'use client';

import React, { useState, useMemo } from 'react';
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

  const handleSelectDemo = (demo: ConversationData) => {
    setConversation(demo);
    setOptions((prev) => ({ ...prev, customTitle: '' }));
  };

  const handleLoadConversation = (newConv: ConversationData) => {
    setConversation(newConv);
    setOptions((prev) => ({ ...prev, customTitle: '' }));
  };

  const handleModeChange = (mode: NoteMode) => {
    setOptions((prev) => ({ ...prev, mode }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar
        onSelectDemo={handleSelectDemo}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        hasDocument={!!generatedNotes}
        onPrint={printDocument}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
        <InputHero
          onLoadConversation={handleLoadConversation}
          onOpenPasteModal={() => setIsPasteModalOpen(true)}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Customizer Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <StudioControls
              options={options}
              setOptions={setOptions}
              defaultTitle={conversation.title}
            />
          </aside>

          {/* Right Live Document Preview Area */}
          <section className="lg:col-span-8 flex flex-col items-center">
            {/* View Switcher Bar (Instant on-the-spot mode switch) */}
            <ViewSwitcher
              activeMode={options.mode}
              onModeChange={handleModeChange}
            />

            {/* Document Rendered Canvas */}
            <DocumentRenderer
              notes={generatedNotes}
              options={options}
            />
          </section>
        </div>

        {/* SEO Information & FAQ Section (Crawled by search engines, hidden from PDF print) */}
        <SeoContentSection />
      </main>

      {generatedNotes && (
        <ExportToolbar notes={generatedNotes} options={options} />
      )}

      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onLoadConversation={handleLoadConversation}
      />
    </div>
  );
}
