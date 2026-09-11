import { NextRequest, NextResponse } from 'next/server';
import { ConversationData, ChatMessage } from '@/types';
import { decodeTurboStream, extractFromChatGPTData, extractCodeBlocks, parseRawPastedChat } from '@/lib/chatgpt-parser';
import { sanitizeChatGPTText, detectAIProvider } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid conversation link or text' }, { status: 400 });
    }

    const trimmed = url.trim();

    // Check if user pasted chat text directly instead of a link
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      (trimmed.length > 50 || trimmed.includes('\n'))
    ) {
      const parsed = parseRawPastedChat(trimmed);
      return NextResponse.json(parsed);
    }

    // Common realistic browser headers
    const browserHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // =========================================================================
    // CASE A: ANTHROPIC CLAUDE (claude.ai/share/<id>)
    // =========================================================================
    const claudeMatch = trimmed.match(/(?:https?:\/\/)?claude\.ai\/share\/([a-zA-Z0-9\-_]+)/i);
    if (claudeMatch) {
      const shareId = claudeMatch[1];
      const canonicalUrl = `https://claude.ai/share/${shareId}`;

      // 1. Try public share API
      try {
        const apiRes = await fetch(`https://claude.ai/api/share/${shareId}`, {
          headers: {
            ...browserHeaders,
            Accept: 'application/json',
          },
        });
        if (apiRes.ok) {
          const data = await apiRes.json();
          const conv = extractFromClaudeData(data, canonicalUrl);
          if (conv && conv.messages.length > 0) {
            return NextResponse.json(conv);
          }
        }
      } catch {
        // proceed
      }

      // 2. Try HTML page
      try {
        const htmlRes = await fetch(canonicalUrl, { headers: browserHeaders });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const conv = extractFromClaudeHtml(html, canonicalUrl);
          if (conv && conv.messages.length > 0) {
            return NextResponse.json(conv);
          }
        }
      } catch {
        // proceed
      }

      // If Claude's bot protection blocks server fetch, explain clearly
      return NextResponse.json(
        {
          error:
            'Claude public share links are protected by Anthropic Cloudflare verification. Please copy your Claude conversation and click "1-Click Paste From Clipboard" to format your notes instantly!',
          suggestPaste: true,
          provider: 'claude',
        },
        { status: 422 }
      );
    }

    // =========================================================================
    // CASE B: GOOGLE GEMINI (gemini.google.com/share/<id>)
    // =========================================================================
    const geminiMatch = trimmed.match(/(?:https?:\/\/)?(?:gemini|bard)\.google\.com\/share\/([a-zA-Z0-9\-_]+)/i);
    if (geminiMatch) {
      const shareId = geminiMatch[1];
      const canonicalUrl = `https://gemini.google.com/share/${shareId}`;

      try {
        const htmlRes = await fetch(canonicalUrl, { headers: browserHeaders });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const conv = extractFromGeminiHtml(html, canonicalUrl);
          if (conv && conv.messages.length > 0) {
            return NextResponse.json(conv);
          }
        }
      } catch {
        // proceed
      }

      return NextResponse.json(
        {
          error:
            'Gemini share links require Google account verification. Please copy your Gemini chat text and click "1-Click Paste From Clipboard" to generate your notes instantly!',
          suggestPaste: true,
          provider: 'gemini',
        },
        { status: 422 }
      );
    }

    // =========================================================================
    // CASE C: OPENAI CHATGPT (chatgpt.com/share/<id> or chat.openai.com)
    // =========================================================================
    const chatGptMatch = trimmed.match(/(?:https?:\/\/)?(?:chatgpt\.com|chat\.openai\.com)\/share\/([a-zA-Z0-9\-_]+)/i);
    if (!chatGptMatch) {
      return NextResponse.json(
        {
          error:
            'Invalid link format. Please provide a ChatGPT (chatgpt.com/share/...), Claude (claude.ai/share/...), or Gemini link, or click "1-Click Paste From Clipboard".',
        },
        { status: 400 }
      );
    }

    const shareId = chatGptMatch[1];
    const canonicalUrl = `https://chatgpt.com/share/${shareId}`;

    const htmlRes = await fetch(canonicalUrl, { headers: browserHeaders });

    if (!htmlRes.ok) {
      return NextResponse.json(
        {
          error: `Could not reach ChatGPT servers (HTTP ${htmlRes.status}). Please check the link or paste the conversation text directly.`,
        },
        { status: 422 }
      );
    }

    const html = await htmlRes.text();

    // Turbo Stream extraction
    const enqueueMatches = html.matchAll(/streamController\.enqueue\(([\s\S]*?)\);/g);
    for (const match of enqueueMatches) {
      if (match[1]) {
        try {
          const rawArg = match[1].trim();
          const parsed = JSON.parse(rawArg);
          const streamArray = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;

          if (Array.isArray(streamArray)) {
            const decoded = decodeTurboStream(streamArray);
            const shareRoute = decoded?.loaderData?.['routes/share.$shareId.($action)'];
            if (shareRoute) {
              const serverResponse = shareRoute.serverResponse;
              if (serverResponse) {
                if (serverResponse.type === 'error' || serverResponse.error) {
                  const errorMsg = serverResponse.error || "This shared conversation could not be loaded.";
                  return NextResponse.json(
                    {
                      error: `ChatGPT reports: "${errorMsg}". You can still generate notes by copying the chat and clicking "1-Click Paste From Clipboard"!`,
                      suggestPaste: true,
                    },
                    { status: 404 }
                  );
                }

                const conv = extractFromChatGPTData(serverResponse, canonicalUrl);
                if (conv && conv.messages.length > 0) {
                  return NextResponse.json(conv);
                }
              }
            }

            const conv = extractFromChatGPTData(decoded, canonicalUrl);
            if (conv && conv.messages.length > 0) {
              return NextResponse.json(conv);
            }
          }
        } catch {
          // proceed
        }
      }
    }

    // Backend API fallback
    try {
      const apiRes = await fetch(`https://chatgpt.com/backend-api/share/${shareId}`, {
        headers: {
          'User-Agent': browserHeaders['User-Agent'],
          Accept: 'application/json',
        },
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const conv = extractFromChatGPTData(data, canonicalUrl);
        if (conv && conv.messages.length > 0) {
          return NextResponse.json(conv);
        }
      }
    } catch {
      // proceed
    }

    return NextResponse.json(
      {
        error:
          "Could not automatically parse the public page scripts. Please copy your chat and click '1-Click Paste From Clipboard' to format your notes instantly!",
        suggestPaste: true,
      },
      { status: 422 }
    );
  } catch (err: any) {
    console.error('Extraction error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to extract conversation' },
      { status: 500 }
    );
  }
}

