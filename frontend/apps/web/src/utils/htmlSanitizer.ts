import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags and attributes.
 *
 * @param dirty - The potentially unsafe HTML string.
 * @returns The sanitized HTML string.
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true }, // Only allow HTML, no SVG/MathML by default
    ADD_ATTR: ['target'], // Allow target attribute for links (e.g. _blank)
  });
};
