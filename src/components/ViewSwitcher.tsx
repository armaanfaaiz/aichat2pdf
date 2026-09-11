'use client';

import React from 'react';
import { BookOpen, MessageSquare, Zap, FileText } from 'lucide-react';
import { NoteMode } from '@/types';

interface ViewSwitcherProps {
  activeMode: NoteMode;
  onModeChange: (mode: NoteMode) => void;
}

export function ViewSwitcher({ activeMode, onModeChange }: ViewSwitcherProps) {
  const views: Array<{ id: NoteMode; label: string; icon: any; desc: string }> = [
    {
      id: 'study',
      label: 'Study Guide',
      icon: BookOpen,
      desc: 'Full structured guide with TOC, summary, tables & quiz',
    },
    {
      id: 'brief',
      label: 'Executive Brief',
      icon: FileText,
      desc: 'High-impact TL;DR, decisions & key findings',
    },
    {
      id: 'cheatsheet',
      label: 'Cheatsheet Cards',
      icon: Zap,
      desc: 'High-density cards for exam patterns & fast revision',
    },
    {
      id: 'transcript',
      label: 'Polished Chat',
      icon: MessageSquare,
      desc: 'Dialogue flow with clean speaker bubbles & markdown',
    },
  ];

  return (
    <div className="view-switcher-bar no-print w-full bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-sm p-2 sm:p-2.5 mb-5">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Output Layout Style
          </span>
        </div>
        <span className="text-[11px] text-indigo-600 font-semibold hidden sm:inline-flex items-center gap-1">
          <span>Instant live preview</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-slate-500 font-normal">Click to switch layout</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/70 rounded-xl">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeMode === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onModeChange(v.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-white text-indigo-950 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5 transform scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate">{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
