import { AttendanceReportData } from '@/services/reportService';

/**
 * Escapes characters for PDF literal strings (parentheses and backslashes)
 */
function escapePdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Truncate string to approximate max character length for column display
 */
function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1) + '.';
}

/**
 * Pure TypeScript PDF Generator producing valid PDF 1.4 byte buffer (DoD 5)
 * With official school header (kop), metadata, KPI summary, proportional table,
 * alternating row shading, page numbers, and signature block.
 */
export function generateAttendancePdf(data: AttendanceReportData): Buffer {
  const PAGE_WIDTH = 595.28; // A4 pt
  const PAGE_HEIGHT = 841.89; // A4 pt
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const PRINT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 515.28 pt

  // Table Column Specifications (Widths sum = 515 pt)
  // No(25), NIS(65), Nama(165), L/P(30), H(38), S(38), I(38), A(38), %(78) = 515
  const cols = [
    { label: 'No', width: 25, align: 'center' },
    { label: 'NIS', width: 65, align: 'left' },
    { label: 'Nama Siswa', width: 165, align: 'left' },
    { label: 'L/P', width: 30, align: 'center' },
    { label: 'Hadir', width: 40, align: 'center' },
    { label: 'Sakit', width: 38, align: 'center' },
    { label: 'Izin', width: 38, align: 'center' },
    { label: 'Alpa', width: 38, align: 'center' },
    { label: '% Kehadiran', width: 76, align: 'center' },
  ];

  const ROW_HEIGHT = 18;
  const HEADER_HEIGHT = 20;

  // Pagination calculation
  // Page 1 available height for table:
  // Top: 40
  // Kop: 70
  // Double rule: 10
  // Title & meta: 50
  // KPI summary: 45
  // Spacing: 15
  // Header: 20
  // Margin bottom: 45
  // Total overhead on Page 1 = 295 pt
  // Remaining for table on Page 1 = 841.89 - 295 = 546 pt
  // If single page with signature: 546 - 115 = 431 pt => max ~23 rows.

  const students = data.students;
  const studentPages: (typeof students)[] = [];

  if (students.length === 0) {
    studentPages.push([]);
  } else {
    let curIndex = 0;
    // Page 1 capacity:
    const p1Capacity = students.length <= 22 ? 22 : 18;
    studentPages.push(students.slice(curIndex, curIndex + p1Capacity));
    curIndex += p1Capacity;

    while (curIndex < students.length) {
      // Remaining pages have ~28 rows if with signature, 32 without
      const remainingCount = students.length - curIndex;
      const nextCap = remainingCount <= 26 ? 26 : 30;
      studentPages.push(students.slice(curIndex, curIndex + nextCap));
      curIndex += nextCap;
    }
  }

  const totalPages = studentPages.length;

  // Build page contents stream
  const pageStreams: string[] = [];

  studentPages.forEach((pageStudents, pageIdx) => {
    const isFirstPage = pageIdx === 0;
    const isLastPage = pageIdx === totalPages - 1;
    const pageNum = pageIdx + 1;
    let stream = '';

    let curY = PAGE_HEIGHT - 40;

    // ------------------------------------
    // 1. KOP SURAT SEKOLAH (Page 1)
    // ------------------------------------
    if (isFirstPage) {
      // Nama Sekolah
      stream += `BT /F2 15 Tf 0 0 0 rg ${MARGIN_LEFT} ${curY} Td (${escapePdfText(
        data.school.name.toUpperCase()
      )}) Tj ET\n`;
      curY -= 16;

      // NPSN & Status
      stream += `BT /F1 9 Tf 0.2 0.2 0.2 rg ${MARGIN_LEFT} ${curY} Td (NPSN: ${escapePdfText(
        data.school.npsn
      )} | Status: Terakreditasi | Sistem Presensi Digital Terpadu) Tj ET\n`;
      curY -= 13;

      // Alamat Sekolah
      if (data.school.address) {
        stream += `BT /F1 8.5 Tf 0.3 0.3 0.3 rg ${MARGIN_LEFT} ${curY} Td (${escapePdfText(
          truncateText(data.school.address, 95)
        )}) Tj ET\n`;
        curY -= 12;
      }

      curY -= 4;
      // Garis Ganda Pembatas Kop
      // Garis tebal atas
      stream += `0 0 0 RG 1.5 w ${MARGIN_LEFT} ${curY} m ${
        MARGIN_LEFT + PRINT_WIDTH
      } ${curY} l S\n`;
      // Garis tipis bawah
      stream += `0.4 0.4 0.4 RG 0.5 w ${MARGIN_LEFT} ${curY - 3} m ${
        MARGIN_LEFT + PRINT_WIDTH
      } ${curY - 3} l S\n`;
      curY -= 18;

      // ------------------------------------
      // 2. JUDUL DOKUMEN & METADATA
      // ------------------------------------
      stream += `BT /F2 12 Tf 0.1 0.1 0.1 rg ${MARGIN_LEFT} ${curY} Td (REKAPITULASI LAPORAN KEHADIRAN SISWA) Tj ET\n`;
      curY -= 15;

      const kelasLabel = data.filter.className
        ? `Kelas: ${data.filter.className}`
        : 'Semua Kelas';
      const statusLabel = data.filter.status
        ? `Status: ${data.filter.status}`
        : 'Semua Status';
      const metaLine = `Periode: ${data.filter.startDate} s/d ${data.filter.endDate}  |  ${kelasLabel}  |  ${statusLabel}`;

      stream += `BT /F1 8.5 Tf 0.25 0.25 0.25 rg ${MARGIN_LEFT} ${curY} Td (${escapePdfText(
        metaLine
      )}) Tj ET\n`;
      curY -= 18;

      // ------------------------------------
      // 3. KOTAK KPI RINGKASAN
      // ------------------------------------
      const kpiBoxWidth = PRINT_WIDTH / 4 - 6;
      const kpiBoxHeight = 36;
      const kpiItems = [
        {
          label: 'Total Siswa',
          val: `${data.summary.totalStudents} Siswa`,
          color: [0.1, 0.4, 0.8],
        },
        {
          label: 'Tingkat Kehadiran',
          val: `${data.summary.attendancePercentage.toFixed(1)}%`,
          color: [0.05, 0.6, 0.3],
        },
        {
          label: 'Total Hadir',
          val: `${data.summary.totalHadir} Presensi`,
          color: [0.2, 0.5, 0.2],
        },
        {
          label: 'S / I / A',
          val: `${data.summary.totalSakit} / ${data.summary.totalIzin} / ${data.summary.totalAlpa}`,
          color: [0.8, 0.3, 0.1],
        },
      ];

      kpiItems.forEach((item, i) => {
        const boxX = MARGIN_LEFT + i * (kpiBoxWidth + 8);
        const boxY = curY - kpiBoxHeight;

        // Background box
        stream += `0.95 0.96 0.98 rg ${boxX} ${boxY} ${kpiBoxWidth} ${kpiBoxHeight} re f\n`;
        // Border box
        stream += `0.8 0.83 0.88 RG 0.5 w ${boxX} ${boxY} ${kpiBoxWidth} ${kpiBoxHeight} re S\n`;

        // Label
        stream += `BT /F1 7.5 Tf 0.4 0.4 0.4 rg ${boxX + 6} ${
          boxY + 22
        } Td (${escapePdfText(item.label)}) Tj ET\n`;

        // Value
        const [r, g, b] = item.color;
        stream += `BT /F2 10 Tf ${r} ${g} ${b} rg ${boxX + 6} ${
          boxY + 9
        } Td (${escapePdfText(item.val)}) Tj ET\n`;
      });

      curY -= kpiBoxHeight + 16;
    } else {
      // Header halaman kelanjutan
      stream += `BT /F2 9.5 Tf 0.2 0.2 0.2 rg ${MARGIN_LEFT} ${curY} Td (${escapePdfText(
        data.school.name
      )} - Rekapitulasi Presensi (Lanjutan)) Tj ET\n`;
      curY -= 12;
      stream += `0.8 0.8 0.8 RG 0.5 w ${MARGIN_LEFT} ${curY} m ${
        MARGIN_LEFT + PRINT_WIDTH
      } ${curY} l S\n`;
      curY -= 14;
    }

    // ------------------------------------
    // 4. TABEL PRESENSI SISWA
    // ------------------------------------
    const tableHeaderY = curY - HEADER_HEIGHT;

    // Header Background
    stream += `0.15 0.2 0.28 rg ${MARGIN_LEFT} ${tableHeaderY} ${PRINT_WIDTH} ${HEADER_HEIGHT} re f\n`;
    stream += `0.1 0.15 0.2 RG 0.5 w ${MARGIN_LEFT} ${tableHeaderY} ${PRINT_WIDTH} ${HEADER_HEIGHT} re S\n`;

    // Header Labels
    let headerX = MARGIN_LEFT;
    cols.forEach((col) => {
      const textX =
        col.align === 'center'
          ? headerX + col.width / 2 - (col.label.length * 2.2)
          : headerX + 4;
      stream += `BT /F2 8 Tf 1 1 1 rg ${textX} ${tableHeaderY + 6} Td (${escapePdfText(
        col.label
      )}) Tj ET\n`;
      headerX += col.width;
    });

    curY = tableHeaderY;

    // Student Rows
    const globalStartIndex =
      pageIdx === 0
        ? 0
        : studentPages
            .slice(0, pageIdx)
            .reduce((acc, p) => acc + p.length, 0);

    if (pageStudents.length === 0) {
      curY -= ROW_HEIGHT;
      stream += `0.97 0.97 0.97 rg ${MARGIN_LEFT} ${curY} ${PRINT_WIDTH} ${ROW_HEIGHT} re f\n`;
      stream += `0.85 0.85 0.85 RG 0.5 w ${MARGIN_LEFT} ${curY} ${PRINT_WIDTH} ${ROW_HEIGHT} re S\n`;
      stream += `BT /F1 8 Tf 0.5 0.5 0.5 rg ${MARGIN_LEFT + 15} ${
        curY + 5
      } Td (Tidak ada data siswa untuk kriteria filter ini.) Tj ET\n`;
    } else {
      pageStudents.forEach((st, i) => {
        const studentIndex = globalStartIndex + i + 1;
        curY -= ROW_HEIGHT;

        // Alternating row background
        if (i % 2 === 1) {
          stream += `0.97 0.98 0.99 rg ${MARGIN_LEFT} ${curY} ${PRINT_WIDTH} ${ROW_HEIGHT} re f\n`;
        }

        // Row border
        stream += `0.88 0.9 0.92 RG 0.5 w ${MARGIN_LEFT} ${curY} ${PRINT_WIDTH} ${ROW_HEIGHT} re S\n`;

        // Cells
        let cellX = MARGIN_LEFT;
        const total = st.hadir + st.sakit + st.izin + st.alpa;
        const pct = total > 0 ? (st.hadir / total) * 100 : 0;

        const cellValues = [
          { val: String(studentIndex), align: 'center', width: cols[0].width },
          { val: st.nis, align: 'left', width: cols[1].width },
          {
            val: truncateText(st.name, 28),
            align: 'left',
            width: cols[2].width,
          },
          { val: st.gender, align: 'center', width: cols[3].width },
          { val: String(st.hadir), align: 'center', width: cols[4].width },
          { val: String(st.sakit), align: 'center', width: cols[5].width },
          { val: String(st.izin), align: 'center', width: cols[6].width },
          { val: String(st.alpa), align: 'center', width: cols[7].width },
          {
            val: `${pct.toFixed(1)}%`,
            align: 'center',
            width: cols[8].width,
            bold: true,
          },
        ];

        cellValues.forEach((c) => {
          const font = c.bold ? '/F2' : '/F1';
          const textColor =
            c.bold && pct < 80
              ? '0.8 0.2 0.2'
              : c.bold
              ? '0.1 0.5 0.2'
              : '0.2 0.2 0.2';

          const textX =
            c.align === 'center'
              ? cellX + c.width / 2 - (c.val.length * 2.2)
              : cellX + 4;

          stream += `BT ${font} 7.5 Tf ${textColor} rg ${textX} ${
            curY + 5
          } Td (${escapePdfText(c.val)}) Tj ET\n`;
          cellX += c.width;
        });
      });
    }

    // ------------------------------------
    // 5. BARIS TOTAL & RATA-RATA (Hanya di Halaman Terakhir)
    // ------------------------------------
    if (isLastPage && data.students.length > 0) {
      curY -= ROW_HEIGHT;
      // Background baris total
      stream += `0.9 0.93 0.96 rg ${MARGIN_LEFT} ${curY} ${PRINT_WIDTH} ${ROW_HEIGHT} re f\n`;
      stream += `0.7 0.75 0.8 RG 0.8 w ${MARGIN_LEFT} ${curY} ${PRINT_WIDTH} ${ROW_HEIGHT} re S\n`;

      // Label TOTAL
      stream += `BT /F2 8 Tf 0.1 0.1 0.2 rg ${
        MARGIN_LEFT + 8
      } ${curY + 5} Td (TOTAL & RATA-RATA KELAS) Tj ET\n`;

      // Posisi kolom Hadir, Sakit, Izin, Alpa, %
      const xHadir =
        MARGIN_LEFT + cols[0].width + cols[1].width + cols[2].width + cols[3].width;
      const xSakit = xHadir + cols[4].width;
      const xIzin = xSakit + cols[5].width;
      const xAlpa = xIzin + cols[6].width;
      const xPct = xAlpa + cols[7].width;

      stream += `BT /F2 8 Tf 0.1 0.5 0.2 rg ${
        xHadir + cols[4].width / 2 - (String(data.summary.totalHadir).length * 2.5)
      } ${curY + 5} Td (${data.summary.totalHadir}) Tj ET\n`;

      stream += `BT /F2 8 Tf 0.2 0.2 0.2 rg ${
        xSakit + cols[5].width / 2 - (String(data.summary.totalSakit).length * 2.5)
      } ${curY + 5} Td (${data.summary.totalSakit}) Tj ET\n`;

      stream += `BT /F2 8 Tf 0.2 0.2 0.2 rg ${
        xIzin + cols[6].width / 2 - (String(data.summary.totalIzin).length * 2.5)
      } ${curY + 5} Td (${data.summary.totalIzin}) Tj ET\n`;

      stream += `BT /F2 8 Tf 0.8 0.2 0.2 rg ${
        xAlpa + cols[7].width / 2 - (String(data.summary.totalAlpa).length * 2.5)
      } ${curY + 5} Td (${data.summary.totalAlpa}) Tj ET\n`;

      const pctStr = `${data.summary.attendancePercentage.toFixed(1)}%`;
      stream += `BT /F2 8.5 Tf 0.05 0.5 0.2 rg ${
        xPct + cols[8].width / 2 - (pctStr.length * 2.6)
      } ${curY + 5} Td (${pctStr}) Tj ET\n`;
    }

    // ------------------------------------
    // 6. BLOK TANDA TANGAN RESMI (Hanya di Halaman Terakhir)
    // ------------------------------------
    if (isLastPage) {
      curY -= 25;
      const todayFormatted = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const rightColX = MARGIN_LEFT + PRINT_WIDTH - 180;
      const leftColX = MARGIN_LEFT + 20;

      // Tanggal Cetak
      stream += `BT /F1 8.5 Tf 0.2 0.2 0.2 rg ${rightColX} ${curY} Td (${escapePdfText(
        `Gresik, ${todayFormatted}`
      )}) Tj ET\n`;
      curY -= 14;

      // Jabatan
      stream += `BT /F1 8.5 Tf 0.2 0.2 0.2 rg ${leftColX} ${curY} Td (Wali Kelas / Petugas Presensi,) Tj ET\n`;
      stream += `BT /F1 8.5 Tf 0.2 0.2 0.2 rg ${rightColX} ${curY} Td (Kepala Sekolah,) Tj ET\n`;

      curY -= 50; // Ruang tanda tangan / stempel

      // Nama Penandatangan
      const principalName = data.school.principalName || 'Drs. H. M. Sholihin, M.Pd.';
      stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${leftColX} ${curY} Td (( .................................................... )) Tj ET\n`;
      stream += `BT /F2 8.5 Tf 0.1 0.1 0.1 rg ${rightColX} ${curY} Td (${escapePdfText(
        principalName
      )}) Tj ET\n`;
      curY -= 11;
      stream += `BT /F1 7.5 Tf 0.3 0.3 0.3 rg ${rightColX} ${curY} Td (NIP. 197805122005011003) Tj ET\n`;
    }

    // ------------------------------------
    // 7. FOOTER & NOMOR HALAMAN
    // ------------------------------------
    const footerY = 28;
    stream += `0.85 0.85 0.85 RG 0.5 w ${MARGIN_LEFT} ${footerY + 12} m ${
      MARGIN_LEFT + PRINT_WIDTH
    } ${footerY + 12} l S\n`;

    stream += `BT /F1 7 Tf 0.45 0.45 0.45 rg ${MARGIN_LEFT} ${footerY} Td (Dokumen Resmi EduNotify MVP - Validitas Rekapitulasi Presensi Berbasis Sistem) Tj ET\n`;

    const pageStr = `Halaman ${pageNum} dari ${totalPages}`;
    stream += `BT /F1 7 Tf 0.45 0.45 0.45 rg ${
      MARGIN_LEFT + PRINT_WIDTH - 80
    } ${footerY} Td (${pageStr}) Tj ET\n`;

    pageStreams.push(stream);
  });

  // ==========================================
  // CONSTRUCT COMPLIANT PDF 1.4 OBJECT STRUCTURE
  // ==========================================
  const objects: string[] = [];

  // Obj 1: Catalog
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');

  // Obj 2: Pages Root
  const pageObjectIds = pageStreams.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objects.push(
    `<< /Type /Pages /Kids [${pageObjectIds}] /Count ${totalPages} >>`
  );

  // Fonts:
  // Obj F1: Helvetica (Regular)
  // Obj F2: Helvetica-Bold
  const FONT1_OBJ_ID = 3 + totalPages * 2;
  const FONT2_OBJ_ID = FONT1_OBJ_ID + 1;

  // For each page:
  // Page object: (3 + i*2)
  // Content stream: (4 + i*2)
  pageStreams.forEach((streamContent, idx) => {
    const pageObjId = 3 + idx * 2;
    const contentObjId = pageObjId + 1;

    // Page Object
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${FONT1_OBJ_ID} 0 R /F2 ${FONT2_OBJ_ID} 0 R >> >> >>`
    );

    // Content Stream Object
    const streamBuffer = Buffer.from(streamContent, 'utf-8');
    objects.push(
      `<< /Length ${streamBuffer.length} >>\nstream\n${streamContent}\nendstream`
    );
  });

  // Font 1: Helvetica
  objects.push(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  );
  // Font 2: Helvetica-Bold
  objects.push(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  );

  // Construct PDF buffer with Byte Offset Cross-Reference (XRef)
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets: number[] = [0]; // 0000000000 65535 f
  let currentOffset = Buffer.byteLength(header, 'utf-8');

  objects.forEach((objContent, index) => {
    const objNum = index + 1;
    offsets.push(currentOffset);
    const objStr = `${objNum} 0 obj\n${objContent}\nendobj\n`;
    body += objStr;
    currentOffset += Buffer.byteLength(objStr, 'utf-8');
  });

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    xref += `${offsetStr} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const finalPdfString = header + body + xref + trailer;
  return Buffer.from(finalPdfString, 'utf-8');
}
