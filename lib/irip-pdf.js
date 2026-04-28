import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';
import sharp from 'sharp';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const PAGE_MARGIN_X = 28;
const FORM_HEADER_TOP = 98;
const FORM_HEADER_HEIGHT = 58;
const TABLE_TOP = FORM_HEADER_TOP + FORM_HEADER_HEIGHT + 8;
const TABLE_HEADER_HEIGHT = 24;
const FOOTER_TOP = 532;
const LEGEND_BLOCK_HEIGHT = 72;
const HEADER_TEXT_FONT = 8.5;
const HEADER_TITLE_FONT = 14;
const TABLE_HEADER_FONT = 8;
const TABLE_TEXT_FONT = 7.2;
const TABLE_NOTE_FONT = 7;
const CELL_LINE_HEIGHT = 8.6;
const NOTE_LINE_HEIGHT = 8.2;
const CELL_PADDING_X = 6;
const CELL_PADDING_Y = 4;
const TABLE_COLUMN_RATIOS = [1032, 7466, 1727, 3723];

const STATUS_LABELS = {
  observed: 'observed',
  partial: 'partial',
  not: 'not'
};

const TEMPLATE_IMAGES = {
  headerSeal: 'word/media/2.jpeg',
  agdangan: 'word/media/7.jpeg',
  matatag: 'word/media/10.png',
  schoolSeal: 'word/media/23.png',
  serbisyo: 'word/media/26.png',
  quezon: 'word/media/29.png',
  facebook: 'word/media/32.png',
  website: 'word/media/35.png',
  email: 'word/media/38.png'
};

const PAGE_IMAGE_PLACEMENTS = [
  { key: 'headerSeal', x: PAGE_WIDTH / 2 - 15, y: 2, width: 30, height: 30 },
  { key: 'schoolSeal', x: 34, y: FOOTER_TOP + 6, width: 30, height: 30 },
  { key: 'facebook', x: 74, y: FOOTER_TOP + 28, width: 9, height: 9 },
  { key: 'quezon', x: 195, y: FOOTER_TOP + 7, width: 86, height: 28 },
  { key: 'website', x: 245, y: FOOTER_TOP + 28, width: 9, height: 9 },
  { key: 'agdangan', x: 332, y: FOOTER_TOP + 2, width: 138, height: 46 },
  { key: 'serbisyo', x: 312, y: FOOTER_TOP + 18, width: 176, height: 42 },
  { key: 'matatag', x: 620, y: FOOTER_TOP + 9, width: 120, height: 30 },
  { key: 'email', x: 700, y: FOOTER_TOP + 29, width: 10, height: 10 }
];

let templateAssetsPromise = null;

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

