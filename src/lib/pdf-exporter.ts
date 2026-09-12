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

  // Read the theme background color from the computed style of the element
  let themeBg = '#ffffff';
  try {
    const computed = window.getComputedStyle(element);
    if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      themeBg = computed.backgroundColor;
    }
  } catch {
    // fallback
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: themeBg,
    windowWidth: element.scrollWidth || 860,
    onclone: (_clonedDoc, clonedElement) => {
      // Remove temporary intro animations so the capture is steady & crisp
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
