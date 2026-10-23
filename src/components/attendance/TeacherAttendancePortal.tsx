'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  BookOpen,
  Calendar,
  Lock,
  Loader2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { RelayBadge } from './RelayBadge';
import { WarningBanner } from './WarningBanner';
import { AttendanceSheet, StudentItem } from './AttendanceSheet';

interface TeacherScheduleItem {
  schedule: {
    id: string;
    classId: string;
    className: string;
    gradeLevel: string;
    subjectName: string;
    periodOrder: number;
    startTime: string;
    endTime: string;
  };
  access: {
    authorized: boolean;
    canEdit: boolean;
    isReadOnly: boolean;
    isLateSubmission: boolean;
    reason?: string;
    message?: string;
    session?: any;
    submittedByName?: string | null;
  };
  overview: {
    classId: string;
    className: string;
    date: string;
    isHoliday: boolean;
    sessionStatus: 'NOT_CREATED' | 'DRAFT' | 'SUBMITTED' | 'UNCOMPLETED_ALERT';
    isSubmitted: boolean;
    isWarning12pm: boolean;
    isUncompletedAlert: boolean;
    isLateSubmission: boolean;
    warningMessage?: string | null;
    submittedBy?: { id: string; name: string } | null;
    submittedAt?: string | null;
    totalStudents: number;
    presentCount: number;
    sickCount: number;
    permitCount: number;
    alpaCount: number;
    unrecordedCount: number;
  };
}

interface Props {
  initialDate?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    schoolId: string;
  };
}

