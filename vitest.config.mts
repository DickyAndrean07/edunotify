import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.example' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
