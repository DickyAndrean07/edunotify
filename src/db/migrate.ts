import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';

export async function runMigrations() {
  console.log('🔄 Running Drizzle migrations...');
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Allow direct execution via CLI
if (require.main === module || process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
