'use client';

import { useState } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  BookOpen,
  User,
  Calendar,
} from 'lucide-react';
import {
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
} from '@/app/(dashboard)/admin/actions';
import { useRouter } from 'next/navigation';

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
];

interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
  dayOfWeek: number;
  periodOrder: number;
  startTime: string;
  endTime: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  name: string;
  role: string;
}

interface ScheduleManagerProps {
  initialSchedules: ScheduleItem[];
  classes: ClassOption[];
  teachers: TeacherOption[];
  selectedClassId?: string;
  selectedDay?: number;
}

export function ScheduleManager({
  initialSchedules,
  classes,
  teachers,
  selectedClassId = '',
  selectedDay = 1,
}: ScheduleManagerProps) {
  const router = useRouter();

  const [activeDay, setActiveDay] = useState<number>(selectedDay);
  const [filterClassId, setFilterClassId] = useState<string>(selectedClassId);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    classId: classes[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    subjectName: '',
    dayOfWeek: 1,
    periodOrder: 1,
    startTime: '07:00',
    endTime: '08:30',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Filter schedules by active day and selected class
  const filteredSchedules = initialSchedules.filter((s) => {
    const matchDay = s.dayOfWeek === activeDay;
    const matchClass = filterClassId ? s.classId === filterClassId : true;
    return matchDay && matchClass;
  });

  const handleOpenCreate = () => {
    setFormData({
      classId: filterClassId || classes[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      subjectName: '',
      dayOfWeek: activeDay,
      periodOrder: (filteredSchedules.length || 0) + 1,
      startTime: '07:00',
      endTime: '08:30',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (s: ScheduleItem) => {
    setEditSchedule(s);
    setFormData({
      classId: s.classId,
      teacherId: s.teacherId,
      subjectName: s.subjectName,
      dayOfWeek: s.dayOfWeek,
      periodOrder: s.periodOrder,
      startTime: s.startTime,
      endTime: s.endTime,
    });
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editSchedule) {
        await updateScheduleAction(editSchedule.id, {
          classId: formData.classId,
          teacherId: formData.teacherId,
          subjectName: formData.subjectName,
          dayOfWeek: Number(formData.dayOfWeek),
          periodOrder: Number(formData.periodOrder),
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
        setEditSchedule(null);
      } else {
        await createScheduleAction({
          classId: formData.classId,
          teacherId: formData.teacherId,
          subjectName: formData.subjectName,
          dayOfWeek: Number(formData.dayOfWeek),
          periodOrder: Number(formData.periodOrder),
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
        setIsCreateOpen(false);
      }
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan jadwal pelajaran.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteScheduleAction(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus jadwal.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400">Pilih Kelas:</label>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Mengajar</span>
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800/80">
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setActiveDay(d.value)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeDay === d.value
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Schedules List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSchedules.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
            Belum ada jadwal pelajaran untuk hari {DAYS_OF_WEEK.find((d) => d.value === activeDay)?.label}.
          </div>
        ) : (
          filteredSchedules.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Jam Ke-{s.periodOrder}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {s.startTime} - {s.endTime}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{s.subjectName}</span>
                </h3>

                <div className="mt-2 text-xs space-y-1 text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500">Kelas:</span>
                    <span className="font-semibold text-neutral-200">{s.className}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="text-neutral-300">{s.teacherName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(s)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editSchedule) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>
                  {editSchedule ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
                </span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditSchedule(null);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Kelas *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Hari *</label>
                  <select
                    required
                    value={formData.dayOfWeek}
                    onChange={(e) =>
                      setFormData({ ...formData, dayOfWeek: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Matematika Wajib, Bahasa Indonesia"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Guru Pengampu *</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Jam Ke- *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={formData.periodOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, periodOrder: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Jam Selesai *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditSchedule(null);
                  }}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Hapus Jadwal?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Yakin ingin menghapus jadwal <strong>{deleteTarget.subjectName}</strong> ({deleteTarget.className}) pada jam {deleteTarget.startTime} - {deleteTarget.endTime}?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
