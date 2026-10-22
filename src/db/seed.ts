import { db, pool } from './index';
import {
  schools,
  users,
  academicYears,
  classes,
  USER_ROLES,
} from './schema';
import { hashPassword } from '../lib/auth/password';
import { eq } from 'drizzle-orm';

export async function runSeed() {
  console.log('🌱 Starting database seed...');

  // 1. Create or get dummy school
  const existingSchools = await db
    .select()
    .from(schools)
    .where(eq(schools.npsn, '20109999'));

  let schoolId: string;
  if (existingSchools.length > 0) {
    schoolId = existingSchools[0].id;
    console.log(`ℹ️  School already exists: ${existingSchools[0].name} (${schoolId})`);
  } else {
    const [newSchool] = await db
      .insert(schools)
      .values({
        name: 'SMA Nusantara 1',
        npsn: '20109999',
        address: 'Jl. Pendidikan Merdeka No. 45, Jakarta',
        timezone: 'Asia/Jakarta',
      })
      .returning();
    schoolId = newSchool.id;
    console.log(`✅ School created: ${newSchool.name} (${schoolId})`);
  }

  // 2. Generate secure password hash at runtime (never plaintext)
  // Default development initial seed password retrieved from env or standard secure seed default
  const defaultInitialPassword =
    process.env.SEED_DEFAULT_PASSWORD || 'EduNotify2026!Secure';
  const hashedInitialPassword = await hashPassword(defaultInitialPassword);

  const seedUsers = [
    {
      name: 'Ahmad Dahlan (Admin)',
      email: 'admin@smanusantara1.sch.id',
      role: USER_ROLES.ADMIN_SEKOLAH,
      nip: '198001012005011001',
      phone: '081234567890',
    },
    {
      name: 'Siti Rahmawati (Guru Mapel)',
      email: 'guru@smanusantara1.sch.id',
      role: USER_ROLES.GURU_MAPEL,
      nip: '198505122010012002',
      phone: '081234567891',
    },
    {
      name: 'Budi Santoso (Wali Kelas)',
      email: 'walikelas@smanusantara1.sch.id',
      role: USER_ROLES.WALI_KELAS,
      nip: '198203152008011003',
      phone: '081234567892',
    },
    {
      name: 'Dr. Hendra Wijaya (Kepala Sekolah)',
      email: 'kepsek@smanusantara1.sch.id',
      role: USER_ROLES.KEPALA_SEKOLAH,
      nip: '197508201999031004',
      phone: '081234567893',
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of seedUsers) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email));

    if (existing.length > 0) {
      userMap[u.role] = existing[0].id;
      console.log(`ℹ️  User already exists: ${u.email} (${u.role})`);
    } else {
      const [created] = await db
        .insert(users)
        .values({
          schoolId,
          name: u.name,
          email: u.email,
          passwordHash: hashedInitialPassword,
          role: u.role,
          nip: u.nip,
          phone: u.phone,
          isActive: true,
        })
        .returning();
      userMap[u.role] = created.id;
      console.log(`✅ User created: ${u.email} (${u.role}) with secure Bcrypt hash`);
    }
  }

  // 3. Seed initial Academic Year
  let academicYearId: string;
  const existingAy = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId));

  if (existingAy.length > 0) {
    academicYearId = existingAy[0].id;
  } else {
    const [newAy] = await db
      .insert(academicYears)
      .values({
        schoolId,
        name: '2026/2027',
        semester: 'GANJIL',
        startDate: '2026-07-15',
        endDate: '2026-12-20',
        isActive: true,
      })
      .returning();
    academicYearId = newAy.id;
    console.log(`✅ Academic Year created: 2026/2027 Ganjil`);
  }

  // 4. Seed initial Class X-A assigned to Wali Kelas
  const existingClass = await db
    .select()
    .from(classes)
    .where(eq(classes.schoolId, schoolId));

  if (existingClass.length === 0 && userMap[USER_ROLES.WALI_KELAS]) {
    await db.insert(classes).values({
      schoolId,
      academicYearId,
      name: 'X-A',
      gradeLevel: '10',
      homeroomTeacherId: userMap[USER_ROLES.WALI_KELAS],
    });
    console.log(`✅ Class created: X-A with Homeroom Teacher`);
  }

  console.log('🎉 Seeding finished successfully!');
}

if (require.main === module || process.argv[1]?.includes('seed.ts')) {
  runSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
