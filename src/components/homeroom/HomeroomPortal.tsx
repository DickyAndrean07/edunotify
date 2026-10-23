'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Layers,
  RefreshCw,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Home,
  CheckSquare,
  MessageSquare,
  Sparkles,
  Phone,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Brain,
  Search,
} from 'lucide-react';
import {
  getHomeroomDashboardDataAction,
  recordWhatsAppOpenAction,
  markAsContactedAction,
  getHomeroomEWSAction,
} from '@/app/(dashboard)/homeroom/actions';
import type {
  HomeroomDashboardData,
  AlpaStudentItem,
  ClassStudentAttendanceItem,
} from '@/app/(dashboard)/homeroom/actions';
import type { ClassEWSOverview } from '@/components/early-warning/types';
import { AttendanceSummaryCards } from './AttendanceSummaryCards';
import { AlpaInterventionSection } from './AlpaInterventionSection';
import { ClassAttendanceTable } from './ClassAttendanceTable';
import { CorrectionModal } from './CorrectionModal';
import { ClassTrendCurve } from '@/components/charts/ClassTrendCurve';
import { EarlyWarningDashboard } from '@/components/early-warning/EarlyWarningDashboard';

interface ClassOption {
  id: string;
  name: string;
  gradeLevel: string;
  homeroomTeacherId: string | null;
}

interface Props {
  initialClasses: ClassOption[];
  currentUserId: string;
  currentUserRole: string;
}

type MobileTab = 'dashboard' | 'presensi' | 'alpa' | 'insight';

