import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../src/utils/sanitize';

describe('HTML Sanitization (Poke-Proof Input)', () => {
  it('should preserve plain text unmodified', () => {
    const input = 'He said good morning to me in the elevator.';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('should strip script tags and their inner content', () => {
    const malicious = 'He smiled at me <script>alert("hacked")</script> and walked away.';
    expect(sanitizeHtml(malicious)).toBe('He smiled at me  and walked away.');
  });

  it('should strip style tags and their inner content', () => {
    const input = 'My crush <style>body { display: none; }</style> looked my way.';
    expect(sanitizeHtml(input)).toBe('My crush  looked my way.');
  });

  it('should strip arbitrary HTML elements', () => {
    const input = '<b>Bold</b> statement with <img src="x" onerror="steal()" /> inside.';
    expect(sanitizeHtml(input)).toBe('Bold statement with  inside.');
  });

  it('should handle empty or whitespace inputs gracefully', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml('   ')).toBe('');
  });
});

