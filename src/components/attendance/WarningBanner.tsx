import React from 'react';
import { AlertTriangle, AlertCircle, Info, CalendarX } from 'lucide-react';

interface WarningBannerProps {
  isHoliday?: boolean;
  holidayDescription?: string | null;
  isWarning12pm?: boolean;
  isUncompletedAlert?: boolean;
  isLateSubmission?: boolean;
  warningMessage?: string | null;
}

export function WarningBanner({
  isHoliday,
  holidayDescription,
  isWarning12pm,
  isUncompletedAlert,
  isLateSubmission,
  warningMessage,
}: WarningBannerProps) {
  if (isHoliday) {
    return (
      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 flex items-start gap-3">
        <CalendarX className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-purple-300">Hari Libur Sekolah: </span>
          {holidayDescription || 'Hari ini adalah hari libur (HOLIDAY). Pengisian presensi dibebaskan.'}
        </div>
      </div>
    );
  }

  if (isUncompletedAlert) {
    return (
      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-rose-300">Peringatan Akhir KBM (UNCOMPLETED_ALERT): </span>
          {warningMessage || 'Jadwal pelajaran hari ini telah berakhir dan presensi kelas belum disubmit.'}
        </div>
      </div>
    );
  }

  if (isWarning12pm) {
    return (
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-amber-300">Peringatan Pukul 12.00 WIB: </span>
          {warningMessage || 'Kelas belum mengisi presensi per 12.00 WIB. Mohon segera lakukan penginputan presensi.'}
        </div>
      </div>
    );
  }

  if (isLateSubmission) {
    return (
      <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-sky-300">Pengisian Susulan (Late Submission): </span>
          KBM hari ini telah selesai. Presensi ini akan dicatat dalam audit log sebagai pengisian susulan (is_late_submission = true).
        </div>
      </div>
    );
  }

  return null;
}
