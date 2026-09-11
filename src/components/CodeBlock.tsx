'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = 'code', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="avoid-break my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-md">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          {title ? (
            <span className="font-semibold text-slate-200">{title}</span>
          ) : (
            <span className="font-mono uppercase text-[11px] text-slate-400">{language}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="no-print flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800 transition"
          title="Copy snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[12px] sm:text-[13px] font-mono leading-relaxed bg-[#0d1117]">
        <pre className="flex">
          {/* Line Numbers */}
          <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800 min-w-[2.2rem]">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Actual Code */}
          <code className="pl-4 text-slate-200 flex-1 whitespace-pre">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
