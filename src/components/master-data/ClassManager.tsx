'use client';

import { useState, useTransition } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  DoorOpen,
  Users,
} from 'lucide-react';
import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
} from '@/app/(dashboard)/admin/actions';
import { useRouter } from 'next/navigation';

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: string;
  academicYearId: string;
  academicYearName: string;
  semester: string;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string | null;
  studentCount: number;
}

interface TeacherOption {
  id: string;
  name: string;
  role: string;
}

interface AcademicYearOption {
  id: string;
  name: string;
  semester: string;
  isActive: boolean;
}

interface ClassManagerProps {
  initialData: {
    classes: ClassItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  teachers: TeacherOption[];
  academicYears: AcademicYearOption[];
  searchQuery?: string;
}

export function ClassManager({
  initialData,
  teachers,
  academicYears,
  searchQuery = '',
}: ClassManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchQuery);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: '10',
    academicYearId: academicYears.find((a) => a.isActive)?.id || academicYears[0]?.id || '',
    homeroomTeacherId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const applyFilters = (newSearch: string, newPage = 1) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newPage > 1) params.set('page', String(newPage));
    startTransition(() => {
      router.push(`/admin/classes?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, 1);
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      gradeLevel: '10',
      academicYearId: academicYears.find((a) => a.isActive)?.id || academicYears[0]?.id || '',
      homeroomTeacherId: '',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditClass(c);
    setFormData({
      name: c.name,
      gradeLevel: c.gradeLevel,
      academicYearId: c.academicYearId,
      homeroomTeacherId: c.homeroomTeacherId || '',
    });
    setFormError(null);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editClass) {
        await updateClassAction(editClass.id, {
          name: formData.name,
          gradeLevel: formData.gradeLevel,
          academicYearId: formData.academicYearId,
          homeroomTeacherId: formData.homeroomTeacherId || null,
        });
        setEditClass(null);
      } else {
        await createClassAction({
          name: formData.name,
          gradeLevel: formData.gradeLevel,
          academicYearId: formData.academicYearId,
          homeroomTeacherId: formData.homeroomTeacherId || null,
        });
        setIsCreateOpen(false);
      }
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data kelas.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClassAction(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus kelas.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kelas..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            Cari
          </button>
        </form>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Kelas</th>
                <th className="px-4 py-3 font-medium">Tingkat</th>
                <th className="px-4 py-3 font-medium">Tahun Akademik</th>
                <th className="px-4 py-3 font-medium">Wali Kelas</th>
                <th className="px-4 py-3 font-medium text-center">Jumlah Siswa</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {initialData.classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Belum ada data kelas yang terdaftar.
                  </td>
                </tr>
              ) : (
                initialData.classes.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-100 flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-emerald-400" />
                      <span>{c.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono">
                        Kelas {c.gradeLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {c.academicYearName} ({c.semester})
                    </td>
                    <td className="px-4 py-3">
                      {c.homeroomTeacherName ? (
                        <span className="text-neutral-200 font-medium">
                          {c.homeroomTeacherName}
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-neutral-300 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span>{c.studentCount}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div>
            Total: <strong>{initialData.total}</strong> kelas
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={initialData.page <= 1}
              onClick={() => applyFilters(search, initialData.page - 1)}
              className="px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sebelumnya
            </button>
            <span>
              Hal. {initialData.page} dari {initialData.totalPages}
            </span>
            <button
              disabled={initialData.page >= initialData.totalPages}
              onClick={() => applyFilters(search, initialData.page + 1)}
              className="px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editClass) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-400" />
                <span>{editClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditClass(null);
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

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Nama Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: X-A, XI-IPA-1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Tingkat Kelas *</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="10">Kelas 10 (X)</option>
                    <option value="11">Kelas 11 (XI)</option>
                    <option value="12">Kelas 12 (XII)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Tahun Akademik *</label>
                <select
                  required
                  value={formData.academicYearId}
                  onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} ({ay.semester}) {ay.isActive ? '— Aktif' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Wali Kelas</label>
                <select
                  value={formData.homeroomTeacherId}
                  onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Guru Sebagai Wali Kelas --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditClass(null);
                  }}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold"
                >
                  Simpan
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
              <h3 className="text-sm font-bold text-neutral-100">Hapus Kelas?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Yakin ingin menghapus kelas <strong>{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
