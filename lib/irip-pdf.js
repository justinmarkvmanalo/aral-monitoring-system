import fs from 'fs/promises';
import path from 'path';

import AdmZip from 'adm-zip';
import sharp from 'sharp';

const TEMPLATE_PATH = path.join(process.cwd(), 'IRIP-ARAL-Program.docx');

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const PAGE_MARGIN_X = 28;
const PAGE_MARGIN_BOTTOM = 14;
const BRAND_HEADER_BOTTOM = 92;
const FORM_HEADER_TOP = 98;
const FORM_HEADER_HEIGHT = 58;
const TABLE_TOP = FORM_HEADER_TOP + FORM_HEADER_HEIGHT + 8;
const TABLE_HEADER_HEIGHT = 24;
const FOOTER_TOP = 532;
const FOOTER_HEIGHT = PAGE_HEIGHT - FOOTER_TOP;
const LEGEND_BLOCK_HEIGHT = 72;
const CELL_PADDING_X = 6;
const CELL_PADDING_Y = 4;
const CELL_LINE_HEIGHT = 8.6;
const NOTE_LINE_HEIGHT = 8.2;
const TABLE_TEXT_FONT = 7.2;
const TABLE_NOTE_FONT = 7;
const TABLE_HEADER_FONT = 8;
const HEADER_TEXT_FONT = 8.5;
const TABLE_COLUMN_RATIOS = [1032, 7466, 1727, 3723];
const RENDER_SCALE = 2;
const RENDER_WIDTH = PAGE_WIDTH * RENDER_SCALE;
const RENDER_HEIGHT = PAGE_HEIGHT * RENDER_SCALE;

const STATUS_LABELS = {
  observed: '\u221A',
  partial: '/',
  not: 'X'
};

const TEMPLATE_IMAGES = {
  headerSeal: { entry: 'word/media/2.jpeg', mime: 'image/jpeg' },
  agdangan: { entry: 'word/media/7.jpeg', mime: 'image/jpeg' },
  matatag: { entry: 'word/media/10.png', mime: 'image/png' },
  schoolSeal: { entry: 'word/media/23.png', mime: 'image/png' },
  serbisyo: { entry: 'word/media/26.png', mime: 'image/png' },
  quezon: { entry: 'word/media/29.png', mime: 'image/png' },
  facebook: { entry: 'word/media/32.png', mime: 'image/png' },
  website: { entry: 'word/media/35.png', mime: 'image/png' },
  email: { entry: 'word/media/38.png', mime: 'image/png' }
};

let templateAssetsPromise = null;

function normalizeSvgText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/&nbsp;/g, ' ');
}