function createStreamObject(content) {
  return Buffer.from(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`, 'utf8');
}

function createBinaryStreamObject(header, binaryBuffer) {
  return Buffer.concat([
    Buffer.from(`${header}\nstream\n`, 'utf8'),
    binaryBuffer,
    Buffer.from('\nendstream', 'utf8')
  ]);
}

async function loadTemplateAssets() {
  if (!templateAssetsPromise) {
    templateAssetsPromise = (async () => {
      const templateBuffer = await fs.readFile(TEMPLATE_PATH);
      const zip = new AdmZip(templateBuffer);
      const assets = {};

      for (const [key, entryPath] of Object.entries(TEMPLATE_IMAGES)) {
        const entry = zip.getEntry(entryPath);
        if (!entry) {
          continue;
        }

        const jpegBuffer = await sharp(entry.getData())
          .flatten({ background: '#ffffff' })
          .jpeg({
            quality: 92,
            mozjpeg: true,
            chromaSubsampling: '4:4:4'
          })
          .toBuffer();

        const metadata = await sharp(jpegBuffer).metadata();
        assets[key] = {
          buffer: jpegBuffer,
          pixelWidth: metadata.width || 1,
          pixelHeight: metadata.height || 1
        };
      }

      return assets;
    })();
  }

  return templateAssetsPromise;
}

class PdfPageBuilder {
  constructor(imageNames) {
    this.imageNames = imageNames;
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
    this.commands.push(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : stroke ? 'S' : 'n'}`);
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
    const textWidth = estimateTextWidth(normalized, fontSize, font === 'F2' || font === 'F3' ? 'bold' : 'regular');
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

  drawImage(key, x, y, width, height) {
    const imageName = this.imageNames[key];
    if (!imageName) {
      return;
    }

    const pdfY = PAGE_HEIGHT - y - height;
    this.commands.push(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${pdfY.toFixed(2)} cm /${imageName} Do Q`);
  }

  finish() {
    return this.commands.join('\n');
  }
}

function buildPageLayout(groups) {
  const pages = [];
  let currentPage = [];
  let currentY = TABLE_TOP + TABLE_HEADER_HEIGHT;
  const contentBottom = FOOTER_TOP - 8;

  for (const group of groups) {
    if (currentY + group.totalHeight + LEGEND_BLOCK_HEIGHT > contentBottom && currentPage.length > 0) {
      pages.push({
        groups: currentPage,
        includeLegend: false
      });
      currentPage = [];
      currentY = TABLE_TOP + TABLE_HEADER_HEIGHT;
    }

    currentPage.push(group);
    currentY += group.totalHeight;
  }

  if (currentY + LEGEND_BLOCK_HEIGHT > contentBottom && currentPage.length > 0) {
    pages.push({
      groups: currentPage,
      includeLegend: false
    });
    currentPage = [];
  }

  pages.push({
    groups: currentPage,
    includeLegend: true
  });

  return pages;
}

function drawBrandHeader(page) {
  const centerX = PAGE_WIDTH / 2;

  page.drawImage('headerSeal', centerX - 15, 2, 30, 30);
  page.drawText('Republic of the Philippines', PAGE_MARGIN_X, 24, {
    font: 'F3',
    fontSize: 11,
    align: 'center',
    width: PAGE_WIDTH - PAGE_MARGIN_X * 2
  });
  page.drawText('Department of Education', PAGE_MARGIN_X, 36, {
    font: 'F3',
    fontSize: 15.5,
    align: 'center',
    width: PAGE_WIDTH - PAGE_MARGIN_X * 2
  });
  page.drawText('Region IV-A', PAGE_MARGIN_X, 51, {
    font: 'F2',
    fontSize: 10,
    align: 'center',
    width: PAGE_WIDTH - PAGE_MARGIN_X * 2
  });
  page.drawText('SCHOOLS DIVISION OF QUEZON PROVINCE', PAGE_MARGIN_X, 61, {
    font: 'F2',
    fontSize: 10.2,
    align: 'center',
    width: PAGE_WIDTH - PAGE_MARGIN_X * 2
  });
  page.drawText('AGDANGAN CENTRAL ELEMENTARY SCHOOL', PAGE_MARGIN_X, 72, {
    font: 'F2',
    fontSize: 10.2,
    align: 'center',
    width: PAGE_WIDTH - PAGE_MARGIN_X * 2
  });
  page.drawLine(PAGE_MARGIN_X, 81, PAGE_WIDTH - PAGE_MARGIN_X, 81, { lineWidth: 1.2 });
  page.drawText('Poblacion I, Agdangan, Quezon', PAGE_MARGIN_X, 83, {
    font: 'F2',
    fontSize: 9.2,
    align: 'center',
    width: PAGE_WIDTH - PAGE_MARGIN_X * 2,
    color: [0, 51, 0]
  });
}

function drawFormHeader(page, { learnerName, gradeLevel, tutorName }) {
  const fullWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const centerX = PAGE_WIDTH / 2;
  const nameLabel = "Learner's Name:";
  const gradeLabel = 'Grade Level:';
  const tutorLabel = "Tutor's Name:";
  const infoY = 124;
  const tutorY = 143;

  page.drawText('ANNEX C', centerX - fullWidth / 2, FORM_HEADER_TOP, {
    font: 'F2',
    fontSize: 10.5,
    align: 'center',
    width: fullWidth
  });
  page.drawText('Individual Reading Intervention Plan (IRIP) Checklist', centerX - fullWidth / 2, FORM_HEADER_TOP + 16, {
    font: 'F2',
    fontSize: HEADER_TITLE_FONT,
    align: 'center',
    width: fullWidth
  });

  const nameLabelWidth = estimateTextWidth(nameLabel, HEADER_TEXT_FONT, 'bold');
  const gradeLabelWidth = estimateTextWidth(gradeLabel, HEADER_TEXT_FONT, 'bold');
  const gradeFieldWidth = fullWidth * 0.2;
  const gradeBlockWidth = gradeLabelWidth + 8 + gradeFieldWidth;
  const gradeBlockX = PAGE_MARGIN_X + fullWidth - gradeBlockWidth;
  const nameFieldX = PAGE_MARGIN_X + nameLabelWidth + 8;
  const nameLineEnd = gradeBlockX - 16;
  const gradeFieldX = gradeBlockX + gradeLabelWidth + 8;
  const tutorLabelWidth = estimateTextWidth(tutorLabel, HEADER_TEXT_FONT, 'bold');
  const tutorFieldX = PAGE_MARGIN_X + tutorLabelWidth + 8;

  page.drawText(nameLabel, PAGE_MARGIN_X, infoY, {
    font: 'F2',
    fontSize: HEADER_TEXT_FONT
  });
  page.drawText(learnerName || '', nameFieldX + 2, infoY, {
    fontSize: HEADER_TEXT_FONT
  });
  page.drawLine(nameFieldX, infoY + 11.5, nameLineEnd, infoY + 11.5, { lineWidth: 0.8 });

  page.drawText(gradeLabel, gradeBlockX, infoY, {
    font: 'F2',
    fontSize: HEADER_TEXT_FONT
  });
  page.drawText(gradeLevel || '', gradeFieldX + 2, infoY, {
    fontSize: HEADER_TEXT_FONT
  });
  page.drawLine(gradeFieldX, infoY + 11.5, PAGE_MARGIN_X + fullWidth, infoY + 11.5, { lineWidth: 0.8 });

  page.drawText(tutorLabel, PAGE_MARGIN_X, tutorY, {
    font: 'F2',
    fontSize: HEADER_TEXT_FONT
  });
  page.drawText(tutorName || '', tutorFieldX + 2, tutorY, {
    fontSize: HEADER_TEXT_FONT
  });
  page.drawLine(tutorFieldX, tutorY + 11.5, PAGE_MARGIN_X + fullWidth, tutorY + 11.5, { lineWidth: 0.8 });
}

function drawTableHeader(page, columnWidths) {
  const labels = ['WEEK', 'READING SUBSKILL WEEKLY', 'STATUS', 'TUTOR NOTES/ OBSERVATIONS'];
  let cursorX = PAGE_MARGIN_X;

  labels.forEach((label, index) => {
    const width = columnWidths[index];
    page.drawRect(cursorX, TABLE_TOP, width, TABLE_HEADER_HEIGHT, {
      fill: true,
      stroke: true,
      fillColor: [242, 242, 242],
      lineWidth: 0.8
    });
    page.drawText(label, cursorX + 2, TABLE_TOP + 6.5, {
      font: 'F2',
      fontSize: TABLE_HEADER_FONT,
      align: 'center',
      width: width - 4
    });
    cursorX += width;
  });
}

function drawGroup(page, group, startY, columnWidths) {
  const [weekWidth, skillWidth, statusWidth, noteWidth] = columnWidths;
  const weekX = PAGE_MARGIN_X;
  const skillX = weekX + weekWidth;
  const statusX = skillX + skillWidth;
  const noteX = statusX + statusWidth;

  page.drawRect(weekX, startY, weekWidth, group.totalHeight, { lineWidth: 0.8 });
  page.drawRect(noteX, startY, noteWidth, group.totalHeight, { lineWidth: 0.8 });
  page.drawText(String(group.week), weekX + 2, startY + group.totalHeight / 2 - 6, {
    font: 'F2',
    fontSize: 9,
    align: 'center',
    width: weekWidth - 4
  });

  if (group.noteLines.length > 0) {
    page.drawTextBlock(group.noteLines, noteX + CELL_PADDING_X, startY + CELL_PADDING_Y + 1, {
      fontSize: TABLE_NOTE_FONT,
      lineHeight: NOTE_LINE_HEIGHT
    });
  }

  let rowY = startY;
  group.items.forEach((item) => {
    page.drawRect(skillX, rowY, skillWidth, item.rowHeight, { lineWidth: 0.8 });
    page.drawRect(statusX, rowY, statusWidth, item.rowHeight, { lineWidth: 0.8 });
    page.drawTextBlock(item.skillLines, skillX + CELL_PADDING_X, rowY + CELL_PADDING_Y + 1, {
      fontSize: TABLE_TEXT_FONT,
      lineHeight: CELL_LINE_HEIGHT
    });
    page.drawStatusSymbol(item.status, statusX, rowY, statusWidth, item.rowHeight);
    rowY += item.rowHeight;
  });
}

function drawLegend(page, startY) {
  const x = PAGE_MARGIN_X;
  const width = PAGE_WIDTH - PAGE_MARGIN_X * 2;
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
    page.drawStatusSymbol(row.key, x + 3, rowY - 6, 18, 14);
    page.drawText(row.label, labelX, rowY, { fontSize: 8.1 });
    page.drawText(row.description, descriptionX, rowY, { fontSize: 8.1 });
  });
}

function drawFooter(page) {
  page.drawLine(PAGE_MARGIN_X, FOOTER_TOP, PAGE_WIDTH - PAGE_MARGIN_X, FOOTER_TOP, { lineWidth: 1.2 });

  PAGE_IMAGE_PLACEMENTS.forEach((image) => {
    page.drawImage(image.key, image.x, image.y, image.width, image.height);
  });

  page.drawText('DepEd Tayo Agdangan CES', 87, FOOTER_TOP + 23, {
    font: 'F2',
    fontSize: 6.8
  });
  page.drawText('https://agdangances.weebly.com', 258, FOOTER_TOP + 23, {
    fontSize: 6.4
  });
  page.drawText('Lead the Race.... ACES', PAGE_WIDTH / 2 - 70, FOOTER_TOP + 6, {
    font: 'F2',
    fontSize: 8.1,
    color: [68, 114, 196]
  });
  page.drawText('Address: Brgy. Poblacion I, Agdangan, Quezon', 660, FOOTER_TOP + 4, {
    fontSize: 5.8
  });
  page.drawText('Contact Numbers: 09104490517, (042) 785-0308', 660, FOOTER_TOP + 12, {
    fontSize: 5.8
  });
  page.drawText('108944@deped.gov.ph', 714, FOOTER_TOP + 23, {
    fontSize: 6.4
  });
}

function createPdfBuffer(pageContents, imageAssets) {
  const objects = [];
  const pageObjectNumbers = [];
  const contentObjectNumbers = [];
  let nextObjectNumber = 3;

  pageContents.forEach(() => {
    pageObjectNumbers.push(nextObjectNumber);
    contentObjectNumbers.push(nextObjectNumber + 1);
    nextObjectNumber += 2;
  });

  const fontHelvetica = nextObjectNumber;
  const fontHelveticaBold = nextObjectNumber + 1;
  const fontTimesBold = nextObjectNumber + 2;
  nextObjectNumber += 3;

  const imageAliases = {};
  const imageObjectNumbers = {};
  Object.keys(imageAssets).forEach((key, index) => {
    imageAliases[key] = `Im${index + 1}`;
    imageObjectNumbers[key] = nextObjectNumber;
    nextObjectNumber += 1;
  });

  objects[1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'utf8');
  objects[2] = Buffer.from(
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageContents.length} >>`,
    'utf8'
  );

  const xObjects = Object.keys(imageAssets)
    .map((key) => `/${imageAliases[key]} ${imageObjectNumbers[key]} 0 R`)
    .join(' ');

  pageContents.forEach((content, index) => {
    const pageObject = pageObjectNumbers[index];
    const contentObject = contentObjectNumbers[index];

    objects[pageObject] = Buffer.from(
      '<< /Type /Page /Parent 2 0 R ' +
      `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontHelvetica} 0 R /F2 ${fontHelveticaBold} 0 R /F3 ${fontTimesBold} 0 R >> ` +
      `/XObject << ${xObjects} >> >> ` +
      `/Contents ${contentObject} 0 R >>`,
      'utf8'
    );
    objects[contentObject] = createStreamObject(content);
  });

  objects[fontHelvetica] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', 'utf8');
  objects[fontHelveticaBold] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>', 'utf8');
  objects[fontTimesBold] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>', 'utf8');

  Object.entries(imageAssets).forEach(([key, asset]) => {
    objects[imageObjectNumbers[key]] = createBinaryStreamObject(
      `<< /Type /XObject /Subtype /Image /Width ${asset.pixelWidth} /Height ${asset.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${asset.buffer.length} >>`,
      asset.buffer
    );
  });

  const chunks = [Buffer.from('%PDF-1.4\n', 'utf8')];
  const offsets = ['0000000000 65535 f \n'];
  let offset = chunks[0].length;

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    const header = Buffer.from(`${objectNumber} 0 obj\n`, 'utf8');
    const footer = Buffer.from('\nendobj\n', 'utf8');
    chunks.push(header, objects[objectNumber], footer);
    offsets.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
    offset += header.length + objects[objectNumber].length + footer.length;
  }

  const xrefOffset = offset;
  chunks.push(Buffer.from(`xref\n0 ${objects.length}\n`, 'utf8'));
  chunks.push(Buffer.from(offsets.join(''), 'utf8'));
  chunks.push(Buffer.from(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`, 'utf8'));

  return {
    buffer: Buffer.concat(chunks),
    imageAliases
  };
}

export async function generateIripPdfBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const tableWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const columnWidths = getColumnWidths(tableWidth);
  const layoutGroups = buildLayoutGroups(rows, columnWidths[3], columnWidths[1]);
  const pageLayout = buildPageLayout(layoutGroups);
  const assets = await loadTemplateAssets();
  const imageAliases = Object.fromEntries(Object.keys(assets).map((key, index) => [key, `Im${index + 1}`]));
  const pageContents = [];

  pageLayout.forEach((pageLayoutItem) => {
    const page = new PdfPageBuilder(imageAliases);
    drawBrandHeader(page);
    drawFormHeader(page, { learnerName, gradeLevel, tutorName });
    drawTableHeader(page, columnWidths);

    let currentY = TABLE_TOP + TABLE_HEADER_HEIGHT;
    pageLayoutItem.groups.forEach((group) => {
      drawGroup(page, group, currentY, columnWidths);
      currentY += group.totalHeight;
    });

    if (pageLayoutItem.includeLegend) {
      drawLegend(page, currentY + 12);
    }

    drawFooter(page);
    pageContents.push(page.finish());
  });

  return createPdfBuffer(pageContents, assets).buffer;
}
