import { describe, it, expect } from 'vitest';
import { generateAttendancePdf } from '@/lib/exporters/pdfExporter';
import { AttendanceReportData } from '@/services/reportService';

describe('EDUNOTIFY-06: PDF Exporter (.pdf) - DoD 5', () => {
  const baseMockData: AttendanceReportData = {
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
    logs: [],
    generatedAt: '2026-10-22T08:00:00.000Z',
  };

  it('menghasilkan file buffer PDF yang valid diawali %PDF-1.4', () => {
    const buffer = generateAttendancePdf(baseMockData);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);

    const pdfString = buffer.toString('utf-8');
    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('memiliki tabel xref dan objek Root Catalog yang valid', () => {
    const buffer = generateAttendancePdf(baseMockData);
    const pdfString = buffer.toString('utf-8');

    expect(pdfString).toContain('/Type /Catalog');
    expect(pdfString).toContain('/Type /Pages');
    expect(pdfString).toContain('xref');
    expect(pdfString).toContain('startxref');
    expect(pdfString).toContain('trailer');
  });

  it('menyertakan kop surat resmi sekolah, NPSN, dan judul laporan', () => {
    const buffer = generateAttendancePdf(baseMockData);
    const pdfString = buffer.toString('utf-8');

    expect(pdfString).toContain('SMA NEGERI 1 EDUNOTIFY GRESIK');
    expect(pdfString).toContain('NPSN: 20501234');
    expect(pdfString).toContain('REKAPITULASI LAPORAN KEHADIRAN SISWA');
    expect(pdfString).toContain('Periode: 2026-10-01 s/d 2026-10-31');
    expect(pdfString).toContain('Kelas: X-A');
  });

  it('merender kotak KPI ringkasan dan data siswa dalam tabel proporsional', () => {
    const buffer = generateAttendancePdf(baseMockData);
    const pdfString = buffer.toString('utf-8');

    // Ringkasan KPI
    expect(pdfString).toContain('Total Siswa');
    expect(pdfString).toContain('2 Siswa');
    expect(pdfString).toContain('Tingkat Kehadiran');
    expect(pdfString).toContain('85.0%');

    // Siswa
    expect(pdfString).toContain('Ahmad Faiz');
    expect(pdfString).toContain('10001');
    expect(pdfString).toContain('Bella Safira');
    expect(pdfString).toContain('10002');
  });

  it('menyertakan blok tanda tangan Kepala Sekolah dan Wali Kelas di akhir dokumen', () => {
    const buffer = generateAttendancePdf(baseMockData);
    const pdfString = buffer.toString('utf-8');

    expect(pdfString).toContain('Wali Kelas / Petugas Presensi');
    expect(pdfString).toContain('Kepala Sekolah');
    expect(pdfString).toContain('Drs. H. M. Sholihin, M.Pd.');
  });

  it('mendukung paginasi multi-halaman jika jumlah siswa melebihi batas 1 halaman', () => {
    // Generate 35 mock students to trigger page break
    const manyStudents = Array.from({ length: 35 }, (_, i) => ({
      studentId: `std-${i + 1}`,
      nis: `100${String(i + 1).padStart(2, '0')}`,
      nisn: `008100${String(i + 1).padStart(2, '0')}`,
      name: `Siswa Uji Coba Ke-${i + 1}`,
      gender: i % 2 === 0 ? 'L' : 'P',
      className: 'X-A',
      totalDaysRecorded: 20,
      hadir: 18,
      sakit: 1,
      izin: 1,
      alpa: 0,
      unrecorded: 0,
      attendanceRate: 90.0,
    }));

    const multiPageData: AttendanceReportData = {
      ...baseMockData,
      summary: {
        ...baseMockData.summary,
        totalStudents: 35,
      },
      students: manyStudents,
    };

    const buffer = generateAttendancePdf(multiPageData);
    const pdfString = buffer.toString('utf-8');

    // Pastikan terdapat lebih dari 1 halaman di Pages Kids & Count
    expect(pdfString).toContain('/Count 2');
    expect(pdfString).toContain('Halaman 1 dari 2');
    expect(pdfString).toContain('Halaman 2 dari 2');
  });
});
