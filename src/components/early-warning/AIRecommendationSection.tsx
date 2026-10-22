'use client';

import React from 'react';
import { AIInsightResponse } from './types';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface AIRecommendationSectionProps {
  aiInsight?: AIInsightResponse | null;
  isLoading?: boolean;
  onRefreshAI?: () => void;
  className?: string;
}

export function AIRecommendationSection({
  aiInsight,
  isLoading = false,
  onRefreshAI,
  className = '',
}: AIRecommendationSectionProps) {
  if (!aiInsight && !isLoading) {
    return (
      <div
        className={`p-6 rounded-2xl bg-neutral-900 border border-neutral-800 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">
                Analisis AI & Rekomendasi Non-Punitif
              </h3>
              <p className="text-xs text-neutral-400">
                Dapatkan narasi ringkasan tren dan rekomendasi pembinaan siswa berbasis AI.
              </p>
            </div>
          </div>
          {onRefreshAI && (
            <button
              onClick={onRefreshAI}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Analisis AI</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isFallback = aiInsight?.isFallback;

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isFallback
          ? 'bg-neutral-900/90 border-amber-900/60'
          : 'bg-gradient-to-b from-purple-950/20 via-neutral-900 to-neutral-900 border-purple-900/50'
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isFallback
                ? 'bg-amber-950/50 border border-amber-800/60 text-amber-400'
                : 'bg-purple-950/60 border border-purple-800/60 text-purple-400'
            }`}
          >
            {isFallback ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-100">
                {isFallback
                  ? 'Status Layanan AI (Fail-Safe Fallback)'
                  : 'Ringkasan Naratif & Rekomendasi AI'}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {aiInsight?.providerUsed || 'AI Engine'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Analisis berorientasi pembinaan non-punitif dan perlindungan privasi data murid.
            </p>
          </div>
        </div>

        {onRefreshAI && (
          <button
            onClick={onRefreshAI}
            disabled={isLoading}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium text-neutral-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>{isLoading ? 'Menganalisis...' : 'Perbarui Analisis'}</span>
          </button>
        )}
      </div>

      {/* Fallback Notice Banner if AI was unreachable */}
      {isFallback && (
        <div className="my-4 p-4 rounded-xl bg-amber-950/30 border border-amber-800/70 text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-200">
              {aiInsight?.executiveSummary}
            </div>
            <p className="text-amber-400/90 leading-relaxed">
              Sistem beroperasi dalam mode aman (fail-safe). Seluruh metrik statistik, perhitungan Alpa, dan pemicu indikator EWS dihitung 100% secara deterministik dan tetap akurat.
            </p>
            {aiInsight?.fallbackReason && (
              <div className="text-[11px] text-amber-400/70 font-mono mt-1">
                Keterangan: {aiInsight.fallbackReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive Summary (when not fallback) */}
      {!isFallback && aiInsight?.executiveSummary && (
        <div className="my-4 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-200 text-xs leading-relaxed">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-purple-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ringkasan Eksekutif</span>
          </div>
          <p>{aiInsight.executiveSummary}</p>
        </div>
      )}

      {/* General Recommendations */}
      {aiInsight?.generalRecommendations &&
        aiInsight.generalRecommendations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-neutral-800/60">
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Rekomendasi Tindak Lanjut Umum:
            </div>
            <ul className="space-y-1.5">
              {aiInsight.generalRecommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-neutral-400"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
