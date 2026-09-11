'use client';

import React, { useState } from 'react';
import { Link2, Sparkles, Loader2, ArrowRight, BookOpen, AlertCircle, Clipboard, ClipboardPaste } from 'lucide-react';
import { DEMO_CONVERSATIONS } from '@/lib/demo-data';
import { parseRawPastedChat } from '@/lib/chatgpt-parser';
import { detectAIProvider } from '@/lib/sanitize';
import { ConversationData, AIProvider } from '@/types';

interface InputHeroProps {
  onLoadConversation: (conv: ConversationData) => void;
  onOpenPasteModal: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function InputHero({ onLoadConversation, onOpenPasteModal, isLoading, setIsLoading }: InputHeroProps) {
  const [url, setUrl] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('universal');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const isHttpUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://');

      if (isHttpUrl) {
        // Send any AI link (ChatGPT, Claude, Gemini) to /api/extract
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to extract conversation');
        }

        onLoadConversation(data);
        return;
      }

      // If user typed or pasted raw text directly into the input bar
      const detected = selectedProvider !== 'universal' ? selectedProvider : detectAIProvider(url);
      const parsed = parseRawPastedChat(url.trim(), undefined, detected !== 'universal' ? detected : undefined);
      if (parsed.messages.length > 0) {
        onLoadConversation(parsed);
      } else {
        throw new Error('Could not parse text. Please paste conversation text or try the 1-Click Clipboard button.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while processing the conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantPasteAndGenerate = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const detected = detectAIProvider(text);
        if (text.trim().startsWith('http://') || text.trim().startsWith('https://')) {
          setUrl(text.trim());
          return;
        }
        const parsed = parseRawPastedChat(text, undefined, detected !== 'universal' ? detected : undefined);
        onLoadConversation(parsed);
        setError(null);
      } else {
        onOpenPasteModal();
      }
    } catch {
      onOpenPasteModal();
    }
  };

  return (
    <div className="hero-input-section relative max-w-4xl mx-auto pt-6 sm:pt-10 pb-4 px-4 sm:px-6 text-center">
      {/* Cool Ambient Glow behind the hero */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-56 bg-gradient-to-tr from-indigo-400/20 via-purple-400/15 to-pink-400/10 blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Universal AI Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-indigo-200/70 text-indigo-900 text-xs font-semibold mb-5 shadow-sm hover:border-indigo-300 transition-all">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
        </span>
        <span className="tracking-wide">Universal AI Engine</span>
        <span className="text-slate-300">&bull;</span>
        <span className="text-slate-600 font-medium">ChatGPT &bull; Claude &bull; Gemini</span>
      </div>

      {/* Hero Title */}
      <h1 className="text-3xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
        Convert AI Chats to <br className="hidden sm:inline" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Publication-Ready PDF
        </span> Notes
      </h1>

      <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-7 leading-relaxed font-medium">
        Paste any conversation link or chat transcript from <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">ChatGPT</span>,{' '}
        <span className="font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">Google Gemini</span>, or{' '}
        <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Claude</span> to generate synthesis notes, flashcards, & executive matrices.
      </p>

      {/* Provider Selector Pills */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-xs text-slate-500 font-semibold mr-1">Select AI:</span>
        <button
          type="button"
          onClick={() => setSelectedProvider('chatgpt')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            selectedProvider === 'chatgpt'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-400 ring-2 ring-emerald-500/25 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span>🤖</span>
          <span>ChatGPT</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedProvider('gemini')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            selectedProvider === 'gemini'
              ? 'bg-blue-50 text-blue-900 border-blue-400 ring-2 ring-blue-500/25 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span>♊</span>
          <span>Gemini</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedProvider('claude')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            selectedProvider === 'claude'
              ? 'bg-amber-50 text-amber-900 border-amber-400 ring-2 ring-amber-500/25 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span>🧠</span>
          <span>Claude</span>
        </button>
      </div>

      {/* Input Form with Floating Glassmorphism & Neon Glow Focus */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-5">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xs opacity-30 group-focus-within:opacity-80 transition duration-500"></div>
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-indigo-950/5 border border-slate-200/90 group-focus-within:border-transparent transition-all p-2">
            <div className="pl-3 pr-2 text-indigo-600">
              <Link2 className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste ChatGPT, Claude, or Gemini share link..."
              className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent outline-hidden pr-2 font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 shrink-0 transform active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Generate Notes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error / Notice Box */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-left flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed space-y-2">
            <div>
              <p className="font-semibold text-amber-950 mb-1">Notice</p>
              <p>{error}</p>
            </div>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleInstantPasteAndGenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>1-Click Paste From Clipboard</span>
              </button>
              <button
                type="button"
                onClick={onOpenPasteModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-medium text-xs transition"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Open Paste Dialog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Demos for ChatGPT, Gemini, and Claude */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
        <button
          onClick={handleInstantPasteAndGenerate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold transition shadow-xs"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste Any Copied Chat</span>
        </button>
        <span className="text-slate-300">|</span>
        <span className="font-medium text-slate-400">Explore AI Demos:</span>
        <button
          onClick={() => onLoadConversation(DEMO_CONVERSATIONS[0])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-700 font-medium transition shadow-xs"
        >
          <span>🤖</span>
          <span>ChatGPT (Caching)</span>
        </button>
        <button
          onClick={() => onLoadConversation(DEMO_CONVERSATIONS[1])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 font-medium transition shadow-xs"
        >
          <span>♊</span>
          <span>Gemini (Multimodal)</span>
        </button>
        <button
          onClick={() => onLoadConversation(DEMO_CONVERSATIONS[2])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-slate-700 font-medium transition shadow-xs"
        >
          <span>🧠</span>
          <span>Claude (3.7 Sonnet)</span>
        </button>
        <button
          onClick={onOpenPasteModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Custom Input</span>
        </button>
      </div>
    </div>
  );
}
