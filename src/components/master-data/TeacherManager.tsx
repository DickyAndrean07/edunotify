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
  Users,
  Shield,
} from 'lucide-react';
import { ImportModal } from './ImportModal';
import {
  createTeacherAction,
  updateTeacherAction,
  deleteTeacherAction,
  importTeachersAction,
} from '@/app/(dashboard)/admin/actions';
import { useRouter } from 'next/navigation';
import { USER_ROLES, UserRole } from '@/db/schema';
import { ROLE_LABELS } from '@/lib/auth/rbac';

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  role: string;
  nip: string | null;
  phone: string | null;
  isActive: boolean;
}

interface TeacherManagerProps {
  initialData: {
    teachers: TeacherItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  searchQuery?: string;
  currentRole?: string;
}

export function TeacherManager({
  initialData,
  searchQuery = '',
  currentRole = '',
}: TeacherManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchQuery);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // CRUD Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: USER_ROLES.GURU_MAPEL as UserRole,
    nip: '',
    phone: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const applyFilters = (newSearch: string, newRole: string, newPage = 1) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newRole) params.set('role', newRole);
    if (newPage > 1) params.set('page', String(newPage));
    startTransition(() => {
      router.push(`/admin/teachers?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, selectedRole, 1);
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      role: USER_ROLES.GURU_MAPEL,
      nip: '',
      phone: '',
      password: '',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (t: TeacherItem) => {
    setEditTeacher(t);
    setFormData({
      name: t.name,
      email: t.email,
      role: t.role as UserRole,
      nip: t.nip || '',
      phone: t.phone || '',
      password: '',
    });
    setFormError(null);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editTeacher) {
        await updateTeacherAction(editTeacher.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          nip: formData.nip || undefined,
          phone: formData.phone || undefined,
        });
        setEditTeacher(null);
      } else {
        await createTeacherAction({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          nip: formData.nip || undefined,
          phone: formData.phone || undefined,
          password: formData.password || undefined,
        });
        setIsCreateOpen(false);
      }
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data guru.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeacherAction(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus data guru.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Role Filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIP, email, atau no HP..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              applyFilters(search, e.target.value, 1);
            }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Semua Peran</option>
            <option value={USER_ROLES.GURU_MAPEL}>Guru Mapel</option>
            <option value={USER_ROLES.WALI_KELAS}>Wali Kelas</option>
            <option value={USER_ROLES.KEPALA_SEKOLAH}>Kepala Sekolah</option>
            <option value={USER_ROLES.ADMIN_SEKOLAH}>Admin Sekolah</option>
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
            <span>Tambah Guru / Staf</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Guru / Staf</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">NIP</th>
                <th className="px-4 py-3 font-medium">Peran (Role)</th>
                <th className="px-4 py-3 font-medium">No. Telepon</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {initialData.teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Belum ada data guru atau staf yang cocok.
                  </td>
                </tr>
              ) : (
                initialData.teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-100">{t.name}</td>
                    <td className="px-4 py-3 text-neutral-300 font-mono">{t.email}</td>
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {t.nip || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-800 border border-neutral-700 text-neutral-200">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>{ROLE_LABELS[t.role as UserRole] || t.role}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {t.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.isActive ? (
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
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(t)}
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
            Total: <strong>{initialData.total}</strong> guru/staf
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={initialData.page <= 1}
              onClick={() => applyFilters(search, selectedRole, initialData.page - 1)}
              className="px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sebelumnya
            </button>
            <span>
              Hal. {initialData.page} dari {initialData.totalPages}
            </span>
            <button
              disabled={initialData.page >= initialData.totalPages}
              onClick={() => applyFilters(search, selectedRole, initialData.page + 1)}
              className="px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editTeacher) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>{editTeacher ? 'Edit Data Guru / Staf' : 'Tambah Guru / Staf Baru'}</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditTeacher(null);
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

            <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">Nama Lengkap Guru / Staf *</label>
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
                  <label className="block text-neutral-300 mb-1">Email Resmi *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Peran (Role) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={USER_ROLES.GURU_MAPEL}>Guru Mata Pelajaran</option>
                    <option value={USER_ROLES.WALI_KELAS}>Wali Kelas</option>
                    <option value={USER_ROLES.KEPALA_SEKOLAH}>Kepala Sekolah</option>
                    <option value={USER_ROLES.ADMIN_SEKOLAH}>Administrator Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {!editTeacher && (
                <div>
                  <label className="block text-neutral-300 mb-1">
                    Password Awal (Kosongkan untuk default &quot;EduNotify2026!&quot;)
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditTeacher(null);
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
              <h3 className="text-sm font-bold text-neutral-100">Hapus Guru / Staf?</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Yakin ingin menghapus <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? Tindakan ini tidak dapat dibatalkan.
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
        title="Impor Data Guru Massal"
        description="Unggah file .csv atau .xlsx dengan kolom Nama Guru, Email, Role (Guru Mapel / Wali Kelas), NIP, dan No HP."
        onImport={importTeachersAction}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
