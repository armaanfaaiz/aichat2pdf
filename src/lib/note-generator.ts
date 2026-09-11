import {
  ConversationData,
  GeneratedNotes,
  QABreakdownItem,
  CodeSnippetItem,
  QuizItem,
  GlossaryItem,
  ChatMessage,
} from '@/types';
import { extractCodeBlocks } from './chatgpt-parser';
import { sanitizeChatGPTText } from './sanitize';

/**
 * Intelligent Note Generator
 * Converts raw conversation dialogs into clean, publication-grade study notes.
 */
export function generateStructuredNotes(conversation: ConversationData): GeneratedNotes {
  // First, sanitize all message contents to remove ChatGPT search citations
  const sanitizedMessages = conversation.messages.map((m) => {
    const cleaned = sanitizeChatGPTText(m.content);
    return {
      ...m,
      content: cleaned,
      codeBlocks: extractCodeBlocks(cleaned),
    };
  });

  const title = sanitizeChatGPTText(conversation.title) || 'Comprehensive Study Notes';
  const url = conversation.url;
  const createdAt = conversation.createdAt;

  // Calculate statistics
  const allText = sanitizedMessages.map((m) => m.content).join(' ');
  const words = allText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));
  const dateFormatted = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const userMessages = sanitizedMessages.filter((m) => m.role === 'user');
  const assistantMessages = sanitizedMessages.filter((m) => m.role === 'assistant');

  // 1. Executive Summary Synthesis
  const executiveSummary = synthesizeExecutiveSummary(title, userMessages, assistantMessages);

  // 2. High-Impact Key Takeaways (Cleaned of citations)
  const keyTakeaways = extractKeyTakeaways(assistantMessages, title);

  // 3. Structured Q&A Topics
  const qaBreakdown = buildQABreakdown(sanitizedMessages);

  // 4. Code Snippet Catalog
  const codeSnippets = extractCodeCatalog(sanitizedMessages);

  // 5. Conceptual Review Quiz & Flashcards
  const reviewQuiz = generateReviewQuiz(qaBreakdown, keyTakeaways, title);

  // 6. Technical Glossary
  const glossary = extractGlossary(allText);

  // 7. Action Items / Checklist
  const actionItems = generateActionItems(assistantMessages, title);

  const provider = conversation.provider || 'universal';
  const providerLabel =
    provider === 'claude'
      ? 'Anthropic Claude'
      : provider === 'gemini'
      ? 'Google Gemini'
      : provider === 'chatgpt'
      ? 'ChatGPT'
      : 'AI Model';

  return {
    title,
    subtitle: `Synthesized from ${providerLabel} Conversation • ${sanitizedMessages.length} Exchanges`,
    provider,
    sourceUrl: url,
    date: dateFormatted,
    readingTimeMinutes,
    wordCount,
    executiveSummary,
    keyTakeaways,
    qaBreakdown,
    codeSnippets,
    reviewQuiz,
    glossary,
    actionItems,
    rawTranscript: sanitizedMessages,
  };
}

/**
 * Synthesizes a crisp executive overview
 */
