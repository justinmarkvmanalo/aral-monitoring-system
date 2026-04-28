const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const PAGE_MARGIN_X = 28;
const PAGE_MARGIN_TOP = 24;
const PAGE_MARGIN_BOTTOM = 22;
const HEADER_TITLE_FONT = 14;
const HEADER_TEXT_FONT = 8.5;
const TABLE_HEADER_FONT = 8;
const TABLE_TEXT_FONT = 7.2;
const TABLE_NOTE_FONT = 7;
const CELL_LINE_HEIGHT = 8.6;
const NOTE_LINE_HEIGHT = 8.2;
const CELL_PADDING_X = 6;
const CELL_PADDING_Y = 4;
const HEADER_BLOCK_HEIGHT = 86;
const TABLE_HEADER_HEIGHT = 24;
const LEGEND_BLOCK_HEIGHT = 72;

const TABLE_COLUMN_RATIOS = [1032, 7466, 1727, 3723];
const STATUS_LABELS = {
  observed: 'observed',
  partial: 'partial',
  not: 'not'
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

function rgb(value) {
  return (value / 255).toFixed(3);
}

function estimateTextWidth(text, fontSize, weight = 'regular') {
  const normalized = normalizePdfText(text);
  let widthUnits = 0;

  for (const char of normalized) {
    if (char === ' ') {
      widthUnits += 0.28;
    } else if ('ilI.,:;!|'.includes(char)) {
      widthUnits += 0.22;
    } else if ('MW@%#&'.includes(char)) {
      widthUnits += 0.9;
    } else if ('()[]{}"\'`'.includes(char)) {
      widthUnits += 0.32;
    } else {
      widthUnits += 0.52;
    }
  }

  return widthUnits * fontSize * (weight === 'bold' ? 1.02 : 1);
}

function splitLongWord(word, maxWidth, fontSize, weight) {
  const parts = [];
  let current = '';

  for (const char of word) {
    const candidate = current + char;
    if (current && estimateTextWidth(candidate, fontSize, weight) > maxWidth) {
      parts.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function wrapText(text, maxWidth, fontSize, weight = 'regular') {
  const paragraphs = normalizePdfText(text).split(/\r?\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/).flatMap((word) => {
      if (estimateTextWidth(word, fontSize, weight) <= maxWidth) {
        return [word];
      }

      return splitLongWord(word, maxWidth, fontSize, weight);
    });

    let current = '';

    for (const word of words) {
      if (!current) {
        current = word;
        continue;
      }

      const candidate = `${current} ${word}`;
      if (estimateTextWidth(candidate, fontSize, weight) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [''];
}

function groupRowsByWeek(rows) {
  const groups = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
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

class PdfPageBuilder {
  constructor() {
    this.commands = ['0 G', '0 g', '0.7 w'];
  }

  toPdfY(topY) {
    return PAGE_HEIGHT - topY;
  }

  setStrokeColor(red, green, blue) {
    this.commands.push(`${rgb(red)} ${rgb(green)} ${rgb(blue)} RG`);
  }

  setFillColor(red, green, blue) {
    this.commands.push(`${rgb(red)} ${rgb(green)} ${rgb(blue)} rg`);
  }

  setLineWidth(width) {
    this.commands.push(`${width.toFixed(2)} w`);
  }

  drawRect(x, y, width, height, { stroke = true, fill = false, fillColor = null, strokeColor = null, lineWidth = 0.7 } = {}) {
    if (fillColor) {
      this.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    }
    if (strokeColor) {
      this.setStrokeColor(strokeColor[0], strokeColor[1], strokeColor[2]);
    }
    this.setLineWidth(lineWidth);

    const pdfY = this.toPdfY(y + height);
    this.commands.push(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);

    this.setStrokeColor(0, 0, 0);
    this.setFillColor(0, 0, 0);
    this.setLineWidth(0.7);
  }

  drawLine(x1, y1, x2, y2, { color = [0, 0, 0], lineWidth = 0.7 } = {}) {
    this.setStrokeColor(color[0], color[1], color[2]);
    this.setLineWidth(lineWidth);
    this.commands.push(
      `${x1.toFixed(2)} ${this.toPdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${this.toPdfY(y2).toFixed(2)} l S`
    );
    this.setStrokeColor(0, 0, 0);
    this.setLineWidth(0.7);
  }

  drawText(text, x, y, { font = 'F1', fontSize = TABLE_TEXT_FONT, align = 'left', width = 0, color = [0, 0, 0] } = {}) {
    const normalized = normalizePdfText(text);
    const textWidth = estimateTextWidth(normalized, fontSize, font === 'F2' ? 'bold' : 'regular');
    let drawX = x;

    if (align === 'center' && width > 0) {
      drawX = x + Math.max(0, (width - textWidth) / 2);
    } else if (align === 'right' && width > 0) {
      drawX = x + Math.max(0, width - textWidth);
    }

    this.setFillColor(color[0], color[1], color[2]);
    this.commands.push(
      `BT /${font} ${fontSize.toFixed(2)} Tf 1 0 0 1 ${drawX.toFixed(2)} ${(this.toPdfY(y) - fontSize).toFixed(2)} Tm (${escapePdfText(normalized)}) Tj ET`
    );
    this.setFillColor(0, 0, 0);
  }

  drawTextBlock(lines, x, y, { font = 'F1', fontSize = TABLE_TEXT_FONT, lineHeight = CELL_LINE_HEIGHT, align = 'left', width = 0, color = [0, 0, 0] } = {}) {
    lines.forEach((line, index) => {
      this.drawText(line, x, y + index * lineHeight, { font, fontSize, align, width, color });
    });
  }

  drawStatusSymbol(status, x, y, width, height) {
    const centerX = x + width / 2;
    const centerY = y + height / 2 + 1;

    if (status === STATUS_LABELS.observed) {
      this.drawLine(centerX - 8, centerY + 1, centerX - 2, centerY + 7, { lineWidth: 1.3 });
      this.drawLine(centerX - 2, centerY + 7, centerX + 8, centerY - 6, { lineWidth: 1.3 });
      return;
    }

    if (status === STATUS_LABELS.partial) {
      const radiusX = 6.5;
      const radiusY = 5.5;
      const segments = 16;
      this.setStrokeColor(0, 0, 0);
      this.setLineWidth(1.1);

      for (let index = 0; index < segments; index += 1) {
        const startAngle = (Math.PI * 2 * index) / segments;
        const endAngle = (Math.PI * 2 * (index + 1)) / segments;
        const x1 = centerX + Math.cos(startAngle) * radiusX;
        const y1 = centerY + Math.sin(startAngle) * radiusY;
        const x2 = centerX + Math.cos(endAngle) * radiusX;
        const y2 = centerY + Math.sin(endAngle) * radiusY;
        this.commands.push(
          `${x1.toFixed(2)} ${this.toPdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${this.toPdfY(y2).toFixed(2)} l S`
        );
      }

      this.setStrokeColor(0, 0, 0);
      this.setLineWidth(0.7);
      return;
    }

    if (status === STATUS_LABELS.not) {
      this.drawLine(centerX - 6, centerY - 6, centerX + 6, centerY + 6, { lineWidth: 1.3 });
      this.drawLine(centerX - 6, centerY + 6, centerX + 6, centerY - 6, { lineWidth: 1.3 });
    }
  }

  finish() {
    return this.commands.join('\n');
  }
}

function getColumnWidths(tableWidth) {
  const ratioTotal = TABLE_COLUMN_RATIOS.reduce((sum, value) => sum + value, 0);
  return TABLE_COLUMN_RATIOS.map((value) => (tableWidth * value) / ratioTotal);
}

function buildLayoutGroups(rows, noteColumnWidth, skillColumnWidth) {
  return groupRowsByWeek(rows).map((group) => {
    const items = group.items.map((item) => {
      const skillLines = wrapText(item.skill || '', skillColumnWidth - CELL_PADDING_X * 2, TABLE_TEXT_FONT);
      const rowHeight = Math.max(18, skillLines.length * CELL_LINE_HEIGHT + CELL_PADDING_Y * 2);

      return {
        ...item,
        skillLines,
        rowHeight
      };
    });

    const noteText = items
      .map((item) => item.notes)
      .filter(Boolean)
      .join('\n');
    const noteLines = noteText
      ? wrapText(noteText, noteColumnWidth - CELL_PADDING_X * 2, TABLE_NOTE_FONT)
      : [];

    const baseHeight = items.reduce((sum, item) => sum + item.rowHeight, 0);
    const noteHeight = noteLines.length > 0
      ? Math.max(18, noteLines.length * NOTE_LINE_HEIGHT + CELL_PADDING_Y * 2)
      : 18;

    if (noteHeight > baseHeight && items.length > 0) {
      items[items.length - 1].rowHeight += noteHeight - baseHeight;
    }

    return {
      week: group.week,
      noteLines,
      items,
      totalHeight: items.reduce((sum, item) => sum + item.rowHeight, 0)
    };
  });
}

function drawHeader(page, data) {
  const fullWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const nameLabel = "Learner's Name:";
  const gradeLabel = 'Grade Level:';
  const tutorLabel = "Tutor's Name:";

  page.drawText('ANNEX C', PAGE_MARGIN_X, PAGE_MARGIN_TOP, {
    font: 'F2',
    fontSize: 10.5,
    align: 'center',
    width: fullWidth
  });
  page.drawText('Individual Reading Intervention Plan (IRIP) Checklist', PAGE_MARGIN_X, PAGE_MARGIN_TOP + 18, {
    font: 'F2',
    fontSize: HEADER_TITLE_FONT,
    align: 'center',
    width: fullWidth
  });

  const infoY = PAGE_MARGIN_TOP + 44;
  const nameLabelWidth = estimateTextWidth(nameLabel, HEADER_TEXT_FONT, 'bold');
  const gradeLabelWidth = estimateTextWidth(gradeLabel, HEADER_TEXT_FONT, 'bold');
  const nameFieldWidth = fullWidth * 0.58;
  const gradeFieldWidth = fullWidth * 0.2;
  const gradeBlockWidth = gradeLabelWidth + 8 + gradeFieldWidth;
  const gradeBlockX = PAGE_MARGIN_X + fullWidth - gradeBlockWidth;
  const nameFieldX = PAGE_MARGIN_X + nameLabelWidth + 6;
  const nameLineEnd = gradeBlockX - 18;

  page.drawText(nameLabel, PAGE_MARGIN_X, infoY, {
    font: 'F2',
    fontSize: HEADER_TEXT_FONT
  });
  page.drawText(data.learnerName || '', nameFieldX + 2, infoY, {
    fontSize: HEADER_TEXT_FONT
  });
  page.drawLine(nameFieldX, infoY + 11, nameLineEnd, infoY + 11, { lineWidth: 0.8 });

  page.drawText(gradeLabel, gradeBlockX, infoY, {
    font: 'F2',
    fontSize: HEADER_TEXT_FONT
  });
  const gradeFieldX = gradeBlockX + gradeLabelWidth + 8;
  page.drawText(data.gradeLevel || '', gradeFieldX + 2, infoY, {
    fontSize: HEADER_TEXT_FONT
  });
  page.drawLine(gradeFieldX, infoY + 11, PAGE_MARGIN_X + fullWidth, infoY + 11, { lineWidth: 0.8 });

  const tutorY = infoY + 22;
  const tutorLabelWidth = estimateTextWidth(tutorLabel, HEADER_TEXT_FONT, 'bold');
  const tutorFieldX = PAGE_MARGIN_X + tutorLabelWidth + 6;
  page.drawText(tutorLabel, PAGE_MARGIN_X, tutorY, {
    font: 'F2',
    fontSize: HEADER_TEXT_FONT
  });
  page.drawText(data.tutorName || '', tutorFieldX + 2, tutorY, {
    fontSize: HEADER_TEXT_FONT
  });
  page.drawLine(tutorFieldX, tutorY + 11, PAGE_MARGIN_X + fullWidth, tutorY + 11, { lineWidth: 0.8 });
}

function drawTableHeader(page, x, y, columnWidths) {
  const labels = ['WEEK', 'READING SUBSKILL WEEKLY', 'STATUS', 'TUTOR NOTES/ OBSERVATIONS'];
  let cursorX = x;

  labels.forEach((label, index) => {
    const width = columnWidths[index];
    page.drawRect(cursorX, y, width, TABLE_HEADER_HEIGHT, {
      fill: true,
      stroke: true,
      fillColor: [242, 242, 242],
      lineWidth: 0.8
    });
    page.drawText(label, cursorX + 2, y + 7, {
      font: 'F2',
      fontSize: TABLE_HEADER_FONT,
      align: 'center',
      width: width - 4
    });
    cursorX += width;
  });
}

function drawGroup(page, group, x, y, columnWidths) {
  const [weekWidth, skillWidth, statusWidth, noteWidth] = columnWidths;
  const weekX = x;
  const skillX = weekX + weekWidth;
  const statusX = skillX + skillWidth;
  const noteX = statusX + statusWidth;

  page.drawRect(weekX, y, weekWidth, group.totalHeight, { lineWidth: 0.8 });
  page.drawRect(noteX, y, noteWidth, group.totalHeight, { lineWidth: 0.8 });

  page.drawText(String(group.week), weekX + 2, y + group.totalHeight / 2 - 6, {
    font: 'F2',
    fontSize: 9,
    align: 'center',
    width: weekWidth - 4
  });

  if (group.noteLines.length > 0) {
    page.drawTextBlock(group.noteLines, noteX + CELL_PADDING_X, y + CELL_PADDING_Y + 1, {
      fontSize: TABLE_NOTE_FONT,
      lineHeight: NOTE_LINE_HEIGHT,
      width: noteWidth - CELL_PADDING_X * 2
    });
  }

  let rowY = y;
  group.items.forEach((item) => {
    page.drawRect(skillX, rowY, skillWidth, item.rowHeight, { lineWidth: 0.8 });
    page.drawRect(statusX, rowY, statusWidth, item.rowHeight, { lineWidth: 0.8 });

    page.drawTextBlock(item.skillLines, skillX + CELL_PADDING_X, rowY + CELL_PADDING_Y + 1, {
      fontSize: TABLE_TEXT_FONT,
      lineHeight: CELL_LINE_HEIGHT,
      width: skillWidth - CELL_PADDING_X * 2
    });

    page.drawStatusSymbol(item.status, statusX, rowY, statusWidth, item.rowHeight);
    rowY += item.rowHeight;
  });
}

function drawLegend(page, startY, x, width) {
  const symbolColumnX = x + 6;
  const labelX = x + 30;
  const descriptionX = x + 168;
  const rowGap = 16;

  page.drawText('Legend:', x, startY, {
    font: 'F2',
    fontSize: 8.5
  });
  page.drawText('Description', descriptionX, startY, {
    font: 'F2',
    fontSize: 8.5
  });
  page.drawLine(x, startY + 12, x + width, startY + 12, { lineWidth: 0.8 });

  const rows = [
    {
      key: STATUS_LABELS.observed,
      label: 'Observed',
      description: 'Ready to proceed to the next topic'
    },
    {
      key: STATUS_LABELS.partial,
      label: 'Partially Observed',
      description: 'Needs additional practice on the current topic target'
    },
    {
      key: STATUS_LABELS.not,
      label: 'Not Observed',
      description: 'Reteach the current topic target'
    }
  ];

  rows.forEach((row, index) => {
    const rowY = startY + 20 + index * rowGap;
    page.drawStatusSymbol(row.key, symbolColumnX - 3, rowY - 6, 18, 14);
    page.drawText(row.label, labelX, rowY, { fontSize: 8.1 });
    page.drawText(row.description, descriptionX, rowY, { fontSize: 8.1 });
  });
}

export async function generateIripPdfBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const tableWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const columnWidths = getColumnWidths(tableWidth);
  const layoutGroups = buildLayoutGroups(rows, columnWidths[3], columnWidths[1]);
  const pages = [];
  let page = new PdfPageBuilder();
  let currentY = PAGE_MARGIN_TOP + HEADER_BLOCK_HEIGHT;
  const availableBottom = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM;

  drawHeader(page, { learnerName, gradeLevel, tutorName });
  drawTableHeader(page, PAGE_MARGIN_X, currentY, columnWidths);
  currentY += TABLE_HEADER_HEIGHT;

  layoutGroups.forEach((group) => {
    if (currentY + group.totalHeight + LEGEND_BLOCK_HEIGHT > availableBottom) {
      pages.push(page.finish());
      page = new PdfPageBuilder();
      drawHeader(page, { learnerName, gradeLevel, tutorName });
      currentY = PAGE_MARGIN_TOP + HEADER_BLOCK_HEIGHT;
      drawTableHeader(page, PAGE_MARGIN_X, currentY, columnWidths);
      currentY += TABLE_HEADER_HEIGHT;
    }

    drawGroup(page, group, PAGE_MARGIN_X, currentY, columnWidths);
    currentY += group.totalHeight;
  });

  if (currentY + LEGEND_BLOCK_HEIGHT > availableBottom) {
    pages.push(page.finish());
    page = new PdfPageBuilder();
    drawHeader(page, { learnerName, gradeLevel, tutorName });
    currentY = PAGE_MARGIN_TOP + HEADER_BLOCK_HEIGHT;
  }

  drawLegend(page, currentY + 12, PAGE_MARGIN_X, tableWidth);
  pages.push(page.finish());

  return createPdfBuffer(pages);
}
