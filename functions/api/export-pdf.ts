/**
 * PDF Export Worker Endpoint
 * Generates PDF from serialized editor content
 * Per Constitution Section 8 - Export
 *
 * Note: This implementation uses a client-side PDF generation approach
 * since Cloudflare Workers don't support Puppeteer directly.
 * For server-side PDF generation, consider using:
 * - Cloudflare Browser Rendering (beta)
 * - External PDF service (e.g., Gotenberg, PDF.co)
 * - R2 + Worker combination with pdf-lib
 */

interface Env {
  DB: D1Database;
  R2_ASSETS: R2Bucket;
}

/**
 * PDF export request payload
 */
interface PdfExportRequest {
  folios: {
    id: string;
    index: number;
    orientation: 'portrait' | 'landscape';
    htmlContent: string;
    cssStyles: string;
  }[];
  options: {
    quality: 'draft' | 'standard' | 'high' | 'print';
    paperSize: 'a4' | 'letter' | 'legal';
    resolveSlots: boolean;
    includeComments: boolean;
    includeTrackChanges: boolean;
    showTrackChangesMarkup: boolean;
    pageRange: { start: number; end: number } | null;
    embedFonts: boolean;
    pdfACompliance: 'none' | 'pdf-a-1b' | 'pdf-a-2b' | 'pdf-a-3b';
  };
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    creationDate: string;
    modificationDate: string;
  };
  resolvedSlots: Record<string, string>;
}

/**
 * Paper dimensions in points (72 dpi)
 */
const PAPER_DIMENSIONS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
};

/**
 * Quality DPI settings
 */
const QUALITY_DPI = {
  draft: 72,
  standard: 150,
  high: 300,
  print: 600,
};

/**
 * Generate HTML template for PDF rendering
 */
