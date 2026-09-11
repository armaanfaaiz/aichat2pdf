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
    <div className="view-switcher-bar no-print w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-2 mb-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Note Structure / Style
        </span>
        <span className="text-[11px] text-indigo-600 font-medium hidden sm:inline">
          Live instant preview &bull; Click to switch
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeMode === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onModeChange(v.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/60'
              }`}
              title={v.desc}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
