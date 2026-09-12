'use client';

import React, { useState } from 'react';
import {
  GeneratedNotes,
  CustomizationOptions,
  ThemeStyle,
  NoteMode,
} from '@/types';
import { CodeBlock } from './CodeBlock';
import { renderMarkdownToHtml, sanitizeChatGPTText } from '@/lib/sanitize';
import {
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Hash,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  Terminal,
  Bookmark,
  CheckSquare,
  Bot,
  Zap,
} from 'lucide-react';

interface DocumentRendererProps {
  notes: GeneratedNotes;
  options: CustomizationOptions;
}

/**
 * Component to safely render rich formatted markdown (tables, lists, headers, bold)
 */
function MarkdownBlock({ content, className = '' }: { content: string; className?: string }) {
  const html = renderMarkdownToHtml(content);
  return (
    <div
      className={`markdown-body text-slate-700 text-xs sm:text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function DocumentRenderer({ notes, options }: DocumentRendererProps) {
  const [revealedQuiz, setRevealedQuiz] = useState<Record<string, boolean>>({});

  const toggleQuizAnswer = (id: string) => {
    setRevealedQuiz((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeMode: NoteMode = options.mode || 'study';
  const activeTitle = options.customTitle || notes.title;
  const activeAuthor = options.authorName || 'AI Synthesizer';
  const theme = options.theme;

  const getThemeClass = (t: ThemeStyle) => {
    switch (t) {
      case 'academic':
        return 'theme-academic bg-[#fdfcf9] text-[#1c1b18] border-[#e8e4dc]';
      case 'minimalist':
        return 'theme-minimalist bg-white text-black border-neutral-300';
      case 'emerald':
        return 'theme-emerald bg-[#f7fbf8] text-slate-900 border-emerald-100';
      case 'midnight':
        return 'theme-midnight bg-[#090d16] text-slate-100 border-slate-800 shadow-2xl';
      case 'sunset':
        return 'theme-sunset bg-[#fffbf7] text-stone-900 border-amber-200/80';
      case 'cyberpunk':
        return 'theme-cyberpunk bg-[#0d1117] text-amber-100 border-amber-500/30';
      case 'lavender':
        return 'theme-lavender bg-[#fcfaff] text-slate-900 border-purple-100';
      case 'vintage':
        return 'theme-vintage bg-[#fbf6ed] text-[#2c221e] border-[#e5dcce]';
      case 'nord':
        return 'theme-nord bg-[#f0f7fa] text-[#0f2942] border-[#bae6fd]';
      case 'crimson':
        return 'theme-crimson bg-[#fffdfb] text-[#1c1917] border-[#fecdd3]';
      case 'forest':
        return 'theme-forest bg-[#f2f8f4] text-[#143521] border-[#bbf7d0]';
      case 'solarized':
        return 'theme-solarized bg-[#fdf6e3] text-[#586e75] border-[#eee8d5]';
      case 'slate':
        return 'theme-slate bg-[#f8fafc] text-[#0f172a] border-[#cbd5e1]';
      case 'modern':
      default:
        return 'theme-modern bg-white text-slate-900 border-slate-200/80';
    }
  };

  const getAccentBar = (t: ThemeStyle) => {
    switch (t) {
      case 'academic':
        return 'border-b-2 border-[#8b5e34]';
      case 'minimalist':
        return 'border-b border-black';
      case 'emerald':
        return 'border-b-2 border-emerald-600';
      case 'midnight':
        return 'border-b-2 border-blue-500';
      case 'sunset':
        return 'border-b-2 border-orange-500';
      case 'cyberpunk':
        return 'border-b-2 border-amber-400';
      case 'lavender':
        return 'border-b-2 border-purple-500';
      case 'vintage':
        return 'border-b-2 border-[#92400e]';
      case 'nord':
        return 'border-b-2 border-[#0284c7]';
      case 'crimson':
        return 'border-b-2 border-[#be123c]';
      case 'forest':
        return 'border-b-2 border-[#15803d]';
      case 'solarized':
        return 'border-b-2 border-[#b58900]';
      case 'slate':
        return 'border-b-2 border-[#475569]';
      case 'modern':
      default:
        return 'border-b-2 border-indigo-600';
    }
  };

  const getAccentIconColor = (t: ThemeStyle) => {
    switch (t) {
      case 'academic':
        return 'text-[#8b5e34]';
      case 'minimalist':
        return 'text-black';
      case 'emerald':
        return 'text-emerald-600';
      case 'midnight':
        return 'text-blue-400';
      case 'sunset':
        return 'text-orange-600';
      case 'cyberpunk':
        return 'text-amber-400';
      case 'lavender':
        return 'text-purple-600';
      case 'vintage':
        return 'text-[#92400e]';
      case 'nord':
        return 'text-[#0284c7]';
      case 'crimson':
        return 'text-[#be123c]';
      case 'forest':
        return 'text-[#15803d]';
      case 'solarized':
        return 'text-[#b58900]';
      case 'slate':
        return 'text-[#475569]';
      case 'modern':
      default:
        return 'text-indigo-600';
    }
  };

  const getCardBgClass = (t: ThemeStyle) => {
    switch (t) {
      case 'academic':
        return 'bg-[#f8f5ee] border-[#e7e1d5] text-[#1c1b18]';
      case 'minimalist':
        return 'bg-white border-neutral-300 text-neutral-900';
      case 'emerald':
        return 'bg-emerald-50/40 border-emerald-100 text-slate-900';
      case 'midnight':
        return 'bg-[#131b2e] border-slate-700/80 text-slate-100';
      case 'sunset':
        return 'bg-amber-50/50 border-amber-200/60 text-stone-900';
      case 'cyberpunk':
        return 'bg-[#161b22] border-amber-500/25 text-amber-50';
      case 'lavender':
        return 'bg-purple-50/40 border-purple-100 text-slate-900';
      case 'vintage':
        return 'bg-[#f4ecdf] border-[#e2d6c3] text-[#2c221e]';
      case 'nord':
        return 'bg-[#e2f1f8] border-[#bae6fd] text-[#0f2942]';
      case 'crimson':
        return 'bg-[#fff5f5] border-[#fecdd3] text-[#1c1917]';
      case 'forest':
        return 'bg-[#e9f5ec] border-[#bbf7d0] text-[#143521]';
      case 'solarized':
        return 'bg-[#f7eed7] border-[#eee8d5] text-[#586e75]';
      case 'slate':
        return 'bg-[#f1f5f9] border-[#cbd5e1] text-[#0f172a]';
      case 'modern':
      default:
        return 'bg-white border-slate-200 text-slate-900';
    }
  };

  return (
    <div className="animate-note-open w-full">
      <div
        id="printable-document"
        className={`w-full max-w-[860px] mx-auto p-6 sm:p-12 transition-all duration-300 shadow-xl rounded-2xl border border-slate-200/80 ${getThemeClass(
          theme
        )}`}
      >
      {/* ========================================================= */}
      {/* 1. COVER PAGE (Shared across all styles if enabled)       */}
      {/* ========================================================= */}
      {options.includeCover && (
        <section className="cover-page mb-12 pb-10 border-b border-slate-200 avoid-break flex flex-col justify-between min-h-[420px]">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-10 uppercase tracking-widest font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>
                {notes.provider === 'claude'
                  ? '🧠 Anthropic Claude Synthesized Document'
                  : notes.provider === 'gemini'
                  ? '♊ Google Gemini Synthesized Document'
                  : notes.provider === 'chatgpt'
                  ? '🤖 OpenAI ChatGPT Synthesized Document'
                  : '⚡ AI Synthesized Document'}
              </span>
            </div>
            <span>{notes.date}</span>
          </div>

          <div className="my-auto space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {activeMode === 'transcript'
                  ? 'Clean Conversation Transcript'
                  : activeMode === 'cheatsheet'
                  ? 'High-Density Cheatsheet & Pattern Cards'
                  : activeMode === 'brief'
                  ? 'Executive Briefing & Summary Matrix'
                  : 'Comprehensive Study Notes & Architecture Summary'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {activeTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
              {notes.subtitle}
            </p>
          </div>

          <div className="pt-8 border-t border-slate-200/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="opacity-60 uppercase font-mono text-[10px]">Author</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <User className="w-3.5 h-3.5 opacity-60" />
                <span>{activeAuthor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="opacity-60 uppercase font-mono text-[10px]">Reading Time</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 opacity-60" />
                <span>{notes.readingTimeMinutes} min ({notes.wordCount} words)</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="opacity-60 uppercase font-mono text-[10px]">Date</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                <span>{notes.date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="opacity-60 uppercase font-mono text-[10px]">Source Link</span>
              <div className={`flex items-center gap-1.5 font-semibold truncate ${getAccentIconColor(theme)}`}>
                {notes.sourceUrl ? (
                  <a
                    href={notes.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline truncate"
                  >
                    <span>Original Chat</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="opacity-60">Pasted Input</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* STYLE 1: STUDY GUIDE (COMPREHENSIVE)                      */}
      {/* ========================================================= */}
      {activeMode === 'study' && (
        <div className="space-y-12">
          {/* Table of Contents */}
          {options.includeToc && (
            <section className={`toc-section p-5 rounded-xl border avoid-break ${getCardBgClass(theme)}`}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-current/10">
                <Bookmark className={`w-4 h-4 ${getAccentIconColor(theme)}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Table of Contents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium opacity-90">
                {options.includeSummary && (
                  <a href="#section-summary" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>1. Executive Summary</span>
                    <span className="opacity-50 font-mono">Overview</span>
                  </a>
                )}
                {options.includeTakeaways && (
                  <a href="#section-takeaways" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>2. Key Takeaways & Decisions</span>
                    <span className="opacity-50 font-mono">Core</span>
                  </a>
                )}
                {options.includeQA && (
                  <a href="#section-qa" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>3. Structured Breakdown & Analysis</span>
                    <span className="opacity-50 font-mono">Q&A</span>
                  </a>
                )}
                {options.includeCode && notes.codeSnippets.length > 0 && (
                  <a href="#section-code" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>4. Code Snippets Reference</span>
                    <span className="opacity-50 font-mono">Code</span>
                  </a>
                )}
                {options.includeQuiz && notes.reviewQuiz.length > 0 && (
                  <a href="#section-quiz" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>5. Self-Testing Quiz & Flashcards</span>
                    <span className="opacity-50 font-mono">Review</span>
                  </a>
                )}
                {options.includeGlossary && notes.glossary.length > 0 && (
                  <a href="#section-glossary" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>6. Technical Terminology Glossary</span>
                    <span className="opacity-50 font-mono">Terms</span>
                  </a>
                )}
                {options.includeActionItems && notes.actionItems.length > 0 && (
                  <a href="#section-actions" className="hover:opacity-100 flex items-center justify-between p-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <span>7. Implementation Checklist</span>
                    <span className="opacity-50 font-mono">Action</span>
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Executive Summary */}
          {options.includeSummary && notes.executiveSummary && (
            <section id="section-summary" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <FileText className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Executive Summary</h2>
              </div>
              <div className={`p-5 rounded-xl border shadow-xs ${getCardBgClass(theme)}`}>
                <MarkdownBlock content={notes.executiveSummary} />
              </div>
            </section>
          )}

          {/* Key Takeaways */}
          {options.includeTakeaways && notes.keyTakeaways.length > 0 && (
            <section id="section-takeaways" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <Sparkles className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Key Takeaways & Core Insights</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.keyTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-xs transition ${getCardBgClass(theme)}`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-xs sm:text-sm leading-relaxed font-medium">
                      {sanitizeChatGPTText(takeaway)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Detailed Q&A Breakdown */}
          {options.includeQA && notes.qaBreakdown.length > 0 && (
            <section id="section-qa" className="space-y-6">
              <div className={`flex items-center gap-2 mb-4 pb-2 ${getAccentBar(theme)}`}>
                <BookOpen className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Detailed Breakdown & Analysis</h2>
              </div>

              {notes.qaBreakdown.map((item, idx) => (
                <div
                  key={item.id}
                  className={`avoid-break p-6 rounded-2xl border shadow-xs space-y-4 ${getCardBgClass(theme)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 font-mono text-xs font-bold shrink-0">
                      #{idx + 1}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug">
                      {sanitizeChatGPTText(item.question)}
                    </h3>
                  </div>

                  <div className="pl-1 sm:pl-9">
                    <MarkdownBlock content={item.answer} />
                  </div>

                  {item.keyPoints && item.keyPoints.length > 0 && (
                    <div className="ml-1 sm:ml-9 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 text-xs space-y-1.5">
                      <span className="font-semibold block mb-1 text-[11px] uppercase tracking-wider opacity-80">
                        Important Highlights
                      </span>
                      {item.keyPoints.map((kp, kpIdx) => (
                        <div key={kpIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{sanitizeChatGPTText(kp)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.code && (
                    <div className="ml-1 sm:ml-9">
                      <CodeBlock code={item.code} language={item.language} />
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Code Catalog */}
          {options.includeCode && notes.codeSnippets.length > 0 && (
            <section id="section-code" className="space-y-4">
              <div className={`flex items-center gap-2 mb-4 pb-2 ${getAccentBar(theme)}`}>
                <Terminal className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Code Snippet Reference</h2>
              </div>
              {notes.codeSnippets.map((snippet) => (
                <div key={snippet.id} className="avoid-break space-y-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Hash className={`w-4 h-4 ${getAccentIconColor(theme)}`} />
                    <span>{snippet.title}</span>
                  </h3>
                  <p className="text-xs opacity-60 italic">{snippet.explanation}</p>
                  <CodeBlock code={snippet.code} language={snippet.language} />
                </div>
              ))}
            </section>
          )}

          {/* Review Quiz */}
          {options.includeQuiz && notes.reviewQuiz.length > 0 && (
            <section id="section-quiz" className="avoid-break space-y-3">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <HelpCircle className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Review Questions & Flashcards</h2>
              </div>
              {notes.reviewQuiz.map((quiz, idx) => {
                const isRevealed = !!revealedQuiz[quiz.id];
                return (
                  <div key={quiz.id} className={`p-4 rounded-xl border shadow-xs space-y-2 ${getCardBgClass(theme)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`font-mono text-xs font-bold shrink-0 ${getAccentIconColor(theme)}`}>Q{idx + 1}.</span>
                        <p className="text-xs sm:text-sm font-semibold leading-snug">{sanitizeChatGPTText(quiz.question)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleQuizAnswer(quiz.id)}
                        className={`no-print inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition shrink-0 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 ${getAccentIconColor(theme)}`}
                      >
                        <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                        {isRevealed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className={`pt-2 border-t border-current/10 text-xs sm:text-sm opacity-90 pl-6 ${isRevealed ? 'block' : 'hidden print:block'}`}>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5 font-mono">Answer:</span>
                      <span>{sanitizeChatGPTText(quiz.answer)}</span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Glossary */}
          {options.includeGlossary && notes.glossary.length > 0 && (
            <section id="section-glossary" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <Bookmark className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Technical Glossary</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.glossary.map((item, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border text-xs ${getCardBgClass(theme)}`}>
                    <span className="font-bold block mb-1 font-mono">{item.term}</span>
                    <p className="opacity-75 leading-relaxed">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Action Items */}
          {options.includeActionItems && notes.actionItems.length > 0 && (
            <section id="section-actions" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <CheckSquare className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Implementation Checklist</h2>
              </div>
              <div className={`p-4 rounded-xl border shadow-xs space-y-2 ${getCardBgClass(theme)}`}>
                {notes.actionItems.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <input type="checkbox" defaultChecked={false} className="mt-0.5 w-4 h-4 rounded" />
                    <span className="leading-snug">{sanitizeChatGPTText(action)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STYLE 2: EXECUTIVE BRIEF                                  */}
      {/* ========================================================= */}
      {activeMode === 'brief' && (
        <div className="space-y-8">
          <div className={`flex items-center gap-2 mb-4 pb-2 ${getAccentBar(theme)}`}>
            <FileText className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Executive Briefing</h2>
          </div>

          <div className={`avoid-break p-6 rounded-2xl border shadow-xs ${getCardBgClass(theme)}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${getAccentIconColor(theme)}`}>Executive Summary</h3>
            <MarkdownBlock content={notes.executiveSummary} />
          </div>

          <div className={`avoid-break p-6 rounded-2xl border shadow-xs space-y-3 ${getCardBgClass(theme)}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">Primary Decisions & Findings</h3>
            <div className="space-y-2.5">
              {notes.keyTakeaways.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="leading-snug opacity-90">{sanitizeChatGPTText(t)}</span>
                </div>
              ))}
            </div>
          </div>

          {notes.actionItems.length > 0 && (
            <div className={`avoid-break p-6 rounded-2xl border shadow-xs space-y-3 ${getCardBgClass(theme)}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">Next Steps & Action Matrix</h3>
              <div className="space-y-2">
                {notes.actionItems.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <input type="checkbox" defaultChecked={false} className="mt-0.5 w-4 h-4 rounded" />
                    <span className="opacity-90">{sanitizeChatGPTText(a)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STYLE 3: CHEATSHEET CARDS                                 */}
      {/* ========================================================= */}
      {activeMode === 'cheatsheet' && (
        <div className="space-y-8">
          <div className={`flex items-center gap-2 mb-4 pb-2 ${getAccentBar(theme)}`}>
            <Zap className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Quick Reference Cheatsheet</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {notes.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className={`avoid-break p-4 rounded-xl border shadow-xs ${getCardBgClass(theme)}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1.5 font-mono ${getAccentIconColor(theme)}`}>
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <span>CORE HIGHLIGHT</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-medium opacity-90">
                  {sanitizeChatGPTText(takeaway)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-current/10 pb-1">
              Pattern & Reference Cards
            </h3>
            {notes.qaBreakdown.map((item) => (
              <div key={item.id} className={`avoid-break p-5 rounded-xl border shadow-xs space-y-3 ${getCardBgClass(theme)}`}>
                <h4 className="font-bold text-sm">{sanitizeChatGPTText(item.question)}</h4>
                <MarkdownBlock content={item.answer} />
                {item.code && <CodeBlock code={item.code} language={item.language} />}
              </div>
            ))}
          </div>

          {notes.glossary.length > 0 && (
            <div className={`avoid-break p-5 rounded-xl border ${getCardBgClass(theme)}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Key Terms At A Glance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {notes.glossary.map((g, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-current/10 bg-black/5 dark:bg-white/5">
                    <span className={`font-bold font-mono block ${getAccentIconColor(theme)}`}>{g.term}</span>
                    <span className="opacity-80">{g.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STYLE 4: POLISHED CHAT (TRANSCRIPT)                       */}
      {/* ========================================================= */}
      {activeMode === 'transcript' && (
        <div className="space-y-6">
          <div className={`flex items-center gap-2 mb-6 pb-2 ${getAccentBar(theme)}`}>
            <Bot className={`w-5 h-5 ${getAccentIconColor(theme)}`} />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Conversation Flow</h2>
          </div>

          <div className="space-y-6">
            {notes.rawTranscript.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`avoid-break rounded-2xl p-5 border transition-all ${
                  msg.role === 'user'
                    ? `${getCardBgClass(theme)} ring-1 ring-current/10 shadow-xs`
                    : `${getCardBgClass(theme)} shadow-xs`
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-current/10 text-xs font-semibold">
                  {msg.role === 'user' ? (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold">
                      {msg.role === 'user'
                        ? 'User Question / Prompt'
                        : notes.provider === 'claude'
                        ? 'Claude Response'
                        : notes.provider === 'gemini'
                        ? 'Gemini Response'
                        : 'ChatGPT Response'}
                    </span>
                    <span className="text-[11px] opacity-50 font-mono ml-2">Turn #{idx + 1}</span>
                  </div>
                </div>

                <div className="pl-1">
                  <MarkdownBlock content={msg.content} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Footer */}
      <footer className="mt-14 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Generated with ChatPDF AI Notes Studio</span>
        <span>{notes.date} &bull; {activeMode.toUpperCase()} MODE</span>
      </footer>
    </div>
  </div>
  );
}
