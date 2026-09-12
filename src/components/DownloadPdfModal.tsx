'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Printer,
  CheckCircle2,
  Loader2,
  FileText,
  Sparkles,
  Zap,
  Palette,
  AlertCircle,
} from 'lucide-react';
import { GeneratedNotes, CustomizationOptions } from '@/types';
import {
  exportToPdfDirect,
  generatePublicationPdf,
  printDocument,
  triggerBlobDownload,
  PdfExportResult,
} from '@/lib/pdf-exporter';
import confetti from 'canvas-confetti';

interface DownloadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: GeneratedNotes;
  options: CustomizationOptions;
}

export function DownloadPdfModal({
  isOpen,
  onClose,
  notes,
  options,
}: DownloadPdfModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Preparing document...');
  const [result, setResult] = useState<PdfExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfType, setPdfType] = useState<'vector' | 'visual'>('vector');

  const rawFilename = `${options.customTitle || notes.title || 'chatgpt-notes'}`
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');

  const startExport = async (type: 'vector' | 'visual') => {
    setIsGenerating(true);
    setError(null);
    setPdfType(type);

    const isLargeDoc =
      (notes.qaBreakdown && notes.qaBreakdown.length > 10) ||
      (notes.rawTranscript && notes.rawTranscript.length > 15) ||
      (notes.wordCount && notes.wordCount > 3000);

    try {
      if (type === 'vector' || isLargeDoc) {
        if (isLargeDoc && type === 'visual') {
          setStatusMsg('Multi-page document detected (up to 250+ pages). Using Vector Engine to guarantee zero blank pages...');
        } else {
          setStatusMsg('Generating HD Publication-Grade PDF with constant margins...');
        }
        await new Promise((r) => setTimeout(r, 60));
        const res = generatePublicationPdf(notes, options, rawFilename);
        setResult(res);
        setPdfType('vector');
      } else {
        setStatusMsg('Rendering exact visual canvas capture...');
        const res = await exportToPdfDirect(
          'printable-document',
          rawFilename,
          (msg) => setStatusMsg(msg)
        );
        setResult(res);
      }

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('PDF export error:', err);
      try {
        setStatusMsg('Generating clean vector fallback...');
        const res = generatePublicationPdf(notes, options, rawFilename);
        setResult(res);
        setPdfType('vector');
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Failed to generate PDF. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setError(null);
      startExport('vector');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Download PDF Notes
              </h3>
              <p className="text-[11px] text-slate-500">
                A4 Publication-Grade Document &bull; Direct to Device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status / Loader State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-800 text-sm">
                  {statusMsg}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Synthesizing cards, highlights, and formatting A4 pages...
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isGenerating && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-800 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={() => startExport('vector')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  Retry with Vector Engine
                </button>
              </div>
            </div>
          )}

          {/* Success / Ready State */}
          {result && !isGenerating && (
            <div className="space-y-5">
              {/* Ready Badge & File Information Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Ready for Download
                    </span>
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {result.filename}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {result.totalPages} {result.totalPages === 1 ? 'Page' : 'Pages'} &bull; A4 Portrait &bull; {pdfType === 'visual' ? 'Exact Preview Theme' : 'Vector Typography'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (iLovePDF Style Direct Tap) */}
              <div className="space-y-2.5">
                {/* 1. Primary Native Download Button (Cannot be blocked by any browser) */}
                <a
                  href={result.blobUrl}
                  download={result.filename}
                  onClick={() => triggerBlobDownload(result.blob, result.filename)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition transform active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF File</span>
                </a>

                {/* 2. Secondary Actions (Preview / Print) */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={result.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>View in New Tab</span>
                  </a>

                  <button
                    onClick={printDocument}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open Print Dialog</span>
                  </button>
                </div>
              </div>

              {/* Format Engine Switcher */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Rendering Mode:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => startExport('vector')}
                    disabled={isGenerating}
                    className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition flex items-center gap-1 ${
                      pdfType === 'vector'
                        ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>HD Vector (Exact Margins)</span>
                  </button>
                  <button
                    onClick={() => startExport('visual')}
                    disabled={isGenerating}
                    className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition flex items-center gap-1 ${
                      pdfType === 'visual'
                        ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                    <span>Visual Canvas</span>
                  </button>
                </div>
              </div>

              {/* Automatic Download Help Note */}
              <p className="text-[11px] text-slate-400 text-center">
                Your download should start automatically. If your browser blocked it, tap <strong className="text-slate-600">Download PDF File</strong> above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
