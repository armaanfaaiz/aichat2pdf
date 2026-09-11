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
 * Normalizes raw chat text from ChatGPT, Claude, or Google Gemini into structured messages
 */
export function parseRawPastedChat(text: string, titleHint?: string, explicitProvider?: AIProvider): ConversationData {
  const provider = explicitProvider || detectAIProvider(text);
  const lines = text.split('\n');
  const messages: ChatMessage[] = [];
  
  let currentRole: 'user' | 'assistant' = 'user';
  let currentContent: string[] = [];
  let msgCounter = 1;

  // Patterns for User prompts across ChatGPT, Claude, and Gemini
  const userPatterns = [
    /^(You|User|Human|Prompt|Me|Question|Speaker 1)(\s+said)?\s*:/i,
    /^###\s*(You|User|Human|Prompt|Question)/i,
    /^\*\*(You|User|Human|Prompt|Question):\*\*/i,
    /^👤\s*(You|User|Human):/i,
    /^Q\s*:\s*/i,
  ];

  // Patterns for AI responses across ChatGPT, Claude, and Gemini
  const assistantPatterns = [
    /^(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Anthropic|Sonnet|Opus|Haiku|Answer)(\s+said)?\s*:/i,
    /^###\s*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Sonnet|Opus)/i,
    /^\*\*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Sonnet|Opus):\*\*/i,
    /^(🤖|♊|🧠)\s*(ChatGPT|Claude|Gemini|Assistant):/i,
    /^A\s*:\s*/i,
  ];

  const flushMessage = () => {
    if (currentContent.length > 0) {
      const rawText = currentContent.join('\n').trim();
      const cleaned = sanitizeChatGPTText(rawText);
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
      currentRole = 'user';
      const cleaned = line
        .replace(/^(👤\s*)?(You|User|Human|Prompt):\s*/i, '')
        .replace(/^###\s*(You|User|Human|Prompt)\s*/i, '')
        .replace(/^\*\*(You|User|Human|Prompt):\*\*\s*/i, '');
      if (cleaned.trim()) {
        currentContent.push(cleaned);
      }
    } else if (isAssistantHeader) {
      flushMessage();
      currentRole = 'assistant';
      const cleaned = line
        .replace(/^(🤖|♊|🧠\s*)?(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini|Anthropic):\s*/i, '')
        .replace(/^###\s*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini)\s*/i, '')
        .replace(/^\*\*(ChatGPT|Claude|Gemini|Assistant|Bot|AI|Google Gemini):\*\*\s*/i, '');
      if (cleaned.trim()) {
        currentContent.push(cleaned);
      }
    } else {
      currentContent.push(line);
    }
  }

  flushMessage();

  if (messages.length === 0 && text.trim()) {
    const cleaned = sanitizeChatGPTText(text.trim());
    messages.push({
      id: 'msg-1',
      role: 'assistant',
      content: cleaned,
      codeBlocks: extractCodeBlocks(cleaned),
    });
  }

  let derivedTitle = titleHint || `${provider.toUpperCase()} Conversation Notes`;
  if (messages.length > 0 && messages[0].role === 'user') {
    const firstLine = messages[0].content.split('\n')[0].replace(/[#*`_]/g, '').trim();
    if (firstLine.length > 5) {
      derivedTitle = firstLine.length > 65 ? firstLine.substring(0, 62) + '...' : firstLine;
    }
  }

  return {
    id: `conv-${Date.now()}`,
    title: derivedTitle,
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
