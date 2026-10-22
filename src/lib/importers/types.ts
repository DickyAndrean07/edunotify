import { UserRole } from '@/db/schema';

export interface ImportError {
  row: number; // 1-indexed row number in the file (data row, header is row 1)
  column: string;
  value: unknown;
  message: string;
}

export interface ImportResult<T = unknown> {
  success: boolean;
  totalRows: number;
  validRows: number;
  errorCount: number;
  errors: ImportError[];
  importedCount: number;
  data?: T[];
}

export interface RawStudentRow {
  nis: string;
  nisn?: string;
  name: string;
  gender: 'L' | 'P';
  guardianName?: string;
  guardianPhone?: string;
  className?: string;
}

export interface RawTeacherRow {
  name: string;
  email: string;
  role: UserRole;
  nip?: string;
  phone?: string;
}

export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/csv',
  'text/plain', // some OS report csv as text/plain
] as const;

export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;
