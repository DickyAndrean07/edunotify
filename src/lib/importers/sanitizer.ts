/**
 * Sanitizer for imported data to prevent XSS and normalize inputs.
 */

export function sanitizeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // Strip <script>...</script> and <style>...</style> including their contents
  const noScripts = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Strip remaining HTML tags completely
  const noTags = noScripts.replace(/<[^>]+>/g, '');
  // Strip control characters (except newline/tab if any)
  const clean = noTags.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return clean.trim();
}

export function sanitizeGender(val: unknown): 'L' | 'P' | null {
  const clean = sanitizeString(val).toUpperCase();
  if (!clean) return null;
  if (clean === 'L' || clean === 'LAKI-LAKI' || clean === 'PRIA' || clean === 'MALE' || clean === 'M') {
    return 'L';
  }
  if (clean === 'P' || clean === 'PEREMPUAN' || clean === 'WANITA' || clean === 'FEMALE' || clean === 'F') {
    return 'P';
  }
  return null;
}

export function sanitizePhone(val: unknown): string {
  const str = sanitizeString(val);
  if (!str) return '';
  // Remove spaces, hyphens, parentheses
  let cleaned = str.replace(/[\s\-()]/g, '');
  // Normalize leading 62 to 0 if needed or keep standard
  if (cleaned.startsWith('+62')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('62') && cleaned.length > 9) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

export function sanitizeEmail(val: unknown): string {
  return sanitizeString(val).toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
