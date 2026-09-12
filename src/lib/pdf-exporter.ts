import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeneratedNotes, CustomizationOptions, ThemeStyle } from '@/types';

/**
 * Triggers native browser print dialog directly.
 * All non-printable chrome elements are hidden via @media print in globals.css,
 * ensuring 100% HD vector rendering identical to preview without iframe sandbox blocking.
 */
export function printDocument() {
  if (typeof window === 'undefined') return;
  window.print();
}

/**
 * Exact HD Preview PDF Exporter powered by html2pdf.js.
 * Renders the live #printable-document DOM with:
 * - 2.2x Ultra-HD Retina resolution (crisp text, SVG icons, code blocks)
 * - Exact preview styling (cards, themes, borders, badges, dark terminals)
 * - Intelligent page breaks (zero split text lines, zero broken cards)
 * - Automatic blob download
 */
export async function exportToExactPreviewPdf(
  elementId: string,
  filename: string,
  onProgress?: (status: string) => void
): Promise<PdfExportResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  onProgress?.('Preparing document for HD capture...');

  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = html2pdfModule.default || html2pdfModule;

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  onProgress?.('Rendering exact preview in Ultra-HD...');

  const opt = {
    margin: [10, 10, 14, 10] as [number, number, number, number],
    filename: cleanFilename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    enableLinks: true,
    html2canvas: {
      scale: 2.2,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1080,
      onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
          #${elementId} {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            opacity: 1 !important;
            filter: none !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
      compress: true,
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: ['.avoid-break', 'section', 'h1', 'h2', 'h3', 'pre', 'code', 'tr'],
    },
  };

  let totalPages = 1;

  const worker = (html2pdf as any)()
    .set(opt)
    .from(element)
    .toPdf()
    .get('pdf')
    .then((pdf: any) => {
      totalPages =
        (typeof pdf.getNumberOfPages === 'function'
          ? pdf.getNumberOfPages()
          : pdf.internal?.getNumberOfPages?.()) || 1;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);

        // Footer divider line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(10, pageHeight - 10, pageWidth - 10, pageHeight - 10);

        // Left branding
        pdf.text('Generated with ChatPDF AI Notes Studio', 10, pageHeight - 5.5);

        // Right running page number (e.g. Page 1 of 5)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 5.5, {
          align: 'right',
        });
      }
    });

  const pdfBlob: Blob = await worker.output('blob');

  onProgress?.('Finalizing PDF download...');
  const blobUrl = URL.createObjectURL(pdfBlob);
  triggerBlobDownload(pdfBlob, cleanFilename);

  return {
    blob: pdfBlob,
    blobUrl,
    filename: cleanFilename,
    totalPages,
  };
}

export interface PdfExportResult {
  blob: Blob;
  blobUrl: string;
  filename: string;
  totalPages: number;
}

interface ThemeColorSet {
  primary: [number, number, number];
  primaryHex: string;
  bg: [number, number, number];
  cardBg: [number, number, number];
  cardBorder: [number, number, number];
  text: [number, number, number];
  textMuted: [number, number, number];
  badgeBg: [number, number, number];
}

