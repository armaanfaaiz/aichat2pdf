'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { InputHero } from '@/components/InputHero';
import { StudioControls } from '@/components/StudioControls';
import { DocumentRenderer } from '@/components/DocumentRenderer';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { ExportToolbar } from '@/components/ExportToolbar';
import { PasteModal } from '@/components/PasteModal';
import { SeoContentSection } from '@/components/SeoContentSection';
import { DEMO_CONVERSATIONS } from '@/lib/demo-data';
import { generateStructuredNotes } from '@/lib/note-generator';
import { printDocument } from '@/lib/pdf-exporter';
import { ConversationData, CustomizationOptions, NoteMode } from '@/types';

export default function Home() {
  const [conversation, setConversation] = useState<ConversationData>(DEMO_CONVERSATIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  // Ensure document stays strictly in white mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('chatpdf_theme');
    }
  }, []);

  const [options, setOptions] = useState<CustomizationOptions>({
    theme: 'academic',
    mode: 'study',
    provider: 'chatgpt',
    includeCover: true,
    includeToc: true,
    includeSummary: true,
    includeTakeaways: true,
    includeQA: true,
    includeCode: true,
    includeQuiz: true,
    includeGlossary: true,
    includeActionItems: true,
    includeTranscript: false,
    customTitle: '',
    authorName: 'AI Synthesizer & Reviewer',
  });

  const generatedNotes = useMemo(() => {
    return generateStructuredNotes(conversation);
  }, [conversation]);

  const scrollToPreview = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        const el = document.getElementById('studio-preview');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleSelectDemo = (demo: ConversationData) => {
    setConversation(demo);
    setOptions((prev) => ({ ...prev, customTitle: '', provider: demo.provider || 'universal' }));
    scrollToPreview();
  };

  const handleLoadConversation = (newConv: ConversationData) => {
    setConversation(newConv);
    setOptions((prev) => ({ ...prev, customTitle: '', provider: newConv.provider || 'universal' }));
    scrollToPreview();
  };

  const handleModeChange = (mode: NoteMode) => {
    setOptions((prev) => ({ ...prev, mode }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar
        onSelectDemo={handleSelectDemo}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        hasDocument={!!generatedNotes}
        onPrint={printDocument}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <InputHero
          onLoadConversation={handleLoadConversation}
          onOpenPasteModal={() => setIsPasteModalOpen(true)}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        {/* Studio Workspace: Mobile-optimized ordering */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Document Preview Area (order-1 on mobile so Android users see it first without scrolling!) */}
          <section id="studio-preview" className="lg:col-span-8 flex flex-col items-center order-1 lg:order-2 w-full">
            {/* View Switcher & Theme Selector Bar (Instant on-the-spot layout and theme switch) */}
            <ViewSwitcher
              activeMode={options.mode}
              onModeChange={handleModeChange}
              activeTheme={options.theme}
              onThemeChange={(theme) => setOptions((prev) => ({ ...prev, theme }))}
            />

            {/* Document Rendered Canvas with Floating Intro Animation on load/switch */}
            <div key={`${conversation.id}-${options.mode}-${options.theme}`} className="w-full">
              <DocumentRenderer
                notes={generatedNotes}
                options={options}
              />
            </div>
          </section>

          {/* Customizer Sidebar (order-2 on mobile, sticky left on desktop) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 order-2 lg:order-1 w-full lg:max-h-[calc(100vh-6rem)]">
            <StudioControls
              options={options}
              setOptions={setOptions}
              defaultTitle={conversation.title}
            />
          </aside>
        </div>

        {/* SEO Information & FAQ Section (Crawled by search engines, hidden from PDF print) */}
        <SeoContentSection />
      </main>

      {generatedNotes && (
        <ExportToolbar
          notes={generatedNotes}
          options={options}
        />
      )}

      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onLoadConversation={handleLoadConversation}
      />
    </div>
  );
}
