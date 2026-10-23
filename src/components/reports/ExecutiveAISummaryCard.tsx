'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExecutiveAISummaryCardProps {
  initialSummary?: string;
  initialRecommendations?: string[];
  attendanceRate: number;
  totalStudents: number;
  totalAlpa: number;
  startDate: string;
  endDate: string;
}

export function ExecutiveAISummaryCard({
  initialSummary,
  initialRecommendations,
  attendanceRate,
  totalStudents,
  totalAlpa,
  startDate,
  endDate,
}: ExecutiveAISummaryCardProps) {
  const [summary, setSummary] = useState<string>(
    initialSummary ||
      `Tingkat kehadiran sekolah pada periode ${startDate} s/d ${endDate} tercatat sebesar ${attendanceRate.toFixed(
        1
      )}% dengan ${totalStudents} siswa terdaftar. Tingkat ketidakhadiran tanpa keterangan (Alpa) terakumulasi sebanyak ${totalAlpa} kejadian yang memerlukan pembinaan kolaboratif antara wali kelas dan guru BK.`
  );

  const [recommendations, setRecommendations] = useState<string[]>(
    initialRecommendations || [
      'Lakukan supervisi terhadap wali kelas untuk menindaklanjuti siswa dengan akumulasi alpa melalui WhatsApp.',
      'Apresiasi kelas-kelas dengan persentase kehadiran di atas ambang batas 95% untuk memotivasi iklim belajar positif.',
      'Adakan koordinasi mingguan antara Guru BK dan Wali Kelas untuk pendampingan siswa yang terdeteksi EWS.',
    ]
  );

  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );

  async function handleRefreshAI() {
    setLoading(true);
    try {
      const res = await fetch('/api/principal/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI service.');
      }

      const json = await res.json();
      if (json.executiveSummary) {
        setSummary(json.executiveSummary);
        if (json.generalRecommendations) {
          setRecommendations(json.generalRecommendations);
        }
        setIsFallback(Boolean(json.isFallback));
        setLastUpdated(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch {
      setIsFallback(true);
      setSummary(
        'Ringkasan AI sementara tidak tersedia. Data statistik di bawah tetap valid dan akurat.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm relative overflow-hidden transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
              Ringkasan Naratif & Rekomendasi Eksekutif AI
            </h3>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
              Analisis tren presensi otomatis & panduan pembinaan non-punitif (Pembaruan: {lastUpdated} WIB)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshAI}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#071325] hover:bg-slate-100 dark:hover:bg-[#11233B] text-[#172944] dark:text-[#EAF5FF] text-xs font-bold transition-all border border-[#E4EBF6] dark:border-[#1D3756] disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Menganalisis...' : 'Perbarui Narasi AI'}</span>
        </button>
      </div>

      {/* Fallback Notice if triggered */}
      {isFallback && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            Mode fail-safe aktif: Menggunakan ringkasan data deterministik sistem.
          </span>
        </div>
      )}

      {/* Executive Summary Paragraph */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] mb-4">
        <p className="text-xs leading-relaxed text-[#172944] dark:text-[#EAF5FF] font-sans font-medium">
          {summary}
        </p>
      </div>

      {/* Managerial Recommendations */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#72849D] dark:text-[#91A9C6] mb-2.5">
          Rekomendasi Tindak Lanjut Manajerial
        </h4>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-[#172944] dark:text-[#EAF5FF] bg-slate-50 dark:bg-[#071325] p-3 rounded-xl border border-[#E4EBF6] dark:border-[#1D3756]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#35E6BD] shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
