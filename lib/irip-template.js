import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');

const STATUS_LABELS = {
  observed: '√',
  partial: '/',
  not: 'X'
};

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildParagraphXml(text, { align = 'left' } = {}) {
  if (!text) {
    return (
      '<w:p>' +
      '<w:pPr>' +
      `<w:jc w:val="${align}"/>` +
      '</w:pPr>' +
      '</w:p>'
    );
  }

  const lines = String(text).split(/\r?\n/);
  const lineXml = lines
    .map((line, index) => {
      const escaped = escapeXml(line);
      if (index === 0) {
        return `<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r>`;
      }
      return `<w:r><w:br/><w:t xml:space="preserve">${escaped}</w:t></w:r>`;
    })
    .join('');

  return (
    '<w:p>' +
    '<w:pPr>' +
    `<w:jc w:val="${align}"/>` +
    '</w:pPr>' +
    lineXml +
    '</w:p>'
  );
}

function replaceFirstCellContent(rowXml, cellIndex, paragraphXml) {
  let seen = -1;
  return rowXml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cellXml) => {
    seen += 1;
    if (seen !== cellIndex) {
      return cellXml;
    }

    return cellXml.replace(/<w:p\b[\s\S]*?<\/w:p>/, paragraphXml);
  });
}

function fillHeader(xml, { learnerName, gradeLevel, tutorName }) {
  const learnerParagraphPattern =
    /<w:p>[\s\S]*?Learner(?:â€™|’|'|&#8217;)s Name:[\s\S]*?Grade Level:[\s\S]*?<\/w:p>/;
  const tutorParagraphPattern =
    /<w:p>[\s\S]*?Tutor(?:â€™|’|'|&#8217;)s Name:[\s\S]*?<\/w:p>/;

  xml = xml.replace(learnerParagraphPattern, (paragraphXml) => {
    const textNodes = [...paragraphXml.matchAll(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/g)];
    if (textNodes.length < 2) {
      return paragraphXml;
    }

    let replaced = paragraphXml;
    replaced = replaced.replace(
      textNodes[0][1],
      escapeXml(`Learner's Name: ${learnerName || ''}`)
    );
    replaced = replaced.replace(
      textNodes[1][1],
      escapeXml(`Grade Level: ${gradeLevel || ''}`)
    );
    return replaced;
  });

  xml = xml.replace(tutorParagraphPattern, (paragraphXml) => {
    const textNode = paragraphXml.match(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/);
    if (!textNode) {
      return paragraphXml;
    }

    return paragraphXml.replace(
      textNode[1],
      escapeXml(`Tutor's Name: ${tutorName || ''}`)
    );
  });

  return xml;
}

function groupNotesByWeek(rows) {
  const notesByWeek = new Map();

  for (const row of rows) {
    if (!notesByWeek.has(row.week)) {
      notesByWeek.set(row.week, []);
    }

    if (row.notes) {
      notesByWeek.get(row.week).push(row.notes.trim());
    }
  }

  return notesByWeek;
}

function fillChecklistTable(xml, rows) {
  const tableMatch = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  if (!tableMatch) {
    return xml;
  }

  const tableXml = tableMatch[0];
  const rowMatches = tableXml.match(/<w:tr>[\s\S]*?<\/w:tr>/g);
  if (!rowMatches || rowMatches.length < 2) {
    return xml;
  }

  const notesByWeek = groupNotesByWeek(rows);
  const updatedRows = [...rowMatches];
  let currentWeek = null;
  const renderedWeekNotes = new Set();

  for (let i = 1; i < updatedRows.length && i - 1 < rows.length; i += 1) {
    const dataRow = rows[i - 1];
    let rowXml = updatedRows[i];

    rowXml = replaceFirstCellContent(
      rowXml,
      2,
      buildParagraphXml(STATUS_LABELS[dataRow.status] || '', { align: 'center' })
    );

    if (dataRow.week !== currentWeek) {
      currentWeek = dataRow.week;
      if (!renderedWeekNotes.has(dataRow.week)) {
        const combinedNotes = (notesByWeek.get(dataRow.week) || []).join('\n');
        rowXml = replaceFirstCellContent(
          rowXml,
          3,
          buildParagraphXml(combinedNotes, { align: 'left' })
        );
        renderedWeekNotes.add(dataRow.week);
      }
    }

    updatedRows[i] = rowXml;
  }

  let replacementIndex = 0;
  const updatedTable = tableXml.replace(/<w:tr>[\s\S]*?<\/w:tr>/g, () => {
    const nextRow = updatedRows[replacementIndex];
    replacementIndex += 1;
    return nextRow;
  });

  return xml.replace(tableXml, updatedTable);
}

export async function generateIripDocxBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = new AdmZip(templateBuffer);
  const documentEntry = zip.getEntry('word/document.xml');

  if (!documentEntry) {
    throw new Error('The IRIP template is missing word/document.xml.');
  }

  let xml = documentEntry.getData().toString('utf8');
  xml = fillHeader(xml, { learnerName, gradeLevel, tutorName });
  xml = fillChecklistTable(xml, rows);

  zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
  return zip.toBuffer();
}
