import { NextRequest, NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET: Check if iLovePDF API keys are configured on the server
 */
export async function GET() {
  const isConfigured = Boolean(
    process.env.ILOVEPDF_PUBLIC_KEY && process.env.ILOVEPDF_SECRET_KEY
  );
  return NextResponse.json({
    configured: isConfigured,
    publicKeySet: Boolean(process.env.ILOVEPDF_PUBLIC_KEY),
  });
}

/**
 * POST: Converts HTML content into high-definition vector PDF using the official iLovePDF API
 */
export async function POST(req: NextRequest) {
  let tempHtmlPath: string | null = null;

  try {
    const body = await req.json();
    const {
      html,
      filename = 'chat-notes.pdf',
      publicKey: userPublicKey,
      secretKey: userSecretKey,
      pageSize = 'A4',
      pageMargin = 12,
    } = body;

    const publicKey = userPublicKey || process.env.ILOVEPDF_PUBLIC_KEY;
    const secretKey = userSecretKey || process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json(
        {
          error: 'iLovePDF API keys missing',
          missingKeys: true,
          message:
            'Please provide your free iLovePDF API keys (Public Key & Secret Key) from https://developer.ilovepdf.com or set ILOVEPDF_PUBLIC_KEY and ILOVEPDF_SECRET_KEY in your .env.local file.',
        },
        { status: 400 }
      );
    }

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'HTML content is required for iLovePDF conversion' },
        { status: 400 }
      );
    }

    // Build standalone HTML document with complete fonts and CSS styling
    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.pdf', '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print, nav, aside, button, .view-switcher-bar, .export-toolbar {
      display: none !important;
    }
    .avoid-break, pre, tr, blockquote {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .section-header, h1, h2, h3, h4 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    section, .space-y-4, .space-y-6, .qa-card, .transcript-turn {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }
  </style>
</head>
<body class="p-4 bg-white text-slate-900">
  <div class="max-w-[860px] mx-auto">
    ${html}
  </div>
</body>
</html>`;

    // Write HTML to temporary file for iLovePDF file upload
    tempHtmlPath = path.join(os.tmpdir(), `ilovepdf_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
    fs.writeFileSync(tempHtmlPath, fullHtmlDocument, 'utf-8');

    // Initialize iLovePDF API client
    const instance = new ILovePDFApi(publicKey, secretKey);
    const task = instance.newTask('htmlpdf');

    await task.start();

    const file = new ILovePDFFile(tempHtmlPath);
    await task.addFile(file);

    await task.process({
      page_size: pageSize as any,
      page_orientation: 'portrait',
      page_margin: Number(pageMargin) || 12,
      single_page: false,
    });

    const pdfData = await task.download();

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    return new Response(pdfData as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanFilename)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('iLovePDF generation error:', error);
    const errorMessage = error?.message || 'Failed to generate PDF via iLovePDF API';

    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.response?.data || String(error),
      },
      { status: 500 }
    );
  } finally {
    if (tempHtmlPath) {
      try {
        if (fs.existsSync(tempHtmlPath)) {
          fs.unlinkSync(tempHtmlPath);
        }
      } catch (e) {
        // silent clean up failure
      }
    }
  }
}
