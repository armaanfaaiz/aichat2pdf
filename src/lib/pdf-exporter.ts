import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeneratedNotes, CustomizationOptions } from '@/types';

/**
 * Triggers native browser print dialog.
 */
export function printDocument() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

export interface PdfExportResult {
  blob: Blob;
  blobUrl: string;
  filename: string;
  totalPages: number;
}

const THEME_BACKGROUNDS: Record<string, string> = {
  academic: '#fdfcf9',
  minimalist: '#ffffff',
  emerald: '#f7fbf8',
  midnight: '#090d16',
  sunset: '#fffbf7',
  cyberpunk: '#0d1117',
  lavender: '#fcfaff',
  vintage: '#fbf6ed',
  nord: '#f0f7fa',
  crimson: '#fffdfb',
  forest: '#f2f8f4',
  solarized: '#fdf6e3',
  slate: '#f8fafc',
  modern: '#ffffff',
};

/**
 * Robust cross-browser blob file download trigger.
 * Safe against mobile browser gesture timeouts.
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
 * Captures the exact rendered document canvas (matching the on-screen preview 1:1)
 * and generates a high-fidelity A4 PDF file directly to the user's device.
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

  onProgress?.('Preparing document for capture...');

  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  const maxCanvasDimension = isMobile ? 4096 : 8192;
  const docHeight = element.scrollHeight || element.offsetHeight || 1000;

  let scale = isMobile ? 1.5 : 2;
  if (docHeight * scale > maxCanvasDimension) {
    scale = Math.max(1, maxCanvasDimension / docHeight);
  }

  onProgress?.('Rendering exact visual pages...');

  // Determine exact theme background color
  let themeBg = '#ffffff';
  for (const [t, bg] of Object.entries(THEME_BACKGROUNDS)) {
    if (element.classList.contains(`theme-${t}`)) {
      themeBg = bg;
      break;
    }
  }
  if (themeBg === '#ffffff') {
    try {
      const computed = window.getComputedStyle(element);
      if (
        computed.backgroundColor &&
        computed.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        computed.backgroundColor !== 'transparent'
      ) {
        themeBg = computed.backgroundColor;
      }
    } catch {
      // fallback
    }
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: themeBg,
    scrollX: 0,
    scrollY: 0,
    windowWidth: 1200,
    windowHeight: Math.max(element.scrollHeight, 1200) + 600,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Force all animations/transitions off and ensure opacity: 1
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

      // 2. Remove animation classes from cloned element
      if (clonedElement) {
        clonedElement.classList.remove('animate-note-open');
        clonedElement.style.opacity = '1';
        clonedElement.style.transform = 'none';
        clonedElement.style.animation = 'none';
        clonedElement.style.filter = 'none';
      }

      // 3. Remove animation classes from all child nodes
      const animatedNodes = clonedDoc.querySelectorAll(
        '.animate-note-open, .animate-pulse, .animate-shimmer, .animate-ping, .animate-spin'
      );
      animatedNodes.forEach((node) => {
        const el = node as HTMLElement;
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
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

  const pdfWidthMm = 210; // Standard A4 width
  const pdfHeightMm = 297; // Standard A4 height
  const aspectRatio = pdfHeightMm / pdfWidthMm; // ~1.4142857

  // Height of one A4 page in canvas pixels
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

    // Create a temporary canvas for this single page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;
    const pageCtx = pageCanvas.getContext('2d');

    if (pageCtx) {
      // Fill page with exact theme background color
      pageCtx.fillStyle = themeBg;
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Draw the slice from the master canvas
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
    }
  }

  onProgress?.('Finalizing PDF download...');
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Auto-trigger download
  triggerBlobDownload(blob, finalFilename);

  return {
    blob,
    blobUrl,
    filename: finalFilename,
    totalPages,
  };
}

/**
 * Pure direct vector PDF generator.
 * Ultra-fast, 100% reliable across all browsers & devices, vector-crisp typography.
 */
