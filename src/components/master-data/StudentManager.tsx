'use client';

import { useState, useTransition } from 'react';
import {
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { ImportModal } from './ImportModal';
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  importStudentsAction,
} from '@/app/(dashboard)/admin/actions';
import { useRouter } from 'next/navigation';

interface StudentItem {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: string;
  guardianName: string | null;
  guardianPhone: string | null;
  isActive: boolean;
  currentClass: { classId: string; className: string } | null;
}

interface ClassItem {
  id: string;
  name: string;
}

interface StudentManagerProps {
  initialData: {
    students: StudentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  classes: ClassItem[];
  searchQuery?: string;
  currentClassId?: string;
}

export function StudentManager({
  initialData,
  classes,
  searchQuery = '',
  currentClassId = '',
}: StudentManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchQuery);
  const [selectedClass, setSelectedClass] = useState(currentClassId);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Modals for CRUD
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    guardianName: '',
    guardianPhone: '',
    classId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const applyFilters = (newSearch: string, newClassId: string, newPage = 1) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newClassId) params.set('classId', newClassId);
    if (newPage > 1) params.set('page', String(newPage));
    startTransition(() => {
      router.push(`/admin/students?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, selectedClass, 1);
  };

  const handleOpenCreate = () => {
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      guardianName: '',
      guardianPhone: '',
      classId: classes[0]?.id || '',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (s: StudentItem) => {
    setEditStudent(s);
    setFormData({
      nis: s.nis,
      nisn: s.nisn || '',
      name: s.name,
      gender: s.gender as 'L' | 'P',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      classId: s.currentClass?.classId || '',
    });
    setFormError(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editStudent) {
        await updateStudentAction(editStudent.id, {
          nis: formData.nis,
          nisn: formData.nisn || undefined,
          name: formData.name,
          gender: formData.gender,
          guardianName: formData.guardianName || undefined,
          guardianPhone: formData.guardianPhone || undefined,
          classId: formData.classId || null,
        });
        setEditStudent(null);
      } else {
        await createStudentAction({
          nis: formData.nis,
          nisn: formData.nisn || undefined,
          name: formData.name,
          gender: formData.gender,
          guardianName: formData.guardianName || undefined,
          guardianPhone: formData.guardianPhone || undefined,
          classId: formData.classId || undefined,
        });
        setIsCreateOpen(false);
      }
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data siswa.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudentAction(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus siswa.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIS, atau wali..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              applyFilters(search, e.target.value, 1);
            }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Impor CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">NIS / NISN</th>
                <th className="px-4 py-3 font-medium">Nama Siswa</th>
                <th className="px-4 py-3 font-medium">L/P</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium">Orang Tua / Wali</th>
                <th className="px-4 py-3 font-medium">No. Telepon Ortu</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {initialData.students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    Belum ada data siswa yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                initialData.students.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-neutral-300">
                      <div>{s.nis}</div>
                      {s.nisn && (
                        <div className="text-[10px] text-neutral-500">{s.nisn}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-100">{s.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.gender === 'L'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                        }`}
                      >
                        {s.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.currentClass ? (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200">
                          {s.currentClass.className}
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">Belum ada kelas</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {s.guardianName || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {s.guardianPhone || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                          <UserX className="w-3.5 h-3.5" />
                          <span>Non-aktif</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
            Total: <strong>{initialData.total}</strong> siswa
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={initialData.page <= 1}
              onClick={() => applyFilters(search, selectedClass, initialData.page - 1)}
              className="px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sebelumnya
            </button>
            <span>
              Hal. {initialData.page} dari {initialData.totalPages}
            </span>
            <button
              disabled={initialData.page >= initialData.totalPages}
              onClick={() => applyFilters(search, selectedClass, initialData.page + 1)}
              className="px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editStudent) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <span>{editStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditStudent(null);
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

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">NISN (Opsional)</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1">Kelas</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Tanpa Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianName: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">No. HP Orang Tua / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={formData.guardianPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianPhone: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditStudent(null);
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
              <h3 className="text-sm font-bold text-neutral-100">Hapus Data Siswa?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Yakin ingin menghapus <strong>{deleteTarget.name}</strong> (NIS: {deleteTarget.nis})? Tindakan ini tidak dapat dibatalkan.
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

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Impor Data Siswa Massal"
        description="Unggah file .csv atau .xlsx dengan kolom NIS, Nama, Gender (L/P), Nama Wali, No HP Wali, dan Kelas."
        classes={classes}
        showClassSelector={true}
        onImport={importStudentsAction}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
