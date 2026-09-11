'use client';

import React from 'react';
import { FileText, Sparkles, BookOpen, ClipboardPaste, Download } from 'lucide-react';
import { DEMO_CONVERSATIONS } from '@/lib/demo-data';
import { ConversationData } from '@/types';

interface NavbarProps {
  onSelectDemo: (conv: ConversationData) => void;
  onOpenPasteModal: () => void;
  hasDocument: boolean;
  onPrint: () => void;
}

export function Navbar({ onSelectDemo, onOpenPasteModal, hasDocument, onPrint }: NavbarProps) {
  return (
    <nav className="no-print sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">ChatPDF Notes</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                GPT &bull; Gemini &bull; Claude
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Turn AI chats into publication-grade PDF notes</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset Demos for All 3 Major AIs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <span className="text-xs font-medium text-slate-500 px-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Demos:
            </span>
            <button
              onClick={() => onSelectDemo(DEMO_CONVERSATIONS[0])}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg text-emerald-800 bg-white shadow-2xs hover:bg-emerald-50 transition flex items-center gap-1"
              title="ChatGPT: Distributed Caching"
            >
              <span>🤖</span>
              <span>ChatGPT</span>
            </button>
            <button
              onClick={() => onSelectDemo(DEMO_CONVERSATIONS[1])}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg text-blue-800 hover:bg-white transition flex items-center gap-1"
              title="Google Gemini: Multimodal 2.0 Flash"
            >
              <span>♊</span>
              <span>Gemini</span>
            </button>
            <button
              onClick={() => onSelectDemo(DEMO_CONVERSATIONS[2])}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg text-amber-800 hover:bg-white transition flex items-center gap-1"
              title="Anthropic Claude: 3.7 Sonnet Hybrid Thinking"
            >
              <span>🧠</span>
              <span>Claude</span>
            </button>
          </div>

          {/* Paste Dialog Button */}
          <button
            onClick={onOpenPasteModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <ClipboardPaste className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Paste Text / File</span>
          </button>

          {/* Quick Print Button if doc loaded */}
          {hasDocument && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
