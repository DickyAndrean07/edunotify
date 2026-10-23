'use client';

import React, { useState, useMemo } from 'react';
import {
  ClassEWSOverview,
  StudentEWSResult,
  EWSFilterTab,
} from './types';
import { StudentEWSCard } from './StudentEWSCard';
import { AIRecommendationSection } from './AIRecommendationSection';
import {
  AlertTriangle,
  Flame,
  Calendar,
  TrendingDown,
  Clock,
  Search,
  CheckCircle,
} from 'lucide-react';

interface EarlyWarningDashboardProps {
  overview: ClassEWSOverview;
  onRefreshAI?: () => Promise<void> | void;
  isLoadingAI?: boolean;
  onStudentAction?: (student: StudentEWSResult) => void;
  className?: string;
}

export function EarlyWarningDashboard({
  overview,
  onRefreshAI,
  isLoadingAI = false,
  onStudentAction,
  className = '',
}: EarlyWarningDashboardProps) {
  const [activeTab, setActiveTab] = useState<EWSFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lookup map for AI guidance per studentId
  const aiGuidanceMap = useMemo(() => {
    const map = new Map<string, any>();
    if (overview.aiInsight?.actionableGuidance) {
      for (const item of overview.aiInsight.actionableGuidance) {
        if (item.studentId) {
          map.set(item.studentId, item);
        }
      }
    }
    return map;
  }, [overview.aiInsight]);

  // Filter students based on tab and search
  const filteredStudents = useMemo(() => {
    return overview.students.filter((student) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesNis = student.nis.toLowerCase().includes(q);
        if (!matchesName && !matchesNis) return false;
      }

      // Tab filters
      switch (activeTab) {
        case 'TINGGI':
          return student.highestSeverity === 'TINGGI';
        case 'SEDANG':
          return student.highestSeverity === 'SEDANG';
        case 'COLD_START':
          return student.coldStartProtected;
        case 'ALL':
        default:
          return student.triggeredCount > 0 || student.coldStartProtected;
      }
    });
  }, [overview.students, activeTab, searchQuery]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total At Risk */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
            <span className="text-xs font-semibold">Siswa Terindikasi EWS</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF]">
            {overview.studentsAtRiskCount}
            <span className="text-xs text-[#72849D] dark:text-[#91A9C6] font-sans ml-1 font-medium">
              / {overview.totalStudents}
            </span>
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            Rata-rata: {overview.averageAttendanceRate.toFixed(1)}%
          </div>
        </div>

        {/* Alpa Streak (Tinggi) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-rose-200 dark:border-rose-900/40 shadow-sm bg-gradient-to-br from-rose-500/5 to-transparent">
          <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-[#FF7087]">Alpa Beruntun</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-[#FF7087]">
            {overview.streakAlertCount}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-[#FF7087]/80 mt-1 font-medium">
            Urgensi Tinggi (≥ 2 hari)
          </div>
        </div>

        {/* Trend Drop (Tinggi) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-rose-200 dark:border-rose-900/40 shadow-sm bg-gradient-to-br from-rose-500/5 to-transparent">
          <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-[#FF7087]">Drop Kehadiran</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-[#FF7087]">
            {overview.trendDropAlertCount}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-[#FF7087]/80 mt-1 font-medium">
            Urgensi Tinggi (≥ 15%)
          </div>
        </div>

        {/* Day Pattern (Sedang) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-amber-200 dark:border-amber-900/40 shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-[#FFAA00]">Pola Hari Tertentu</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-[#FFAA00]">
            {overview.patternAlertCount}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-[#FFAA00]/80 mt-1 font-medium">
            Urgensi Sedang (≥ 70%)
          </div>
        </div>

        {/* Cold Start Protection (<14 days) */}
        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
            <span className="text-xs font-semibold">Proteksi Cold-Start</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF]">
            {overview.coldStartCount}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            Historis &lt; 14 hari aktif
          </div>
        </div>
      </div>

      {/* 2. AI Recommendation Section */}
      <AIRecommendationSection
        aiInsight={overview.aiInsight}
        isLoading={isLoadingAI}
        onRefreshAI={onRefreshAI}
      />

      {/* 3. Search & Tab Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-[#11233B] text-[#1351C6] dark:text-[#04B9E8] shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            Semua Perhatian ({overview.studentsAtRiskCount + overview.coldStartCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TINGGI')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'TINGGI'
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800 shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            Urgensi Tinggi ({overview.streakAlertCount + overview.trendDropAlertCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SEDANG')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'SEDANG'
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800 shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            Urgensi Sedang ({overview.monthlyAlertCount + overview.patternAlertCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COLD_START')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'COLD_START'
                ? 'bg-white dark:bg-[#11233B] text-[#1351C6] dark:text-[#04B9E8] shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            Cold-Start ({overview.coldStartCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#72849D] dark:text-[#91A9C6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau NIS..."
            className="w-full bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8]"
          />
        </div>
      </div>

      {/* 4. Student EWS Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-center shadow-sm">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-[#35E6BD] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
            Tidak Ada Peringatan Dini
          </h4>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            {searchQuery
              ? 'Tidak ada siswa yang cocok dengan pencarian kata kunci.'
              : 'Semua siswa dalam kategori ini memiliki catatan presensi prima.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <StudentEWSCard
              key={student.studentId}
              student={student}
              aiGuidance={aiGuidanceMap.get(student.studentId)}
              onActionClick={onStudentAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
