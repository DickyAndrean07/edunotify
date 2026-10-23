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
        className={`p-6 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
                Analisis AI & Rekomendasi Non-Punitif
              </h3>
              <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
                Dapatkan narasi ringkasan tren dan rekomendasi pembinaan siswa berbasis AI.
              </p>
            </div>
          </div>
          {onRefreshAI && (
            <button
              type="button"
              onClick={onRefreshAI}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1351C6] to-[#04B9E8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
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
      className={`p-6 rounded-2xl border transition-all shadow-sm ${
        isFallback
          ? 'bg-amber-50/50 dark:bg-[#0D2037] border-amber-200 dark:border-amber-900/60'
          : 'bg-white dark:bg-[#0D2037] border-[#E4EBF6] dark:border-[#1D3756]'
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4EBF6] dark:border-[#1D3756]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isFallback
                ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400'
                : 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400'
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
              <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
                {isFallback
                  ? 'Status Layanan AI (Fail-Safe Fallback)'
                  : 'Ringkasan Naratif & Rekomendasi AI'}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#071325] text-[#72849D] dark:text-[#91A9C6] font-mono flex items-center gap-1 border border-[#E4EBF6] dark:border-[#1D3756]">
                <Cpu className="w-3 h-3" />
                {aiInsight?.providerUsed || 'AI Engine'}
              </span>
            </div>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5">
              Analisis berorientasi pembinaan non-punitif dan perlindungan privasi data murid.
            </p>
          </div>
        </div>

        {onRefreshAI && (
          <button
            type="button"
            onClick={onRefreshAI}
            disabled={isLoading}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#071325] hover:bg-slate-100 dark:hover:bg-[#11233B] border border-[#E4EBF6] dark:border-[#1D3756] disabled:opacity-50 text-xs font-bold text-[#172944] dark:text-[#EAF5FF] flex items-center gap-2 transition-all shadow-sm cursor-pointer"
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
        <div className="my-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900 dark:text-amber-200">
              {aiInsight?.executiveSummary}
            </div>
            <p className="text-amber-800/90 dark:text-amber-400/90 leading-relaxed">
              Sistem beroperasi dalam mode aman (fail-safe). Seluruh metrik statistik, perhitungan Alpa, dan pemicu indikator EWS dihitung 100% secara deterministik dan tetap akurat.
            </p>
            {aiInsight?.fallbackReason && (
              <div className="text-[11px] text-amber-700 dark:text-amber-400/70 font-mono mt-1">
                Keterangan: {aiInsight.fallbackReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive Summary (when not fallback) */}
      {!isFallback && aiInsight?.executiveSummary && (
        <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-[#172944] dark:text-[#EAF5FF] text-xs leading-relaxed font-medium">
          <div className="text-[11px] uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ringkasan Eksekutif</span>
          </div>
          <p>{aiInsight.executiveSummary}</p>
        </div>
      )}

      {/* General Recommendations */}
      {aiInsight?.generalRecommendations &&
        aiInsight.generalRecommendations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E4EBF6] dark:border-[#1D3756]/60">
            <div className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF] mb-2">
              Rekomendasi Tindak Lanjut Umum:
            </div>
            <ul className="space-y-1.5">
              {aiInsight.generalRecommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[#72849D] dark:text-[#91A9C6]"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
