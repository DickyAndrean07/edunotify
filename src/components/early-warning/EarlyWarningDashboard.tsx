'use client';

import React, { useState, useMemo } from 'react';
import {
  ClassEWSOverview,
  StudentEWSResult,
  AIInsightResponse,
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
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  Info,
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
          // In ALL tab, show any student with triggered indicators or cold-start
          return student.triggeredCount > 0 || student.coldStartProtected;
      }
    });
  }, [overview.students, activeTab, searchQuery]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total At Risk */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Siswa Terindikasi EWS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {overview.studentsAtRiskCount}
            <span className="text-xs text-neutral-500 font-sans ml-1">
              / {overview.totalStudents}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Rata-rata: {overview.averageAttendanceRate.toFixed(1)}%
          </div>
        </div>

        {/* Alpa Streak (Tinggi) */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-red-900/40">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Alpa Beruntun</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {overview.streakAlertCount}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1">
            Urgensi Tinggi (≥ 2 hari)
          </div>
        </div>

        {/* Trend Drop (Tinggi) */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-red-900/40">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Drop Tren Kehadiran</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {overview.trendDropAlertCount}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1">
            Urgensi Tinggi (≥ 15%)
          </div>
        </div>

        {/* Day Pattern (Sedang) */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-900/40">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Pola Hari Tertentu</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {overview.patternAlertCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Urgensi Sedang (≥ 70%)
          </div>
        </div>

        {/* Cold Start Protection (<14 days) */}
        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Proteksi Cold-Start</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-200">
            {overview.coldStartCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
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
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Semua Perhatian ({overview.studentsAtRiskCount + overview.coldStartCount})
          </button>
          <button
            onClick={() => setActiveTab('TINGGI')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'TINGGI'
                ? 'bg-red-950/80 text-red-200 border border-red-800/80 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Urgensi Tinggi ({overview.streakAlertCount + overview.trendDropAlertCount})
          </button>
          <button
            onClick={() => setActiveTab('SEDANG')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'SEDANG'
                ? 'bg-amber-950/80 text-amber-200 border border-amber-800/80 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Urgensi Sedang ({overview.monthlyAlertCount + overview.patternAlertCount})
          </button>
          <button
            onClick={() => setActiveTab('COLD_START')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'COLD_START'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Cold-Start ({overview.coldStartCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau NIS..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {/* 4. Student EWS Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Tidak Ada Peringatan Dini
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
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
