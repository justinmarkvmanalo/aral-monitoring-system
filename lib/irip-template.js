import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');
const LEARNER_APOSTROPHE = '\u2019';

const STATUS_LABELS = {
  observed: '\u221A',
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

function normalizeWordText(value) {
  return String(value || '')
    .replace(/Ã¢â‚¬â„¢|â€™/g, LEARNER_APOSTROPHE)
    .replace(/&#8217;/g, LEARNER_APOSTROPHE)
    .replace(/&apos;/g, "'");
}

function replaceTextNode(paragraphXml, textNodeIndex, nextText) {
  let currentIndex = -1;
  return paragraphXml.replace(/(<w:t(?: xml:space="preserve")?>)([\s\S]*?)(<\/w:t>)/g, (match, open, _content, close) => {
    currentIndex += 1;
    if (currentIndex !== textNodeIndex) {
      return match;
    }

    return `${open}${escapeXml(nextText)}${close}`;
  });
}

function fillHeader(xml, { learnerName, gradeLevel, tutorName }) {
  const paragraphs = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g);
  if (!paragraphs) {
    return xml;
  }

  const learnerLabel = `Learner${LEARNER_APOSTROPHE}s Name:`;
  const tutorLabel = `Tutor${LEARNER_APOSTROPHE}s Name:`;

  const learnerIndex = paragraphs.findIndex((paragraphXml) => {
    const normalized = normalizeWordText(paragraphXml);
    return normalized.includes(learnerLabel) && normalized.includes('Grade Level:');
  });

  if (learnerIndex >= 0) {
    let learnerParagraph = paragraphs[learnerIndex];
    learnerParagraph = replaceTextNode(learnerParagraph, 0, `${learnerLabel} ${learnerName || ''}`);
    learnerParagraph = replaceTextNode(learnerParagraph, 1, `Grade Level: ${gradeLevel || ''}`);
    paragraphs[learnerIndex] = learnerParagraph;
  }

  const tutorIndex = paragraphs.findIndex((paragraphXml, index) => {
    if (index <= learnerIndex) {
      return false;
    }

    const normalized = normalizeWordText(paragraphXml);
    return normalized.includes(tutorLabel) && normalized.includes('<w:bookmarkStart');
  });

  if (tutorIndex >= 0) {
    let tutorParagraph = paragraphs[tutorIndex];
    tutorParagraph = replaceTextNode(tutorParagraph, 0, `${tutorLabel} `);
    tutorParagraph = replaceTextNode(tutorParagraph, 1, tutorName || '');
    paragraphs[tutorIndex] = tutorParagraph;
  }

  let paragraphIndex = 0;
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, () => {
    const nextParagraph = paragraphs[paragraphIndex];
    paragraphIndex += 1;
    return nextParagraph;
  });
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