function synthesizeExecutiveSummary(
  title: string,
  userMsgs: ChatMessage[],
  assistantMsgs: ChatMessage[]
): string {
  if (assistantMsgs.length === 0) {
    return `This document captures key technical explorations and notes on ${title}.`;
  }

  const firstAssistant = assistantMsgs[0].content;
  const cleanParagraphs = firstAssistant
    .split(/\n\n+/)
    .map((p) => sanitizeChatGPTText(p.replace(/^[#*`_ \t]+/, '').trim()))
    .filter((p) => p.length > 40 && !p.startsWith('|') && !p.startsWith('-'));

  if (cleanParagraphs.length > 0) {
    const summary = cleanParagraphs[0];
    return summary.length > 340 ? summary.substring(0, 335) + '...' : summary;
  }

  const userGoal = userMsgs.length > 0 ? userMsgs[0].content.split('\n')[0].slice(0, 150) : title;
  return `This briefing synthesizes key information regarding "${title}". The notes detail essential concepts, important dates, eligibility, core patterns, and exam structure discussed in: "${userGoal}".`;
}

/**
 * Extracts key takeaways, strictly removing citations and cleaning bullet markdown
 */
function extractKeyTakeaways(assistantMsgs: ChatMessage[], topicTitle: string): string[] {
  const takeaways: string[] = [];
  const seen = new Set<string>();

  for (const msg of assistantMsgs) {
    const lines = msg.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const bulletMatch = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
      if (bulletMatch) {
        let text = sanitizeChatGPTText(bulletMatch[1])
          .replace(/[*_`]/g, '')
          .trim();
        // Remove trailing or leading dashes
        text = text.replace(/^[—\-–:]\s*/, '').trim();

        if (
          text.length > 20 &&
          text.length < 260 &&
          !text.startsWith('http') &&
          !seen.has(text.toLowerCase())
        ) {
          seen.add(text.toLowerCase());
          takeaways.push(text);
          if (takeaways.length >= 6) break;
        }
      }
    }
    if (takeaways.length >= 6) break;
  }

  if (takeaways.length < 3) {
    takeaways.push(
      `Clarified fundamental criteria and essential requirements for ${topicTitle}.`,
      `Identified critical dates, selection phases, and preparation checkpoints.`,
      `Structured key patterns and reference details for quick review.`
    );
  }

  return takeaways;
}

/**
 * Groups user queries with assistant responses into structured Q&A sections
 */
function buildQABreakdown(messages: ChatMessage[]): QABreakdownItem[] {
  const items: QABreakdownItem[] = [];
  let currentQuestion = '';
  let currentAnswerParts: string[] = [];
  let itemIndex = 1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user') {
      if (currentQuestion && currentAnswerParts.length > 0) {
        items.push(formatQAItem(currentQuestion, currentAnswerParts.join('\n\n'), itemIndex++));
        currentAnswerParts = [];
      }
      currentQuestion = sanitizeChatGPTText(msg.content.replace(/^[#*`_\s]+/, '').trim());
    } else if (msg.role === 'assistant') {
      currentAnswerParts.push(sanitizeChatGPTText(msg.content));
    }
  }

  if (currentQuestion && currentAnswerParts.length > 0) {
    items.push(formatQAItem(currentQuestion, currentAnswerParts.join('\n\n'), itemIndex++));
  } else if (currentAnswerParts.length > 0 && items.length === 0) {
    items.push(formatQAItem('Detailed Topic Overview & Breakdown', currentAnswerParts.join('\n\n'), 1));
  }

  return items;
}

function formatQAItem(question: string, rawAnswer: string, idx: number): QABreakdownItem {
  const codeBlocks = extractCodeBlocks(rawAnswer);
  const primaryCode = codeBlocks.length > 0 ? codeBlocks[0].code : undefined;
  const primaryLang = codeBlocks.length > 0 ? codeBlocks[0].language : undefined;

  // Extract key bullet points
  const keyPoints: string[] = [];
  const lines = rawAnswer.split('\n');
  for (const line of lines) {
    const cleanLine = sanitizeChatGPTText(line);
    const bullet = cleanLine.trim().match(/^(?:[-*•]|\d+\.)\s+\*\*([^*]+)\*\*:\s*(.+)$/);
    if (bullet) {
      keyPoints.push(`**${bullet[1]}**: ${bullet[2]}`);
    } else {
      const simpleBullet = cleanLine.trim().match(/^(?:[-*•])\s+([A-Z][^.:]+[:.]\s*.+)$/);
      if (simpleBullet && simpleBullet[1].length < 180) {
        keyPoints.push(simpleBullet[1]);
      }
    }
    if (keyPoints.length >= 5) break;
  }

  // Answer text
  const cleanedAnswer = rawAnswer
    .replace(/```[a-zA-Z0-9_\-\+]*\n[\s\S]*?```/g, '')
    .trim();

  let displayQuestion = question;
  if (displayQuestion.length > 120) {
    const firstSentence = displayQuestion.split(/[.?!\n]/)[0];
    displayQuestion = firstSentence.length > 20 ? firstSentence : displayQuestion.substring(0, 115) + '...';
  }

  return {
    id: `qa-${idx}`,
    question: displayQuestion,
    answer: cleanedAnswer || rawAnswer,
    code: primaryCode,
    language: primaryLang,
    keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
    tag: `Section ${idx}`,
  };
}

/**
 * Extracts and catalogs all code blocks
 */
function extractCodeCatalog(messages: ChatMessage[]): CodeSnippetItem[] {
  const snippets: CodeSnippetItem[] = [];
  let snippetId = 1;

  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    const blocks = extractCodeBlocks(msg.content);
    for (const b of blocks) {
      if (b.code.trim().length > 20) {
        let snippetTitle = `Implementation (${b.language.toUpperCase() || 'Code'})`;
        const firstLine = b.code.split('\n')[0].trim();
        if (firstLine.startsWith('//') || firstLine.startsWith('#') || firstLine.startsWith('--')) {
          snippetTitle = firstLine.replace(/^[/#\-* ]+/, '').trim();
        }

        snippets.push({
          id: `code-${snippetId++}`,
          title: snippetTitle,
          language: b.language || 'typescript',
          code: b.code,
          explanation: `Reference code implementation highlighting core syntax and logic for ${b.language || 'code'}.`,
        });

        if (snippets.length >= 6) break;
      }
    }
    if (snippets.length >= 6) break;
  }

  return snippets;
}

/**
 * Creates self-testing review questions
 */
function generateReviewQuiz(qaItems: QABreakdownItem[], takeaways: string[], title: string): QuizItem[] {
  const quiz: QuizItem[] = [];

  for (let i = 0; i < Math.min(qaItems.length, 3); i++) {
    const item = qaItems[i];
    quiz.push({
      id: `quiz-${i + 1}`,
      question: `What are the core aspects or guidelines regarding "${item.question}"?`,
      answer:
        item.keyPoints && item.keyPoints.length > 0
          ? item.keyPoints.join(' ')
          : item.answer.slice(0, 220).replace(/[#*`]/g, '') + '...',
    });
  }

  if (takeaways.length > 0 && quiz.length < 4) {
    quiz.push({
      id: `quiz-${quiz.length + 1}`,
      question: `Why is this key takeaway essential for ${title}: "${takeaways[0]}"?`,
      answer: `It establishes the timeline, prerequisites, and operational guidelines necessary for successful completion.`,
    });
  }

  return quiz;
}

/**
 * Extracts technical acronyms and key terminology
 */
function extractGlossary(text: string): GlossaryItem[] {
  const defaultTerms: Record<string, string> = {
    'IBPS': 'Institute of Banking Personnel Selection: Autonomous research and recruitment agency for Indian banks.',
    'CSA': 'Customer Service Associate: Modern designation for clerical roles in public sector banking.',
    'Prelims': 'Preliminary Examination: Initial qualifying tier testing speed, reasoning, quantitative ability, and language.',
    'Mains': 'Main Examination: Second-stage comprehensive competitive evaluation determining final merit.',
    'Negative Marking': 'Deduction of marks (commonly 0.25) for incorrect answers to penalize blind guessing.',
    'Cutoff': 'The minimum threshold score required across categories to qualify for subsequent stages.',
    'TTL': 'Time-To-Live: Duration cached data remains valid before automatic invalidation.',
    'Cache Stampede': 'High concurrent misses for an expired key simultaneously overloading origin servers.',
    'LRU': 'Least Recently Used: Eviction policy that discards oldest unused entries first.',
    'Bloom Filter': 'Space-efficient probabilistic structure testing set membership.',
    'Server Actions': 'Server-executed functions directly callable from client React components.',
    'Optimistic UI': 'Instant UI rendering before mutation confirmation from the network.',
  };

  const found: GlossaryItem[] = [];
  const textUpper = text.toUpperCase();

  for (const [term, def] of Object.entries(defaultTerms)) {
    if (textUpper.includes(term.toUpperCase())) {
      found.push({ term, definition: def });
      if (found.length >= 6) break;
    }
  }

  if (found.length === 0) {
    found.push(
      { term: 'Overview', definition: 'Comprehensive summary of requirements, syllabus, and structure.' },
      { term: 'Eligibility', definition: 'Prerequisites regarding age, education, nationality, and qualifications.' },
      { term: 'Strategy', definition: 'Systematic study schedule, practice tests, and revision checkpoints.' }
    );
  }

  return found;
}

/**
 * Generates an actionable checklist of next steps
 */
function generateActionItems(assistantMsgs: ChatMessage[], topicTitle: string): string[] {
  const actions: string[] = [];

  for (const msg of assistantMsgs) {
    const lines = msg.content.split('\n');
    for (const line of lines) {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        actions.push(sanitizeChatGPTText(match[2].trim()));
      }
    }
  }

  if (actions.length === 0) {
    actions.push(
      `Confirm eligibility criteria, official notification dates, and application deadlines for ${topicTitle}.`,
      `Gather standard study materials, past year papers, and syllabus topics.`,
      `Create a weekly mock test schedule and track section-wise time distribution.`,
      `Consolidate revision cheat sheets and formulas for the final exam countdown.`
    );
  }

  return actions;
}
