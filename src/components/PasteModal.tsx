'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, Check, Sparkles } from 'lucide-react';
import { parseRawPastedChat, parseChatGPTJson } from '@/lib/chatgpt-parser';
import { ConversationData, AIProvider } from '@/types';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conv: ConversationData) => void;
}

export function PasteModal({ isOpen, onClose, onLoadConversation }: PasteModalProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState<AIProvider>('universal');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please paste conversation text or drag in a file.');
      return;
    }

    try {
      setError(null);
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        try {
          const parsedJson = JSON.parse(text);
          const conv = parseChatGPTJson(parsedJson);
          onLoadConversation({ ...conv, provider: provider !== 'universal' ? provider : conv.provider });
          onClose();
          return;
        } catch {
          // Fall through to text parser
        }
      }

      const conv = parseRawPastedChat(
        text,
        title.trim() || undefined,
        provider !== 'universal' ? provider : undefined
      );

      if (!conv || conv.messages.length === 0) {
        setError('Could not extract any content from the text. Please check the content and try again.');
        return;
      }

      onLoadConversation(conv);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to parse pasted text. Please verify the content format.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setText(content);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.onerror = () => {
      setError('Failed to read the uploaded file.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Paste Conversation or Upload File</h3>
              <p className="text-xs text-slate-500">Supports ChatGPT, Google Gemini, and Anthropic Claude</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Provider Switcher */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-600">AI Model Source:</span>
          {(['universal', 'chatgpt', 'gemini', 'claude'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                provider === p
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              {p === 'universal'
                ? '✨ Auto Detect'
                : p === 'chatgpt'
                ? '🤖 ChatGPT'
                : p === 'gemini'
                ? '♊ Gemini'
                : '🧠 Claude'}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <form onSubmit={handlePasteSubmit} className="flex flex-col flex-1 min-h-0 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Topic Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quantum Computing or IBPS Exam Strategy"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conversation Text, Export JSON, or Markdown
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`User: How does multi-head attention work?\n\nAssistant (Claude/Gemini/ChatGPT): Multi-head attention allows the model to jointly attend to information...`}
              className="w-full flex-1 min-h-[200px] text-xs font-mono border border-slate-200 rounded-xl p-3 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 resize-none leading-relaxed"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          {/* Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".txt,.json,.md,.markdown,.html,.log"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const clip = await navigator.clipboard.readText();
                    if (clip) setText(clip);
                  } catch {
                    // Ignore clipboard error
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition"
              >
                <span>📋 Paste from Clipboard</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Format Notes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
