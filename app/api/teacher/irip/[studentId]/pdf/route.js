import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { getTeacherIripDocumentData } from '@/lib/data';
import { getIripFilename } from '@/lib/irip-export';
import { generateIripPdfBuffer } from '@/lib/irip-pdf';

export async function GET(_, { params }) {
  const session = await requireRole('teacher');
  const studentId = Number(params.studentId || 0);

  if (!studentId) {
    return NextResponse.json({ error: 'Invalid student.' }, { status: 400 });
  }

  const data = await getTeacherIripDocumentData(session.userId, studentId);
  if (!data) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
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