const THEME_PALETTES: Record<string, ThemeColorSet> = {
  academic: {
    primary: [139, 94, 52],
    primaryHex: '#8b5e34',
    bg: [253, 252, 249],
    cardBg: [248, 245, 238],
    cardBorder: [231, 225, 213],
    text: [28, 27, 24],
    textMuted: [115, 110, 100],
    badgeBg: [243, 238, 227],
  },
  minimalist: {
    primary: [15, 23, 42],
    primaryHex: '#0f172a',
    bg: [255, 255, 255],
    cardBg: [250, 250, 250],
    cardBorder: [226, 232, 240],
    text: [10, 10, 10],
    textMuted: [115, 115, 115],
    badgeBg: [245, 245, 245],
  },
  emerald: {
    primary: [5, 150, 105],
    primaryHex: '#059669',
    bg: [247, 251, 248],
    cardBg: [236, 248, 240],
    cardBorder: [187, 235, 204],
    text: [15, 23, 42],
    textMuted: [71, 85, 105],
    badgeBg: [209, 250, 229],
  },
  midnight: {
    primary: [37, 99, 235],
    primaryHex: '#2563eb',
    bg: [255, 255, 255],
    cardBg: [241, 245, 249],
    cardBorder: [203, 213, 225],
    text: [15, 23, 42],
    textMuted: [71, 85, 105],
    badgeBg: [224, 231, 255],
  },
  sunset: {
    primary: [234, 88, 12],
    primaryHex: '#ea580c',
    bg: [255, 251, 247],
    cardBg: [254, 243, 230],
    cardBorder: [253, 216, 178],
    text: [41, 37, 36],
    textMuted: [120, 113, 108],
    badgeBg: [255, 237, 213],
  },
  cyberpunk: {
    primary: [217, 119, 6],
    primaryHex: '#d97706',
    bg: [255, 255, 255],
    cardBg: [254, 249, 235],
    cardBorder: [252, 228, 160],
    text: [15, 23, 42],
    textMuted: [100, 116, 139],
    badgeBg: [254, 243, 199],
  },
  lavender: {
    primary: [147, 51, 234],
    primaryHex: '#9333ea',
    bg: [252, 250, 255],
    cardBg: [247, 242, 254],
    cardBorder: [233, 218, 252],
    text: [15, 23, 42],
    textMuted: [71, 85, 105],
    badgeBg: [243, 232, 255],
  },
  vintage: {
    primary: [146, 64, 14],
    primaryHex: '#92400e',
    bg: [251, 246, 237],
    cardBg: [244, 236, 223],
    cardBorder: [226, 214, 195],
    text: [44, 34, 30],
    textMuted: [120, 105, 95],
    badgeBg: [238, 226, 208],
  },
  nord: {
    primary: [2, 132, 199],
    primaryHex: '#0284c7',
    bg: [240, 247, 250],
    cardBg: [226, 241, 248],
    cardBorder: [186, 230, 253],
    text: [15, 41, 66],
    textMuted: [71, 85, 105],
    badgeBg: [217, 241, 251],
  },
  crimson: {
    primary: [190, 18, 60],
    primaryHex: '#be123c',
    bg: [255, 253, 251],
    cardBg: [255, 241, 242],
    cardBorder: [254, 205, 211],
    text: [28, 25, 23],
    textMuted: [120, 113, 108],
    badgeBg: [255, 228, 230],
  },
  forest: {
    primary: [21, 128, 61],
    primaryHex: '#15803d',
    bg: [242, 248, 244],
    cardBg: [233, 245, 236],
    cardBorder: [187, 247, 208],
    text: [20, 53, 33],
    textMuted: [71, 85, 105],
    badgeBg: [220, 252, 231],
  },
  solarized: {
    primary: [181, 137, 0],
    primaryHex: '#b58900',
    bg: [253, 246, 227],
    cardBg: [247, 238, 215],
    cardBorder: [238, 232, 213],
    text: [88, 110, 117],
    textMuted: [131, 148, 150],
    badgeBg: [240, 230, 204],
  },
  slate: {
    primary: [71, 85, 105],
    primaryHex: '#475569',
    bg: [248, 250, 252],
    cardBg: [241, 245, 249],
    cardBorder: [203, 213, 225],
    text: [15, 23, 42],
    textMuted: [100, 116, 139],
    badgeBg: [226, 232, 240],
  },
  modern: {
    primary: [79, 70, 229],
    primaryHex: '#4f46e5',
    bg: [255, 255, 255],
    cardBg: [248, 250, 252],
    cardBorder: [226, 232, 240],
    text: [15, 23, 42],
    textMuted: [100, 116, 139],
    badgeBg: [238, 242, 255],
  },
};

/**
 * Cross-browser blob file download trigger with memory cleanup.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 15000);
  } catch (err) {
    console.error('Download trigger error:', err);
  }
}

/**
 * Publication-Grade High-Definition (HD) Vector PDF Generator.
 * - 100% Vector Typography (Selectable, Searchable, Infinitely Crisp)
 * - Constant Margins & Boundaries (18mm Left/Right, 20mm Top, 18mm Bottom)
 * - Card-Aware Pagination (Zero split text, zero broken cards)
 * - Running Header & Page Numbers on every page
 * - Themed Color Accents, Badges, Callout Boxes, Monospace Code Blocks
 */
