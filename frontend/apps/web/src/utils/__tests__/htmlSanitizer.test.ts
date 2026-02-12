import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../htmlSanitizer';

describe('sanitizeHtml', () => {
  it('should allow safe HTML', () => {
    const dirty = '<p>Hello <b>World</b></p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('<p>Hello <b>World</b></p>');
  });

  it('should remove script tags', () => {
    const dirty = '<p>Hello <script>alert("XSS")</script>World</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('<p>Hello World</p>');
  });

  it('should remove on* attributes', () => {
    const dirty = '<button onclick="alert(\'XSS\')">Click me</button>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('<button>Click me</button>');
  });

  it('should remove javascript: links', () => {
    const dirty = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('should allow target="_blank"', () => {
    const dirty = '<a href="https://example.com" target="_blank">Link</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('<a href="https://example.com" target="_blank">Link</a>');
  });

  it('should handle img tags with onerror', () => {
    const dirty = '<img src="x" onerror="alert(1)">';
    const clean = sanitizeHtml(dirty);
    expect(clean).toBe('<img src="x">');
  });
});
