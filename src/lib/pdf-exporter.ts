import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeneratedNotes, CustomizationOptions } from '@/types';

/**
 * Triggers native high-resolution browser print dialog targeted at the document element.
 * This delivers vector-grade crisp typography, true page numbers, and custom print layout.
 */
export function printDocument() {
  window.print();
}

/**
 * Convert an OKLCH color string to RGB/RGBA string.
 * Tailwind CSS v4 defaults to oklch(), which causes html2canvas to crash:
 * "Error: Attempting to parse an unsupported color function 'oklch'"
 */
export function oklchToRgbString(lStr: string, cStr: string, hStr: string, aStr?: string): string {
  let l = parseFloat(lStr);
  if (lStr.endsWith('%')) l /= 100;
  if (isNaN(l)) l = 0;

  let c = parseFloat(cStr);
  if (cStr.endsWith('%')) c = (parseFloat(cStr) / 100) * 0.4;
  if (isNaN(c)) c = 0;

  let h = parseFloat(hStr);
  if (isNaN(h)) h = 0;

  let a = 1;
  if (aStr) {
    a = parseFloat(aStr);
    if (aStr.endsWith('%')) a /= 100;
    if (isNaN(a)) a = 1;
  }

  // Convert OKLCH to linear sRGB
  const hRad = (h * Math.PI) / 180;
  const a_ = c * Math.cos(hRad);
  const b_ = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
  const m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
  const s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = +4.0767434770 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  function toSrgb(val: number): number {
    const clamped = Math.max(0, Math.min(1, val));
    return clamped <= 0.0031308
      ? Math.round(12.92 * clamped * 255)
      : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
  }

  const r = toSrgb(rLinear);
  const g = toSrgb(gLinear);
  const b = toSrgb(bLinear);

  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Replaces all oklch(...) occurrences in CSS text with rgb(...) / rgba(...)
 */
export function sanitizeOklchInCss(text: string): string {
  if (!text || typeof text !== 'string' || !text.includes('oklch')) return text;
  return text.replace(/oklch\s*\(([^)]+)\)/gi, (match, inner) => {
    try {
      const slashParts = inner.split('/');
      const colorParts = slashParts[0].trim().split(/\s+/);
      if (colorParts.length < 3) return 'rgb(0, 0, 0)';
      const alphaPart = slashParts[1] ? slashParts[1].trim() : undefined;
      return oklchToRgbString(colorParts[0], colorParts[1], colorParts[2], alphaPart);
    } catch {
      return 'rgb(0, 0, 0)';
    }
  });
}

/**
 * Intercepts getComputedStyle on a Window object so html2canvas never receives oklch colors.
 */
function wrapWindowComputedStyle(win: Window): () => void {
  const original = win.getComputedStyle;
  win.getComputedStyle = function (element: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const style = original.call(win, element, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return (propName: string) => {
            const val = target.getPropertyValue(propName);
            return typeof val === 'string' && val.includes('oklch')
              ? sanitizeOklchInCss(val)
              : val;
          };
        }
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'string' && value.includes('oklch')) {
          return sanitizeOklchInCss(value);
        }
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },
    });
  };
  return () => {
    win.getComputedStyle = original;
  };
}

/**
 * Generates and downloads a direct PDF file using html2canvas & jsPDF.
 * Automatically saves the file to user's downloads folder WITHOUT printer view.
 */
