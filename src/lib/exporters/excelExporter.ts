import * as XLSX from 'xlsx';
import { AttendanceReportData } from '@/services/reportService';

export interface GenerateExcelOptions {
  includeDetailedLogs?: boolean;
}

/**
 * Generator file Excel (.xlsx) presensi dengan kop sekolah, format tabel rapi,
 * dan formula persentase kehadiran yang valid (DoD 4).
 */
export function generateAttendanceExcel(
  data: AttendanceReportData,
  options: GenerateExcelOptions = { includeDetailedLogs: true }
): Buffer {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: REKAPITULASI PRESENSI SISWA
  // ==========================================

  const wsData: Array<Array<unknown>> = [];

  // 1. Header Sekolah & Metadata Laporan
  wsData.push([data.school.name.toUpperCase()]);
  wsData.push([`NPSN: ${data.school.npsn} | Alamat: ${data.school.address || '-'}`]);
  wsData.push(['LAPORAN REKAPITULASI KEHADIRAN SISWA']);
  wsData.push([
    `Periode: ${data.filter.startDate} s/d ${data.filter.endDate} | Kelas: ${
      data.filter.className || 'Semua Kelas'
    } | Status: ${data.filter.status || 'Semua Status'}`,
  ]);
  wsData.push([
    `Waktu Unduh: ${new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    })} WIB | Dicetak oleh Sistem EduNotify`,
  ]);
  wsData.push([]); // Baris kosong pemisah (baris ke-6)

  // 2. Table Column Headers (baris ke-7, index 6)
  const headers = [
    'No',
    'NIS',
    'NISN',
    'Nama Siswa',
    'L/P',
    'Kelas',
    'Hadir (H)',
    'Sakit (S)',
    'Izin (I)',
    'Alpa (A)',
    'Total Pertemuan',
    '% Kehadiran',
  ];
  wsData.push(headers);

  // 3. Data Baris Siswa (Mulai baris ke-8, index 7, Excel row 8)
  const startRow = 8;
  data.students.forEach((student, index) => {
    const excelRow = startRow + index;
    // Kolom G: Hadir, H: Sakit, I: Izin, J: Alpa, K: Total, L: % Kehadiran
    const totalFormula = `SUM(G${excelRow}:J${excelRow})`;
    const pctFormula = `IF(K${excelRow}>0,(G${excelRow}/K${excelRow})*100,0)`;

    const totalVal = student.hadir + student.sakit + student.izin + student.alpa;
    const pctVal = totalVal > 0 ? (student.hadir / totalVal) * 100 : 0;

    wsData.push([
      index + 1,
      student.nis,
      student.nisn || '-',
      student.name,
      student.gender,
      student.className,
      student.hadir,
      student.sakit,
      student.izin,
      student.alpa,
      { t: 'n', f: totalFormula, v: totalVal },
      { t: 'n', f: pctFormula, v: Number(pctVal.toFixed(1)) },
    ]);
  });

  const studentCount = data.students.length;
  const lastStudentRow = startRow + studentCount - 1;

  // 4. Baris Total & Rata-rata
  if (studentCount > 0) {
    wsData.push([
      'TOTAL & RATA-RATA',
      '',
      '',
      '',
      '',
      '',
      { t: 'n', f: `SUM(G${startRow}:G${lastStudentRow})`, v: data.summary.totalHadir },
      { t: 'n', f: `SUM(H${startRow}:H${lastStudentRow})`, v: data.summary.totalSakit },
      { t: 'n', f: `SUM(I${startRow}:I${lastStudentRow})`, v: data.summary.totalIzin },
      { t: 'n', f: `SUM(J${startRow}:J${lastStudentRow})`, v: data.summary.totalAlpa },
      { t: 'n', f: `SUM(K${startRow}:K${lastStudentRow})`, v: data.summary.totalRecords },
      {
        t: 'n',
        f: `AVERAGE(L${startRow}:L${lastStudentRow})`,
        v: data.summary.attendancePercentage,
      },
    ]);
  } else {
    wsData.push(['Tidak ada data siswa untuk kriteria filter ini.']);
  }

  // 5. Buat Worksheet
  const wsRekap = XLSX.utils.aoa_to_sheet(wsData);

  // Atur lebar kolom agar rapi (DoD 4)
  wsRekap['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // NIS
    { wch: 14 }, // NISN
    { wch: 30 }, // Nama Siswa
    { wch: 6 },  // L/P
    { wch: 10 }, // Kelas
    { wch: 11 }, // Hadir
    { wch: 11 }, // Sakit
    { wch: 11 }, // Izin
    { wch: 11 }, // Alpa
    { wch: 16 }, // Total Pertemuan
    { wch: 14 }, // % Kehadiran
  ];

  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi Kehadiran');

  // ==========================================
  // SHEET 2: LOG RINCI PRESENSI (OPSIONAL/JIKA ADA)
  // ==========================================
  if (options.includeDetailedLogs && data.logs.length > 0) {
    const wsLogsData: Array<Array<unknown>> = [];
    wsLogsData.push([data.school.name.toUpperCase()]);
    wsLogsData.push(['LOG RINCIAN HARIAN PRESENSI SISWA']);
    wsLogsData.push([
      `Periode: ${data.filter.startDate} s/d ${data.filter.endDate} | Total Log: ${data.logs.length}`,
    ]);
    wsLogsData.push([]);

    // Headers
    wsLogsData.push([
      'No',
      'Tanggal',
      'Kelas',
      'NIS',
      'Nama Siswa',
      'Gender',
      'Status Kehadiran',
      'Catatan',
      'Guru Penginput',
      'Waktu Input',
    ]);

    const statusLabels: Record<string, string> = {
      PRESENT: 'Hadir',
      SICK: 'Sakit',
      PERMIT: 'Izin',
      ABSENT_ALPA: 'Alpa',
      UNRECORDED: 'Belum Diabsen',
    };

    data.logs.forEach((log, idx) => {
      wsLogsData.push([
        idx + 1,
        log.date,
        log.className,
        log.nis,
        log.studentName,
        log.gender,
        statusLabels[log.status] || log.status,
        log.notes || '-',
        log.submittedByTeacherName || '-',
        log.submittedAt
          ? new Date(log.submittedAt).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
            })
          : '-',
      ]);
    });

    const wsLogs = XLSX.utils.aoa_to_sheet(wsLogsData);
    wsLogs['!cols'] = [
      { wch: 5 },  // No
      { wch: 12 }, // Tanggal
      { wch: 10 }, // Kelas
      { wch: 12 }, // NIS
      { wch: 28 }, // Nama Siswa
      { wch: 8 },  // Gender
      { wch: 16 }, // Status
      { wch: 25 }, // Catatan
      { wch: 24 }, // Guru Penginput
      { wch: 20 }, // Waktu Input
    ];

    XLSX.utils.book_append_sheet(wb, wsLogs, 'Log Presensi Harian');
  }

  // Tulis buffer file Excel .xlsx
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'buffer',
  });

  return Buffer.isBuffer(excelBuffer)
    ? excelBuffer
    : Buffer.from(excelBuffer);
}
