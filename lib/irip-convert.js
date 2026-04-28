import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

import { generateIripDocxBuffer } from '@/lib/irip-template';

const SOFFICE_CANDIDATES = [
  process.env.SOFFICE_PATH,
  'soffice',
  'libreoffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
].filter(Boolean);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findSofficeBinary() {
  for (const candidate of SOFFICE_CANDIDATES) {
    if (candidate.includes(path.sep) || /^[A-Za-z]:\\/.test(candidate)) {
      if (await pathExists(candidate)) {
        return candidate;
      }
      continue;
    }

    return candidate;
  }

  return null;
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      ...options
    });

    let stderr = '';
    let stdout = '';

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(stderr.trim() || stdout.trim() || `Converter exited with code ${code}.`);
      error.code = 'DOCX_TO_PDF_FAILED';
      reject(error);
    });
  });
}

export async function convertIripDocxToPdfBuffer(data) {
  const sofficeBinary = await findSofficeBinary();
  if (!sofficeBinary) {
    const error = new Error('DOCX-to-PDF conversion is not configured. Install LibreOffice or set SOFFICE_PATH on the server.');
    error.code = 'DOCX_TO_PDF_UNAVAILABLE';
    throw error;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aral-irip-'));
  const inputPath = path.join(tempDir, 'irip.docx');
  const outputPath = path.join(tempDir, 'irip.pdf');

  try {
    const docxBuffer = await generateIripDocxBuffer(data);
    await fs.writeFile(inputPath, docxBuffer);

    await runProcess(sofficeBinary, [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      tempDir,
      inputPath
    ], {
      cwd: tempDir
    });

    return await fs.readFile(outputPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      const missingBinary = new Error('LibreOffice was not found on the server. Install it or set SOFFICE_PATH.');
      missingBinary.code = 'DOCX_TO_PDF_UNAVAILABLE';
      throw missingBinary;
    }

    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
