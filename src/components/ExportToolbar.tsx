'use client';

import React, { useState } from 'react';
import {
  Printer,
  FileCode2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { GeneratedNotes, CustomizationOptions } from '@/types';
import { printDocument } from '@/lib/pdf-exporter';
import { convertNotesToMarkdown, downloadFile } from '@/lib/markdown-exporter';
import confetti from 'canvas-confetti';

interface ExportToolbarProps {
  notes: GeneratedNotes;
  options: CustomizationOptions;
}

export function ExportToolbar({ notes, options }: ExportToolbarProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    triggerConfetti();
    setStatusMsg('Opening printer view...');
    printDocument();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDownloadMarkdown = () => {
    const md = convertNotesToMarkdown(notes, options);
    const filename = `${options.customTitle || notes.title || 'chatgpt-notes'}.md`
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_');
    downloadFile(md, filename);
    triggerConfetti();
  };

  const handleCopyMarkdown = async () => {
    const md = convertNotesToMarkdown(notes, options);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
      triggerConfetti();
    } catch {
      // fallback
    }
  };

  return (
    <div className="no-print sticky bottom-6 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-2xl text-white p-2.5 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl shadow-indigo-950/30 border border-slate-700/60 max-w-3xl mx-auto ring-1 ring-white/10">
      <div className="flex items-center gap-2.5 text-xs">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-bold text-slate-200 block text-xs">Ready to Export</span>
          <span className="text-[10px] text-slate-400 font-medium">HD Printer View &bull; Markdown ready</span>
        </div>
        {statusMsg && <span className="text-cyan-300 font-mono text-[11px] animate-pulse ml-1">({statusMsg})</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Single Primary Export: Printer View (High-Definition PDF) */}
        <button
          onClick={handlePrint}
          className="relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 cursor-pointer"
          title="Open printer view to print or save as high-definition PDF"
        >
          <Printer className="w-4 h-4" />
          <span>Printer View</span>
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/20 font-mono tracking-wider font-semibold">Save as PDF</span>
        </button>

        {/* Download MD */}
        <button
          onClick={handleDownloadMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/60 transition active:scale-95"
          title="Export formatted Markdown file"
        >
          <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
          <span>.MD</span>
        </button>

        {/* Copy MD */}
        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700/60 transition active:scale-95"
          title="Copy Markdown to Clipboard"
        >
          {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copiedMd ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}