export function generateDirectVectorPdf(
  notes: GeneratedNotes,
  options: CustomizationOptions,
  filename: string
): PdfExportResult {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = margin + 5;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      pdf.addPage('a4', 'portrait');
      y = margin + 5;
    }
  };

  // Header Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(15, 23, 42); // slate-900
  const titleText = options.customTitle || notes.title || 'ChatGPT Study Notes';
  const titleLines = pdf.splitTextToSize(titleText, maxWidth);
  checkPageBreak(titleLines.length * 9 + 15);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 9 + 4;

  // Metadata subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `${notes.date}  •  Author: ${options.authorName || 'AI Synthesizer'}  •  ${notes.readingTimeMinutes} min read  •  Mode: ${(options.mode || 'study').toUpperCase()}`,
    margin,
    y
  );
  y += 7;

  // Divider line
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 9;

  // Executive Summary
  if (options.includeSummary && notes.executiveSummary) {
    checkPageBreak(30);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229); // indigo-600
    pdf.text('Executive Summary', margin, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 41, 59);
    const summaryLines = pdf.splitTextToSize(notes.executiveSummary, maxWidth);
    checkPageBreak(summaryLines.length * 5 + 8);
    pdf.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 8;
  }

  // Key Takeaways
  if (options.includeTakeaways && notes.keyTakeaways && notes.keyTakeaways.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Key Takeaways & Core Concepts', margin, y);
    y += 6;

    notes.keyTakeaways.forEach((item) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(30, 41, 59);
      const itemLines = pdf.splitTextToSize(`•  ${item}`, maxWidth);
      checkPageBreak(itemLines.length * 5 + 4);
      pdf.text(itemLines, margin, y);
      y += itemLines.length * 5 + 4;
    });
    y += 6;
  }

  // Detailed Q&A Breakdown
  if (options.includeQA && notes.qaBreakdown && notes.qaBreakdown.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Detailed Breakdown & Analysis', margin, y);
    y += 6;

    notes.qaBreakdown.forEach((qa, i) => {
      // Question
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      const qLines = pdf.splitTextToSize(`Q${i + 1}: ${qa.question}`, maxWidth);
      checkPageBreak(qLines.length * 5.5 + 8);
      pdf.text(qLines, margin, y);
      y += qLines.length * 5.5 + 3;

      // Answer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      const aLines = pdf.splitTextToSize(qa.answer, maxWidth);
      checkPageBreak(aLines.length * 4.8 + 8);
      pdf.text(aLines, margin, y);
      y += aLines.length * 4.8 + 8;
    });
    y += 4;
  }

  // Action Items / Checklist
  if (options.includeActionItems && notes.actionItems && notes.actionItems.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Action Items & Implementation Checklist', margin, y);
    y += 6;

    notes.actionItems.forEach((item: string) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      const lines = pdf.splitTextToSize(`[  ]  ${item}`, maxWidth);
      checkPageBreak(lines.length * 5 + 3);
      pdf.text(lines, margin, y);
      y += lines.length * 5 + 3;
    });
    y += 6;
  }

  // Self-Testing Quiz
  if (options.includeQuiz && notes.reviewQuiz && notes.reviewQuiz.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Self-Testing Review Quiz', margin, y);
    y += 6;

    notes.reviewQuiz.forEach((q, i: number) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42);
      const qLines = pdf.splitTextToSize(`${i + 1}. ${q.question}`, maxWidth);
      checkPageBreak(qLines.length * 5 + 6);
      pdf.text(qLines, margin, y);
      y += qLines.length * 5 + 2;

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      const ansLines = pdf.splitTextToSize(`Answer: ${q.answer}`, maxWidth);
      checkPageBreak(ansLines.length * 4.5 + 6);
      pdf.text(ansLines, margin, y);
      y += ansLines.length * 4.5 + 6;
    });
    y += 6;
  }

  // Glossary
  if (options.includeGlossary && notes.glossary && notes.glossary.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Glossary of Key Terminology', margin, y);
    y += 6;

    notes.glossary.forEach((t) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      const defLines = pdf.splitTextToSize(`${t.term}: ${t.definition}`, maxWidth);
      checkPageBreak(defLines.length * 4.5 + 4);
      pdf.text(defLines, margin, y);
      y += defLines.length * 4.5 + 4;
    });
  }

  // Footer page numbers on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Page ${p} of ${totalPages}  •  Generated with ChatPDF AI Notes Studio`,
      margin,
      pageHeight - 8
    );
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