export async function exportToPdfDirect(
  elementId: string,
  filename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  onProgress?.('Preparing document for capture...');

  // Safe scale determination:
  // Mobile browsers (iOS Safari / Android) cap canvas dimension at 4096px, desktop at 8192px
  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  const maxCanvasDimension = isMobile ? 4096 : 8192;
  const docHeight = element.scrollHeight || element.offsetHeight || 1000;

  let scale = isMobile ? 1.25 : 1.75;
  if (docHeight * scale > maxCanvasDimension) {
    scale = Math.max(1, maxCanvasDimension / docHeight);
  }

  onProgress?.('Capturing document...');

  // Wrap main window's getComputedStyle to sanitize any oklch properties
  const restoreMain = typeof window !== 'undefined' ? wrapWindowComputedStyle(window) : () => {};

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth || 860,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Wrap cloned iframe window's getComputedStyle as well
        if (clonedDoc.defaultView) {
          wrapWindowComputedStyle(clonedDoc.defaultView);
        }

        // 2. Sanitize all stylesheet rules in the cloned iframe document
        try {
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
              styleTag.textContent = sanitizeOklchInCss(styleTag.textContent);
            }
          });

          // Also sanitize inline styles on all cloned elements
          const allCloned = clonedDoc.querySelectorAll('*');
          allCloned.forEach((node) => {
            const el = node as HTMLElement;
            if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
              el.style.cssText = sanitizeOklchInCss(el.style.cssText);
            }
          });
        } catch (e) {
          console.warn('Could not sanitize style tags in html2canvas clone:', e);
        }

        // 3. Remove floating animations, transforms, blur filters from document and children
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.animation = 'none';
          clonedElement.style.transition = 'none';
          clonedElement.style.filter = 'none';
          clonedElement.classList.remove('animate-note-open');

          const animatedChildren = clonedElement.querySelectorAll(
            '.animate-note-open, .animate-pulse, .animate-shimmer'
          );
          animatedChildren.forEach((child) => {
            const el = child as HTMLElement;
            el.style.animation = 'none';
            el.style.transform = 'none';
            el.style.filter = 'none';
          });
        }
      },
    });

    onProgress?.('Formatting PDF pages...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidthMm = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeightMm = pdf.internal.pageSize.getHeight(); // 297 mm
    const aspectRatio = pdfHeightMm / pdfWidthMm; // ~1.4142

    // Height of one A4 page in canvas pixels
    const pageHeightPx = Math.floor(canvas.width * aspectRatio);
    const totalCanvasHeight = canvas.height;
    const totalPages = Math.max(1, Math.ceil(totalCanvasHeight / pageHeightPx));

    for (let page = 0; page < totalPages; page++) {
      onProgress?.(`Compiling page ${page + 1} of ${totalPages}...`);

      if (page > 0) {
        pdf.addPage();
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
        // Clean white background
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Draw the slice from master canvas
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

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
      }
    }

    onProgress?.('Downloading PDF file...');
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalFilename);
  } finally {
    restoreMain();
  }
}

/**
 * Pure direct jsPDF text-and-layout generator.
 * Guaranteed to work in 100% of browsers with 0% external CSS dependencies.
 * Downloads directly without opening printer view.
 */
export function generateDirectTextPdf(
  notes: GeneratedNotes,
  options: CustomizationOptions,
  filename: string
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = margin + 4;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin + 4;
    }
  };

  // Header Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(15, 23, 42); // slate-900
  const titleText = options.customTitle || notes.title || 'ChatGPT Study Notes';
  const titleLines = pdf.splitTextToSize(titleText, maxWidth);
  checkPageBreak(titleLines.length * 8 + 12);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 8 + 3;

  // Metadata subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `${notes.date}  •  Author: ${options.authorName || 'AI Synthesizer'}  •  ${notes.readingTimeMinutes} min read`,
    margin,
    y
  );
  y += 7;

  // Divider line
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Executive Summary
  if (notes.executiveSummary) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(79, 70, 229); // indigo-600
    pdf.text('Executive Summary', margin, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 41, 59);
    const summaryLines = pdf.splitTextToSize(notes.executiveSummary, maxWidth);
    checkPageBreak(summaryLines.length * 4.8 + 8);
    pdf.text(summaryLines, margin, y);
    y += summaryLines.length * 4.8 + 8;
  }

  // Key Takeaways
  if (notes.keyTakeaways && notes.keyTakeaways.length > 0) {
    checkPageBreak(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Key Takeaways & Core Insights', margin, y);
    y += 6;

    notes.keyTakeaways.forEach((item, i) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(30, 41, 59);
      const itemLines = pdf.splitTextToSize(`•  ${item}`, maxWidth);
      checkPageBreak(itemLines.length * 4.8 + 3);
      pdf.text(itemLines, margin, y);
      y += itemLines.length * 4.8 + 3;
    });
    y += 6;
  }

  // Q&A Breakdown
  if (notes.qaBreakdown && notes.qaBreakdown.length > 0) {
    checkPageBreak(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Detailed Breakdown & Analysis', margin, y);
    y += 6;

    notes.qaBreakdown.forEach((qa, i) => {
      // Question
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      const qLines = pdf.splitTextToSize(`Q${i + 1}: ${qa.question}`, maxWidth);
      checkPageBreak(qLines.length * 5 + 6);
      pdf.text(qLines, margin, y);
      y += qLines.length * 5 + 2;

      // Answer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      const aLines = pdf.splitTextToSize(qa.answer, maxWidth);
      checkPageBreak(aLines.length * 4.5 + 6);
      pdf.text(aLines, margin, y);
      y += aLines.length * 4.5 + 6;
    });
  }

  // Footer page numbers
  const totalPagesCount = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPagesCount; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Page ${p} of ${totalPagesCount}  •  ChatGPT PDF Notes Studio`, margin, pageHeight - 8);
  }

  const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(finalName);
}
