'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileCode2,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { GeneratedNotes, CustomizationOptions } from '@/types';
import { printDocument, exportToPdfDirect } from '@/lib/pdf-exporter';
import { convertNotesToMarkdown, downloadFile } from '@/lib/markdown-exporter';
import confetti from 'canvas-confetti';

interface ExportToolbarProps {
  notes: GeneratedNotes;
  options: CustomizationOptions;
}

export function ExportToolbar({ notes, options }: ExportToolbarProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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
    printDocument();
  };

  const handleDirectPdf = async () => {
    setIsExportingPdf(true);
    setStatusMsg('Generating PDF...');
    try {
      const filename = `${options.customTitle || notes.title || 'chatgpt-notes'}.pdf`
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_');
      await exportToPdfDirect('printable-document', filename, (msg) => setStatusMsg(msg));
      triggerConfetti();
    } catch (err: any) {
      alert('Failed to generate direct PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
      setStatusMsg(null);
    }
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
    <div className="no-print sticky bottom-6 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md text-white p-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-xs">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="font-semibold text-slate-200">Export Notes:</span>
        {statusMsg && <span className="text-cyan-300 font-mono text-[11px] animate-pulse">({statusMsg})</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Recommended Print / Save Vector PDF */}
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md transition transform active:scale-95"
          title="Best quality vector PDF with native browser engine"
        >
          <Printer className="w-4 h-4" />
          <span>Save PDF (Recommended)</span>
        </button>

        {/* Direct PDF Download */}
        <button
          onClick={handleDirectPdf}
          disabled={isExportingPdf}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-medium text-xs transition"
          title="Direct raster download"
        >
          {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Download className="w-3.5 h-3.5" />}
          <span>Direct PDF</span>
        </button>

        {/* Markdown Download */}
        <button
          onClick={handleDownloadMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition"
          title="Download Markdown file (.md)"
        >
          <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>.MD</span>
        </button>

        {/* Copy to Clipboard */}
        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition"
          title="Copy Markdown to Clipboard"
        >
          {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedMd ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}