function escapeXml(value) {
  return normalizeSvgText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toBaselineY(topY, fontSize) {
  return topY + fontSize * 0.82;
}

function estimateTextWidth(text, fontSize, weight = 'regular') {
  const normalized = normalizeSvgText(text);
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
  const paragraphs = normalizeSvgText(text).split(/\r?\n/);
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

function svgRect(x, y, width, height, options = {}) {
  const {
    fill = 'none',
    stroke = '#000000',
    strokeWidth = 0.8,
    rx = 0,
    opacity = 1
  } = options;

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${rx}" opacity="${opacity}"/>`;
}

function svgLine(x1, y1, x2, y2, options = {}) {
  const { stroke = '#000000', strokeWidth = 0.8 } = options;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function svgImage(href, x, y, width, height, options = {}) {
  if (!href) {
    return '';
  }

  const { opacity = 1 } = options;
  return `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" opacity="${opacity}"/>`;
}

function svgTextElement(text, x, topY, options = {}) {
  const {
    fontSize = 8,
    fontFamily = 'Arial, sans-serif',
    fontWeight = '400',
    fontStyle = 'normal',
    fill = '#000000',
    anchor = 'start',
    letterSpacing = 0
  } = options;

  return (
    `<text x="${x}" y="${toBaselineY(topY, fontSize)}" fill="${fill}" font-size="${fontSize}" ` +
    `font-family="${escapeXml(fontFamily)}" font-weight="${fontWeight}" font-style="${fontStyle}" ` +
    `text-anchor="${anchor}" letter-spacing="${letterSpacing}">${escapeXml(text)}</text>`
  );
}

function svgTextBlock(lines, x, topY, options = {}) {
  const {
    fontSize = 8,
    lineHeight = 10,
    fontFamily = 'Arial, sans-serif',
    fontWeight = '400',
    fontStyle = 'normal',
    fill = '#000000',
    anchor = 'start'
  } = options;

  const normalizedLines = Array.isArray(lines) && lines.length > 0 ? lines : [''];
  const tspans = normalizedLines
    .map((line, index) => {
      const baseline = toBaselineY(topY + index * lineHeight, fontSize);
      return `<tspan x="${x}" y="${baseline}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  return (
    `<text fill="${fill}" font-size="${fontSize}" font-family="${escapeXml(fontFamily)}" ` +
    `font-weight="${fontWeight}" font-style="${fontStyle}" text-anchor="${anchor}">${tspans}</text>`
  );
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

async function loadTemplateAssets() {
  if (!templateAssetsPromise) {
    templateAssetsPromise = (async () => {
      const templateBuffer = await fs.readFile(TEMPLATE_PATH);
      const zip = new AdmZip(templateBuffer);
      const assets = {};

      for (const [key, config] of Object.entries(TEMPLATE_IMAGES)) {
        const entry = zip.getEntry(config.entry);
        if (!entry) {
          continue;
        }

        assets[key] = `data:${config.mime};base64,${entry.getData().toString('base64')}`;
      }

      return assets;
    })();
  }

  return templateAssetsPromise;
}

function buildBrandHeaderSvg(assets) {
  const centerX = PAGE_WIDTH / 2;
  const green = '#003300';

  return [
    svgImage(assets.headerSeal, centerX - 15, 2, 30, 30),
    svgTextElement('Republic of the Philippines', centerX, 24, {
      fontSize: 11,
      fontFamily: "'Old English Text MT','Times New Roman',serif",
      fontWeight: '700',
      anchor: 'middle'
    }),
    svgTextElement('Department of Education', centerX, 36, {
      fontSize: 15.5,
      fontFamily: "'Old English Text MT','Times New Roman',serif",
      fontWeight: '700',
      anchor: 'middle'
    }),
    svgTextElement('Region IV-A', centerX, 51, {
      fontSize: 10,
      fontFamily: "'Trajan Pro','Georgia',serif",
      fontWeight: '700',
      anchor: 'middle'
    }),
    svgTextElement('SCHOOLS DIVISION OF QUEZON PROVINCE', centerX, 61, {
      fontSize: 10.2,
      fontFamily: "'Trajan Pro','Georgia',serif",
      fontWeight: '700',
      anchor: 'middle',
      letterSpacing: 0.4
    }),
    svgTextElement('AGDANGAN CENTRAL ELEMENTARY SCHOOL', centerX, 72, {
      fontSize: 10.2,
      fontFamily: "'Trajan Pro','Georgia',serif",
      fontWeight: '700',
      anchor: 'middle',
      letterSpacing: 0.4
    }),
    svgLine(PAGE_MARGIN_X, 81, PAGE_WIDTH - PAGE_MARGIN_X, 81, { strokeWidth: 1.2 }),
    svgTextElement('Poblacion I, Agdangan, Quezon', centerX, 83, {
      fontSize: 9.2,
      fontFamily: "'Trajan Pro','Arial',sans-serif",
      fontWeight: '700',
      anchor: 'middle',
      fill: green
    }),
    svgRect(PAGE_MARGIN_X - 3, 2, PAGE_WIDTH - PAGE_MARGIN_X * 2 + 6, BRAND_HEADER_BOTTOM - 4, {
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: 0
    })
  ].join('');
}

function buildFormHeaderSvg({ learnerName, gradeLevel, tutorName }) {
  const fullWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const centerX = PAGE_WIDTH / 2;
  const nameLabel = "Learner's Name:";
  const gradeLabel = 'Grade Level:';
  const tutorLabel = "Tutor's Name:";

  const infoY = 124;
  const tutorY = 143;
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

  return [
    svgTextElement('ANNEX C', centerX, FORM_HEADER_TOP, {
      fontSize: 10.5,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700',
      anchor: 'middle'
    }),
    svgTextElement('Individual Reading Intervention Plan (IRIP) Checklist', centerX, FORM_HEADER_TOP + 16, {
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700',
      anchor: 'middle'
    }),
    svgTextElement(nameLabel, PAGE_MARGIN_X, infoY, {
      fontSize: HEADER_TEXT_FONT,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    }),
    svgTextElement(learnerName || '', nameFieldX + 2, infoY, {
      fontSize: HEADER_TEXT_FONT,
      fontFamily: 'Arial, sans-serif'
    }),
    svgLine(nameFieldX, infoY + 11.5, nameLineEnd, infoY + 11.5, { strokeWidth: 0.8 }),
    svgTextElement(gradeLabel, gradeBlockX, infoY, {
      fontSize: HEADER_TEXT_FONT,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    }),
    svgTextElement(gradeLevel || '', gradeFieldX + 2, infoY, {
      fontSize: HEADER_TEXT_FONT,
      fontFamily: 'Arial, sans-serif'
    }),
    svgLine(gradeFieldX, infoY + 11.5, PAGE_MARGIN_X + fullWidth, infoY + 11.5, { strokeWidth: 0.8 }),
    svgTextElement(tutorLabel, PAGE_MARGIN_X, tutorY, {
      fontSize: HEADER_TEXT_FONT,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    }),
    svgTextElement(tutorName || '', tutorFieldX + 2, tutorY, {
      fontSize: HEADER_TEXT_FONT,
      fontFamily: 'Arial, sans-serif'
    }),
    svgLine(tutorFieldX, tutorY + 11.5, PAGE_MARGIN_X + fullWidth, tutorY + 11.5, { strokeWidth: 0.8 })
  ].join('');
}

function buildTableHeaderSvg(columnWidths) {
  const labels = ['WEEK', 'READING SUBSKILL WEEKLY', 'STATUS', 'TUTOR NOTES/ OBSERVATIONS'];
  let cursorX = PAGE_MARGIN_X;

  return labels.map((label, index) => {
    const width = columnWidths[index];
    const output = [
      svgRect(cursorX, TABLE_TOP, width, TABLE_HEADER_HEIGHT, {
        fill: '#f2f2f2',
        stroke: '#000000',
        strokeWidth: 0.8
      }),
      svgTextElement(label, cursorX + width / 2, TABLE_TOP + 6.5, {
        fontSize: TABLE_HEADER_FONT,
        fontFamily: 'Arial, sans-serif',
        fontWeight: '700',
        anchor: 'middle'
      })
    ].join('');
    cursorX += width;
    return output;
  }).join('');
}

function buildGroupSvg(group, startY, columnWidths) {
  const [weekWidth, skillWidth, statusWidth, noteWidth] = columnWidths;
  const weekX = PAGE_MARGIN_X;
  const skillX = weekX + weekWidth;
  const statusX = skillX + skillWidth;
  const noteX = statusX + statusWidth;
  const parts = [
    svgRect(weekX, startY, weekWidth, group.totalHeight, { strokeWidth: 0.8 }),
    svgRect(noteX, startY, noteWidth, group.totalHeight, { strokeWidth: 0.8 }),
    svgTextElement(String(group.week), weekX + weekWidth / 2, startY + group.totalHeight / 2 - 6, {
      fontSize: 9,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700',
      anchor: 'middle'
    })
  ];

  if (group.noteLines.length > 0) {
    parts.push(
      svgTextBlock(group.noteLines, noteX + CELL_PADDING_X, startY + CELL_PADDING_Y + 1, {
        fontSize: TABLE_NOTE_FONT,
        lineHeight: NOTE_LINE_HEIGHT,
        fontFamily: 'Arial, sans-serif'
      })
    );
  }

  let rowY = startY;
  for (const item of group.items) {
    parts.push(svgRect(skillX, rowY, skillWidth, item.rowHeight, { strokeWidth: 0.8 }));
    parts.push(svgRect(statusX, rowY, statusWidth, item.rowHeight, { strokeWidth: 0.8 }));
    parts.push(
      svgTextBlock(item.skillLines, skillX + CELL_PADDING_X, rowY + CELL_PADDING_Y + 1, {
        fontSize: TABLE_TEXT_FONT,
        lineHeight: CELL_LINE_HEIGHT,
        fontFamily: 'Arial, sans-serif'
      })
    );
    parts.push(
      svgTextElement(STATUS_LABELS[item.status] || '', statusX + statusWidth / 2, rowY + item.rowHeight / 2 - 6, {
        fontSize: 11,
        fontFamily: 'Arial, sans-serif',
        fontWeight: '700',
        anchor: 'middle'
      })
    );

    rowY += item.rowHeight;
  }

  return parts.join('');
}

function buildLegendSvg(startY) {
  const x = PAGE_MARGIN_X;
  const width = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const labelX = x + 34;
  const descriptionX = x + 164;
  const rowGap = 16;
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

  return [
    svgTextElement('Legend:', x, startY, {
      fontSize: 8.5,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    }),
    svgTextElement('Description', descriptionX, startY, {
      fontSize: 8.5,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    }),
    svgLine(x, startY + 12, x + width, startY + 12, { strokeWidth: 0.8 }),
    rows.map((row, index) => {
      const rowY = startY + 19 + index * rowGap;
      const symbol = row.key === STATUS_LABELS.partial
        ? [
            `<circle cx="${x + 9}" cy="${rowY + 4}" r="6" fill="none" stroke="#000000" stroke-width="1"/>`,
            svgTextElement(row.key, x + 9, rowY - 2, {
              fontSize: 8.5,
              fontFamily: 'Arial, sans-serif',
              fontWeight: '700',
              anchor: 'middle'
            })
          ].join('')
        : svgTextElement(row.key, x + 9, rowY - 2, {
            fontSize: 9,
            fontFamily: 'Arial, sans-serif',
            fontWeight: '700',
            anchor: 'middle'
          });

      return [
        symbol,
        svgTextElement(row.label, labelX, rowY, {
          fontSize: 8.1,
          fontFamily: 'Arial, sans-serif'
        }),
        svgTextElement(row.description, descriptionX, rowY, {
          fontSize: 8.1,
          fontFamily: 'Arial, sans-serif'
        })
      ].join('');
    }).join('')
  ].join('');
}

function buildFooterSvg(assets) {
  return [
    svgLine(PAGE_MARGIN_X, FOOTER_TOP, PAGE_WIDTH - PAGE_MARGIN_X, FOOTER_TOP, { strokeWidth: 1.2 }),
    svgImage(assets.schoolSeal, 34, FOOTER_TOP + 6, 30, 30),
    svgImage(assets.facebook, 74, FOOTER_TOP + 28, 9, 9),
    svgTextElement('DepEd Tayo Agdangan CES', 87, FOOTER_TOP + 23, {
      fontSize: 6.8,
      fontFamily: 'Calibri, Arial, sans-serif',
      fontWeight: '700'
    }),
    svgImage(assets.quezon, 195, FOOTER_TOP + 7, 86, 28),
    svgImage(assets.website, 245, FOOTER_TOP + 28, 9, 9),
    svgTextElement('https://agdangances.weebly.com', 258, FOOTER_TOP + 23, {
      fontSize: 6.4,
      fontFamily: 'Calibri, Arial, sans-serif'
    }),
    svgImage(assets.agdangan, 332, FOOTER_TOP + 2, 138, 46, { opacity: 0.95 }),
    svgTextElement('Lead the Race.... ACES', PAGE_WIDTH / 2, FOOTER_TOP + 6, {
      fontSize: 8.1,
      fontFamily: 'Calibri, Arial, sans-serif',
      fontWeight: '700',
      fontStyle: 'italic',
      fill: '#4472C4',
      anchor: 'middle'
    }),
    svgImage(assets.serbisyo, 312, FOOTER_TOP + 18, 176, 42),
    svgImage(assets.matatag, 620, FOOTER_TOP + 9, 120, 30),
    svgTextBlock(
      [
        'Address: Brgy. Poblacion I, Agdangan, Quezon',
        'Contact Numbers: 09104490517, (042) 785-0308'
      ],
      PAGE_WIDTH - PAGE_MARGIN_X,
      FOOTER_TOP + 3,
      {
        fontSize: 5.8,
        lineHeight: 8,
        fontFamily: 'Calibri, Arial, sans-serif',
        anchor: 'end'
      }
    ),
    svgImage(assets.email, 700, FOOTER_TOP + 29, 10, 10),
    svgTextElement('108944@deped.gov.ph', 714, FOOTER_TOP + 23, {
      fontSize: 6.4,
      fontFamily: 'Calibri, Arial, sans-serif'
    })
  ].join('');
}

function buildPageSvg({ learnerName, gradeLevel, tutorName, groups, includeLegend, assets, columnWidths }) {
  const parts = [
    svgRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: '#ffffff', stroke: '#ffffff', strokeWidth: 0 }),
    buildBrandHeaderSvg(assets),
    buildFormHeaderSvg({ learnerName, gradeLevel, tutorName }),
    buildTableHeaderSvg(columnWidths)
  ];

  let currentY = TABLE_TOP + TABLE_HEADER_HEIGHT;
  for (const group of groups) {
    parts.push(buildGroupSvg(group, currentY, columnWidths));
    currentY += group.totalHeight;
  }

  if (includeLegend) {
    parts.push(buildLegendSvg(currentY + 12));
  }

  parts.push(buildFooterSvg(assets));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${RENDER_WIDTH}" height="${RENDER_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">` +
    parts.join('') +
    '</svg>'
  );
}

async function renderSvgPageToJpeg(svg) {
  return sharp(Buffer.from(svg))
    .flatten({ background: '#ffffff' })
    .jpeg({
      quality: 92,
      mozjpeg: true,
      chromaSubsampling: '4:4:4'
    })
    .toBuffer();
}

function createJpegImageObject(imageBuffer, width, height) {
  return Buffer.concat([
    Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBuffer.length} >>\nstream\n`,
      'utf8'
    ),
    imageBuffer,
    Buffer.from('\nendstream', 'utf8')
  ]);
}

function createStreamObject(content) {
  return Buffer.from(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`, 'utf8');
}

function createPdfFromJpegPages(pageImages) {
  const objects = [];
  const pageObjectNumbers = [];
  let nextObjectNumber = 3;

  pageImages.forEach((imageBuffer) => {
    const pageObject = nextObjectNumber;
    const contentObject = nextObjectNumber + 1;
    const imageObject = nextObjectNumber + 2;
    nextObjectNumber += 3;
    pageObjectNumbers.push(pageObject);

    const contentStream = `q\n${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm\n/Im1 Do\nQ`;
    objects[pageObject] = Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /ProcSet [/PDF /ImageC] /XObject << /Im1 ${imageObject} 0 R >> >> ` +
      `/Contents ${contentObject} 0 R >>`,
      'utf8'
    );
    objects[contentObject] = createStreamObject(contentStream);
    objects[imageObject] = createJpegImageObject(imageBuffer, RENDER_WIDTH, RENDER_HEIGHT);
  });

  objects[1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'utf8');
  objects[2] = Buffer.from(
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`,
    'utf8'
  );

  const chunks = [Buffer.from('%PDF-1.4\n', 'utf8')];
  const offsets = ['0000000000 65535 f \n'];
  let offset = chunks[0].length;

  for (let index = 1; index < objects.length; index += 1) {
    const header = Buffer.from(`${index} 0 obj\n`, 'utf8');
    const footer = Buffer.from('\nendobj\n', 'utf8');
    chunks.push(header, objects[index], footer);
    offsets.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
    offset += header.length + objects[index].length + footer.length;
  }

  const xrefOffset = offset;
  const xrefHeader = Buffer.from(`xref\n0 ${objects.length}\n`, 'utf8');
  const xrefBody = Buffer.from(offsets.join(''), 'utf8');
  const trailer = Buffer.from(
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    'utf8'
  );

  chunks.push(xrefHeader, xrefBody, trailer);

  return Buffer.concat(chunks);
}

export async function generateIripPdfBuffer({ learnerName, gradeLevel, tutorName, rows }) {
  const tableWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
  const columnWidths = getColumnWidths(tableWidth);
  const layoutGroups = buildLayoutGroups(rows, columnWidths[3], columnWidths[1]);
  const pages = buildPageLayout(layoutGroups);
  const assets = await loadTemplateAssets();

  const renderedPages = [];
  for (const page of pages) {
    const svg = buildPageSvg({
      learnerName,
      gradeLevel,
      tutorName,
      groups: page.groups,
      includeLegend: page.includeLegend,
      assets,
      columnWidths
    });
    renderedPages.push(await renderSvgPageToJpeg(svg));
  }

  return createPdfFromJpegPages(renderedPages);
}
