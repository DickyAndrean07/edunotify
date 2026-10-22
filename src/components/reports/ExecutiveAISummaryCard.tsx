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
      // Keep existing data or display friendly fallback
      setSummary(
        'Ringkasan AI sementara tidak tersedia. Data statistik di bawah tetap valid dan akurat.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-100">
              Ringkasan Naratif & Rekomendasi Eksekutif AI
            </h3>
            <p className="text-xs text-neutral-400">
              Analisis tren presensi otomatis & panduan pembinaan non-punitif (Pembaruan: {lastUpdated} WIB)
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshAI}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors border border-neutral-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Menganalisis...' : 'Perbarui Narasi AI'}</span>
        </button>
      </div>

      {/* Fallback Notice if triggered */}
      {isFallback && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Mode fail-safe aktif: Menggunakan ringkasan data deterministik sistem.
          </span>
        </div>
      )}

      {/* Executive Summary Paragraph */}
      <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 mb-4">
        <p className="text-sm text-neutral-200 leading-relaxed font-sans">
          {summary}
        </p>
      </div>

      {/* Managerial Recommendations */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          Rekomendasi Tindak Lanjut Manajerial
        </h4>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-neutral-300 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