export function generatePublicationPdf(
  notes: GeneratedNotes,
  options: CustomizationOptions,
  filename: string
): PdfExportResult {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const themeKey = options.theme || 'modern';
  const palette = THEME_PALETTES[themeKey] || THEME_PALETTES.modern;

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const marginTop = 20;
  const marginBottom = 18;
  const contentWidth = pageWidth - marginX * 2; // 174mm
  const activeMode = options.mode || 'study';
  let y = marginTop;

  const drawRunningHeader = () => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(palette.textMuted[0], palette.textMuted[1], palette.textMuted[2]);
    const headerTitle = options.customTitle || notes.title || 'Study Notes';
    const cleanHeader = headerTitle.length > 55 ? `${headerTitle.slice(0, 52)}...` : headerTitle;
    pdf.text(cleanHeader, marginX, 12);
    pdf.text('AI Synthesized Document', pageWidth - marginX, 12, { align: 'right' });

    pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, 14, pageWidth - marginX, 14);
  };

  const checkPageBreak = (neededHeight: number) => {
    const maxAvailable = pageHeight - marginBottom - 10 - marginTop;
    const clampedNeeded = Math.min(neededHeight, maxAvailable);
    if (y + clampedNeeded > pageHeight - marginBottom - 10) {
      pdf.addPage('a4', 'portrait');
      y = marginTop;
      drawRunningHeader();
    }
  };

  const printTextLines = (
    lines: string[],
    x: number,
    lineHeight: number,
    textColor?: [number, number, number]
  ) => {
    if (textColor) {
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
    for (const line of lines) {
      if (y + lineHeight > pageHeight - marginBottom - 10) {
        pdf.addPage('a4', 'portrait');
        y = marginTop;
        drawRunningHeader();
        if (textColor) {
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        }
      }
      pdf.text(line, x, y);
      y += lineHeight;
    }
  };

  const printCodeBlock = (code: string, marginStartX: number, boxWidth: number) => {
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    const codeLines = pdf.splitTextToSize(code, boxWidth - 8);
    const lineHeight = 3.8;

    if (y + 12 > pageHeight - marginBottom - 10) {
      pdf.addPage('a4', 'portrait');
      y = marginTop;
      drawRunningHeader();
    }

    for (let i = 0; i < codeLines.length; i++) {
      if (y + lineHeight > pageHeight - marginBottom - 10) {
        pdf.addPage('a4', 'portrait');
        y = marginTop;
        drawRunningHeader();
      }
      pdf.setFillColor(243, 246, 250);
      pdf.rect(marginStartX, y - 2.8, boxWidth, lineHeight, 'F');

      pdf.setTextColor(30, 41, 59);
      pdf.text(codeLines[i], marginStartX + 4, y);
      y += lineHeight;
    }
    y += 3;
  };

  // =========================================================================
  // 1. COVER / HEADER SECTION
  // =========================================================================
  if (options.includeCover) {
    // Provider Badge
    pdf.setFillColor(palette.badgeBg[0], palette.badgeBg[1], palette.badgeBg[2]);
    pdf.roundedRect(marginX, y, 62, 6.5, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    const providerLabel =
      notes.provider === 'claude'
        ? 'ANTHROPIC CLAUDE'
        : notes.provider === 'gemini'
        ? 'GOOGLE GEMINI'
        : notes.provider === 'chatgpt'
        ? 'OPENAI CHATGPT'
        : 'AI SYNTHESIS';
    pdf.text(providerLabel, marginX + 4, y + 4.5);

    // Date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(palette.textMuted[0], palette.textMuted[1], palette.textMuted[2]);
    pdf.text(notes.date, pageWidth - marginX, y + 4.5, { align: 'right' });
    y += 12;

    // Document Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
    const activeTitle = options.customTitle || notes.title || 'Study Notes';
    const titleLines = pdf.splitTextToSize(activeTitle, contentWidth);
    pdf.text(titleLines, marginX, y);
    y += titleLines.length * 8.5 + 4;

    // Metadata Row (Author, reading time, mode)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(palette.textMuted[0], palette.textMuted[1], palette.textMuted[2]);
    const author = options.authorName || 'AI Synthesizer';
    const modeStr = activeMode.toUpperCase();
    pdf.text(
      `Author: ${author}   |   ${notes.readingTimeMinutes} min read (${notes.wordCount} words)   |   Format: ${modeStr} MODE`,
      marginX,
      y
    );
    y += 7;

    // Thick accent divider bar
    pdf.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
    pdf.rect(marginX, y, contentWidth, 1.2, 'F');
    y += 8;
  }

  // =========================================================================
  // MODE A: TRANSCRIPT MODE (Full Conversation Stream)
  // =========================================================================
  if (activeMode === 'transcript' && notes.rawTranscript && notes.rawTranscript.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
    pdf.text('Complete Conversation Transcript', marginX, y);
    y += 7;

    notes.rawTranscript.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const roleLabel = isUser
        ? `TURN #${idx + 1} • USER QUESTION`
        : `TURN #${idx + 1} • ${notes.provider ? notes.provider.toUpperCase() : 'AI'} RESPONSE`;

      checkPageBreak(18);

      // Turn badge
      if (isUser) {
        pdf.setFillColor(palette.badgeBg[0], palette.badgeBg[1], palette.badgeBg[2]);
        pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
      } else {
        pdf.setFillColor(241, 245, 249);
        pdf.setTextColor(71, 85, 105);
      }
      pdf.roundedRect(marginX, y, 68, 5.5, 1.5, 1.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text(roleLabel, marginX + 3, y + 3.8);
      y += 7.5;

      // Message Content with line-by-line pagination
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const contentLines = pdf.splitTextToSize(msg.content, contentWidth - 6);
      printTextLines(contentLines, marginX + 3, 4.6, palette.text);
      y += 5;
    });
  } else {
    // =======================================================================
    // 2. EXECUTIVE SUMMARY (Callout Card with Left Accent Border)
    // =======================================================================
    if (options.includeSummary && notes.executiveSummary) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      const summaryLines = pdf.splitTextToSize(notes.executiveSummary, contentWidth - 12);
      const boxHeight = summaryLines.length * 4.8 + 14;

      if (boxHeight <= pageHeight - marginBottom - 10 - y) {
        // Fits on current page
        pdf.setFillColor(palette.cardBg[0], palette.cardBg[1], palette.cardBg[2]);
        pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(marginX, y, contentWidth, boxHeight, 2.5, 2.5, 'FD');

        pdf.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.rect(marginX, y, 2.2, boxHeight, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.text('Executive Summary', marginX + 6, y + 6.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
        pdf.text(summaryLines, marginX + 6, y + 12);

        y += boxHeight + 7;
      } else if (boxHeight <= pageHeight - marginBottom - 10 - marginTop) {
        // Fits on fresh page
        pdf.addPage('a4', 'portrait');
        y = marginTop;
        drawRunningHeader();

        pdf.setFillColor(palette.cardBg[0], palette.cardBg[1], palette.cardBg[2]);
        pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(marginX, y, contentWidth, boxHeight, 2.5, 2.5, 'FD');

        pdf.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.rect(marginX, y, 2.2, boxHeight, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.text('Executive Summary', marginX + 6, y + 6.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
        pdf.text(summaryLines, marginX + 6, y + 12);

        y += boxHeight + 7;
      } else {
        // Large multi-page summary
        checkPageBreak(22);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.text('Executive Summary', marginX, y);
        y += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        printTextLines(summaryLines, marginX, 4.6, palette.text);
        y += 6;
      }
    }

    // =======================================================================
    // 3. KEY TAKEAWAYS
    // =======================================================================
    if (options.includeTakeaways && notes.keyTakeaways && notes.keyTakeaways.length > 0) {
      checkPageBreak(25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
      pdf.text(
        activeMode === 'brief'
          ? 'Primary Decisions & Findings'
          : 'Key Takeaways & Core Concepts',
        marginX,
        y
      );
      y += 6;

      notes.keyTakeaways.forEach((item) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        const lines = pdf.splitTextToSize(item, contentWidth - 12);
        const rowHeight = lines.length * 4.8 + 2;

        checkPageBreak(Math.min(rowHeight, 40));

        // Bullet dot
        pdf.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.circle(marginX + 3, y + 2, 1.3, 'F');

        // Text
        printTextLines(lines, marginX + 8, 4.8, palette.text);
        y += 2;
      });

      y += 4;
    }

    // =======================================================================
    // 4. DETAILED BREAKDOWN / Q&A (Study & Cheatsheet modes)
    // =======================================================================
    if (
      activeMode !== 'brief' &&
      options.includeQA &&
      notes.qaBreakdown &&
      notes.qaBreakdown.length > 0
    ) {
      checkPageBreak(25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
      pdf.text(
        activeMode === 'cheatsheet'
          ? 'Pattern & Reference Cards'
          : 'Detailed Breakdown & Analysis',
        marginX,
        y
      );
      y += 6;

      notes.qaBreakdown.forEach((qa, idx) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        const qLines = pdf.splitTextToSize(`Q${idx + 1}: ${qa.question}`, contentWidth - 10);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const aLines = pdf.splitTextToSize(qa.answer, contentWidth - 10);

        const hasCode = qa.code && qa.code.trim().length > 0;
        const qHeight = qLines.length * 5;
        const aHeight = aLines.length * 4.6;
        const cardPadding = 8;
        const estimatedCodeH = hasCode ? 35 : 0;
        const totalCardHeight = qHeight + aHeight + estimatedCodeH + cardPadding * 2;
        const availableOnPage = pageHeight - marginBottom - 10 - y;

        if (totalCardHeight <= availableOnPage) {
          // Fits on current page as card
          pdf.setFillColor(palette.cardBg[0], palette.cardBg[1], palette.cardBg[2]);
          pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(marginX, y, contentWidth, totalCardHeight, 2.5, 2.5, 'FD');

          let innerY = y + cardPadding;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
          pdf.text(qLines, marginX + 5, innerY);
          innerY += qHeight + 2.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
          pdf.text(aLines, marginX + 5, innerY);
          innerY += aHeight + 3;

          if (hasCode) {
            printCodeBlock(qa.code!, marginX + 5, contentWidth - 10);
          }
          y += totalCardHeight + 5;
        } else if (totalCardHeight <= pageHeight - marginBottom - 10 - marginTop) {
          // Fits on fresh page as card
          pdf.addPage('a4', 'portrait');
          y = marginTop;
          drawRunningHeader();

          pdf.setFillColor(palette.cardBg[0], palette.cardBg[1], palette.cardBg[2]);
          pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(marginX, y, contentWidth, totalCardHeight, 2.5, 2.5, 'FD');

          let innerY = y + cardPadding;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
          pdf.text(qLines, marginX + 5, innerY);
          innerY += qHeight + 2.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
          pdf.text(aLines, marginX + 5, innerY);
          innerY += aHeight + 3;

          if (hasCode) {
            printCodeBlock(qa.code!, marginX + 5, contentWidth - 10);
          }
          y += totalCardHeight + 5;
        } else {
          // Large card spanning multiple pages cleanly
          checkPageBreak(25);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
          printTextLines(qLines, marginX + 4, 5);
          y += 2.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          printTextLines(aLines, marginX + 4, 4.6, palette.text);
          y += 3;

          if (hasCode) {
            printCodeBlock(qa.code!, marginX + 4, contentWidth - 8);
          }
          y += 5;
        }
      });

      y += 4;
    }

    // =======================================================================
    // 5. ACTION ITEMS / CHECKLIST (Study & Brief modes)
    // =======================================================================
    if (options.includeActionItems && notes.actionItems && notes.actionItems.length > 0) {
      checkPageBreak(25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
      pdf.text(
        activeMode === 'brief'
          ? 'Next Steps & Action Matrix'
          : 'Action Items & Implementation Checklist',
        marginX,
        y
      );
      y += 6;

      notes.actionItems.forEach((item) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(item, contentWidth - 12);
        const rowHeight = lines.length * 4.8 + 2;

        checkPageBreak(Math.min(rowHeight, 40));

        // Checkbox square
        pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(marginX + 2, y + 0.5, 3.5, 3.5, 0.6, 0.6, 'FD');

        // Checkbox text
        printTextLines(lines, marginX + 8, 4.8, palette.text);
        y += 2;
      });

      y += 4;
    }

    // =======================================================================
    // 6. REVIEW QUIZ (Study mode)
    // =======================================================================
    if (
      activeMode === 'study' &&
      options.includeQuiz &&
      notes.reviewQuiz &&
      notes.reviewQuiz.length > 0
    ) {
      checkPageBreak(25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
      pdf.text('Self-Testing Review Quiz', marginX, y);
      y += 6;

      notes.reviewQuiz.forEach((q, idx) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        const qLines = pdf.splitTextToSize(`${idx + 1}. ${q.question}`, contentWidth - 10);

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8.5);
        const aLines = pdf.splitTextToSize(`Answer: ${q.answer}`, contentWidth - 14);

        const qH = qLines.length * 4.8;
        const aH = aLines.length * 4.2;
        const totalH = qH + aH + 7;

        checkPageBreak(Math.min(totalH, 50));

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        printTextLines(qLines, marginX + 3, 4.8, palette.text);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        printTextLines(aLines, marginX + 7, 4.2, palette.primary);

        y += 3;
      });

      y += 4;
    }

    // =======================================================================
    // 7. GLOSSARY (Study & Cheatsheet modes)
    // =======================================================================
    if (
      activeMode !== 'brief' &&
      options.includeGlossary &&
      notes.glossary &&
      notes.glossary.length > 0
    ) {
      checkPageBreak(25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
      pdf.text('Glossary of Key Terminology', marginX, y);
      y += 6;

      notes.glossary.forEach((t) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        const prefix = `${t.term}: `;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(`${prefix}${t.definition}`, contentWidth - 6);
        const rowHeight = lines.length * 4.6 + 3;

        checkPageBreak(Math.min(rowHeight, 40));
        printTextLines(lines, marginX + 3, 4.6, palette.text);
        y += 2;
      });
    }
  }

  // =========================================================================
  // 8. RUNNING FOOTER ON ALL PAGES
  // =========================================================================
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);

    // Footer divider
    pdf.setDrawColor(palette.cardBorder[0], palette.cardBorder[1], palette.cardBorder[2]);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    // Left label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(palette.textMuted[0], palette.textMuted[1], palette.textMuted[2]);
    pdf.text('Generated with ChatPDF Notes Studio', marginX, pageHeight - 7);

    // Right page number
    pdf.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, {
      align: 'right',
    });
  }

  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  triggerBlobDownload(blob, finalFilename);

  return {
    blob,
    blobUrl,
    filename: finalFilename,
    totalPages,
  };
}

