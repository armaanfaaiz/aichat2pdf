import React from 'react';
import { FileText, Sparkles, BookOpen, ClipboardPaste, Printer } from 'lucide-react';
import { DEMO_CONVERSATIONS } from '@/lib/demo-data';
import { ConversationData } from '@/types';

interface NavbarProps {
  onSelectDemo: (conv: ConversationData) => void;
  onOpenPasteModal: () => void;
  hasDocument: boolean;
  onPrint: () => void;
}

export function Navbar({
  onSelectDemo,
  onOpenPasteModal,
  hasDocument,
  onPrint,
}: NavbarProps) {
  return (
    <nav className="no-print sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 to-indigo-950 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5 text-indigo-400 group-hover:rotate-6 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text">
                ChatPDF<span className="text-indigo-600">.ai</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200/60 shadow-2xs">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                Universal Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">AI Conversations &rarr; Executive Notes & PDF Guides</p>
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

          {/* Primary Print / Save PDF via Printer View */}
          {hasDocument && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
              title="Print or Save PDF via printer view"
            >
              <Printer className="w-4 h-4" />
              <span>Printer View</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
