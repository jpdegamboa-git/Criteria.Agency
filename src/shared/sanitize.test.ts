import { describe, it, expect } from "vitest";
import { escapeHtml, escapeJsString, sanitizeUrl, sanitizeAgentId } from "./sanitize.js";

describe("sanitizeAgentId", () => {
  it("should accept a simple alphanumeric id", () => {
    expect(sanitizeAgentId("T1L")).toBe("T1L");
  });

  it("should accept ids with hyphens and underscores", () => {
    expect(sanitizeAgentId("T1-L")).toBe("T1-L");
    expect(sanitizeAgentId("agent_001")).toBe("agent_001");
  });

  it("should accept mixed-case ids", () => {
    expect(sanitizeAgentId("XF-001")).toBe("XF-001");
  });

  it("should trim surrounding whitespace before validating", () => {
    expect(sanitizeAgentId("  T1-L  ")).toBe("T1-L");
  });

  it("should reject path traversal with dots", () => {
    expect(sanitizeAgentId("../../etc/passwd")).toBeNull();
  });

  it("should reject ids containing a forward slash", () => {
    expect(sanitizeAgentId("foo/bar")).toBeNull();
  });

  it("should reject ids containing a backslash", () => {
    expect(sanitizeAgentId("foo\\bar")).toBeNull();
  });

  it("should reject ids containing a dot", () => {
    expect(sanitizeAgentId("foo.bar")).toBeNull();
    expect(sanitizeAgentId(".hidden")).toBeNull();
  });

  it("should reject empty or whitespace-only ids", () => {
    expect(sanitizeAgentId("")).toBeNull();
    expect(sanitizeAgentId("   ")).toBeNull();
  });

  it("should reject ids with null bytes", () => {
    expect(sanitizeAgentId("foo\0bar")).toBeNull();
  });

  it("should reject ids with spaces", () => {
    expect(sanitizeAgentId("foo bar")).toBeNull();
  });
});

describe("escapeHtml", () => {
  it("should escape < and >", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("should escape &", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("should escape all special characters together", () => {
    expect(escapeHtml(`<a href="x" class='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; class=&#39;y&#39;&gt;&amp;"
    );
  });

  it("should return empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should not alter strings without special chars", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("escapeJsString", () => {
  it("should escape single quotes", () => {
    expect(escapeJsString("it's")).toBe("it\\'s");
  });

  it("should escape double quotes", () => {
    expect(escapeJsString('"hi"')).toBe('\\"hi\\"');
  });

  it("should escape newlines", () => {
    expect(escapeJsString("line1\nline2")).toBe("line1\\nline2");
  });

  it("should escape carriage returns", () => {
    expect(escapeJsString("a\rb")).toBe("a\\rb");
  });

  it("should escape backslashes", () => {
    expect(escapeJsString("back\\slash")).toBe("back\\\\slash");
  });

  it("should escape </script> closing tags", () => {
    expect(escapeJsString("</script>")).toBe("<\\/script>");
  });

  it("should handle combined escapes", () => {
    const input = `He said "it's\nover" </script>`;
    const result = escapeJsString(input);
    expect(result).not.toContain("</");
    expect(result).toContain("\\n");
    expect(result).toContain("\\'");
    expect(result).toContain('\\"');
  });
});

describe("sanitizeUrl", () => {
  it("should allow http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("should allow https URLs", () => {
    expect(sanitizeUrl("https://example.com/path?q=1")).toBe(
      "https://example.com/path?q=1"
    );
  });

  it("should block javascript: scheme", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("should block javascript: scheme case-insensitively", () => {
    expect(sanitizeUrl("JavaScript:alert(1)")).toBe("");
  });

  it("should block data: scheme", () => {
    expect(sanitizeUrl("data:text/html,<h1>hi</h1>")).toBe("");
  });

  it("should block vbscript: scheme", () => {
    expect(sanitizeUrl("vbscript:msgbox")).toBe("");
  });

  it("should allow relative URLs", () => {
    const result = sanitizeUrl("/some/path");
    expect(result).toBe("/some/path");
  });

  it("should escape HTML in allowed URLs", () => {
    expect(sanitizeUrl('https://example.com/?q=<script>"')).toBe(
      "https://example.com/?q=&lt;script&gt;&quot;"
    );
  });

  it("should block ftp: as absolute URL", () => {
    expect(sanitizeUrl("ftp://example.com/file")).toBe("");
  });
});
