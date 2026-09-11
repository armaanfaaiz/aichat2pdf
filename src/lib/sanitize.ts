import { marked } from 'marked';

/**
 * Robustly strips AI artifacts (ChatGPT, Claude, and Gemini)
 */
export function sanitizeChatGPTText(raw: string): string {
  if (!raw) return '';

  return (
    raw
      // ChatGPT citation artifacts
      .replace(/[□\u25a0-\u25ff\u200b\ufeff]*cite[□\u25a0-\u25ff\u200b\ufeff]*turn\w*[□\u25a0-\u25ff\u200b\ufeff]*/gi, '')
      .replace(/turn\d*\w*search\w*/gi, '')
      .replace(/turn\d+[a-z]+\d*/gi, '')
      .replace(/[□\u25a0-\u25ff\u200b\ufeff]*cite[□\u25a0-\u25ff\u200b\ufeff]*/gi, '')
      .replace(/□[^□\n\r]{1,80}□/g, '')
      .replace(/[□\u25a0-\u25ff\u200b-\u200f\ufeff\ufffd]/g, '')
      .replace(/【[^】]*】/g, '')

      // Claude artifacts (<antArtifact>, <antThinking>)
      .replace(/<antArtifact\b[^>]*>/gi, '')
      .replace(/<\/antArtifact>/gi, '')
      .replace(/<antThinking>[\s\S]*?<\/antThinking>/gi, '')

      // Gemini artifacts (grounding markers, [cite: ...], draft badges)
      .replace(/\[\s*cite\s*:[^\]]*\]/gi, '')
      .replace(/\[\s*source\s*:[^\]]*\]/gi, '')
      .replace(/\[\s*\d+\s*\](?!\()/g, '') // remove footnote citations like [1], [2] unless markdown link [1](...)
      .replace(/^(Draft \d+|Show drafts|View other drafts)$/gim, '')

      // Clean up orphaned citation brackets
      .replace(/\[\s*\]/g, '')
      // Clean up multi-spaces on single lines
      .replace(/[ \t]{2,}/g, ' ')
      // Normalize multi newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Detect AI Provider from text or URL
 */
export function detectAIProvider(input: string): 'chatgpt' | 'gemini' | 'claude' | 'universal' {
  const lower = input.toLowerCase();
  if (lower.includes('claude.ai') || lower.includes('anthropic') || lower.includes('human:') || lower.includes('assistant:')) {
    return 'claude';
  }
  if (lower.includes('gemini.google.com') || lower.includes('bard.google.com') || lower.includes('gemini:') || lower.includes('google gemini')) {
    return 'gemini';
  }
  if (lower.includes('chatgpt.com') || lower.includes('openai.com') || lower.includes('chatgpt:')) {
    return 'chatgpt';
  }
  return 'universal';
}

/**
 * Configure marked with GFM (tables, line breaks, autolinks)
 */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Safely parses markdown into HTML with table, list, and formatting support
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  const cleaned = sanitizeChatGPTText(markdown);
  try {
    return marked.parse(cleaned) as string;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return cleaned;
  }
}
