'use client';

import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { ImportError, ImportResult } from '@/lib/importers/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onImport: (formData: FormData) => Promise<ImportResult<any>>;
  onSuccess: () => void;
  classes?: Array<{ id: string; name: string }>;
  showClassSelector?: boolean;
}

export function ImportModal({
  isOpen,
  onClose,
  title,
  description,
  onImport,
  onSuccess,
  classes = [],
  showClassSelector = false,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult<any> | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientError(null);
    setResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.slice(selected.name.lastIndexOf('.')).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      setClientError('Format file tidak didukung. Harap pilih file .csv atau .xlsx');
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setClientError('Silakan pilih file terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setClientError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedClassId) {
        formData.append('defaultClassId', selectedClassId);
      }

      const res = await onImport(formData);
      setResult(res);

      if (res.success && res.importedCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setClientError(err?.message || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setClientError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-100">{title}</h2>
            <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {clientError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{clientError}</span>
            </div>
          )}

          {result?.success && result.importedCount > 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">
                  Impor Berhasil Disimpan ke Database!
                </p>
                <p className="mt-1 text-emerald-300/80">
                  Sebanyak <strong>{result.importedCount}</strong> baris data berhasil divalidasi dan diimpor.
                </p>
              </div>
            </div>
          )}

          {result && !result.success && result.errors.length > 0 && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-200">
                    Ditemukan {result.errors.length} Kesalahan Data (Database Tetap Aman)
                  </p>
                  <p className="mt-0.5 text-amber-300/80">
                    Tidak ada data yang disimpan ke database karena terdapat baris duplikat atau kolom tidak valid. Perbaiki file Anda berdasarkan daftar di bawah ini:
                  </p>
                </div>
              </div>

              <div className="border border-neutral-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-800/60 text-neutral-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Baris</th>
                      <th className="px-3 py-2">Kolom</th>
                      <th className="px-3 py-2">Nilai</th>
                      <th className="px-3 py-2">Pesan Masalah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/30">
                        <td className="px-3 py-2 font-mono text-amber-400">
                          {err.row > 0 ? `Baris ${err.row}` : '-'}
                        </td>
                        <td className="px-3 py-2 uppercase font-medium text-neutral-400">
                          {err.column}
                        </td>
                        <td className="px-3 py-2 font-mono text-neutral-300 truncate max-w-[120px]">
                          {String(err.value ?? '-')}
                        </td>
                        <td className="px-3 py-2 text-red-400">
                          {err.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {showClassSelector && classes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Tetapkan Kelas Default (Opsional jika di file tidak ada kolom kelas)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Kelas Default --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Pilih Berkas CSV atau Excel (.xlsx)
              </label>
              <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-neutral-950">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="import-file-input"
                />
                <label
                  htmlFor="import-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-emerald-400" />
                      <div className="text-xs font-medium text-neutral-200">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {(file.size / 1024).toFixed(1)} KB — Klik untuk ganti file
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-neutral-500" />
                      <div className="text-xs font-medium text-neutral-300">
                        Klik untuk memilih file CSV atau Excel
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Format didukung: .csv, .xlsx, .xls
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                >
                  Unggah File Lain
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={!file || isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Mulai Impor</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
