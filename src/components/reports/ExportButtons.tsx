'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, AlertCircle } from 'lucide-react';

interface ExportButtonsProps {
  startDate: string;
  endDate: string;
  classId?: string;
  studentId?: string;
  status?: string;
}

export function ExportButtons({
  startDate,
  endDate,
  classId,
  studentId,
  status,
}: ExportButtonsProps) {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleExport(format: 'excel' | 'pdf') {
    setErrorMsg(null);
    if (format === 'excel') setDownloadingExcel(true);
    else setDownloadingPdf(true);

    try {
      // Validate date range client-side first
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 366) {
        throw new Error('Rentang tanggal maksimal 1 tahun ajaran (366 hari).');
      }

      const params = new URLSearchParams({
        format,
        startDate,
        endDate,
      });

      if (classId) params.append('classId', classId);
      if (studentId) params.append('studentId', studentId);
      if (status) params.append('status', status);

      const res = await fetch(`/api/reports/export?${params.toString()}`);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal mengekspor berkas ${format.toUpperCase()}.`);
      }

      // Convert response to blob and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from header or construct default
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `Rekap_Presensi_${startDate}_sd_${endDate}.${
        format === 'excel' ? 'xlsx' : 'pdf'
      }`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses ekspor.'
      );
    } finally {
      if (format === 'excel') setDownloadingExcel(false);
      else setDownloadingPdf(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {errorMsg && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Tombol Ekspor Excel */}
        <button
          onClick={() => handleExport('excel')}
          disabled={downloadingExcel || downloadingPdf}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {downloadingExcel ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          )}
          <span>{downloadingExcel ? 'Menyiapkan...' : 'Ekspor Excel (.xlsx)'}</span>
        </button>

        {/* Tombol Ekspor PDF */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={downloadingExcel || downloadingPdf}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
          ) : (
            <FileText className="w-4 h-4 text-rose-400" />
          )}
          <span>{downloadingPdf ? 'Menyiapkan...' : 'Ekspor PDF (.pdf)'}</span>
        </button>
      </div>
    </div>
  );
}
