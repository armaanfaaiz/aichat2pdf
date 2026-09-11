import { GeneratedNotes, CustomizationOptions } from '@/types';

/**
 * Converts GeneratedNotes into clean, beautifully structured Markdown
 */
export function convertNotesToMarkdown(notes: GeneratedNotes, options: CustomizationOptions): string {
  const parts: string[] = [];

  const title = options.customTitle || notes.title;
  parts.push(`# ${title}\n`);
  parts.push(`> **Date**: ${notes.date} | **Estimated Reading**: ${notes.readingTimeMinutes} min | **Words**: ${notes.wordCount}`);
  if (options.authorName) {
    parts.push(`> **Author**: ${options.authorName}`);
  }
  if (notes.sourceUrl) {
    parts.push(`> **Source**: [ChatGPT Conversation](${notes.sourceUrl})`);
  }
  parts.push('\n---\n');

  if (options.includeSummary && notes.executiveSummary) {
    parts.push(`## 📌 Executive Summary\n\n${notes.executiveSummary}\n\n---\n`);
  }

  if (options.includeTakeaways && notes.keyTakeaways.length > 0) {
    parts.push(`## 💡 Key Takeaways\n`);
    for (const t of notes.keyTakeaways) {
      parts.push(`- ${t}`);
    }
    parts.push('\n---\n');
  }

  if (options.includeQA && notes.qaBreakdown.length > 0) {
    parts.push(`## 📚 Structured Breakdown & Deep Dive\n`);
    for (const item of notes.qaBreakdown) {
      parts.push(`### ${item.question}\n`);
      parts.push(`${item.answer}\n`);

      if (item.keyPoints && item.keyPoints.length > 0) {
        parts.push(`**Key Points:**\n`);
        for (const kp of item.keyPoints) {
          parts.push(`- ${kp}`);
        }
        parts.push('');
      }

      if (item.code) {
        parts.push(`\`\`\`${item.language || ''}\n${item.code}\n\`\`\`\n`);
      }
    }
    parts.push('---\n');
  }

  if (options.includeCode && notes.codeSnippets.length > 0) {
    parts.push(`## 💻 Code Reference Catalog\n`);
    for (const snippet of notes.codeSnippets) {
      parts.push(`### ${snippet.title}\n`);
      parts.push(`*${snippet.explanation}*\n`);
      parts.push(`\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n`);
    }
    parts.push('---\n');
  }

  if (options.includeQuiz && notes.reviewQuiz.length > 0) {
    parts.push(`## 🎯 Review Questions & Flashcards\n`);
    for (const q of notes.reviewQuiz) {
      parts.push(`- **Q: ${q.question}**`);
      parts.push(`  - *Answer*: ${q.answer}\n`);
    }
    parts.push('---\n');
  }

  if (options.includeGlossary && notes.glossary.length > 0) {
    parts.push(`## 📖 Technical Glossary\n`);
    for (const g of notes.glossary) {
      parts.push(`- **${g.term}**: ${g.definition}`);
    }
    parts.push('\n---\n');
  }

  if (options.includeActionItems && notes.actionItems.length > 0) {
    parts.push(`## ✅ Action Items & Implementation Checklist\n`);
    for (const a of notes.actionItems) {
      parts.push(`- [ ] ${a}`);
    }
    parts.push('\n');
  }

  return parts.join('\n');
}

/**
 * Downloads a raw text/markdown file in browser
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/markdown;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