export function TeacherAttendancePortal({ initialDate, user }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [schedules, setSchedules] = useState<TeacherScheduleItem[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayDescription, setHolidayDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active sheet modal state
  const [activeSheet, setActiveSheet] = useState<{
    isOpen: boolean;
    classId: string;
    className: string;
    subjectName: string;
    periodOrder: number;
    isReadOnly: boolean;
    sessionStatus: string;
    submittedByName?: string | null;
    submittedAt?: string | null;
    isLateSubmission: boolean;
    isWarning12pm: boolean;
    isUncompletedAlert: boolean;
    records: StudentItem[];
  } | null>(null);
  const [isSheetLoading, setIsSheetLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/today?date=${selectedDate}`);
      if (!res.ok) {
        throw new Error('Gagal memuat jadwal mengajar.');
      }
      const data = await res.json();
      setSchedules(data.schedules || []);
      setIsHoliday(data.isHoliday || false);
      setHolidayDescription(data.holidayDescription || null);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat jadwal.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleOpenAttendance = async (item: TeacherScheduleItem) => {
    setIsSheetLoading(true);
    try {
      const res = await fetch(
        `/api/attendance/session?classId=${item.schedule.classId}&date=${selectedDate}`
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal memuat lembar presensi kelas.');
        return;
      }

      setActiveSheet({
        isOpen: true,
        classId: item.schedule.classId,
        className: item.schedule.className,
        subjectName: item.schedule.subjectName,
        periodOrder: item.schedule.periodOrder,
        isReadOnly: data.access?.isReadOnly ?? false,
        sessionStatus: data.session?.status || 'DRAFT',
        submittedByName:
          data.access?.submittedByName || data.overview?.submittedBy?.name || null,
        submittedAt: data.session?.submittedAt || null,
        isLateSubmission: data.access?.isLateSubmission ?? false,
        isWarning12pm: data.overview?.isWarning12pm ?? false,
        isUncompletedAlert: data.overview?.isUncompletedAlert ?? false,
        records: data.records || [],
      });
    } catch (err: any) {
      alert(err.message || 'Terjadi galat saat memuat data siswa.');
    } finally {
      setIsSheetLoading(false);
    }
  };

  const any12pmWarning = schedules.find((s) => s.overview?.isWarning12pm);
  const anyUncompleted = schedules.find((s) => s.overview?.isUncompletedAlert);

  return (
    <div className="space-y-6">
      {/* Top Filter & Refresh bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#1351C6] dark:text-[#04B9E8]" />
          <div>
            <div className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">Tanggal KBM:</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-[#172944] dark:text-[#EAF5FF] text-xs font-bold font-mono rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#1351C6]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSchedules}
          disabled={isLoading}
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#071325] hover:bg-slate-100 dark:hover:bg-[#11233B] text-[#172944] dark:text-[#EAF5FF] border border-[#E4EBF6] dark:border-[#1D3756] transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Global Warning Banners */}
      {isHoliday && (
        <WarningBanner isHoliday={true} holidayDescription={holidayDescription} />
      )}

      {!isHoliday && anyUncompleted && (
        <WarningBanner
          isUncompletedAlert={true}
          warningMessage={`Kelas ${anyUncompleted.schedule.className} belum mengisi presensi hingga akhir jam KBM.`}
        />
      )}

      {!isHoliday && !anyUncompleted && any12pmWarning && (
        <WarningBanner
          isWarning12pm={true}
          warningMessage={`Kelas ${any12pmWarning.schedule.className} belum mengisi presensi per 12.00 WIB.`}
        />
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Schedules Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#72849D] dark:text-[#91A9C6] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1351C6] dark:text-[#04B9E8]" />
          <p className="text-xs font-medium">Memuat jadwal mengajar hari ini...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <BookOpen className="w-10 h-10 text-[#72849D] dark:text-[#91A9C6] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
            Tidak Ada Jadwal Mengajar
          </h3>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 max-w-md mx-auto">
            Anda tidak memiliki jadwal mengajar terdaftar pada tanggal yang dipilih ({selectedDate}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((item) => {
            const { schedule, access, overview } = item;
            const isDone = overview.isSubmitted;
            const canFill = access.canEdit;

            return (
              <div
                key={schedule.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#CBD8EA] dark:hover:border-[#2D4E75] transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#1351C6] dark:text-[#04B9E8] uppercase tracking-wider">
                        Jam ke-{schedule.periodOrder}
                      </span>
                      <h3 className="text-xl font-extrabold text-[#172944] dark:text-[#EAF5FF] mt-0.5">
                        {schedule.className}
                      </h3>
                    </div>

                    <RelayBadge
                      sessionStatus={overview.sessionStatus}
                      isReadOnly={access.isReadOnly}
                      canEdit={access.canEdit}
                      periodOrder={schedule.periodOrder}
                      isLateSubmission={overview.isLateSubmission}
                    />
                  </div>

                  <div className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                    {schedule.subjectName}
                  </div>

                  <div className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{schedule.startTime} – {schedule.endTime} WIB</span>
                  </div>

                  {/* Overview Stats pill if submitted */}
                  {isDone ? (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs">
                      <div className="text-[#72849D] dark:text-[#91A9C6] mb-1.5 flex items-center justify-between font-semibold">
                        <span>Status Rekap:</span>
                        <span className="text-emerald-600 dark:text-[#35E6BD]">Tersimpan</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold font-mono">
                        <span className="text-emerald-600 dark:text-[#35E6BD]">H: {overview.presentCount}</span>
                        <span className="text-[#94A3B8]">•</span>
                        <span className="text-blue-600 dark:text-[#04B9E8]">S: {overview.sickCount}</span>
                        <span className="text-[#94A3B8]">•</span>
                        <span className="text-amber-600 dark:text-[#FFAA00]">I: {overview.permitCount}</span>
                        <span className="text-[#94A3B8]">•</span>
                        <span className="text-rose-600 dark:text-[#FF7087]">A: {overview.alpaCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#72849D] dark:text-[#91A9C6]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#72849D]" />
                        <span>Total Siswa: <strong className="text-[#172944] dark:text-[#EAF5FF]">{overview.totalStudents}</strong></span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-1">
                        {access.message || 'Presensi kelas belum disubmit.'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-[#E4EBF6] dark:border-[#1D3756]">
                  <button
                    type="button"
                    disabled={isSheetLoading || isHoliday}
                    onClick={() => handleOpenAttendance(item)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      isDone
                        ? 'bg-slate-100 dark:bg-[#11233B] hover:bg-slate-200 dark:hover:bg-[#142C49] text-[#172944] dark:text-[#EAF5FF] border border-[#E4EBF6] dark:border-[#1D3756]'
                        : canFill
                        ? 'bg-gradient-to-r from-[#1351C6] to-[#04B9E8] hover:opacity-95 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-[#071325] text-slate-400 dark:text-[#91A9C6]'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Lihat Presensi (Read-Only)</span>
                      </>
                    ) : canFill ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Isi Presensi Estafet</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Buka Detail Jadwal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Attendance Sheet Modal */}
      {activeSheet && (
        <AttendanceSheet
          isOpen={activeSheet.isOpen}
          onClose={() => setActiveSheet(null)}
          onSuccess={() => {
            fetchSchedules();
          }}
          classId={activeSheet.classId}
          className={activeSheet.className}
          subjectName={activeSheet.subjectName}
          date={selectedDate}
          periodOrder={activeSheet.periodOrder}
          initialRecords={activeSheet.records}
          isReadOnly={activeSheet.isReadOnly}
          sessionStatus={activeSheet.sessionStatus}
          submittedByName={activeSheet.submittedByName}
          submittedAt={activeSheet.submittedAt}
          isLateSubmission={activeSheet.isLateSubmission}
          isWarning12pm={activeSheet.isWarning12pm}
          isUncompletedAlert={activeSheet.isUncompletedAlert}
        />
      )}
    </div>
  );
}
