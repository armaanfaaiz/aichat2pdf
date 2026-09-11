import { ChatCodeBlock, ChatMessage, ConversationData, AIProvider } from '@/types';
import { detectAIProvider, sanitizeChatGPTText } from './sanitize';

/**
 * Extracts code blocks from markdown content
 */
export function extractCodeBlocks(content: string): ChatCodeBlock[] {
  const blocks: ChatCodeBlock[] = [];
  const regex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1]?.trim() || 'text',
      code: match[2]?.trimEnd() || '',
    });
  }
  return blocks;
}

/**
 * Decodes React Router 7 / Remix Turbo Stream array format
 */
export function decodeTurboStream(arr: any[]): any {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const memo = new Map<number, any>();

  function resolve(index: any): any {
    if (typeof index !== 'number') return index;
    if (index < 0) {
      if (index === -1) return undefined;
      if (index === -5) return null;
      return null;
    }
    if (memo.has(index)) {
      return memo.get(index);
    }

    const val = arr[index];
    if (val === null || val === undefined || typeof val !== 'object') {
      return val;
    }

    if (Array.isArray(val)) {
      const resolvedArr: any[] = [];
      memo.set(index, resolvedArr);
      for (const item of val) {
        resolvedArr.push(resolve(item));
      }
      return resolvedArr;
    }

    const obj: Record<string, any> = {};
    memo.set(index, obj);
    for (const [k, v] of Object.entries(val)) {
      if (k.startsWith('_')) {
        const keyIndex = parseInt(k.slice(1), 10);
        const resolvedKey = arr[keyIndex];
        if (resolvedKey !== undefined) {
          obj[resolvedKey] = resolve(v);
        }
      } else {
        obj[k] = resolve(v);
      }
    }
    return obj;
  }

  return resolve(0);
}

/**
 * Extracts conversation data from ChatGPT internal payloads (Turbo Stream, Remix, or Backend API)
 */
export function extractFromChatGPTData(data: any, canonicalUrl?: string): ConversationData | null {
  if (!data) return null;

  const convPayload = data.data || data;
  const title = convPayload.title || 'ChatGPT Shared Conversation';
  const createdAt = convPayload.create_time
    ? new Date(convPayload.create_time * 1000).toISOString()
    : new Date().toISOString();

  const messages: ChatMessage[] = [];
  let counter = 1;

  if (Array.isArray(convPayload.linear_conversation)) {
    for (const item of convPayload.linear_conversation) {
      const role = item.role === 'user' ? 'user' : 'assistant';
      const text =
        typeof item.content === 'string'
          ? item.content
          : item.content?.parts?.join('\n') || '';
      if (text.trim()) {
        messages.push({
          id: item.id || `msg-${counter++}`,
          role,
          content: sanitizeChatGPTText(text.trim()),
          codeBlocks: extractCodeBlocks(text),
        });
      }
    }
  }

  if (messages.length === 0 && convPayload.mapping && typeof convPayload.mapping === 'object') {
    const nodes = Object.values(convPayload.mapping) as any[];
    nodes.sort((a, b) => {
      const tA = a?.message?.create_time || 0;
      const tB = b?.message?.create_time || 0;
      return tA - tB;
    });

    for (const node of nodes) {
      const msg = node?.message;
      if (msg && msg.content?.parts && msg.author?.role) {
        const role = msg.author.role;
        if (role === 'user' || role === 'assistant') {
          const parts = msg.content.parts
            .filter((p: any) => typeof p === 'string')
            .join('\n');
          if (parts.trim()) {
            messages.push({
              id: msg.id || `msg-${counter++}`,
              role,
              content: sanitizeChatGPTText(parts.trim()),
              codeBlocks: extractCodeBlocks(parts),
              timestamp: msg.create_time ? new Date(msg.create_time * 1000).toISOString() : undefined,
            });
          }
        }
      }
    }
  }

  if (messages.length === 0) return null;

  return {
    id: convPayload.id || `conv-${Date.now()}`,
    title: sanitizeChatGPTText(title),
    provider: 'chatgpt',
    url: canonicalUrl,
    createdAt,
    messages,
  };
}

/**
 * Normalizes raw chat text, markdown files, notes, or dialogue transcripts
 * from ChatGPT, Claude, Google Gemini, or pasted documents into structured conversation messages
 */