/**
 * Extracts conversation data from Claude API responses
 */
function extractFromClaudeData(data: any, canonicalUrl: string): ConversationData | null {
  if (!data) return null;
  const title = data.title || 'Claude Conversation Notes';
  const rawMessages = data.chat_messages || data.messages || [];
  const messages: ChatMessage[] = [];
  let counter = 1;

  for (const m of rawMessages) {
    const role = m.sender === 'human' || m.role === 'user' ? 'user' : 'assistant';
    const text = typeof m.text === 'string' ? m.text : m.content || '';
    if (text.trim()) {
      const cleaned = sanitizeChatGPTText(text.trim());
      messages.push({
        id: m.uuid || `claude-msg-${counter++}`,
        role,
        content: cleaned,
        codeBlocks: extractCodeBlocks(cleaned),
      });
    }
  }

  if (messages.length === 0) return null;

  return {
    id: data.uuid || `claude-${Date.now()}`,
    title: sanitizeChatGPTText(title),
    provider: 'claude',
    url: canonicalUrl,
    createdAt: data.created_at || new Date().toISOString(),
    messages,
  };
}

/**
 * Extracts conversation from Claude share HTML
 */
function extractFromClaudeHtml(html: string, canonicalUrl: string): ConversationData | null {
  // Check for JSON script tags
  const jsonMatches = html.matchAll(/<script\b[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonMatches) {
    try {
      const data = JSON.parse(match[1]);
      const conv = extractFromClaudeData(data, canonicalUrl);
      if (conv) return conv;
    } catch {
      // proceed
    }
  }

  // Check for title in OpenGraph
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Claude$/, '').trim() : 'Claude Conversation';

  return null;
}

/**
 * Extracts conversation from Gemini share HTML
 */
function extractFromGeminiHtml(html: string, canonicalUrl: string): ConversationData | null {
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Google Gemini$/, '').trim() : 'Gemini Conversation';
  return null;
}
