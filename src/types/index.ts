export interface ChatCodeBlock {
  language: string;
  code: string;
}

export type AIProvider = 'chatgpt' | 'gemini' | 'claude' | 'universal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  codeBlocks?: ChatCodeBlock[];
}

export interface ConversationData {
  id: string;
  title: string;
  provider?: AIProvider;
  url?: string;
  createdAt?: string;
  messages: ChatMessage[];
}

export type ThemeStyle =
  | 'academic'
  | 'modern'
  | 'minimalist'
  | 'emerald'
  | 'midnight'
  | 'cyberpunk'
  | 'sunset'
  | 'lavender';
export type NoteMode = 'study' | 'brief' | 'cheatsheet' | 'transcript';
export type ViewMode = 'study' | 'chat' | 'cheatsheet' | 'brief';

export interface QABreakdownItem {
  id: string;
  question: string;
  answer: string;
  keyPoints?: string[];
  code?: string;
  language?: string;
  tag?: string;
}

export interface CodeSnippetItem {
  id: string;
  title: string;
  language: string;
  code: string;
  explanation: string;
}

export interface QuizItem {
  id: string;
  question: string;
  answer: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface GeneratedNotes {
  title: string;
  subtitle: string;
  provider: AIProvider;
  sourceUrl?: string;
  date: string;
  readingTimeMinutes: number;
  wordCount: number;
  executiveSummary: string;
  keyTakeaways: string[];
  qaBreakdown: QABreakdownItem[];
  codeSnippets: CodeSnippetItem[];
  reviewQuiz: QuizItem[];
  glossary: GlossaryItem[];
  actionItems: string[];
  rawTranscript: ChatMessage[];
}

export interface CustomizationOptions {
  theme: ThemeStyle;
  mode: NoteMode;
  provider?: AIProvider;
  includeCover: boolean;
  includeToc: boolean;
  includeSummary: boolean;
  includeTakeaways: boolean;
  includeQA: boolean;
  includeCode: boolean;
  includeQuiz: boolean;
  includeGlossary: boolean;
  includeActionItems: boolean;
  includeTranscript: boolean;
  customTitle: string;
  authorName: string;
}
