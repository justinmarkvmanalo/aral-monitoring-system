import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');

const WEEK_SEQUENCE = [1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8];

const STATUS_LABELS = {
  observed: '√',
  partial: '/',
  not: 'X'
};

function replaceTextOccurrence(xml, oldText, newText) {
  return xml.replace(oldText, newText);
}

function buildRunXml(text) {
  return `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function fillTemplatePlaceholders(documentXml) {
  let xml = documentXml;

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
    replaced = replaceTextOccurrence(replaced, matches[0][1], "Learner's Name: {learner_name}");
    replaced = replaceTextOccurrence(replaced, matches[1][1], 'Grade Level: {grade_level}');
    return replaced;
  });

  xml = xml.replace(tutorParagraphPattern, (paragraphXml) => {
    const match = paragraphXml.match(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/);
    if (!match) {
      return paragraphXml;
    }
    return replaceTextOccurrence(paragraphXml, match[1], "Tutor's Name: {tutor_name}");
  });

  const tableMatch = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  if (!tableMatch) {
    return xml;
  }

  const tableXml = tableMatch[0];
  const tableRows = tableXml.match(/<w:tr>[\s\S]*?<\/w:tr>/g);
  if (!tableRows || tableRows.length < 2) {
    return xml;
  }

  const updatedRows = [...tableRows];
  const renderedWeekNotes = new Set();

  for (let rowIndex = 1; rowIndex < updatedRows.length && rowIndex - 1 < WEEK_SEQUENCE.length; rowIndex += 1) {
    const itemIndex = rowIndex;
    const week = WEEK_SEQUENCE[rowIndex - 1];
    let cellIndex = -1;

    updatedRows[rowIndex] = updatedRows[rowIndex].replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cellXml) => {
      cellIndex += 1;

      if (cellIndex === 2) {
        return cellXml.replace(/<w:p\b[\s\S]*?<\/w:p>|<w:p\/>/, (paragraphXml) => {
          const textMatch = paragraphXml.match(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/);
          if (textMatch) {
            return paragraphXml.replace(textMatch[1], `{status_${itemIndex}}`);
          }
          if (paragraphXml === '<w:p/>') {
            return `<w:p>${buildRunXml(`{status_${itemIndex}}`)}</w:p>`;
          }
          return paragraphXml.replace(/<\/w:p>$/, `${buildRunXml(`{status_${itemIndex}}`)}</w:p>`);
        });
      }

      if (cellIndex === 3 && !renderedWeekNotes.has(week)) {
        renderedWeekNotes.add(week);
        return cellXml.replace(/<w:p\b[\s\S]*?<\/w:p>|<w:p\/>/, (paragraphXml) => {
          const textMatch = paragraphXml.match(/<w:t(?: xml:space="preserve")?>([\s\S]*?)<\/w:t>/);
          if (textMatch) {
            return paragraphXml.replace(textMatch[1], `{note_week_${week}}`);
          }
          if (paragraphXml === '<w:p/>') {
            return `<w:p>${buildRunXml(`{note_week_${week}}`)}</w:p>`;
          }
          return paragraphXml.replace(/<\/w:p>$/, `${buildRunXml(`{note_week_${week}}`)}</w:p>`);
        });
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

function buildTemplateData({ learnerName, gradeLevel, tutorName, rows }) {
  const data = {
    learner_name: learnerName || '',
    grade_level: gradeLevel || '',
    tutor_name: tutorName || ''
  };

  const notesByWeek = new Map();
  for (const row of rows) {
    if (!notesByWeek.has(row.week)) {
      notesByWeek.set(row.week, []);
    }
    if (row.notes) {
      notesByWeek.get(row.week).push(String(row.notes).trim());
    }
  }

  rows.forEach((row, index) => {
    data[`status_${index + 1}`] = STATUS_LABELS[row.status] || '';
  });

  for (let week = 1; week <= 8; week += 1) {
    data[`note_week_${week}`] = (notesByWeek.get(week) || []).join('\n');
  }

  return data;
}

export async function generateIripDocxBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const sourceZip = new AdmZip(templateBuffer);
  const documentEntry = sourceZip.getEntry('word/document.xml');

  if (!documentEntry) {
    throw new Error('The IRIP template is missing word/document.xml.');
  }

  const patchedZip = new AdmZip(templateBuffer);
  const originalXml = documentEntry.getData().toString('utf8');
  const placeholderXml = fillTemplatePlaceholders(originalXml);
  patchedZip.updateFile('word/document.xml', Buffer.from(placeholderXml, 'utf8'));

  const zip = new PizZip(patchedZip.toBuffer());
  const doc = new Docxtemplater(zip, {
    linebreaks: true,
    paragraphLoop: true
  });

  doc.render(buildTemplateData({
    learnerName,
    gradeLevel,
    tutorName,
    rows: Array.isArray(rows) ? rows : []
  }));

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });
}
