export const runtime = 'nodejs';

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 20 * 1024 * 1024) return new Response('PDF payload is too large', { status: 413 });
  try {
    const form = await request.formData();
    const pdfData = form.get('pdfData');
    const requestedFilename = form.get('filename');
    if (typeof pdfData !== 'string' || !/^data:application\/pdf(?:;[^,]*)?;base64,/i.test(pdfData)) return new Response('Invalid PDF payload', { status: 400 });
    const binary = Buffer.from(pdfData.slice(pdfData.indexOf(',') + 1), 'base64');
    if (!binary.length || binary.length > 15 * 1024 * 1024 || binary.subarray(0, 5).toString('ascii') !== '%PDF-') return new Response('Invalid or oversized PDF file', { status: 400 });
    const safeFilename = (typeof requestedFilename === 'string' ? requestedFilename : 'fino-pay-statement.pdf').replace(/[\\/\r\n\"]/g, '_').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'fino-pay-statement.pdf';
    return new Response(new Uint8Array(binary), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${safeFilename}"`, 'Content-Length': String(binary.length), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Unable to generate PDF download', { status: 400 }); }
}
