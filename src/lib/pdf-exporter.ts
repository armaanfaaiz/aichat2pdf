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
 * Generates and downloads a direct PDF file using html2canvas & jsPDF
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

  onProgress?.('Capturing document pages...');

  // Configure high-DPI rendering
  const canvas = await html2canvas(element, {
    scale: 2, // 2x scale for sharp text
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    backgroundColor: '#ffffff',
  });

  onProgress?.('Compiling PDF...');

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Subsequent pages
  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  onProgress?.('Saving PDF...');
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
