import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { convertIripDocxToPdfBuffer } from '@/lib/irip-convert';
import { getAdminIripForwardDocumentData } from '@/lib/data';
import { getIripFilename } from '@/lib/irip-export';

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

  let buffer;
  try {
    buffer = await convertIripDocxToPdfBuffer(data);
  } catch (error) {
    if (error?.code === 'DOCX_TO_PDF_UNAVAILABLE' || error?.code === 'DOCX_TO_PDF_FAILED') {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
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
