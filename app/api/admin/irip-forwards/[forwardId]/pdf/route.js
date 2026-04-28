import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { getAdminIripForwardDocumentData } from '@/lib/data';
import { getIripFilename } from '@/lib/irip-export';
import { generateIripPdfBuffer } from '@/lib/irip-pdf';

export async function GET(_, { params }) {
  await requireRole('admin');
  const forwardId = Number(params.forwardId || 0);

  if (!forwardId) {
    return NextResponse.json({ error: 'Invalid IRIP forward.' }, { status: 400 });
  }

  const data = await getAdminIripForwardDocumentData(forwardId);
  if (!data) {
    return NextResponse.json({ error: 'Forwarded IRIP not found.' }, { status: 404 });
  }

  const buffer = await generateIripPdfBuffer(data);
  const filename = getIripFilename(data.learnerName, 'pdf');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
}
