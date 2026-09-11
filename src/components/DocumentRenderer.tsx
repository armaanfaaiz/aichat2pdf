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
        return 'theme-academic bg-[#fdfcf9] text-[#1c1b18]';
      case 'minimalist':
        return 'theme-minimalist bg-white text-black';
      case 'emerald':
        return 'theme-emerald bg-[#fafdfb] text-slate-900';
      case 'modern':
      default:
        return 'theme-modern bg-white text-slate-900';
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
      case 'modern':
      default:
        return 'border-b-2 border-indigo-600';
    }
  };

  return (
    <div
      id="printable-document"
      className={`w-full max-w-[860px] mx-auto p-6 sm:p-12 transition-all shadow-xl rounded-2xl border border-slate-200/80 ${getThemeClass(
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

          <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 uppercase font-mono text-[10px]">Author</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeAuthor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 uppercase font-mono text-[10px]">Reading Time</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{notes.readingTimeMinutes} min ({notes.wordCount} words)</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 uppercase font-mono text-[10px]">Date</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{notes.date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 uppercase font-mono text-[10px]">Source Link</span>
              <div className="flex items-center gap-1.5 font-semibold text-indigo-600 truncate">
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
                  <span className="text-slate-500">Pasted Input</span>
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
            <section className="toc-section p-5 rounded-xl bg-slate-50/80 border border-slate-200/70 avoid-break">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Table of Contents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                {options.includeSummary && (
                  <a href="#section-summary" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>1. Executive Summary</span>
                    <span className="text-slate-400 font-mono">Overview</span>
                  </a>
                )}
                {options.includeTakeaways && (
                  <a href="#section-takeaways" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>2. Key Takeaways & Decisions</span>
                    <span className="text-slate-400 font-mono">Core</span>
                  </a>
                )}
                {options.includeQA && (
                  <a href="#section-qa" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>3. Structured Breakdown & Analysis</span>
                    <span className="text-slate-400 font-mono">Q&A</span>
                  </a>
                )}
                {options.includeCode && notes.codeSnippets.length > 0 && (
                  <a href="#section-code" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>4. Code Snippets Reference</span>
                    <span className="text-slate-400 font-mono">Code</span>
                  </a>
                )}
                {options.includeQuiz && notes.reviewQuiz.length > 0 && (
                  <a href="#section-quiz" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>5. Self-Testing Quiz & Flashcards</span>
                    <span className="text-slate-400 font-mono">Review</span>
                  </a>
                )}
                {options.includeGlossary && notes.glossary.length > 0 && (
                  <a href="#section-glossary" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>6. Technical Terminology Glossary</span>
                    <span className="text-slate-400 font-mono">Terms</span>
                  </a>
                )}
                {options.includeActionItems && notes.actionItems.length > 0 && (
                  <a href="#section-actions" className="hover:text-indigo-600 flex items-center justify-between p-1 rounded-sm hover:bg-white transition">
                    <span>7. Implementation Checklist</span>
                    <span className="text-slate-400 font-mono">Action</span>
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Executive Summary */}
          {options.includeSummary && notes.executiveSummary && (
            <section id="section-summary" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Executive Summary</h2>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <MarkdownBlock content={notes.executiveSummary} />
              </div>
            </section>
          )}

          {/* Key Takeaways */}
          {options.includeTakeaways && notes.keyTakeaways.length > 0 && (
            <section id="section-takeaways" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Key Takeaways & Core Insights</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.keyTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-200 transition"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
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
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Detailed Breakdown & Analysis</h2>
              </div>

              {notes.qaBreakdown.map((item, idx) => (
                <div
                  key={item.id}
                  className="avoid-break p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold shrink-0">
                      #{idx + 1}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {sanitizeChatGPTText(item.question)}
                    </h3>
                  </div>

                  <div className="pl-1 sm:pl-9">
                    <MarkdownBlock content={item.answer} />
                  </div>

                  {item.keyPoints && item.keyPoints.length > 0 && (
                    <div className="ml-1 sm:ml-9 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                      <span className="font-semibold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider">
                        Important Highlights
                      </span>
                      {item.keyPoints.map((kp, kpIdx) => (
                        <div key={kpIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
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
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Code Snippet Reference</h2>
              </div>
              {notes.codeSnippets.map((snippet) => (
                <div key={snippet.id} className="avoid-break space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <span>{snippet.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 italic">{snippet.explanation}</p>
                  <CodeBlock code={snippet.code} language={snippet.language} />
                </div>
              ))}
            </section>
          )}

          {/* Review Quiz */}
          {options.includeQuiz && notes.reviewQuiz.length > 0 && (
            <section id="section-quiz" className="avoid-break space-y-3">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Review Questions & Flashcards</h2>
              </div>
              {notes.reviewQuiz.map((quiz, idx) => {
                const isRevealed = !!revealedQuiz[quiz.id];
                return (
                  <div key={quiz.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-bold text-indigo-600 shrink-0">Q{idx + 1}.</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">{sanitizeChatGPTText(quiz.question)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleQuizAnswer(quiz.id)}
                        className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition shrink-0"
                      >
                        <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                        {isRevealed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className={`pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-600 pl-6 ${isRevealed ? 'block' : 'hidden print:block'}`}>
                      <span className="font-semibold text-emerald-700 mr-1.5 font-mono">Answer:</span>
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
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Technical Glossary</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.glossary.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-900 block mb-1 font-mono">{item.term}</span>
                    <p className="text-slate-600 leading-relaxed">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Action Items */}
          {options.includeActionItems && notes.actionItems.length > 0 && (
            <section id="section-actions" className="avoid-break">
              <div className={`flex items-center gap-2 mb-3 pb-2 ${getAccentBar(theme)}`}>
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Implementation Checklist</h2>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                {notes.actionItems.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <input type="checkbox" defaultChecked={false} className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
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
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Executive Briefing</h2>
          </div>

          <div className="avoid-break p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2">Executive Summary</h3>
            <MarkdownBlock content={notes.executiveSummary} />
          </div>

          <div className="avoid-break p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">Primary Decisions & Findings</h3>
            <div className="space-y-2.5">
              {notes.keyTakeaways.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="leading-snug">{sanitizeChatGPTText(t)}</span>
                </div>
              ))}
            </div>
          </div>

          {notes.actionItems.length > 0 && (
            <div className="avoid-break p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">Next Steps & Action Matrix</h3>
              <div className="space-y-2">
                {notes.actionItems.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <input type="checkbox" defaultChecked={false} className="mt-0.5 w-4 h-4 rounded text-indigo-600" />
                    <span>{sanitizeChatGPTText(a)}</span>
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
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Quick Reference Cheatsheet</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {notes.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className="avoid-break p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1.5 font-mono">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <span>CORE HIGHLIGHT</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {sanitizeChatGPTText(takeaway)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
              Pattern & Reference Cards
            </h3>
            {notes.qaBreakdown.map((item) => (
              <div key={item.id} className="avoid-break p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">{sanitizeChatGPTText(item.question)}</h4>
                <MarkdownBlock content={item.answer} />
                {item.code && <CodeBlock code={item.code} language={item.language} />}
              </div>
            ))}
          </div>

          {notes.glossary.length > 0 && (
            <div className="avoid-break p-5 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Key Terms At A Glance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {notes.glossary.map((g, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-indigo-700 font-mono block">{g.term}</span>
                    <span className="text-slate-600">{g.definition}</span>
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
            <Bot className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Conversation Flow</h2>
          </div>

          <div className="space-y-6">
            {notes.rawTranscript.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`avoid-break rounded-2xl p-5 border transition-all ${
                  msg.role === 'user'
                    ? 'bg-indigo-50/60 border-indigo-200 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 text-xs font-semibold">
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
                    <span className="font-bold text-slate-800">
                      {msg.role === 'user'
                        ? 'User Question / Prompt'
                        : notes.provider === 'claude'
                        ? 'Claude Response'
                        : notes.provider === 'gemini'
                        ? 'Gemini Response'
                        : 'ChatGPT Response'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono ml-2">Turn #{idx + 1}</span>
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
  );
}
