/**
 * Escape HTML special characters to prevent XSS in SSR templates and emails.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a string for safe use inside a JavaScript string literal in inline scripts.
 * Handles </script> injection, newlines, and quotes.
 */
export function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/<\//g, "<\\/");
}

/**
 * Validate and sanitize a URL for use in href/src attributes.
 * Returns empty string if URL looks suspicious.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return escapeHtml(url);
    }
    return "";
  } catch {
    // Relative URLs — allow if they don't contain dangerous schemes
    if (/^javascript:/i.test(url) || /^data:/i.test(url) || /^vbscript:/i.test(url)) {
      return "";
    }
    return escapeHtml(url);
  }
}
