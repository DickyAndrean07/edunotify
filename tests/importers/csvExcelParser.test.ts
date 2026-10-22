import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseSpreadsheetBuffer,
  validateFileType,
} from '@/lib/importers/csvExcelParser';

describe('CSV & Excel Parser Unit Tests', () => {
  describe('validateFileType', () => {
    it('accepts valid .csv and .xlsx extensions', () => {
      expect(validateFileType('siswa.csv').valid).toBe(true);
      expect(validateFileType('guru.xlsx').valid).toBe(true);
      expect(validateFileType('data.xls').valid).toBe(true);
    });

    it('rejects invalid extensions like .pdf, .exe, .json', () => {
      const resPdf = validateFileType('dokumen.pdf');
      expect(resPdf.valid).toBe(false);
      expect(resPdf.error).toContain('Format file tidak didukung');

      const resExe = validateFileType('malware.exe');
      expect(resExe.valid).toBe(false);
    });

    it('accepts valid MIME types', () => {
      expect(validateFileType(undefined, 'text/csv').valid).toBe(true);
      expect(
        validateFileType(
          undefined,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ).valid
      ).toBe(true);
    });

    it('rejects invalid MIME types', () => {
      const res = validateFileType(undefined, 'application/pdf');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Tipe MIME tidak valid');
    });
  });

  describe('parseSpreadsheetBuffer', () => {
    it('correctly parses raw CSV string', () => {
      const csvContent = `NIS,Nama,Gender,Kelas\n1001,Budi,L,X-A\n1002,Siti,P,X-A`;
      const result = parseSpreadsheetBuffer(csvContent);

      expect(result.headers).toEqual(['NIS', 'Nama', 'Gender', 'Kelas']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].NIS).toBe('1001');
      expect(result.rows[0].Nama).toBe('Budi');
      expect(result.rawRows[0].rowNumber).toBe(2);
      expect(result.rawRows[1].rowNumber).toBe(3);
    });

    it('correctly parses XLSX buffer created with SheetJS', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['NIP', 'Nama Guru', 'Email', 'Role'],
        ['19850101', 'Dewi Sartika', 'dewi@sekolah.sch.id', 'GURU_MAPEL'],
        ['19860202', 'Ki Hajar', 'kihajar@sekolah.sch.id', 'WALI_KELAS'],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseSpreadsheetBuffer(buf, { filename: 'guru.xlsx' });
      expect(result.headers).toContain('NIP');
      expect(result.headers).toContain('Email');
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]['Nama Guru']).toBe('Dewi Sartika');
      expect(result.rows[1]['Email']).toBe('kihajar@sekolah.sch.id');
    });

    it('handles empty sheet or whitespace rows gracefully', () => {
      const emptyCsv = `   \n   \n   `;
      const result = parseSpreadsheetBuffer(emptyCsv);
      expect(result.rows).toHaveLength(0);
      expect(result.headers).toHaveLength(0);
    });
  });
});
