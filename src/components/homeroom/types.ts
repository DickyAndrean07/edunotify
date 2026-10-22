export type AttendanceStatus =
  | 'UNRECORDED'
  | 'PRESENT'
  | 'SICK'
  | 'PERMIT'
  | 'ABSENT_ALPA';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  UNRECORDED: 'Belum Diabsen',
  PRESENT: 'Hadir',
  SICK: 'Sakit',
  PERMIT: 'Izin',
  ABSENT_ALPA: 'Alpa',
};

export type InterventionStatus =
  | 'NOT_OPENED'
  | 'WHATSAPP_OPENED'
  | 'MARKED_CONTACTED';

export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  NOT_OPENED: 'Belum Dibuka',
  WHATSAPP_OPENED: 'WhatsApp Dibuka',
  MARKED_CONTACTED: 'Ditandai Sudah Dihubungi',
};
