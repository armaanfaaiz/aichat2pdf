import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
function oklchToRgbString(lStr: string, cStr: string, hStr: string, aStr?: string): string {
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
function sanitizeOklchInCss(text: string): string {
  if (!text || !text.includes('oklch')) return text;
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
 * Generates and downloads a direct PDF file using html2canvas & jsPDF.
 * - Sanitizes Tailwind v4 OKLCH colors to prevent html2canvas crashes.
 * - Caps scale to prevent exceeding mobile/desktop canvas memory limits.
 * - Slices into individual A4 pages with zero image overflow.
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

  let scale = isMobile ? 1.5 : 2;
  if (docHeight * scale > maxCanvasDimension) {
    scale = Math.max(1, maxCanvasDimension / docHeight);
  }

  onProgress?.('Capturing high-resolution document...');

  // Configure html2canvas with sanitized styles and stripped animation transforms
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth || 860,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Sanitize all stylesheet rules in the cloned iframe document
      try {
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach((styleTag) => {
          if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
            styleTag.textContent = sanitizeOklchInCss(styleTag.textContent);
          }
        });
      } catch (e) {
        console.warn('Could not sanitize style tags in html2canvas clone:', e);
      }

      // 2. Remove floating animations, transforms, blur filters from document and children
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
    onProgress?.(`Processing page ${page + 1} of ${totalPages}...`);

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

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
    }
  }

  onProgress?.('Saving PDF file...');
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(finalFilename);
}