export function parseRawPastedChat(text: string, titleHint?: string, explicitProvider?: AIProvider): ConversationData {
  const provider = explicitProvider || detectAIProvider(text);
  const trimmedText = text.trim();
  const lines = trimmedText.split('\n');
  const messages: ChatMessage[] = [];

  // 1. Patterns for User prompts across ChatGPT, Claude, Gemini, or standard Q&A
  const userPatterns = [
    /^(You|User|Human|Prompt|Me|Question|Speaker 1|Interviewer)(\s+said)?\s*:/i,
    /^###?\s*(You|User|Human|Prompt|Question|Query)/i,
    /^\*\*(You|User|Human|Prompt|Question|Query):\*\*/i,
    /^👤\s*(You|User|Human):/i,
    /^Q\s*[:\.]\s*/i,
    /^(Question|Query)\s*\d*\s*[:\.]\s*/i,
  ];

  // 2. Patterns for AI responses across ChatGPT, Claude, Gemini, or standard answers
  const assistantPatterns = [
    /^(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Anthropic|Sonnet|Opus|Haiku|Answer|Speaker 2)(\s+said)?\s*:/i,
    /^###?\s*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Sonnet|Opus|Answer)/i,
    /^\*\*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Sonnet|Opus|Answer):\*\*/i,
    /^(🤖|♊|🧠)\s*(ChatGPT|Claude|Gemini|Assistant):/i,
    /^A\s*[:\.]\s*/i,
    /^(Answer|Response)\s*\d*\s*[:\.]\s*/i,
  ];

  let currentRole: 'user' | 'assistant' = 'user';
  let currentContent: string[] = [];
  let msgCounter = 1;
  let hasDetectedRoles = false;

  const flushMessage = () => {
    if (currentContent.length > 0) {
      const raw = currentContent.join('\n').trim();
      const cleaned = sanitizeChatGPTText(raw);
      if (cleaned) {
        messages.push({
          id: `msg-${msgCounter++}`,
          role: currentRole,
          content: cleaned,
          codeBlocks: extractCodeBlocks(cleaned),
        });
      }
      currentContent = [];
    }
  };

  for (const line of lines) {
    const isUserHeader = userPatterns.some((p) => p.test(line.trim()));
    const isAssistantHeader = assistantPatterns.some((p) => p.test(line.trim()));

    if (isUserHeader) {
      flushMessage();
      hasDetectedRoles = true;
      currentRole = 'user';
      const cleaned = line
        .replace(/^(👤\s*)?(You|User|Human|Prompt|Me|Question|Query|Speaker 1)(\s+said)?\s*:\s*/i, '')
        .replace(/^###?\s*(You|User|Human|Prompt|Question|Query)\s*/i, '')
        .replace(/^\*\*(You|User|Human|Prompt|Question|Query):\*\*\s*/i, '')
        .replace(/^(Q|Question|Query)\s*\d*\s*[:\.]\s*/i, '');
      if (cleaned.trim()) {
        currentContent.push(cleaned);
      }
    } else if (isAssistantHeader) {
      flushMessage();
      hasDetectedRoles = true;
      currentRole = 'assistant';
      const cleaned = line
        .replace(/^(🤖|♊|🧠\s*)?(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Anthropic|Sonnet|Opus|Haiku|Answer|Speaker 2)(\s+said)?\s*:\s*/i, '')
        .replace(/^###?\s*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Sonnet|Opus|Answer)\s*/i, '')
        .replace(/^\*\*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Sonnet|Opus|Answer):\*\*\s*/i, '')
        .replace(/^(A|Answer|Response)\s*\d*\s*[:\.]\s*/i, '');
      if (cleaned.trim()) {
        currentContent.push(cleaned);
      }
    } else {
      currentContent.push(line);
    }
  }

  flushMessage();

  // If no explicit dialogue turn markers were matched (e.g. pasted article, essay, or single AI reply)
  if (!hasDetectedRoles || messages.length <= 1) {
    // Check if the pasted text has markdown section headers like "# " or "## "
    const headingSections = trimmedText.split(/\n(?=#{1,3}\s+)/g).filter((s) => s.trim().length > 0);

    if (headingSections.length > 1) {
      messages.length = 0;
      msgCounter = 1;
      // First section might be the intro / user question
      for (let i = 0; i < headingSections.length; i++) {
        const sec = headingSections[i].trim();
        const firstLine = sec.split('\n')[0].replace(/^#{1,4}\s*/, '').trim();
        const body = sec.split('\n').slice(1).join('\n').trim();

        if (i === 0 && !body) {
          // It's just a top-level document title
          continue;
        }

        messages.push({
          id: `msg-${msgCounter++}`,
          role: 'user',
          content: firstLine || `Topic Section ${i + 1}`,
          codeBlocks: [],
        });

        messages.push({
          id: `msg-${msgCounter++}`,
          role: 'assistant',
          content: sanitizeChatGPTText(body || sec),
          codeBlocks: extractCodeBlocks(body || sec),
        });
      }
    } else if (messages.length === 0 && trimmedText) {
      const cleaned = sanitizeChatGPTText(trimmedText);
      // Create a user prompt and assistant response pair so note synthesis works cleanly
      const firstLine = cleaned.split('\n')[0].replace(/^[#*`_\s]+/, '').trim();
      const rest = cleaned.split('\n').slice(1).join('\n').trim();

      messages.push({
        id: 'msg-1',
        role: 'user',
        content: titleHint || (firstLine.length > 5 ? firstLine : 'Overview and Key Points'),
        codeBlocks: [],
      });
      messages.push({
        id: 'msg-2',
        role: 'assistant',
        content: rest || cleaned,
        codeBlocks: extractCodeBlocks(rest || cleaned),
      });
    }
  }

  // Determine Title
  let derivedTitle = titleHint || '';
  if (!derivedTitle) {
    if (messages.length > 0) {
      const firstMsgContent = messages[0].content;
      const firstLine = firstMsgContent.split('\n')[0].replace(/^[#*`_\s]+/, '').trim();
      if (firstLine.length > 3) {
        derivedTitle = firstLine.length > 70 ? firstLine.substring(0, 67) + '...' : firstLine;
      }
    }
  }
  if (!derivedTitle) {
    derivedTitle = `${provider.toUpperCase()} Document Notes`;
  }

  return {
    id: `conv-${Date.now()}`,
    title: sanitizeChatGPTText(derivedTitle),
    provider,
    createdAt: new Date().toISOString(),
    messages,
  };
}

/**
 * Parses JSON exported from ChatGPT, Claude, or Gemini
 */
export function parseChatGPTJson(jsonData: any): ConversationData {
  const result = extractFromChatGPTData(jsonData);
  if (result) return result;
  throw new Error('Unrecognized JSON structure');
}
