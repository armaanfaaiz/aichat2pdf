'use client';

import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  CheckSquare,
  BookOpen,
  Briefcase,
  Code2,
  MessageSquare,
  Type,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CustomizationOptions, ThemeStyle, NoteMode } from '@/types';

interface StudioControlsProps {
  options: CustomizationOptions;
  setOptions: React.Dispatch<React.SetStateAction<CustomizationOptions>>;
  defaultTitle: string;
}

export function StudioControls({ options, setOptions, defaultTitle }: StudioControlsProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const updateOption = <K extends keyof CustomizationOptions>(key: K, value: CustomizationOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const themes: Array<{ id: ThemeStyle; name: string; icon: string; desc: string; color: string }> = [
    { id: 'academic', name: 'Academic Scholar', icon: '🎓', desc: 'Serif headings, ivory paper, formal review style', color: '#8b5e34' },
    { id: 'modern', name: 'Modern Indigo', icon: '🌌', desc: 'Clean SaaS aesthetic, crisp indigo highlights', color: '#4f46e5' },
    { id: 'vintage', name: 'Vintage Parchment', icon: '📜', desc: 'Antique book paper, warm espresso ink', color: '#92400e' },
    { id: 'nord', name: 'Nordic Frost', icon: '❄️', desc: 'Arctic ice blue tint, cool slate typography', color: '#0284c7' },
    { id: 'crimson', name: 'Crimson Scholar', icon: '🏛️', desc: 'Oxford/Harvard deep crimson, bold scholarly borders', color: '#be123c' },
    { id: 'forest', name: 'Deep Evergreen', icon: '🌲', desc: 'Rich pine tree moss, calming earthy green', color: '#15803d' },
    { id: 'minimalist', name: 'Minimalist Swiss', icon: '🌿', desc: 'Monochrome editorial, high contrast, clean grid', color: '#18181b' },
    { id: 'emerald', name: 'Emerald Notion', icon: '💎', desc: 'Notion-style callouts, mint & forest green', color: '#059669' },
    { id: 'midnight', name: 'Midnight Dark', icon: '🌙', desc: 'Deep slate navy, electric luminescent blue', color: '#3b82f6' },
    { id: 'cyberpunk', name: 'Cyber Terminal', icon: '⚡', desc: 'Tech hacker vibe, monospace headers, neon amber', color: '#f59e0b' },
    { id: 'sunset', name: 'Sunset Warmth', icon: '🌅', desc: 'Warm terracotta, peach tints, energizing study feel', color: '#ea580c' },
    { id: 'lavender', name: 'Lavender Pastel', icon: '🌸', desc: 'Gentle violet tones, calm readable aesthetic', color: '#9333ea' },
    { id: 'solarized', name: 'Solarized Cream', icon: '☀️', desc: 'Classic solarized warm base, golden accents', color: '#b58900' },
    { id: 'slate', name: 'Executive Slate', icon: '🖋️', desc: 'Steel corporate slate, charcoal typography', color: '#475569' },
  ];

  const modes: Array<{ id: NoteMode; name: string; icon: any; desc: string }> = [
    { id: 'study', name: 'Study Guide', icon: BookOpen, desc: 'Complete breakdown with Q&A, quiz & glossary' },
    { id: 'brief', name: 'Executive Brief', icon: Briefcase, desc: 'High-impact TL;DR, decisions & takeaways' },
    { id: 'cheatsheet', name: 'Cheatsheet', icon: Code2, desc: 'Code patterns, syntax rules & reference cards' },
    { id: 'transcript', name: 'Polished Chat', icon: MessageSquare, desc: 'Clean dialogue turns with styled bubbles' },
  ];

  const currentThemeObj = themes.find((t) => t.id === options.theme) || themes[0];
  const currentModeObj = modes.find((m) => m.id === options.mode) || modes[0];

  return (
    <div className="no-print bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all text-slate-900">
      {/* Mobile Accordion Toggle Header (Visible on mobile screens) */}
      <button
        type="button"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className="w-full lg:hidden flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customize Document</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                {currentThemeObj.icon} {currentThemeObj.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Tap to customize themes, title, author & sections</p>
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isMobileExpanded ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Desktop Header (Always visible on large screens) */}
      <div className="hidden lg:flex items-center gap-2 p-5 pb-3 border-b border-slate-100">
        <Sliders className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Studio Customizer</h3>
      </div>

      {/* Collapsible Content Body (Always open on lg, collapsible on mobile) */}
      <div className={`p-5 space-y-6 ${isMobileExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* Note Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">Note Structure / Style</label>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = options.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateOption('mode', m.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-bold text-xs">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span className={isSelected ? 'text-indigo-950' : 'text-slate-800'}>{m.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Selector */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>Visual Theme (14 Styles)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => {
              const isSelected = options.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateOption('theme', t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 transform active:scale-95 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30 text-indigo-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-sm">{t.icon}</span>
                      <span className={`truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>{t.name}</span>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.color }}
                      title={`${t.name} accent`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-1 block">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Metadata Input */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
              <Type className="w-3.5 h-3.5 text-slate-400" />
              <span>Document Title</span>
            </label>
            <input
              type="text"
              value={options.customTitle || defaultTitle}
              onChange={(e) => updateOption('customTitle', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Author / Compiler Name</span>
            </label>
            <input
              type="text"
              value={options.authorName}
              onChange={(e) => updateOption('authorName', e.target.value)}
              placeholder="e.g., Engineering Team or Your Name"
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Section Toggles */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Included Document Sections</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { key: 'includeCover', label: 'Cover Page with Metadata' },
              { key: 'includeToc', label: 'Table of Contents' },
              { key: 'includeSummary', label: 'Executive Summary' },
              { key: 'includeTakeaways', label: 'Key Takeaways & Highlights' },
              { key: 'includeQA', label: 'Structured Q&A Deep Dive' },
              { key: 'includeCode', label: 'Code Snippets Catalog' },
              { key: 'includeQuiz', label: 'Self-Testing Review Quiz' },
              { key: 'includeGlossary', label: 'Technical Glossary' },
              { key: 'includeActionItems', label: 'Action Items Checklist' },
              { key: 'includeTranscript', label: 'Raw Dialogue Transcript' },
            ].map((item) => {
              const isChecked = options[item.key as keyof CustomizationOptions] as boolean;
              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-slate-700">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      updateOption(item.key as keyof CustomizationOptions, e.target.checked as any)
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
