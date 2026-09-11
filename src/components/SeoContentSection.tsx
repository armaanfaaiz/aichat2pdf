'use client';

import React from 'react';
import {
  FileText,
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  Table,
  Code2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function SeoContentSection() {
  const steps = [
    {
      number: '01',
      title: 'Share or Copy Your Chat',
      desc: 'In ChatGPT, click "Share link" to copy the public URL, or select and copy the chat text directly.',
      icon: ArrowRight,
    },
    {
      number: '02',
      title: 'Pick Your Note Style & Theme',
      desc: 'Choose from Study Guide, Executive Brief, Cheatsheet Cards, or Polished Chat, paired with Academic, Modern, or Notion styling.',
      icon: Sparkles,
    },
    {
      number: '03',
      title: 'Export Publication-Grade PDF',
      desc: 'Click "Save PDF" to generate a vector-grade, high-resolution document with styled tables and zero citation artifacts.',
      icon: FileText,
    },
  ];

  const features = [
    {
      title: 'Automatic Citation Sanitization',
      desc: 'Completely strips away ugly search markers (like turn0search, box glyphs, and source tags) from ChatGPT web search results.',
      icon: ShieldCheck,
    },
    {
      title: 'Publication-Grade Markdown Tables',
      desc: 'Raw table syntax like exam patterns and schedules are converted into beautiful, responsive HTML tables with crisp headers and borders.',
      icon: Table,
    },
    {
      title: 'Syntax-Highlighted Code Blocks',
      desc: 'Source code in Python, TypeScript, SQL, Lua, and more is styled with line numbers and a 1-click copy button.',
      icon: Code2,
    },
    {
      title: 'Executive Summaries & Takeaways',
      desc: 'Synthesizes long conversations into high-impact TL;DR summaries, priority bullet points, and self-testing flashcards.',
      icon: Zap,
    },
  ];

  const faqs = [
    {
      q: 'How do I convert a ChatGPT conversation link into PDF notes?',
      a: 'Simply copy the public share link from ChatGPT (https://chatgpt.com/share/...) and paste it into our input box. Our studio parses the full conversation turns, cleans up citation artifacts, extracts key takeaways, and formats everything into a publication-grade PDF in seconds.',
    },
    {
      q: 'Can I paste conversation text directly if I don’t have a share link?',
      a: 'Yes! Click the "1-Click Paste From Clipboard" button or "Paste Text / File". You can paste raw copied text, ChatGPT export JSON, or markdown files.',
    },
    {
      q: 'Does it support Markdown tables and code snippets?',
      a: 'Yes, full GitHub Flavored Markdown (GFM) is supported. Exam patterns, marks tables, schedules, and code snippets are rendered into clean, vector-sharp tables and syntax-highlighted containers.',
    },
    {
      q: 'What note formats are available?',
      a: 'You can choose between 4 note structures: Comprehensive Study Guide (for in-depth learning with quiz & glossary), Executive Brief (for managers and decision-makers), Cheatsheet Cards (for quick exam revision), and Polished Chat (clean dialog flow).',
    },
    {
      q: 'Is this free and private?',
      a: 'Yes, ChatPDF Notes is 100% free and client-driven. No login, registration, or API key is required.',
    },
  ];

  return (
    <section className="no-print mt-20 pt-16 border-t border-slate-200 text-slate-800 space-y-20">
      {/* 1. How It Works Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            How to Convert ChatGPT to Wonderful PDF Notes
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Turn unstructured AI conversations into crisp, structured reference notes and study guides in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-indigo-600 font-mono">{s.number}</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Key Features Matrix */}
      <div className="bg-slate-100/60 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Designed For Perfection
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Why Choose ChatPDF Notes Studio?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered to produce beautiful, clean, and publication-ready documents without the manual formatting hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Frequently Asked Questions (FAQ) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
            >
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6.5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Footer */}
      <footer className="border-t border-slate-200 py-10 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-700">
          ChatPDF Notes Studio &bull; Free ChatGPT to PDF Notes & Study Guide Converter
        </p>
        <p>
          Convert ChatGPT conversation links, exam preparation notes, coding tutorials, and interview prep into wonderful PDFs.
        </p>
        <p className="text-[11px] text-slate-400 font-mono pt-2">
          &copy; {new Date().getFullYear()} ChatPDF Notes. All rights reserved.
        </p>
      </footer>
    </section>
  );
}