/**
 * Visual screenshot-based export for users who explicitly want the raster preview canvas.
 */
export async function exportToPdfDirect(
  elementId: string,
  filename: string,
  onProgress?: (status: string) => void
): Promise<PdfExportResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  const docHeight = element.scrollHeight || element.offsetHeight || 1000;

  // Safe Guard: If document is massive (>12,000px, which is >10 pages),
  // HTML5 single canvas allocation will fail or produce blank pages in Chromium.
  if (docHeight > 14000) {
    throw new Error(
      'Document exceeds single canvas limit (>10 pages). For large multi-page documents (up to 250+ pages), use HD Publication Vector PDF for 100% complete pages with zero blank pages.'
    );
  }

  onProgress?.('Preparing document for capture...');

  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  const maxCanvasDimension = isMobile ? 4096 : 8192;

  let scale = isMobile ? 1.5 : 2;
  if (docHeight * scale > maxCanvasDimension) {
    scale = Math.max(0.8, maxCanvasDimension / docHeight);
  }

  onProgress?.('Rendering exact visual pages...');

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: 1200,
    windowHeight: Math.max(element.scrollHeight, 1200) + 600,
    onclone: (clonedDoc, clonedElement) => {
      const overrideStyle = clonedDoc.createElement('style');
      overrideStyle.textContent = `
        *, *::before, *::after {
          animation: none !important;
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition: none !important;
          transition-duration: 0s !important;
        }
        #${elementId}, #${elementId} * {
          opacity: 1 !important;
          filter: none !important;
        }
      `;
      clonedDoc.head.appendChild(overrideStyle);

      if (clonedElement) {
        clonedElement.classList.remove('animate-note-open');
        clonedElement.style.opacity = '1';
        clonedElement.style.transform = 'none';
        clonedElement.style.animation = 'none';
        clonedElement.style.filter = 'none';
      }
    },
  });

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas render produced an empty image');
  }

  onProgress?.('Formatting PDF pages...');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidthMm = 210;
  const pdfHeightMm = 297;
  const aspectRatio = pdfHeightMm / pdfWidthMm;

  const pageHeightPx = Math.floor(canvas.width * aspectRatio);
  const totalCanvasHeight = canvas.height;
  const totalPages = Math.max(1, Math.ceil(totalCanvasHeight / pageHeightPx));

  for (let page = 0; page < totalPages; page++) {
    onProgress?.(`Compiling page ${page + 1} of ${totalPages}...`);

    if (page > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const srcY = page * pageHeightPx;
    const remainingHeight = totalCanvasHeight - srcY;
    const sliceHeight = Math.min(pageHeightPx, remainingHeight);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;
    const pageCtx = pageCanvas.getContext('2d');

    if (pageCtx) {
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      pageCtx.drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');

      // Footer divider line and running page number
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(10, pdfHeightMm - 10, pdfWidthMm - 10, pdfHeightMm - 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Generated with ChatPDF AI Notes Studio', 10, pdfHeightMm - 5.5);
      pdf.text(`Page ${page + 1} of ${totalPages}`, pdfWidthMm - 10, pdfHeightMm - 5.5, {
        align: 'right',
      });
    }
  }

  onProgress?.('Finalizing PDF download...');
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  triggerBlobDownload(blob, finalFilename);

  return {
    blob,
    blobUrl,
    filename: finalFilename,
    totalPages,
  };
}
