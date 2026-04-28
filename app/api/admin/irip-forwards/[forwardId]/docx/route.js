import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { getAdminIripForwardDocumentData } from '@/lib/data';
import { getIripFilename } from '@/lib/irip-export';
import { generateIripDocxBuffer } from '@/lib/irip-template';

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

  const buffer = await generateIripDocxBuffer(data);
  const filename = getIripFilename(data.learnerName, 'docx');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
}
