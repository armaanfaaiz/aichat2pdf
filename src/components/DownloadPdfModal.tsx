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
  Cloud,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { GeneratedNotes, CustomizationOptions } from '@/types';
import {
  exportToExactPreviewPdf,
  generatePublicationPdf,
  exportViaILovePdfApi,
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
  const [pdfType, setPdfType] = useState<'vector' | 'ilovepdf' | 'exact'>('vector');

  // iLovePDF credentials management
  const [serverHasILovePdf, setServerHasILovePdf] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [ilovepdfPublicKey, setIlovepdfPublicKey] = useState('');
  const [ilovepdfSecretKey, setIlovepdfSecretKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const rawFilename = `${options.customTitle || notes.title || 'chatgpt-notes'}`
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');

  // Load saved keys from localStorage and probe server config
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPub = localStorage.getItem('ilovepdf_public_key') || '';
      const savedSec = localStorage.getItem('ilovepdf_secret_key') || '';
      if (savedPub) setIlovepdfPublicKey(savedPub);
      if (savedSec) setIlovepdfSecretKey(savedSec);

      fetch('/api/pdf/ilovepdf')
        .then((r) => r.json())
        .then((data) => {
          if (data.configured) {
            setServerHasILovePdf(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const saveKeysToStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilovepdf_public_key', ilovepdfPublicKey.trim());
      localStorage.setItem('ilovepdf_secret_key', ilovepdfSecretKey.trim());
      setKeySaved(true);
      setShowKeyConfig(false);
      startExport('ilovepdf');
    }
  };

  const startExport = async (type: 'vector' | 'ilovepdf' | 'exact') => {
    setIsGenerating(true);
    setError(null);
    setPdfType(type);

    try {
      if (type === 'ilovepdf') {
        const pubKey = ilovepdfPublicKey.trim() || undefined;
        const secKey = ilovepdfSecretKey.trim() || undefined;

        if (!serverHasILovePdf && (!pubKey || !secKey)) {
          setShowKeyConfig(true);
          setIsGenerating(false);
          return;
        }

        setStatusMsg('Connecting to official iLovePDF API cloud engine...');
        const res = await exportViaILovePdfApi(
          'printable-document',
          rawFilename,
          { publicKey: pubKey, secretKey: secKey },
          (msg) => setStatusMsg(msg)
        );
        setResult(res);
      } else if (type === 'exact') {
        setStatusMsg('Rendering exact snapshot in High Resolution...');
        const res = await exportToExactPreviewPdf(
          'printable-document',
          rawFilename,
          (msg) => setStatusMsg(msg)
        );
        setResult(res);
      } else {
        // 'vector' - 100% Vector Typography, razor sharp, zero blur, crystal clear at 500% zoom
        setStatusMsg('Generating Ultra-HD Vector PDF with crystal-clear typography...');
        await new Promise((r) => setTimeout(r, 60));
        const res = generatePublicationPdf(notes, options, rawFilename);
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
      if (type === 'ilovepdf' && (err.message?.includes('keys') || !serverHasILovePdf)) {
        setShowKeyConfig(true);
      }
      setError(err.message || 'Failed to generate PDF. Falling back to native vector engine.');
      try {
        setStatusMsg('Generating clean Ultra-HD Vector fallback...');
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
      // Default to Ultra-HD Vector Typography for crystal-clear, zero-blur direct download
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
                Publication-Grade HD Vector &bull; Direct to Device
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
        <div className="p-6 space-y-5">
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

          {/* Key Configuration Box for iLovePDF */}
          {showKeyConfig && !isGenerating && (
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/80 text-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-red-950">
                    Connect iLovePDF Cloud API
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-md">
                  Official Integration
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Enter your free credentials from{' '}
                <a
                  href="https://developer.ilovepdf.com/user/projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-700 underline font-medium hover:text-red-800"
                >
                  developer.ilovepdf.com
                </a>{' '}
                to render via iLovePDF&apos;s cloud Chrome engine, or use native Ultra-HD Vector below.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="iLovePDF Public Key (e.g. project_public_...)"
                  value={ilovepdfPublicKey}
                  onChange={(e) => setIlovepdfPublicKey(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-red-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <input
                  type="password"
                  placeholder="iLovePDF Secret Key (e.g. secret_key_...)"
                  value={ilovepdfSecretKey}
                  onChange={(e) => setIlovepdfSecretKey(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-red-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={saveKeysToStorage}
                  disabled={!ilovepdfPublicKey.trim() || !ilovepdfSecretKey.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  Save & Generate PDF
                </button>
                <button
                  onClick={() => {
                    setShowKeyConfig(false);
                    startExport('vector');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                >
                  Use Native Vector Instead
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isGenerating && !showKeyConfig && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold">{error}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startExport('vector')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                  >
                    Use Ultra-HD Vector
                  </button>
                  <button
                    onClick={() => setShowKeyConfig(true)}
                    className="px-3 py-1.5 bg-white border border-amber-200 text-slate-700 rounded-lg font-medium transition"
                  >
                    Configure iLovePDF Keys
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success / Ready State */}
          {result && !isGenerating && (
            <div className="space-y-4">
              {/* Ready Badge & File Information Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Ready for Download
                      </span>
                      {pdfType === 'ilovepdf' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          iLovePDF
                        </span>
                      )}
                      {pdfType === 'vector' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          Ultra-HD Vector
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {result.filename}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      A4 Portrait &bull; {pdfType === 'ilovepdf' ? 'iLovePDF Cloud Vector' : pdfType === 'vector' ? 'Ultra-HD Vector Typography' : 'Exact Snapshot (HD)'}
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

              {/* Engine Switcher Tabs */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Download Engine:</span>
                  {(serverHasILovePdf || ilovepdfPublicKey) && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> iLovePDF Connected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {/* Option 1: Ultra-HD Vector (Default, crystal clear, zero blur) */}
                  <button
                    onClick={() => startExport('vector')}
                    disabled={isGenerating}
                    className={`px-2.5 py-2 rounded-lg font-medium text-[11px] transition flex flex-col items-center gap-0.5 text-center ${
                      pdfType === 'vector'
                        ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-indigo-500" />
                      <span>Ultra-HD Vector</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Razor sharp text</span>
                  </button>

                  {/* Option 2: iLovePDF Cloud (@ilovepdf/ilovepdf-nodejs) */}
                  <button
                    onClick={() => startExport('ilovepdf')}
                    disabled={isGenerating}
                    className={`px-2.5 py-2 rounded-lg font-medium text-[11px] transition flex flex-col items-center gap-0.5 text-center ${
                      pdfType === 'ilovepdf'
                        ? 'bg-white text-red-600 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-red-500" />
                      <span>iLovePDF API</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Official Cloud</span>
                  </button>

                  {/* Option 3: Exact Snapshot */}
                  <button
                    onClick={() => startExport('exact')}
                    disabled={isGenerating}
                    className={`px-2.5 py-2 rounded-lg font-medium text-[11px] transition flex flex-col items-center gap-0.5 text-center ${
                      pdfType === 'exact'
                        ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Exact Snapshot</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Retina capture</span>
                  </button>
                </div>
              </div>

              {/* Automatic Download Help Note */}
              <p className="text-[11px] text-slate-400 text-center">
                Your download should start automatically. If blocked by browser, tap <strong className="text-slate-600">Download PDF File</strong> above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
