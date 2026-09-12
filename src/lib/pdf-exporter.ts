import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Triggers native high-resolution browser print dialog targeted at the document element.
 * This delivers vector-grade crisp typography, true page numbers, and custom print layout.
 */
export function printDocument() {
  window.print();
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
 * Captures the exact rendered document canvas (matching the on-screen preview 1:1)
 * and downloads a high-fidelity A4 PDF file directly to the user's device.
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
  // Mobile browsers cap canvas dimension at 4096px, desktop at 8192px
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
    onProgress?.(`Processing page ${page + 1} of ${totalPages}...`);

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
      // Fill page with the exact theme background color
      pageCtx.fillStyle = themeBg;
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Draw the exact slice from the master canvas
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

  onProgress?.('Downloading PDF file...');
  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(finalFilename);
}