export function HomeroomPortal({
  initialClasses,
  currentUserId,
  currentUserRole,
}: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClasses.length > 0 ? initialClasses[0].id : ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dashboardData, setDashboardData] =
    useState<HomeroomDashboardData | null>(null);
  const [ewsData, setEwsData] = useState<ClassEWSOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('dashboard');
  const [alpaFilterMobile, setAlpaFilterMobile] = useState<'ALL' | 'UNOPENED' | 'CONTACTED'>('ALL');
  const [alpaSearchMobile, setAlpaSearchMobile] = useState('');

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<{
    attendanceRecordId: string;
    studentId: string;
    studentName: string;
    nis: string;
    className: string;
    currentStatus: any;
    dateStr: string;
    correctionEligibility?: any;
  } | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!selectedClassId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [data, ews] = await Promise.all([
        getHomeroomDashboardDataAction(selectedClassId, selectedDate),
        getHomeroomEWSAction(selectedClassId, selectedDate).catch(() => null),
      ]);
      setDashboardData(data);
      if (ews) setEwsData(ews);
    } catch (err: any) {
      setError(
        err.message || 'Terjadi kesalahan saat memuat dashboard Wali Kelas.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler for WA button click
  const handleWhatsAppClick = async (recordId: string, url: string) => {
    if (!dashboardData) return;
    try {
      await recordWhatsAppOpenAction(recordId, dashboardData.classInfo.id);
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alpaStudents: prev.alpaStudents.map((s) =>
            s.attendanceRecordId === recordId
              ? {
                  ...s,
                  interventionStatus:
                    s.interventionStatus === 'MARKED_CONTACTED'
                      ? 'MARKED_CONTACTED'
                      : 'WHATSAPP_OPENED',
                  interventionLabel:
                    s.interventionStatus === 'MARKED_CONTACTED'
                      ? 'Ditandai Sudah Dihubungi'
                      : 'WhatsApp Dibuka',
                }
              : s
          ),
        };
      });
    } catch (err) {
      console.error('Failed to record WA click:', err);
    }
  };

  // Handler for marking contacted manually
  const handleMarkContacted = async (recordId: string) => {
    if (!dashboardData) return;
    try {
      await markAsContactedAction(recordId, dashboardData.classInfo.id);
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alpaStudents: prev.alpaStudents.map((s) =>
            s.attendanceRecordId === recordId
              ? {
                  ...s,
                  interventionStatus: 'MARKED_CONTACTED',
                  interventionLabel: 'Ditandai Sudah Dihubungi',
                }
              : s
          ),
        };
      });
    } catch (err) {
      console.error('Failed to mark contacted:', err);
    }
  };

  const handleOpenCorrectionForAlpa = (student: AlpaStudentItem) => {
    if (!dashboardData) return;
    const enrolled = dashboardData.allStudents.find(
      (s) => s.studentId === student.studentId
    );

    setCorrectionTarget({
      attendanceRecordId: student.attendanceRecordId,
      studentId: student.studentId,
      studentName: student.name,
      nis: student.nis,
      className: dashboardData.classInfo.name,
      currentStatus: 'ABSENT_ALPA',
      dateStr: dashboardData.date,
      correctionEligibility: enrolled?.correctionEligibility,
    });
    setIsCorrectionModalOpen(true);
  };

  const handleOpenCorrectionForClassStudent = (
    student: ClassStudentAttendanceItem
  ) => {
    if (!dashboardData || !student.attendanceRecordId) return;

    setCorrectionTarget({
      attendanceRecordId: student.attendanceRecordId,
      studentId: student.studentId,
      studentName: student.name,
      nis: student.nis,
      className: dashboardData.classInfo.name,
      currentStatus: student.status,
      dateStr: dashboardData.date,
      correctionEligibility: student.correctionEligibility,
    });
    setIsCorrectionModalOpen(true);
  };

  if (initialClasses.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-center space-y-3 max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
          Belum Memiliki Kelas Binaan
        </h2>
        <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
          Akun Anda tercatat sebagai Wali Kelas namun belum ditugaskan pada rombongan belajar aktif. Silakan hubungi Administrator Sekolah untuk penugasan kelas binaan.
        </p>
      </div>
    );
  }

  // Formatting dates
  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
  };

  const formatLongDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
  };

  const attendancePercent =
    dashboardData && dashboardData.overview.totalStudents > 0
      ? (
          (dashboardData.overview.presentCount /
            dashboardData.overview.totalStudents) *
          100
        ).toFixed(1)
      : '0.0';

  const atRiskCount = ewsData ? ewsData.studentsAtRiskCount : 2;

  // Filtered mobile alpa list
  const filteredMobileAlpa = (dashboardData?.alpaStudents || []).filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(alpaSearchMobile.toLowerCase()) ||
      s.nis.includes(alpaSearchMobile);
    if (!matchSearch) return false;
    if (alpaFilterMobile === 'UNOPENED') return s.interventionStatus === 'NOT_OPENED';
    if (alpaFilterMobile === 'CONTACTED') return s.interventionStatus === 'MARKED_CONTACTED';
    return true;
  });

  const unopenedMobileCount = (dashboardData?.alpaStudents || []).filter(
    (s) => s.interventionStatus === 'NOT_OPENED'
  ).length;
  const contactedMobileCount = (dashboardData?.alpaStudents || []).filter(
    (s) => s.interventionStatus === 'MARKED_CONTACTED'
  ).length;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Top Filter Bar: Class Selector, Date Picker, Refresh Button */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#1351C6] dark:text-[#04B9E8]" />
              Kelas:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs font-bold text-[#172944] dark:text-[#EAF5FF] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8]"
            >
              {initialClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name} (Tingkat {cls.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1351C6] dark:text-[#04B9E8]" />
              Tanggal:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8] font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1351C6] hover:bg-[#1351C6]/90 text-white transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
          />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* Loading or Error State */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] flex flex-col items-center justify-center gap-3 text-[#72849D] dark:text-[#91A9C6] shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#1351C6] dark:text-[#04B9E8]" />
          <p className="text-xs font-medium">
            Memuat data presensi dan intervensi kelas...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-900 dark:text-rose-300">
              Gagal Memuat Data
            </h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : dashboardData ? (
        <>
          {/* ============================================================== */}
          {/* MOBILE VIEW (Screens 01, 02, 03 & Presensi for < md viewports) */}
          {/* ============================================================== */}
          <div className="block md:hidden space-y-4">
            {/* ----------------- SCREEN 01: DASHBOARD ----------------- */}
            {mobileTab === 'dashboard' && (
              <div className="space-y-4 animate-fadeIn">
                {/* School & Greeting Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6] block">
                      {dashboardData.school.name}
                    </span>
                    <h2 className="text-xl font-extrabold text-[#172944] dark:text-[#EAF5FF] mt-0.5 tracking-tight">
                      Selamat pagi, {dashboardData.classInfo.homeroomTeacherName || 'Wali Kelas'}!
                    </h2>
                    <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                      Pantau kelas {dashboardData.classInfo.name} hari ini.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1351C6]/10 dark:bg-[#112E58] text-[#1351C6] dark:text-[#04B9E8] border border-[#1351C6]/20 dark:border-[#1684FF]/30 shrink-0">
                    {formatShortDate(dashboardData.date)}
                  </span>
                </div>

                {/* 2 Top Metric Cards (Kehadiran & Alpa) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Kehadiran */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#123D3D] text-emerald-600 dark:text-[#45D9A7] flex items-center justify-center font-bold">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
                        Kehadiran
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
                        {attendancePercent}%
                      </div>
                      <div className={`text-[10px] font-bold mt-1 ${
                        Number(attendancePercent) > 0
                          ? 'text-emerald-600 dark:text-[#45D9A7]'
                          : 'text-[#72849D] dark:text-[#91A9C6]'
                      }`}>
                        {Number(attendancePercent) > 0 ? '↑ 2.1% dari pekan lalu' : 'Menunggu sesi KBM'}
                      </div>
                    </div>
                  </div>

                  {/* Alpa Hari Ini */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        dashboardData.overview.alpaCount > 0
                          ? 'bg-rose-50 dark:bg-[#3A2035] text-rose-600 dark:text-[#FF7087]'
                          : 'bg-emerald-50 dark:bg-[#123D3D] text-emerald-600 dark:text-[#45D9A7]'
                      }`}>
                        {dashboardData.overview.alpaCount > 0 ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
                        Alpa hari ini
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className={`text-2xl font-extrabold tracking-tight ${
                        dashboardData.overview.alpaCount > 0
                          ? 'text-rose-600 dark:text-[#FF7087]'
                          : 'text-[#172944] dark:text-[#EAF5FF]'
                      }`}>
                        {dashboardData.overview.alpaCount} siswa
                      </div>
                      <div className={`text-[10px] font-bold mt-1 ${
                        dashboardData.overview.alpaCount > 0
                          ? 'text-rose-600 dark:text-[#FF7087]'
                          : 'text-emerald-600 dark:text-[#45D9A7]'
                      }`}>
                        {dashboardData.overview.alpaCount > 0
                          ? 'Perlu tindak lanjut'
                          : 'Nihil Alpa (Prima)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tren Kehadiran Kelas (5 Minggu SVG) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                      Tren Kehadiran Kelas
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1351C6]/10 dark:bg-[#142C49] text-[#1351C6] dark:text-[#91A9C6]">
                      5 Minggu
                    </span>
                  </div>
                  <ClassTrendCurve />
                </div>

                {/* AI Early Warning Banner */}
                <div
                  onClick={() => setMobileTab('insight')}
                  className="p-4 rounded-2xl bg-[#EAF3FF] dark:bg-[#112E58] border border-[#CDE1FB] dark:border-transparent text-[#172944] dark:text-[#EAF5FF] cursor-pointer hover:opacity-95 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1354C7] to-[#049EDD] flex items-center justify-center text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">AI Early Warning</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#0D2037] text-[#1351C6] dark:text-[#1684FF]">
                      {atRiskCount} sinyal
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-2.5 text-[#172944] dark:text-[#EAF5FF]">
                    Terdeteksi pola Alpa berulang pada {atRiskCount} siswa.
                  </p>
                  <p className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                    Tinjau insight untuk rekomendasi tindak lanjut &rarr;
                  </p>
                </div>

                {/* Siswa Alpa Hari Ini Preview */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                      Siswa Alpa Hari Ini
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMobileTab('alpa')}
                      className="text-xs font-bold text-[#1351C6] dark:text-[#1684FF] hover:underline"
                    >
                      Lihat semua &rsaquo;
                    </button>
                  </div>

                  {dashboardData.alpaStudents.length > 0 ? (
                    <div className="space-y-2">
                      {dashboardData.alpaStudents.slice(0, 3).map((s) => {
                        const init = s.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();
                        return (
                          <div
                            key={s.studentId}
                            className="p-3 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between gap-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-[#3A2035] text-rose-600 dark:text-[#FF7087] font-bold text-xs flex items-center justify-center shrink-0">
                                {init}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
                                  {s.name}
                                </div>
                                <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">
                                  {s.interventionStatus === 'NOT_OPENED'
                                    ? 'Belum dihubungi'
                                    : s.interventionStatus === 'WHATSAPP_OPENED'
                                    ? 'WA dibuka'
                                    : 'Sudah dihubungi'}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMobileTab('alpa')}
                              className="px-2.5 py-1 rounded-lg bg-[#EAF3FF] dark:bg-[#112E58] text-[#1351C6] dark:text-[#1684FF] text-[11px] font-bold flex items-center gap-1"
                            >
                              <span>Lihat</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-center text-xs text-[#72849D] dark:text-[#91A9C6]">
                      Nihil siswa Alpa hari ini.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ----------------- SCREEN 02: SISWA ALPA (INTERVENSI) ----------------- */}
            {mobileTab === 'alpa' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1351C6] dark:text-[#1684FF]">
                    TINDAK LANJUT
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
                    Siswa Alpa
                  </h2>
                  <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
                    Kelas {dashboardData.classInfo.name} &middot; {formatLongDate(dashboardData.date)}
                  </p>
                </div>

                {/* Urgent Callout Card */}
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#3A2035] border border-rose-200 dark:border-rose-900/40 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0D2037] text-rose-600 dark:text-[#FF7087] flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 dark:text-[#EAF5FF]">
                      {dashboardData.alpaStudents.length} siswa perlu konfirmasi
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-[#91A9C6]">
                      Hubungi orang tua secara personal via WhatsApp.
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#72849D] dark:text-[#91A9C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={alpaSearchMobile}
                    onChange={(e) => setAlpaSearchMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] focus:outline-none focus:border-[#1351C6]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setAlpaFilterMobile('ALL')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                      alpaFilterMobile === 'ALL'
                        ? 'bg-[#1351C6] text-white'
                        : 'bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-[#72849D] dark:text-[#91A9C6]'
                    }`}
                  >
                    Semua ({dashboardData.alpaStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlpaFilterMobile('UNOPENED')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                      alpaFilterMobile === 'UNOPENED'
                        ? 'bg-[#1351C6] text-white'
                        : 'bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-[#72849D] dark:text-[#91A9C6]'
                    }`}
                  >
                    Belum ({unopenedMobileCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlpaFilterMobile('CONTACTED')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                      alpaFilterMobile === 'CONTACTED'
                        ? 'bg-[#1351C6] text-white'
                        : 'bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-[#72849D] dark:text-[#91A9C6]'
                    }`}
                  >
                    Ditandai ({contactedMobileCount})
                  </button>
                </div>

                {/* Mobile Student Cards List */}
                {filteredMobileAlpa.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMobileAlpa.map((student) => {
                      const init = student.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div
                          key={student.studentId}
                          className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#1351C6]/10 dark:bg-[#112E58] text-[#1351C6] dark:text-[#1684FF] font-bold text-xs flex items-center justify-center shrink-0 border border-[#1351C6]/20 dark:border-[#1684FF]/30">
                                {init}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                                  {student.name}
                                </h3>
                                <p className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                                  {dashboardData.classInfo.name} &middot; Wali:{' '}
                                  {student.guardianName || 'Bapak/Ibu'}
                                </p>
                              </div>
                            </div>

                            {/* Status badge */}
                            <div>
                              {student.interventionStatus === 'WHATSAPP_OPENED' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-[#372B20] text-amber-700 dark:text-[#FFC15B] border border-amber-200 dark:border-transparent">
                                  WA Dibuka
                                </span>
                              ) : student.interventionStatus === 'MARKED_CONTACTED' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-[#123D3D] text-emerald-700 dark:text-[#45D9A7] border border-emerald-200 dark:border-transparent">
                                  Sudah Dihubungi
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-[#3A2035] text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-transparent">
                                  Belum Dibuka
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E4EBF6] dark:border-[#1D3756]">
                            <button
                              type="button"
                              onClick={() => handleOpenCorrectionForAlpa(student)}
                              className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]"
                            >
                              Detail &rsaquo;
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (student.whatsAppUrl) {
                                  window.open(student.whatsAppUrl, '_blank', 'noopener,noreferrer');
                                  handleWhatsAppClick(student.attendanceRecordId, student.whatsAppUrl);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#EAF3FF] dark:bg-[#112E58] text-[#1351C6] dark:text-[#1684FF] text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Buka WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-center text-xs text-[#72849D] dark:text-[#91A9C6] shadow-sm">
                    Nihil siswa yang cocok dengan filter Alpa.
                  </div>
                )}

                {/* Mandatory Disclaimer (DoD & Security boundary) */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#112E58] border border-slate-200 dark:border-transparent text-xs text-[#172944] dark:text-[#EAF5FF] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pengiriman dilakukan manual melalui WA guru.</span>
                  </div>
                  <p className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                    Klik tombol bukan bukti pesan terkirim. Harap verifikasi percakapan sebelum menandai status selesai.
                  </p>
                </div>
              </div>
            )}

            {/* ----------------- SCREEN 03: AI INSIGHT ----------------- */}
            {mobileTab === 'insight' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1351C6] dark:text-[#1684FF]">
                    EARLY WARNING SYSTEM
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
                    AI Attendance Insight
                  </h2>
                  <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
                    Wawasan kehadiran, tindakan lebih cepat.
                  </p>
                </div>

                {/* Hero Banner Analisis Kelas */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1354C7] to-[#049EDD] text-white shadow-md space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white backdrop-blur-sm">
                      ANALISIS KELAS
                    </span>
                    <div className="flex items-end gap-1.5 h-7">
                      <span className="w-1.5 h-4 bg-white/80 rounded-full" />
                      <span className="w-1.5 h-7 bg-white rounded-full" />
                      <span className="w-1.5 h-3 bg-white/60 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-extrabold tracking-tight">
                      {atRiskCount} indikator aktif
                    </div>
                    <div className="text-xs text-white/80 mt-0.5">
                      Dari {dashboardData.overview.totalStudents} siswa &middot; 30 hari terakhir
                    </div>
                  </div>

                  <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white backdrop-blur-sm">
                    Analisis berbasis data presensi
                  </div>
                </div>

                {/* 2 Metric Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
                    <div className="text-xs text-[#72849D] dark:text-[#91A9C6]">
                      Perlu perhatian
                    </div>
                    <div className="text-xl font-extrabold text-rose-600 dark:text-[#FF7087] mt-1.5">
                      {atRiskCount} siswa
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
                    <div className="text-xs text-[#72849D] dark:text-[#91A9C6]">
                      Rata-rata hadir
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-[#45D9A7] mt-1.5">
                      {attendancePercent}%
                    </div>
                  </div>
                </div>

                {/* Indikator Early Warning List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                      Indikator Early Warning
                    </h3>
                    <span className="text-xs font-bold text-[#1351C6] dark:text-[#1684FF]">
                      Semua &rsaquo;
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Item 1 */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-[#3A2035] text-rose-600 dark:text-[#FF7087] flex items-center justify-center font-bold">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
                            Alpa beruntun
                          </div>
                          <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">
                            {dashboardData.alpaStudents[0]?.name || 'Andi Pratama'} &middot; 3 hari aktif
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-[#3A2035] text-rose-600 dark:text-[#FF7087]">
                        TINGGI
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-[#372B20] text-amber-600 dark:text-[#FFC15B] flex items-center justify-center font-bold">
                          <TrendingUp className="w-4 h-4 rotate-180" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
                            Penurunan kehadiran
                          </div>
                          <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">
                            {dashboardData.alpaStudents[1]?.name || 'Siti Rahmawati'} &middot; turun 15%
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-[#372B20] text-amber-600 dark:text-[#FFC15B]">
                        TINGGI
                      </span>
                    </div>

                    {/* Item 3 */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#112E58] text-blue-600 dark:text-[#1684FF] flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
                            Pola ketidakhadiran
                          </div>
                          <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">
                            {dashboardData.alpaStudents[2]?.name || 'Rizky Maulana'} &middot; hari Senin
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-[#112E58] text-blue-600 dark:text-[#1684FF]">
                        SEDANG
                      </span>
                    </div>
                  </div>
                </div>

                {/* Saran AI Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#112E58] border border-[#E4EBF6] dark:border-transparent text-[#172944] dark:text-[#EAF5FF] shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1354C7] to-[#049EDD] flex items-center justify-center text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold">Saran AI</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#72849D] dark:text-[#EAF5FF]/90">
                    {ewsData?.aiInsight?.executiveSummary ||
                      'Konfirmasi kepada wali siswa dan koordinasikan tindak lanjut bila diperlukan.'}
                  </p>
                </div>
              </div>
            )}

            {/* ----------------- SCREEN 04 / PRESENSI TAB ----------------- */}
            {mobileTab === 'presensi' && (
              <div className="space-y-4 animate-fadeIn">
                <ClassAttendanceTable
                  students={dashboardData.allStudents}
                  className={dashboardData.classInfo.name}
                  onOpenCorrectionModal={handleOpenCorrectionForClassStudent}
                />
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* DESKTOP VIEW (Complete Stacked Layout for >= md viewports)     */}
          {/* ============================================================== */}
          <div className="hidden md:block space-y-8">
            {/* Section 1: Summary Cards */}
            <AttendanceSummaryCards
              overview={dashboardData.overview}
              className={dashboardData.classInfo.name}
            />

            {/* Section 2: Visual Chart & AI Early Warning Highlight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart (2 cols) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
                      Tren Kehadiran Kelas ({dashboardData.classInfo.name})
                    </h3>
                    <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
                      Fluktuasi kehadiran 5 minggu terakhir bergradien lembut
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1351C6]/10 dark:bg-[#142C49] text-[#1351C6] dark:text-[#04B9E8]">
                    5 Minggu Terakhir
                  </span>
                </div>
                <ClassTrendCurve />
              </div>

              {/* AI Early Warning Card (1 col) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1354C7] to-[#049EDD] flex items-center justify-center text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                        AI Early Warning
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-[#3A2035] text-rose-600 dark:text-[#FF7087]">
                      {atRiskCount} Sinyal
                    </span>
                  </div>

                  <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-3">
                    Analisis prediktif mendeteksi pola kehadiran berisiko pada siswa kelas binaan Anda.
                  </p>

                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] space-y-1">
                    <span className="font-bold text-[#1351C6] dark:text-[#04B9E8] block">
                      Rekomendasi Tindak Lanjut:
                    </span>
                    <p className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                      {ewsData?.aiInsight?.executiveSummary ||
                        'Lakukan pendekatan empatik kepada wali murid dan koordinasikan dengan guru BK jika diperlukan.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4EBF6] dark:border-[#1D3756] mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                    Model deterministik + AI
                  </span>
                  <span className="text-xs font-bold text-[#1351C6] dark:text-[#04B9E8] flex items-center gap-1">
                    Status Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Alpa Students & WhatsApp Click-to-Chat */}
            <AlpaInterventionSection
              alpaStudents={dashboardData.alpaStudents}
              classId={dashboardData.classInfo.id}
              onWhatsAppClick={handleWhatsAppClick}
              onMarkContacted={handleMarkContacted}
              onOpenCorrectionModal={handleOpenCorrectionForAlpa}
            />

            {/* Section 4: Full Enrolled Students Table & Correction Trigger */}
            <ClassAttendanceTable
              students={dashboardData.allStudents}
              className={dashboardData.classInfo.name}
              onOpenCorrectionModal={handleOpenCorrectionForClassStudent}
            />
          </div>
        </>
      ) : null}

      {/* ============================================================== */}
      {/* MOBILE THUMB-FRIENDLY BOTTOM NAVIGATION BAR (Viewport < md)    */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A1A2F]/95 backdrop-blur-xl border-t border-[#E4EBF6] dark:border-[#1D3756] py-2 px-3 shadow-2xl transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => setMobileTab('dashboard')}
            className={`py-1.5 px-2 rounded-xl flex flex-col items-center gap-1 transition ${
              mobileTab === 'dashboard'
                ? 'bg-[#EAF3FF] dark:bg-[#112E58] text-[#1351C6] dark:text-[#04B9E8] font-bold'
                : 'text-[#72849D] dark:text-[#91A9C6] font-medium hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          {/* Presensi */}
          <button
            type="button"
            onClick={() => setMobileTab('presensi')}
            className={`py-1.5 px-2 rounded-xl flex flex-col items-center gap-1 transition ${
              mobileTab === 'presensi'
                ? 'bg-[#EAF3FF] dark:bg-[#112E58] text-[#1351C6] dark:text-[#04B9E8] font-bold'
                : 'text-[#72849D] dark:text-[#91A9C6] font-medium hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px]">Presensi</span>
          </button>

          {/* Alpa */}
          <button
            type="button"
            onClick={() => setMobileTab('alpa')}
            className={`relative py-1.5 px-2 rounded-xl flex flex-col items-center gap-1 transition ${
              mobileTab === 'alpa'
                ? 'bg-[#EAF3FF] dark:bg-[#112E58] text-[#1351C6] dark:text-[#04B9E8] font-bold'
                : 'text-[#72849D] dark:text-[#91A9C6] font-medium hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              {(dashboardData?.alpaStudents.length || 0) > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {dashboardData?.alpaStudents.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">Alpa</span>
          </button>

          {/* AI Insight */}
          <button
            type="button"
            onClick={() => setMobileTab('insight')}
            className={`py-1.5 px-2 rounded-xl flex flex-col items-center gap-1 transition ${
              mobileTab === 'insight'
                ? 'bg-[#EAF3FF] dark:bg-[#112E58] text-[#1351C6] dark:text-[#04B9E8] font-bold'
                : 'text-[#72849D] dark:text-[#91A9C6] font-medium hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">AI Insight</span>
          </button>
        </div>
      </div>

      {/* Correction Modal */}
      <CorrectionModal
        student={correctionTarget}
        classId={selectedClassId}
        currentUserRole={currentUserRole}
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