function generatePdfHtml(
  folios: PdfExportRequest['folios'],
  options: PdfExportRequest['options'],
  metadata: PdfExportRequest['metadata'],
  resolvedSlots: Record<string, string>
): string {
  const paperSize = PAPER_DIMENSIONS[options.paperSize];

  // Process folios based on page range
  let processedFolios = folios;
  if (options.pageRange) {
    processedFolios = folios.filter(
      (f) => f.index >= options.pageRange!.start && f.index <= options.pageRange!.end
    );
  }

  // Replace slot placeholders with resolved values
  const processHtml = (html: string): string => {
    let processed = html;

    // Replace slot markers with resolved values
    Object.entries(resolvedSlots).forEach(([slotId, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${slotId}\\s*\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    });

    // Remove track changes markup if not showing
    if (!options.showTrackChangesMarkup && options.includeTrackChanges) {
      // Keep insertions as normal text, remove deletions
      processed = processed.replace(/<ins[^>]*>(.*?)<\/ins>/gi, '$1');
      processed = processed.replace(/<del[^>]*>.*?<\/del>/gi, '');
      processed = processed.replace(
        /<span[^>]*data-revision-type="insertion"[^>]*>(.*?)<\/span>/gi,
        '$1'
      );
      processed = processed.replace(
        /<span[^>]*data-revision-type="deletion"[^>]*>.*?<\/span>/gi,
        ''
      );
    }

    // Remove comments if not including
    if (!options.includeComments) {
      processed = processed.replace(
        /<span[^>]*data-comment[^>]*>(.*?)<\/span>/gi,
        '$1'
      );
    }

    return processed;
  };

  const pages = processedFolios.map((folio, index) => {
    const isLandscape = folio.orientation === 'landscape';
    const pageWidth = isLandscape ? paperSize.height : paperSize.width;
    const pageHeight = isLandscape ? paperSize.width : paperSize.height;

    return `
      <div class="pdf-page" style="
        width: ${pageWidth}pt;
        height: ${pageHeight}pt;
        page-break-after: ${index < processedFolios.length - 1 ? 'always' : 'auto'};
        box-sizing: border-box;
        overflow: hidden;
        position: relative;
        background: white;
      ">
        <style>${folio.cssStyles}</style>
        ${processHtml(folio.htmlContent)}
      </div>
    `;
  }).join('\n');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <meta name="author" content="${metadata.author}">
  <meta name="description" content="${metadata.subject}">
  <meta name="keywords" content="${metadata.keywords}">
  <style>
    @page {
      size: ${options.paperSize};
      margin: 0;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    .pdf-page {
      margin: 0 auto;
      padding: 20mm;
    }

    /* A4 specific styles */
    .a4-content {
      width: 100%;
      height: 100%;
    }

    /* Hide non-printable elements */
    .comment-marker,
    .slot-marker,
    .collaboration-cursor,
    .presence-indicator {
      display: none !important;
    }

    /* Table styles */
    table {
      border-collapse: collapse;
      width: 100%;
    }

    td, th {
      border: 1px solid #000;
      padding: 6pt;
    }

    /* List styles */
    ul, ol {
      margin: 0;
      padding-left: 20pt;
    }

    /* Heading styles */
    h1 { font-size: 24pt; margin: 12pt 0; }
    h2 { font-size: 18pt; margin: 10pt 0; }
    h3 { font-size: 14pt; margin: 8pt 0; }

    /* Image styles */
    img {
      max-width: 100%;
      height: auto;
    }

    /* Track changes styles (when showing markup) */
    ${options.showTrackChangesMarkup ? `
    ins, .insertion-node {
      background-color: #dbeafe;
      color: #1e40af;
      text-decoration: underline;
    }

    del, .deletion-node {
      color: #3b82f6;
      text-decoration: line-through;
    }
    ` : ''}

    /* Comment highlight (when including) */
    ${options.includeComments ? `
    .comment-highlight {
      background-color: #fef3c7;
      border-bottom: 2px solid #f59e0b;
    }
    ` : ''}
  </style>
</head>
<body>
  ${pages}
</body>
</html>
  `.trim();
}

/**
 * Handle POST request for PDF export
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // Parse request body
    const body = await request.json() as PdfExportRequest;
    const { folios, options, metadata, resolvedSlots } = body;

    // Validate request
    if (!folios || folios.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No folios provided for export',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML for PDF
    const html = generatePdfHtml(folios, options, metadata, resolvedSlots);

    // Calculate page count
    let pageCount = folios.length;
    if (options.pageRange) {
      pageCount = Math.min(
        options.pageRange.end - options.pageRange.start + 1,
        folios.length
      );
    }

    // Generate filename
    const sanitizedTitle = metadata.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    const filename = `${sanitizedTitle || 'document'}-${Date.now()}.pdf`;

    // For now, return the HTML that can be used for client-side PDF generation
    // In a production environment, this would integrate with:
    // 1. Cloudflare Browser Rendering API (when available)
    // 2. External PDF service
    // 3. pdf-lib for direct PDF generation

    // Store the HTML temporarily in R2 for retrieval
    const htmlKey = `exports/temp/${crypto.randomUUID()}.html`;
    await env.R2_ASSETS.put(htmlKey, html, {
      customMetadata: {
        filename,
        pageCount: String(pageCount),
        quality: options.quality,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      },
    });

    // Return response with HTML content and metadata
    // Client will use this to generate PDF via browser print or jspdf
    return new Response(JSON.stringify({
      success: true,
      method: 'client-side',
      html: html,
      filename,
      pageCount,
      storageKey: htmlKey,
      instructions: {
        browser: 'Use window.print() or browser PDF export',
        library: 'Use jspdf + html2canvas for programmatic export',
      },
      metadata: {
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        keywords: metadata.keywords,
        creationDate: metadata.creationDate,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[export-pdf] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Handle GET request for export status/info
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');

  if (key) {
    // Retrieve stored export
    const object = await env.R2_ASSETS.get(key);

    if (!object) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Export not found or expired',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await object.text();
    const metadata = object.customMetadata;

    return new Response(JSON.stringify({
      success: true,
      html,
      filename: metadata?.filename,
      pageCount: parseInt(metadata?.pageCount || '0', 10),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return export capabilities info
  return new Response(JSON.stringify({
    service: 'pdf-export',
    version: '1.0.0',
    capabilities: {
      maxPages: 100,
      supportedFormats: ['a4', 'letter', 'legal'],
      qualityLevels: ['draft', 'standard', 'high', 'print'],
      features: [
        'slot_resolution',
        'track_changes',
        'comments',
        'multi_page',
        'metadata',
      ],
    },
    methods: {
      available: 'client-side',
      future: ['cloudflare-browser-rendering', 'external-service'],
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
