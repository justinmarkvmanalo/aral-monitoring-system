import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');

const STATUS_LABELS = {
  observed: '&#8730;',
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

function fillHeader(xml, { learnerName, gradeLevel, tutorName }) {
  const learnerPattern =
    /(<w:t>)(Learner(?:â€™|’|'|&#8217;)s Name:)[^<]*(<\/w:t><w:tab\/><w:tab\/><w:t>Grade Level: )[^<]*(<\/w:t>)/;
  const tutorPattern =
    /(<w:t(?: xml:space="preserve")?>)Tutor(?:â€™|’|'|&#8217;)s Name:[^<]*(<\/w:t>)/;

  xml = xml.replace(
    learnerPattern,
    (_, open, learnerLabel, middle, close) =>
      `${open}${escapeXml(`${learnerLabel} ${learnerName || ''}`)}${middle}${escapeXml(gradeLevel || '')}${close}`
  );

  xml = xml.replace(
    tutorPattern,
    (_, open, close) => `${open}${escapeXml(`Tutor's Name: ${tutorName || ''}`)}${close}`
  );

  return xml;
}

function buildParagraphXml(text, { align = 'left' } = {}) {
  if (!text) {
    return `<w:p><w:pPr><w:jc w:val="${align}"/></w:pPr></w:p>`;
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

  return `<w:p><w:pPr><w:jc w:val="${align}"/></w:pPr>${lineXml}</w:p>`;
}

function replaceFirstParagraph(cellXml, paragraphXml) {
  return cellXml.replace(/<w:p\b[\s\S]*?<\/w:p>|<w:p\/>/, paragraphXml);
}

function fillChecklistTable(xml, rows) {
  const tableMatch = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  if (!tableMatch) {
    return xml;
  }

  const tableXml = tableMatch[0];
  const tableRows = tableXml.match(/<w:tr>[\s\S]*?<\/w:tr>/g);
  if (!tableRows || tableRows.length < 2) {
    return xml;
  }

  const notesByWeek = new Map();
  for (const row of rows) {
    if (!notesByWeek.has(row.week)) {
      notesByWeek.set(row.week, []);
    }
    if (row.notes) {
      notesByWeek.get(row.week).push(String(row.notes).trim());
    }
  }

  const updatedRows = [...tableRows];
  const renderedWeekNotes = new Set();

  for (let rowIndex = 1; rowIndex < updatedRows.length && rowIndex - 1 < rows.length; rowIndex += 1) {
    const dataRow = rows[rowIndex - 1];
    let cellIndex = -1;

    updatedRows[rowIndex] = updatedRows[rowIndex].replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cellXml) => {
      cellIndex += 1;

      if (cellIndex === 2) {
        return replaceFirstParagraph(
          cellXml,
          buildParagraphXml(STATUS_LABELS[dataRow.status] || '', { align: 'center' })
        );
      }

      if (cellIndex === 3 && !renderedWeekNotes.has(dataRow.week)) {
        renderedWeekNotes.add(dataRow.week);
        return replaceFirstParagraph(
          cellXml,
          buildParagraphXml((notesByWeek.get(dataRow.week) || []).join('\n'), { align: 'left' })
        );
      }

      return cellXml;
    });
  }

  let replacementIndex = 0;
  const updatedTableXml = tableXml.replace(/<w:tr>[\s\S]*?<\/w:tr>/g, () => {
    const nextRow = updatedRows[replacementIndex];
    replacementIndex += 1;
    return nextRow;
  });

  return xml.replace(tableXml, updatedTableXml);
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
  xml = fillChecklistTable(xml, Array.isArray(rows) ? rows : []);

  zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
  return zip.toBuffer();
}
