/**
 * Strips HTML tags and normalizes dangerous characters from user input or AI strings.
 * Ensures pasted HTML/script tags render as plain harmless text.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove HTML tag blocks e.g. <script>...</script>, <style>...</style>
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  return clean.trim();
}

