'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Layers,
  RefreshCw,
  Loader2,
  AlertCircle,
  GraduationCap,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  getHomeroomDashboardDataAction,
  recordWhatsAppOpenAction,
  markAsContactedAction,
} from '@/app/(dashboard)/homeroom/actions';
import type {
  HomeroomDashboardData,
  AlpaStudentItem,
  ClassStudentAttendanceItem,
} from '@/app/(dashboard)/homeroom/actions';
import { AttendanceSummaryCards } from './AttendanceSummaryCards';
import { AlpaInterventionSection } from './AlpaInterventionSection';
import { ClassAttendanceTable } from './ClassAttendanceTable';
import { CorrectionModal } from './CorrectionModal';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const data = await getHomeroomDashboardDataAction(
        selectedClassId,
        selectedDate
      );
      setDashboardData(data);
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
      // Immediately reflect state in local state
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
      // Immediately reflect state in local state
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

  // Open correction modal for Alpa student item
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

  // Open correction modal for Class student item
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
      <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-3 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-neutral-100">
          Belum Memiliki Kelas Binaan
        </h2>
        <p className="text-xs text-neutral-400">
          Akun Anda tercatat sebagai Wali Kelas namun belum ditugaskan pada rombongan belajar aktif. Silakan hubungi Administrator Sekolah untuk penugasan kelas binaan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Filter Bar: Class Selector, Date Picker, Refresh Button */}
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-neutral-400" />
              Kelas:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-100 focus:outline-none focus:border-neutral-700"
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
            <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neutral-400" />
              Tanggal:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-neutral-700 font-mono"
            />
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
          />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* Loading or Error State */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-xs">Memuat data presensi dan intervensi kelas...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 flex items-start gap-3 text-rose-200 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-300">Gagal Memuat Data</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : dashboardData ? (
        <div className="space-y-8">
          {/* Section 1: Summary Cards */}
          <AttendanceSummaryCards
            overview={dashboardData.overview}
            className={dashboardData.classInfo.name}
          />

          {/* Section 2: Alpa Students & WhatsApp Click-to-Chat */}
          <AlpaInterventionSection
            alpaStudents={dashboardData.alpaStudents}
            classId={dashboardData.classInfo.id}
            onWhatsAppClick={handleWhatsAppClick}
            onMarkContacted={handleMarkContacted}
            onOpenCorrectionModal={handleOpenCorrectionForAlpa}
          />

          {/* Section 3: Full Enrolled Students Table & Correction Trigger */}
          <ClassAttendanceTable
            students={dashboardData.allStudents}
            className={dashboardData.classInfo.name}
            onOpenCorrectionModal={handleOpenCorrectionForClassStudent}
          />
        </div>
      ) : null}

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
