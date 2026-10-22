'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  setCalendarAction,
  deleteCalendarAction,
} from '@/app/(dashboard)/admin/actions';
import { useRouter } from 'next/navigation';
import { DayType } from '@/services/masterDataService';

interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayType: DayType;
  description: string | null;
}

interface CalendarManagerProps {
  initialEntries: CalendarEntry[];
  currentYearMonth?: string; // "YYYY-MM"
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function CalendarManager({
  initialEntries,
  currentYearMonth,
}: CalendarManagerProps) {
  const router = useRouter();

  // Current view year & month
  const today = new Date();
  const initialDate = currentYearMonth
    ? new Date(`${currentYearMonth}-01`)
    : today;

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  // Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalDayType, setModalDayType] = useState<DayType>('ACTIVE_KBM');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map entries by date key "YYYY-MM-DD"
  const entryMap = new Map<string, CalendarEntry>();
  for (const entry of initialEntries) {
    entryMap.set(entry.date, entry);
  }

  // Days in month calculation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

    const existing = entryMap.get(dateStr);
    setSelectedDate(dateStr);
    setModalDayType(existing ? existing.dayType : 'ACTIVE_KBM');
    setModalDescription(existing?.description || '');
    setModalError(null);
  };

  const handleSaveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await setCalendarAction({
        date: selectedDate,
        dayType: modalDayType,
        description: modalDescription || undefined,
      });
      setSelectedDate(null);
      router.refresh();
    } catch (err: any) {
      setModalError(err?.message || 'Gagal menyimpan kalender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      await deleteCalendarAction(selectedDate);
      setSelectedDate(null);
      router.refresh();
    } catch (err: any) {
      setModalError(err?.message || 'Gagal menghapus penandaan kalender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation & Legend */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-base font-bold text-neutral-100 min-w-[180px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-300">Belajar Aktif (KBM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-neutral-300">Hari Libur</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-neutral-300">Kegiatan Khusus</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/60 p-4">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-neutral-400">
          {DAY_NAMES.map((name, idx) => (
            <div
              key={name}
              className={`py-2 rounded-lg ${
                idx === 0 ? 'text-rose-400' : 'text-neutral-400'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before day 1 */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] rounded-xl bg-neutral-950/30" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const formattedMonth = String(viewMonth + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
            const entry = entryMap.get(dateStr);

            const isSunday = (firstDayOfMonth + i) % 7 === 0;

            let badgeClass = '';
            let label = '';
            if (entry?.dayType === 'ACTIVE_KBM') {
              badgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
              label = 'KBM Aktif';
            } else if (entry?.dayType === 'HOLIDAY') {
              badgeClass = 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold';
              label = 'Libur';
            } else if (entry?.dayType === 'SPECIAL_EVENT') {
              badgeClass = 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold';
              label = 'Khusus';
            }

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`min-h-[90px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${
                  entry?.dayType === 'HOLIDAY'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : entry?.dayType === 'SPECIAL_EVENT'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : entry?.dayType === 'ACTIVE_KBM'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isSunday
                    ? 'bg-neutral-950/80 border-neutral-800/60'
                    : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono ${
                      entry?.dayType === 'HOLIDAY' || isSunday
                        ? 'text-rose-400'
                        : 'text-neutral-200'
                    }`}
                  >
                    {day}
                  </span>

                  {entry && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border ${badgeClass}`}
                    >
                      {label}
                    </span>
                  )}
                </div>

                {entry?.description && (
                  <p className="text-[10px] text-neutral-300 line-clamp-2 mt-1 leading-tight">
                    {entry.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Configuration Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-400" />
                  <span>Atur Status Kalender</span>
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Tanggal: {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDay} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 mb-2 font-medium">
                  Tipe Hari *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalDayType('ACTIVE_KBM')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      modalDayType === 'ACTIVE_KBM'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    Belajar Aktif (KBM)
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalDayType('HOLIDAY')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      modalDayType === 'HOLIDAY'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    Hari Libur
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalDayType('SPECIAL_EVENT')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      modalDayType === 'SPECIAL_EVENT'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    Kegiatan Khusus
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: HUT RI, Ujian Tengah Semester, Libur Semester"
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                {entryMap.has(selectedDate) ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleDeleteEntry}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Status</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
