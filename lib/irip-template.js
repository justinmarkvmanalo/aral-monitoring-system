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

function fillHeader(xml, { learnerName, gradeLevel, tutorName }) {
  const learnerParagraphPattern =
    /<w:p>[\s\S]*?Learner(?:â€™|’|'|&#8217;)s Name:[\s\S]*?Grade Level:[\s\S]*?<\/w:p>/;
  const tutorParagraphPattern =
    /<w:p>[\s\S]*?Tutor(?:â€™|’|'|&#8217;)s Name:[\s\S]*?<\/w:p>/;

  xml = xml.replace(learnerParagraphPattern, (paragraphXml) => {
    const matches = [...paragraphXml.matchAll(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/g)];
    if (matches.length < 2) {
      return paragraphXml;
    }

    let replaced = paragraphXml;
    replaced = replaceTextOccurrence(
      replaced,
      matches[0][1],
      `Learner's Name: ${learnerName || ''}`
    );
    replaced = replaceTextOccurrence(
      replaced,
      matches[1][1],
      `Grade Level: ${gradeLevel || ''}`
    );
    return replaced;
  });

  xml = xml.replace(tutorParagraphPattern, (paragraphXml) => {
    const match = paragraphXml.match(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/);
    if (!match) {
      return paragraphXml;
    }

    return replaceTextOccurrence(paragraphXml, match[1], `Tutor's Name: ${tutorName || ''}`);
  });

  return xml;
}

function buildRunXml(text) {
  const lines = String(text).split(/\r?\n/);
  return lines
    .map((line, index) => {
      const escaped = escapeXml(line);
      if (index === 0) {
        return `<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r>`;
      }
      return `<w:r><w:br/><w:t xml:space="preserve">${escaped}</w:t></w:r>`;
    })
    .join('');
}

function replaceTextOccurrence(xml, oldText, newText) {
  return xml.replace(oldText, escapeXml(newText));
}

function setParagraphTextInPlace(paragraphXml, text) {
  const escapedText = escapeXml(text);
  const textMatch = paragraphXml.match(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/);

  if (textMatch) {
    return replaceTextOccurrence(paragraphXml, textMatch[1], text);
  }

  if (!text) {
    return paragraphXml;
  }

  return paragraphXml.replace(/<\/w:p>$/, `${buildRunXml(text)}</w:p>`);
}

function replaceNthCell(rowXml, targetIndex, mutateCell) {
  let cellIndex = -1;
  return rowXml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cellXml) => {
    cellIndex += 1;
    if (cellIndex !== targetIndex) {
      return cellXml;
    }
    return mutateCell(cellXml);
  });
}

function replaceFirstParagraphInCell(cellXml, mutateParagraph) {
  return cellXml.replace(/<w:p\b[\s\S]*?<\/w:p>|<w:p\/>/, (paragraphXml) => {
    if (paragraphXml === '<w:p/>') {
      return `<w:p>${buildRunXml(mutateParagraph(''))}</w:p>`;
    }
    return mutateParagraph(paragraphXml);
  });
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
    updatedRows[rowIndex] = replaceNthCell(updatedRows[rowIndex], 2, (cellXml) =>
      replaceFirstParagraphInCell(cellXml, (paragraphXml) =>
        setParagraphTextInPlace(paragraphXml, STATUS_LABELS[dataRow.status] || '')
      )
    );

    if (!renderedWeekNotes.has(dataRow.week)) {
      renderedWeekNotes.add(dataRow.week);
      updatedRows[rowIndex] = replaceNthCell(updatedRows[rowIndex], 3, (cellXml) =>
        replaceFirstParagraphInCell(cellXml, (paragraphXml) =>
          setParagraphTextInPlace(paragraphXml, (notesByWeek.get(dataRow.week) || []).join('\n'))
        )
      );
    }
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
