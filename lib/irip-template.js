import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const STATUS_LABELS = {
  observed: '√',
  partial: '/',
  not: 'X'
};

function firstByTag(node, tagName) {
  const list = node.getElementsByTagNameNS(WORD_NS, tagName);
  return list.length > 0 ? list[0] : null;
}

function directChildrenByTag(node, tagName) {
  const result = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1 && child.localName === tagName) {
      result.push(child);
    }
  }
  return result;
}

function getParagraphText(paragraph) {
  return directChildrenByTag(paragraph, 'r')
    .flatMap((run) => directChildrenByTag(run, 't').map((textNode) => textNode.textContent || ''))
    .join('');
}

function cloneFirstRunProps(paragraph) {
  const firstRun = directChildrenByTag(paragraph, 'r')[0];
  const runProps = firstRun ? firstByTag(firstRun, 'rPr') : null;
  return runProps ? runProps.cloneNode(true) : null;
}

function removeRunChildren(paragraph) {
  const toRemove = [];
  for (let child = paragraph.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1 && child.localName !== 'pPr') {
      toRemove.push(child);
    }
  }
  for (const node of toRemove) {
    paragraph.removeChild(node);
  }
}

function createRun(doc, runProps, parts) {
  const run = doc.createElementNS(WORD_NS, 'w:r');
  if (runProps) {
    run.appendChild(runProps.cloneNode(true));
  }

  for (const part of parts) {
    if (part.type === 'text') {
      const textNode = doc.createElementNS(WORD_NS, 'w:t');
      textNode.setAttribute('xml:space', 'preserve');
      textNode.appendChild(doc.createTextNode(part.value));
      run.appendChild(textNode);
      continue;
    }

    if (part.type === 'tab') {
      run.appendChild(doc.createElementNS(WORD_NS, 'w:tab'));
      continue;
    }

    if (part.type === 'break') {
      run.appendChild(doc.createElementNS(WORD_NS, 'w:br'));
    }
  }

  return run;
}

function setParagraphParts(paragraph, parts, align = null) {
  const doc = paragraph.ownerDocument;
  const runProps = cloneFirstRunProps(paragraph);
  removeRunChildren(paragraph);

  if (align) {
    let pPr = firstByTag(paragraph, 'pPr');
    if (!pPr) {
      pPr = doc.createElementNS(WORD_NS, 'w:pPr');
      paragraph.insertBefore(pPr, paragraph.firstChild);
    }

    let jc = firstByTag(pPr, 'jc');
    if (!jc) {
      jc = doc.createElementNS(WORD_NS, 'w:jc');
      pPr.appendChild(jc);
    }
    jc.setAttributeNS(WORD_NS, 'w:val', align);
  }

  if (!parts.length) {
    return;
  }

  paragraph.appendChild(createRun(doc, runProps, parts));
}

function setParagraphText(paragraph, text, align = null) {
  if (!text) {
    setParagraphParts(paragraph, [], align);
    return;
  }

  const parts = [];
  const lines = String(text).split(/\r?\n/);

  lines.forEach((line, index) => {
    if (index > 0) {
      parts.push({ type: 'break' });
    }
    parts.push({ type: 'text', value: line });
  });

  setParagraphParts(paragraph, parts, align);
}

function findParagraphContaining(body, text) {
  const paragraphs = body.getElementsByTagNameNS(WORD_NS, 'p');
  for (let i = 0; i < paragraphs.length; i += 1) {
    const paragraph = paragraphs[i];
    if (getParagraphText(paragraph).includes(text)) {
      return paragraph;
    }
  }
  return null;
}

function fillHeader(body, values) {
  const learnerParagraph =
    findParagraphContaining(body, 'Learner') ||
    findParagraphContaining(body, 'Grade Level');
  const tutorParagraph = findParagraphContaining(body, 'Tutor');

  if (learnerParagraph) {
    setParagraphParts(learnerParagraph, [
      { type: 'text', value: `Learner's Name: ${values.learnerName || ''}` },
      { type: 'tab' },
      { type: 'tab' },
      { type: 'text', value: `Grade Level: ${values.gradeLevel || ''}` }
    ]);
  }

  if (tutorParagraph) {
    setParagraphText(tutorParagraph, `Tutor's Name: ${values.tutorName || ''}`);
  }
}

function groupNotesByWeek(rows) {
  const notesByWeek = new Map();

  for (const row of rows) {
    if (!notesByWeek.has(row.week)) {
      notesByWeek.set(row.week, []);
    }
    if (row.notes) {
      notesByWeek.get(row.week).push(String(row.notes).trim());
    }
  }

  return notesByWeek;
}

function fillChecklistTable(body, rows) {
  const table = firstByTag(body, 'tbl');
  if (!table) {
    return;
  }

  const tableRows = directChildrenByTag(table, 'tr');
  if (tableRows.length < 2) {
    return;
  }

  const notesByWeek = groupNotesByWeek(rows);
  const renderedWeekNotes = new Set();

  for (let i = 1; i < tableRows.length && i - 1 < rows.length; i += 1) {
    const rowData = rows[i - 1];
    const cells = directChildrenByTag(tableRows[i], 'tc');
    if (cells.length < 4) {
      continue;
    }

    const statusParagraph = firstByTag(cells[2], 'p');
    if (statusParagraph) {
      setParagraphText(statusParagraph, STATUS_LABELS[rowData.status] || '', 'center');
    }

    if (!renderedWeekNotes.has(rowData.week)) {
      const notesParagraph = firstByTag(cells[3], 'p');
      if (notesParagraph) {
        setParagraphText(notesParagraph, (notesByWeek.get(rowData.week) || []).join('\n'), 'left');
      }
      renderedWeekNotes.add(rowData.week);
    }
  }
}

export async function generateIripDocxBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = new AdmZip(templateBuffer);
  const documentEntry = zip.getEntry('word/document.xml');

  if (!documentEntry) {
    throw new Error('The IRIP template is missing word/document.xml.');
  }

  const xml = documentEntry.getData().toString('utf8');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const body = firstByTag(doc, 'body');

  if (!body) {
    throw new Error('The IRIP template document body could not be read.');
  }

  fillHeader(body, { learnerName, gradeLevel, tutorName });
  fillChecklistTable(body, Array.isArray(rows) ? rows : []);

  const serialized = new XMLSerializer().serializeToString(doc);
  zip.updateFile('word/document.xml', Buffer.from(serialized, 'utf8'));
  return zip.toBuffer();
}
