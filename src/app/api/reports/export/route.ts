import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getAttendanceReportData,
  validateDateRange,
  ReportDateRangeError,
} from '@/services/reportService';
import { generateAttendanceExcel, generateAttendancePdf } from '@/lib/exporters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi login tidak ditemukan.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'excel').toLowerCase();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const classId = searchParams.get('classId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const status = searchParams.get('status') || undefined;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Parameter startDate dan endDate wajib disertakan.' },
        { status: 400 }
      );
    }

    // Validasi rentang tanggal maksimal 1 tahun ajaran (DoD Keamanan)
    try {
      validateDateRange(startDate, endDate);
    } catch (valErr: unknown) {
      const msg =
        valErr instanceof Error ? valErr.message : 'Rentang tanggal tidak valid.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Ambil data laporan
    const reportData = await getAttendanceReportData(session.schoolId, {
      startDate,
      endDate,
      classId,
      studentId,
      status,
    });

    const dateSlug = `${startDate}_sd_${endDate}`;
    const classSlug = reportData.filter.className
      ? `_${reportData.filter.className.replace(/\s+/g, '_')}`
      : '';

    if (format === 'pdf') {
      const pdfBuffer = generateAttendancePdf(reportData);
      const filename = `Rekap_Presensi${classSlug}_${dateSlug}.pdf`;

      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(pdfBuffer.length),
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Default: Excel
    const excelBuffer = generateAttendanceExcel(reportData, {
      includeDetailedLogs: true,
    });
    const filename = `Rekap_Presensi${classSlug}_${dateSlug}.xlsx`;

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(excelBuffer.length),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    if (err instanceof ReportDateRangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Report export error:', err);
    const msg =
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat memproses ekspor laporan.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
