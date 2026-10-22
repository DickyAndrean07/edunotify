import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import {
  schools,
  academicYears,
  classes,
  students,
  classEnrollments,
  users,
  teachingSchedules,
  academicCalendars,
  attendanceRecords,
  attendanceFollowUps,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  verifyRelayAttendanceAccess,
  submitAttendanceSession,
} from '@/services/attendanceService';
import { calculateStudentEWS, saveEWSAlerts } from '@/services/earlyWarningService';
import {
  getDailyAttendanceCompleteness,
  getSchoolAttendanceSummary,
  getAttendanceReportData,
} from '@/services/reportService';
import { generateAttendanceExcel } from '@/lib/exporters/excelExporter';
import { generateAttendancePdf } from '@/lib/exporters/pdfExporter';
import { hashPassword } from '@/lib/auth/password';
import * as XLSX from 'xlsx';

describe('EDUNOTIFY-06: End-to-End System Integration Workflow (DoD 6)', () => {
  let schoolId: string;
  let academicYearId: string;
  let classId: string;

  let adminUserId: string;
  let teacher1UserId: string;
  let teacher2UserId: string;
  let homeroomUserId: string;
  let principalUserId: string;

  let student1Id: string;
  let student2Id: string;

  const testDate = '2026-10-19'; // A Monday (dayOfWeek = 1)

  beforeAll(async () => {
    const dummyHash = await hashPassword('password123');

    // 1. Setup School
    const [school] = await db
      .insert(schools)
      .values({
        name: 'SMA Negeri Model EduNotify',
        npsn: 'E2E_' + Math.random().toString(36).substring(2, 9),
        address: 'Jl. Pemuda No. 45, Gresik',
      })
      .returning();
    schoolId = school.id;

    // 2. Setup Academic Year
    const [ay] = await db
      .insert(academicYears)
      .values({
        schoolId,
        name: '2026/2027',
        semester: 'GANJIL',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        isActive: true,
      })
      .returning();
    academicYearId = ay.id;

    // 3. Setup Academic Calendar (ACTIVE_KBM on testDate)
    await db.insert(academicCalendars).values({
      schoolId,
      date: testDate,
      dayType: 'ACTIVE_KBM',
      description: 'Hari Efektif KBM Senin',
    });

    // 4. Setup Users for all 4 roles
    const [admin] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Admin Tata Usaha',
        email: `admin_e2e_${Date.now()}@edunotify.sch.id`,
        passwordHash: dummyHash,
        role: 'ADMIN_SEKOLAH',
      })
      .returning();
    adminUserId = admin.id;

    const [principal] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Drs. H. M. Sholihin, M.Pd.',
        email: `kepsek_e2e_${Date.now()}@edunotify.sch.id`,
        passwordHash: dummyHash,
        role: 'KEPALA_SEKOLAH',
      })
      .returning();
    principalUserId = principal.id;

    const [homeroom] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Dra. Endang Purwanti',
        email: `wali_e2e_${Date.now()}@edunotify.sch.id`,
        passwordHash: dummyHash,
        role: 'WALI_KELAS',
        phone: '081234567890',
      })
      .returning();
    homeroomUserId = homeroom.id;

    const [t1] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Pak Guru Matematika',
        email: `guru1_e2e_${Date.now()}@edunotify.sch.id`,
        passwordHash: dummyHash,
        role: 'GURU_MAPEL',
      })
      .returning();
    teacher1UserId = t1.id;

    const [t2] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Bu Guru Bahasa Inggris',
        email: `guru2_e2e_${Date.now()}@edunotify.sch.id`,
        passwordHash: dummyHash,
        role: 'GURU_MAPEL',
      })
      .returning();
    teacher2UserId = t2.id;

    // 5. Setup Class
    const [cls] = await db
      .insert(classes)
      .values({
        schoolId,
        academicYearId,
        name: 'X-RPL 1',
        gradeLevel: '10',
        homeroomTeacherId: homeroomUserId,
      })
      .returning();
    classId = cls.id;

    // 6. Setup Schedules (Period 1: Guru 1, Period 2: Guru 2)
    await db.insert(teachingSchedules).values([
      {
        schoolId,
        classId,
        teacherId: teacher1UserId,
        subjectName: 'Matematika Peminatan',
        dayOfWeek: 1, // Senin
        periodOrder: 1,
        startTime: '07:00',
        endTime: '08:30',
      },
      {
        schoolId,
        classId,
        teacherId: teacher2UserId,
        subjectName: 'Bahasa Inggris',
        dayOfWeek: 1, // Senin
        periodOrder: 2,
        startTime: '08:30',
        endTime: '10:00',
      },
    ]);

    // 7. Setup Students
    const [st1] = await db
      .insert(students)
      .values({
        schoolId,
        nis: '20261001',
        nisn: '009876001',
        name: 'Bagus Prakoso',
        gender: 'L',
        guardianName: 'Bapak Prakoso',
        guardianPhone: '081299887711',
      })
      .returning();
    student1Id = st1.id;

    const [st2] = await db
      .insert(students)
      .values({
        schoolId,
        nis: '20261002',
        nisn: '009876002',
        name: 'Dimas Anggara',
        gender: 'L',
        guardianName: 'Ibu Anggara',
        guardianPhone: '081299887722',
      })
      .returning();
    student2Id = st2.id;

    // Enroll students in class
    await db.insert(classEnrollments).values([
      { schoolId, classId, studentId: student1Id, academicYearId },
      { schoolId, classId, studentId: student2Id, academicYearId },
    ]);
  });

  afterAll(async () => {
    if (schoolId) {
      await db.delete(schools).where(eq(schools.id, schoolId));
    }
  });

  // ========================================================
  // END-TO-END FLOW: 5 SEQUENTIAL BUSINESS STAGES
  // ========================================================

  it('Langkah 1 s/d 6: Menjalankan alur lengkap end-to-end tanpa kendala', async () => {
    expect(adminUserId).toBeDefined();
    expect(principalUserId).toBeDefined();

    // ----------------------------------------------------
    // LANGKAH 1: Otorisasi & Pengisian Presensi Estafet (Guru Jam 1)
    // ----------------------------------------------------
    // Guru Jam 1 memeriksa akses pada jam 07:15 (dalam jam mengajar ke-1)
    const accessT1 = await verifyRelayAttendanceAccess(
      schoolId,
      classId,
      testDate,
      teacher1UserId,
      { currentTime: '07:15' }
    );
    expect(accessT1.authorized).toBe(true);
    expect(accessT1.canEdit).toBe(true);
    expect(accessT1.isReadOnly).toBe(false);

    // Guru Jam 1 submit presensi resmi:
    // - Siswa 1 (Bagus Prakoso) = PRESENT (Hadir)
    // - Siswa 2 (Dimas Anggara) = ABSENT_ALPA (Alpa)
    const submitResult = await submitAttendanceSession({
      schoolId,
      classId,
      date: testDate,
      teacherUserId: teacher1UserId,
      records: [
        { studentId: student1Id, status: 'PRESENT' },
        { studentId: student2Id, status: 'ABSENT_ALPA', notes: 'Tidak masuk tanpa kabar' },
      ],
      options: { currentTime: '07:30' },
    });

    expect(submitResult.success).toBe(true);
    expect(submitResult.recordsCount).toBe(2);
    expect(submitResult.sessionId).toBeDefined();

    // Verifikasi Guru Jam 2 sekarang terkunci read-only (estafet sukses)
    const accessT2 = await verifyRelayAttendanceAccess(
      schoolId,
      classId,
      testDate,
      teacher2UserId,
      { currentTime: '08:45' }
    );
    expect(accessT2.authorized).toBe(true);
    expect(accessT2.isReadOnly).toBe(true);
    expect(accessT2.canEdit).toBe(false);
    expect(accessT2.reason).toBe('ALREADY_SUBMITTED');

    // ----------------------------------------------------
    // LANGKAH 2: Wali Kelas Melakukan Tindak Lanjut WhatsApp
    // ----------------------------------------------------
    // Ambil record presensi siswa alpa
    const [alpaRecord] = await db
      .select({
        recordId: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.schoolId, schoolId),
          eq(attendanceRecords.studentId, student2Id),
          eq(attendanceRecords.status, 'ABSENT_ALPA')
        )
      );

    expect(alpaRecord).toBeDefined();

    // Wali Kelas membuka link WA Click-to-Chat (status CLICKED)
    const [followUp1] = await db
      .insert(attendanceFollowUps)
      .values({
        schoolId,
        attendanceRecordId: alpaRecord.recordId,
        userId: homeroomUserId,
        channel: 'WHATSAPP',
        status: 'CLICKED',
        notes: 'Membuka wa.me ke 081299887722',
      })
      .returning();

    expect(followUp1.status).toBe('CLICKED');

    // Wali Kelas menandai sudah berhasil konfirmasi secara manual (status MARKED_CONTACTED)
    const [followUp2] = await db
      .insert(attendanceFollowUps)
      .values({
        schoolId,
        attendanceRecordId: alpaRecord.recordId,
        userId: homeroomUserId,
        channel: 'WHATSAPP',
        status: 'MARKED_CONTACTED',
        notes: 'Orang tua menyatakan ananda terlambat bangun',
      })
      .returning();

    expect(followUp2.status).toBe('MARKED_CONTACTED');

    // ----------------------------------------------------
    // LANGKAH 3: Rule-Engine Early Warning System (EWS Trigger)
    // ----------------------------------------------------
    // Misal Siswa 2 memiliki catatan 2 hari alpa beruntun
    const ewsEvaluation = calculateStudentEWS({
      studentId: student2Id,
      name: 'Dimas Anggara',
      nis: '20261002',
      gender: 'L',
      records: [
        { date: '2026-10-16', status: 'ABSENT_ALPA' },
        { date: testDate, status: 'ABSENT_ALPA' },
      ],
    });

    const streakTriggered = ewsEvaluation.indicators.find(
      (ind) => ind.code === 'EWS_ALPA_STREAK'
    );
    expect(streakTriggered?.triggered).toBe(true);
    expect(streakTriggered?.severity).toBe('TINGGI');

    // Simpan EWS alert ke basis data
    const savedCount = await saveEWSAlerts(schoolId, [ewsEvaluation]);
    expect(savedCount).toBeGreaterThanOrEqual(1);

    // ----------------------------------------------------
    // LANGKAH 4: Admin Melihat Kelengkapan Harian (DoD 2)
    // ----------------------------------------------------
    const dailyOverview = await getDailyAttendanceCompleteness(
      schoolId,
      testDate,
      '11:00'
    );

    expect(dailyOverview.summary.totalClasses).toBe(1);
    expect(dailyOverview.summary.completedClasses).toBe(1);
    expect(dailyOverview.summary.uncompletedClasses).toBe(0);
    expect(dailyOverview.summary.completenessRate).toBe(100.0);
    expect(dailyOverview.summary.totalPresent).toBe(1);
    expect(dailyOverview.summary.totalAlpa).toBe(1);

    const classStatus = dailyOverview.classes[0];
    expect(classStatus.sessionStatus).toBe('SUBMITTED');
    expect(classStatus.isCompleted).toBe(true);
    expect(classStatus.submittedByTeacherName).toBe('Pak Guru Matematika');

    // ----------------------------------------------------
    // LANGKAH 5: Kepala Sekolah Melihat Agregat & Komparasi (DoD 1)
    // ----------------------------------------------------
    const principalSummary = await getSchoolAttendanceSummary(schoolId, {
      startDate: testDate,
      endDate: testDate,
    });

    expect(principalSummary.overallStats.overallAttendanceRate).toBe(50.0);
    expect(principalSummary.overallStats.totalEnrolledStudents).toBe(2);
    expect(principalSummary.classComparisons[0].className).toBe('X-RPL 1');
    expect(principalSummary.classComparisons[0].atRiskStudentsCount).toBe(1); // Siswa 2 ada alert EWS

    // ----------------------------------------------------
    // LANGKAH 6: Ekspor Dokumen Resmi Excel (.xlsx) & PDF (.pdf) (DoD 4 & 5)
    // ----------------------------------------------------
    const reportData = await getAttendanceReportData(schoolId, {
      startDate: testDate,
      endDate: testDate,
      classId,
    });

    expect(reportData.summary.totalStudents).toBe(2);
    expect(reportData.summary.totalHadir).toBe(1);
    expect(reportData.summary.totalAlpa).toBe(1);

    // 6.a Generate Excel (.xlsx)
    const excelBuffer = generateAttendanceExcel(reportData);
    expect(Buffer.isBuffer(excelBuffer)).toBe(true);
    const wb = XLSX.read(excelBuffer, { type: 'buffer' });
    expect(wb.SheetNames).toContain('Rekapitulasi Kehadiran');
    const ws = wb.Sheets['Rekapitulasi Kehadiran'];
    expect(ws['A1'].v).toContain('SMA NEGERI MODEL EDUNOTIFY');
    expect(ws['D8'].v).toBe('Bagus Prakoso');
    expect(ws['K8'].f).toBe('SUM(G8:J8)'); // Formula total hadir valid
    expect(ws['L8'].f).toBe('IF(K8>0,(G8/K8)*100,0)'); // Formula persentase valid

    // 6.b Generate PDF (.pdf)
    const pdfBuffer = generateAttendancePdf(reportData);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    const pdfStr = pdfBuffer.toString('utf-8');
    expect(pdfStr.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfStr).toContain('SMA NEGERI MODEL EDUNOTIFY');
    expect(pdfStr).toContain('Bagus Prakoso');
    expect(pdfStr).toContain('Dimas Anggara');
    expect(pdfStr).toContain('Wali Kelas / Petugas Presensi');
    expect(pdfStr).toContain('Kepala Sekolah');
    expect(pdfStr.trimEnd().endsWith('%%EOF')).toBe(true);
  });
});
