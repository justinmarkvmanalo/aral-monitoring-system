import { getCurrentDateValue } from '@/lib/date';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 48;
const MARGIN_RIGHT = 48;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 48;
const BODY_FONT_SIZE = 10.5;
const SMALL_FONT_SIZE = 9;
const TITLE_FONT_SIZE = 18;
const SECTION_FONT_SIZE = 12;
const LINE_HEIGHT = 14;
const SECTION_GAP = 10;

const STATUS_LABELS = {
  observed: 'Observed',
  partial: 'Partially Observed',
  not: 'Not Observed'
};

function normalizePdfText(value) {
  return String(value || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022]/g, '-')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
}

function escapePdfText(value) {
  return normalizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(value, maxChars) {
  const paragraphs = normalizePdfText(value).split(/\r?\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = '';

    for (const word of words) {
      if (!current) {
        current = word;
        continue;
      }

      const candidate = `${current} ${word}`;
      if (candidate.length <= maxChars) {
        current = candidate;
        continue;
      }

      lines.push(current);
      current = word;
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [''];
}

function buildWrappedLabel(label, value, maxChars) {
  const prefix = `${label}: `;
  const wrapped = wrapText(value || '-', Math.max(12, maxChars - prefix.length));

  return wrapped.map((line, index) => (index === 0 ? `${prefix}${line}` : `${' '.repeat(prefix.length)}${line}`));
}

function groupRowsByWeek(rows) {
  const groups = new Map();

  for (const row of rows) {
    const week = Number(row?.week || 0) || 0;
    if (!groups.has(week)) {
      groups.set(week, []);
    }
    groups.get(week).push({
      skill: String(row?.skill || '').trim(),
      status: String(row?.status || '').trim(),
      notes: String(row?.notes || '').trim()
    });
  }

  return Array.from(groups.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([week, items]) => ({ week, items }));
}

function buildSummary(rows) {
  return rows.reduce(
    (summary, row) => {
      if (row?.status === 'observed') summary.observed += 1;
      if (row?.status === 'partial') summary.partial += 1;
      if (row?.status === 'not') summary.not += 1;
      return summary;
    },
    { observed: 0, partial: 0, not: 0 }
  );
}

function createPdfBuffer(pageContents) {
  const objects = [];

  const pageObjectNumbers = pageContents.map((_, index) => 3 + index * 2);
  const contentObjectNumbers = pageContents.map((_, index) => 4 + index * 2);
  const fontHelvetica = 3 + pageContents.length * 2;
  const fontHelveticaBold = fontHelvetica + 1;

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageContents.length} >>`;

  pageContents.forEach((content, index) => {
    const pageObject = pageObjectNumbers[index];
    const contentObject = contentObjectNumbers[index];
    objects[pageObject] =
      '<< /Type /Page /Parent 2 0 R ' +
      `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontHelvetica} 0 R /F2 ${fontHelveticaBold} 0 R >> >> ` +
      `/Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`;
  });

  objects[fontHelvetica] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[fontHelveticaBold] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  const output = ['%PDF-1.4'];
  const offsets = [];

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    offsets[objectNumber] = Buffer.byteLength(output.join('\n') + '\n', 'utf8');
    output.push(`${objectNumber} 0 obj`);
    output.push(objects[objectNumber]);
    output.push('endobj');
  }

  const xrefOffset = Buffer.byteLength(output.join('\n') + '\n', 'utf8');
  output.push(`xref\n0 ${objects.length}`);
  output.push('0000000000 65535 f ');

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    output.push(`${String(offsets[objectNumber]).padStart(10, '0')} 00000 n `);
  }

  output.push(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>`);
  output.push(`startxref\n${xrefOffset}`);
  output.push('%%EOF');

  return Buffer.from(output.join('\n'), 'utf8');
}

export async function generateIripPdfBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const pageContents = [];
  let currentPage = [];
  let currentY = PAGE_HEIGHT - MARGIN_TOP;
  const usableWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const wrapWidth = Math.max(40, Math.floor(usableWidth / (BODY_FONT_SIZE * 0.56)));
  const detailWrapWidth = Math.max(34, Math.floor(usableWidth / (BODY_FONT_SIZE * 0.54)));
  const groups = groupRowsByWeek(Array.isArray(rows) ? rows : []);
  const summary = buildSummary(Array.isArray(rows) ? rows : []);

  function flushPage() {
    pageContents.push(currentPage.join('\n'));
    currentPage = [];
    currentY = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(linesNeeded = 1, gap = 0) {
    const neededHeight = linesNeeded * LINE_HEIGHT + gap;
    if (currentY - neededHeight < MARGIN_BOTTOM) {
      flushPage();
    }
  }

  function drawText(text, { x = MARGIN_LEFT, font = 'F1', size = BODY_FONT_SIZE } = {}) {
    currentPage.push(
      `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${currentY.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`
    );
    currentY -= LINE_HEIGHT;
  }

  function drawDivider() {
    currentPage.push(
      `${MARGIN_LEFT} ${currentY + 4} m ${PAGE_WIDTH - MARGIN_RIGHT} ${currentY + 4} l S`
    );
    currentY -= 8;
  }

  function drawWrappedLines(lines, options = {}) {
    ensureSpace(lines.length, options.afterGap || 0);
    lines.forEach((line) => drawText(line, options));
    if (options.afterGap) {
      currentY -= options.afterGap;
    }
  }

  currentPage.push('0.6 w');
  drawWrappedLines(['Individual Reading Intervention Plan (IRIP)'], {
    font: 'F2',
    size: TITLE_FONT_SIZE,
    afterGap: 2
  });
  drawWrappedLines(['ARAL Monitor export'], {
    size: SMALL_FONT_SIZE,
    afterGap: SECTION_GAP
  });
  drawWrappedLines(buildWrappedLabel('Learner', learnerName, wrapWidth), { afterGap: 0 });
  drawWrappedLines(buildWrappedLabel('Grade Level', gradeLevel, wrapWidth), { afterGap: 0 });
  drawWrappedLines(buildWrappedLabel('Tutor', tutorName, wrapWidth), { afterGap: 0 });
  drawWrappedLines(buildWrappedLabel('Generated On', getCurrentDateValue(), wrapWidth), {
    afterGap: SECTION_GAP
  });
  drawDivider();

  const completionSummary = `Observed: ${summary.observed}   Partially Observed: ${summary.partial}   Not Observed: ${summary.not}`;
  drawWrappedLines(buildWrappedLabel('Summary', completionSummary, wrapWidth), {
    afterGap: SECTION_GAP
  });

  if (groups.length === 0) {
    drawWrappedLines(['No IRIP checklist rows were saved for this learner yet.']);
  } else {
    for (const group of groups) {
      ensureSpace(2, 0);
      drawWrappedLines([`Week ${group.week}`], {
        font: 'F2',
        size: SECTION_FONT_SIZE,
        afterGap: 2
      });

      group.items.forEach((item, index) => {
        const skillLines = buildWrappedLabel(`Skill ${index + 1}`, item.skill || '-', detailWrapWidth);
        const statusLines = buildWrappedLabel('Status', STATUS_LABELS[item.status] || 'Not Set', detailWrapWidth);
        const noteLines = buildWrappedLabel('Notes', item.notes || '-', detailWrapWidth);
        const blockLines = [...skillLines, ...statusLines, ...noteLines, ''];

        drawWrappedLines(blockLines, { afterGap: 0 });
      });

      currentY -= 2;
    }
  }

  if (currentPage.length > 0) {
    flushPage();
  }

  return createPdfBuffer(pageContents);
}
