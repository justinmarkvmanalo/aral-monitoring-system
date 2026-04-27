import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { getTeacherIripDocumentData } from '@/lib/data';
import { generateIripDocxBuffer } from '@/lib/irip-template';

function safeFilePart(value) {
  return String(value || 'document')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

  const buffer = await generateIripDocxBuffer(data);
  const filename = `${safeFilePart(data.learnerName)}-IRIP.docx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
}
