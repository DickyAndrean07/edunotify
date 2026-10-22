import * as XLSX from 'xlsx';
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from './types';

export interface ParseOptions {
  filename?: string;
  mimeType?: string;
}

export function validateFileType(filename?: string, mimeType?: string): { valid: boolean; error?: string } {
  if (filename) {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
      return {
        valid: false,
        error: `Format file tidak didukung (${ext}). Hanya diperbolehkan: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }
  }

  if (mimeType && mimeType !== 'application/octet-stream') {
    // Check if mimeType matches allowed
    const isAllowed = ALLOWED_MIME_TYPES.some(
      (m) => m.toLowerCase() === mimeType.toLowerCase()
    );
    if (!isAllowed && !mimeType.includes('csv') && !mimeType.includes('spreadsheetml')) {
      return {
        valid: false,
        error: `Tipe MIME tidak valid (${mimeType}). Hanya file CSV atau Excel yang diterima.`,
      };
    }
  }

  return { valid: true };
}

export interface ParsedTable {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: Array<{ rowNumber: number; data: Record<string, string> }>;
}

export function parseSpreadsheetBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array | string,
  options?: ParseOptions
): ParsedTable {
  if (options) {
    const val = validateFileType(options.filename, options.mimeType);
    if (!val.valid) {
      throw new Error(val.error);
    }
  }

  const workbook = XLSX.read(buffer, {
    type: typeof buffer === 'string' ? 'string' : 'buffer',
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File tidak memiliki sheet data.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error('Sheet data kosong atau tidak dapat dibaca.');
  }

  // Convert to 2D matrix
  const matrix = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!matrix || matrix.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Find header row (first non-empty row)
  let headerIndex = -1;
  let headers: string[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    if (row && row.some((cell) => cell !== undefined && String(cell).trim() !== '')) {
      headerIndex = i;
      headers = row.map((cell) => String(cell || '').trim());
      break;
    }
  }

  if (headerIndex === -1 || headers.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const rawRows: Array<{ rowNumber: number; data: Record<string, string> }> = [];
  const rows: Record<string, string>[] = [];

  for (let r = headerIndex + 1; r < matrix.length; r++) {
    const rowData = matrix[r];
    if (!rowData || !rowData.some((c) => c !== undefined && String(c).trim() !== '')) {
      continue; // Skip entirely empty rows
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      if (h) {
        rowObj[h] = rowData[colIdx] !== undefined ? String(rowData[colIdx]).trim() : '';
      }
    });

    const physicalRowNumber = r + 1; // 1-indexed Excel row
    rawRows.push({ rowNumber: physicalRowNumber, data: rowObj });
    rows.push(rowObj);
  }

  return { headers, rows, rawRows };
}
