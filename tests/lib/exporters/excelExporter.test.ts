import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { generateAttendanceExcel } from '@/lib/exporters/excelExporter';
import { AttendanceReportData } from '@/services/reportService';

describe('EDUNOTIFY-06: Excel Exporter (.xlsx) - DoD 4', () => {
  const mockReportData: AttendanceReportData = {
    school: {
      id: 'sch-1',
      name: 'SMA Negeri 1 EduNotify Gresik',
      npsn: '20501234',
      address: 'Jl. Arif Rahman Hakim No. 1, Gresik',
      principalName: 'Drs. H. M. Sholihin, M.Pd.',
    },
    filter: {
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      classId: 'cls-1',
      className: 'X-A',
      studentId: null,
      studentName: null,
      status: null,
    },
    summary: {
      totalRecords: 40,
      totalStudents: 2,
      totalHadir: 34,
      totalSakit: 3,
      totalIzin: 2,
      totalAlpa: 1,
      attendancePercentage: 85.0,
    },
    students: [
      {
        studentId: 'std-1',
        nis: '10001',
        nisn: '0081234567',
        name: 'Ahmad Faiz',
        gender: 'L',
        className: 'X-A',
        totalDaysRecorded: 20,
        hadir: 19,
        sakit: 1,
        izin: 0,
        alpa: 0,
        unrecorded: 0,
        attendanceRate: 95.0,
      },
      {
        studentId: 'std-2',
        nis: '10002',
        nisn: '0081234568',
        name: 'Bella Safira',
        gender: 'P',
        className: 'X-A',
        totalDaysRecorded: 20,
        hadir: 15,
        sakit: 2,
        izin: 2,
        alpa: 1,
        unrecorded: 0,
        attendanceRate: 75.0,
      },
    ],
    logs: [
      {
        id: 'log-1',
        date: '2026-10-01',
        classId: 'cls-1',
        className: 'X-A',
        studentId: 'std-1',
        nis: '10001',
        studentName: 'Ahmad Faiz',
        gender: 'L',
        status: 'PRESENT',
        notes: null,
        submittedByTeacherName: 'Budi Santoso',
        submittedAt: new Date('2026-10-01T07:30:00Z'),
      },
      {
        id: 'log-2',
        date: '2026-10-01',
        classId: 'cls-1',
        className: 'X-A',
        studentId: 'std-2',
        nis: '10002',
        studentName: 'Bella Safira',
        gender: 'P',
        status: 'ABSENT_ALPA',
        notes: 'Tidak ada surat',
        submittedByTeacherName: 'Budi Santoso',
        submittedAt: new Date('2026-10-01T07:30:00Z'),
      },
    ],
    generatedAt: '2026-10-22T08:00:00.000Z',
  };

  it('menghasilkan file buffer Excel yang valid dengan header ZIP (PK) resmi .xlsx', () => {
    const buffer = generateAttendanceExcel(mockReportData);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);

    // ZIP Magic Bytes for .xlsx (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });

  it('dapat dibaca ulang oleh pustaka XLSX tanpa error korupsi data', () => {
    const buffer = generateAttendanceExcel(mockReportData);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    expect(wb.SheetNames).toContain('Rekapitulasi Kehadiran');
    expect(wb.SheetNames).toContain('Log Presensi Harian');
  });

  it('menyusun kop sekolah dan metadata laporan pada lembar rekap', () => {
    const buffer = generateAttendanceExcel(mockReportData);
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets['Rekapitulasi Kehadiran'];

    // Row 1: Nama Sekolah
    expect(ws['A1'].v).toContain('SMA NEGERI 1 EDUNOTIFY GRESIK');
    // Row 2: NPSN & Alamat
    expect(ws['A2'].v).toContain('20501234');
    expect(ws['A2'].v).toContain('Jl. Arif Rahman Hakim');
    // Row 3: Judul
    expect(ws['A3'].v).toBe('LAPORAN REKAPITULASI KEHADIRAN SISWA');
    // Row 4: Periode & Kelas
    expect(ws['A4'].v).toContain('2026-10-01 s/d 2026-10-31');
    expect(ws['A4'].v).toContain('Kelas: X-A');
  });

  it('menyajikan header tabel presensi yang proporsional dan rapi', () => {
    const buffer = generateAttendanceExcel(mockReportData);
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets['Rekapitulasi Kehadiran'];

    // Header tabel pada row 7
    expect(ws['A7'].v).toBe('No');
    expect(ws['B7'].v).toBe('NIS');
    expect(ws['C7'].v).toBe('NISN');
    expect(ws['D7'].v).toBe('Nama Siswa');
    expect(ws['E7'].v).toBe('L/P');
    expect(ws['F7'].v).toBe('Kelas');
    expect(ws['G7'].v).toBe('Hadir (H)');
    expect(ws['H7'].v).toBe('Sakit (S)');
    expect(ws['I7'].v).toBe('Izin (I)');
    expect(ws['J7'].v).toBe('Alpa (A)');
    expect(ws['K7'].v).toBe('Total Pertemuan');
    expect(ws['L7'].v).toBe('% Kehadiran');
  });

  it('menggunakan formula Excel yang valid untuk total dan persentase kehadiran (DoD 4)', () => {
    const buffer = generateAttendanceExcel(mockReportData);
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets['Rekapitulasi Kehadiran'];

    // Siswa 1 di row 8
    expect(ws['D8'].v).toBe('Ahmad Faiz');
    // Formula Total K8: SUM(G8:J8)
    expect(ws['K8'].f).toBe('SUM(G8:J8)');
    // Formula Persentase L8: IF(K8>0,(G8/K8)*100,0)
    expect(ws['L8'].f).toBe('IF(K8>0,(G8/K8)*100,0)');

    // Siswa 2 di row 9
    expect(ws['D9'].v).toBe('Bella Safira');
    expect(ws['K9'].f).toBe('SUM(G9:J9)');
    expect(ws['L9'].f).toBe('IF(K9>0,(G9/K9)*100,0)');

    // Row 10: Total & Rata-rata
    expect(ws['A10'].v).toBe('TOTAL & RATA-RATA');
    expect(ws['G10'].f).toBe('SUM(G8:G9)');
    expect(ws['H10'].f).toBe('SUM(H8:H9)');
    expect(ws['I10'].f).toBe('SUM(I8:I9)');
    expect(ws['J10'].f).toBe('SUM(J8:J9)');
    expect(ws['K10'].f).toBe('SUM(K8:K9)');
    expect(ws['L10'].f).toBe('AVERAGE(L8:L9)');
  });

  it('mengatur lebar kolom (!cols) pada worksheet agar tabel tidak terpotong', () => {
    const buffer = generateAttendanceExcel(mockReportData);
    const wb = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
    const ws = wb.Sheets['Rekapitulasi Kehadiran'];

    expect(ws['!cols']).toBeDefined();
    expect(ws['!cols']?.length).toBe(12);
    // Lebar kolom Nama Siswa (index 3) cukup luas
    expect(ws['!cols']![3].wch).toBeGreaterThanOrEqual(25);
  });
});
