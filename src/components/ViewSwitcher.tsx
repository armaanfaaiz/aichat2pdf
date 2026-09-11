'use client';

import React from 'react';
import { BookOpen, MessageSquare, Zap, FileText, Palette } from 'lucide-react';
import { NoteMode, ThemeStyle } from '@/types';

export const THEMES_LIST: Array<{ id: ThemeStyle; name: string; icon: string; color: string }> = [
  { id: 'academic', name: 'Academic', icon: '🎓', color: '#8b5e34' },
  { id: 'modern', name: 'Modern', icon: '🌌', color: '#4f46e5' },
  { id: 'vintage', name: 'Vintage', icon: '📜', color: '#92400e' },
  { id: 'nord', name: 'Nordic', icon: '❄️', color: '#0284c7' },
  { id: 'crimson', name: 'Crimson', icon: '🏛️', color: '#be123c' },
  { id: 'forest', name: 'Forest', icon: '🌲', color: '#15803d' },
  { id: 'minimalist', name: 'Minimalist', icon: '🌿', color: '#18181b' },
  { id: 'emerald', name: 'Emerald', icon: '💎', color: '#059669' },
  { id: 'midnight', name: 'Midnight', icon: '🌙', color: '#3b82f6' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡', color: '#f59e0b' },
  { id: 'sunset', name: 'Sunset', icon: '🌅', color: '#ea580c' },
  { id: 'lavender', name: 'Lavender', icon: '🌸', color: '#9333ea' },
  { id: 'solarized', name: 'Solarized', icon: '☀️', color: '#b58900' },
  { id: 'slate', name: 'Slate', icon: '🖋️', color: '#475569' },
];

interface ViewSwitcherProps {
  activeMode: NoteMode;
  onModeChange: (mode: NoteMode) => void;
  activeTheme?: ThemeStyle;
  onThemeChange?: (theme: ThemeStyle) => void;
}

export function ViewSwitcher({
  activeMode,
  onModeChange,
  activeTheme,
  onThemeChange,
}: ViewSwitcherProps) {
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
    <div className="view-switcher-bar no-print w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 sm:p-4 mb-5">
      {/* Output Structure Layout Row */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">
            Document Layout Structure
          </span>
        </div>
        <span className="text-[11px] text-indigo-600 font-semibold hidden sm:inline-flex items-center gap-1">
          <span>Live Switch</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeMode === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onModeChange(v.id)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-white text-indigo-950 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5 transform scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate">{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Theme Quick Strip Row (All 14 Themes directly visible) */}
      {onThemeChange && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">
                Visual Themes ({THEMES_LIST.length} Styles)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Horizontal scroll &bull; 1-Tap Switch</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 px-0.5 scrollbar-none">
            {THEMES_LIST.map((t) => {
              const isSelected = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onThemeChange(t.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-950 text-white shadow-sm ring-2 ring-indigo-500/50'
                      : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <span className="text-xs">{t.icon}</span>
                  <span>{t.name}</span>
                  <span
                    className="w-2 h-2 rounded-full ml-0.5 border border-black/10 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

