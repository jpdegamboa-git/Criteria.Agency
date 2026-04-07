import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { cors } from "hono/cors";

// ─── Security headers middleware ──────────────────────────────────────────────

function buildSecurityHeadersApp(nodeEnv?: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (nodeEnv === "production") {
      c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
  });

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.get("/api/data", (c) => c.json({ data: "hello" }));

  return app;
}

describe("Security headers middleware", () => {
  it("sets X-Content-Type-Options: nosniff on all responses", async () => {
    const app = buildSecurityHeadersApp();
    const res = await app.request("/health");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets X-Frame-Options: DENY on all responses", async () => {
    const app = buildSecurityHeadersApp();
    const res = await app.request("/health");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("sets X-XSS-Protection: 1; mode=block on all responses", async () => {
    const app = buildSecurityHeadersApp();
    const res = await app.request("/health");
    expect(res.headers.get("X-XSS-Protection")).toBe("1; mode=block");
  });

  it("sets Referrer-Policy: strict-origin-when-cross-origin", async () => {
    const app = buildSecurityHeadersApp();
    const res = await app.request("/health");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sets Permissions-Policy", async () => {
    const app = buildSecurityHeadersApp();
    const res = await app.request("/health");
    expect(res.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });

  it("does NOT set HSTS outside production", async () => {
    const app = buildSecurityHeadersApp("development");
    const res = await app.request("/health");
    expect(res.headers.get("Strict-Transport-Security")).toBeNull();
  });

  it("sets HSTS in production", async () => {
    const app = buildSecurityHeadersApp("production");
    const res = await app.request("/health");
    expect(res.headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
  });

  it("applies headers to API routes too", async () => {
    const app = buildSecurityHeadersApp();
    const res = await app.request("/api/data");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });
});

// ─── CSRF middleware ──────────────────────────────────────────────────────────

function buildCsrfApp() {
  const app = new Hono();

  app.use("/api/*", async (c, next) => {
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;

    const isExempt =
      path.startsWith("/api/auth/") ||
      path.startsWith("/api/webhooks/");

    if (!isExempt && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const xrw = c.req.header("X-Requested-With");
      if (!xrw) {
        return c.json({ error: "Missing X-Requested-With header" }, 403);
      }
    }
    await next();
  });

  // Routes under test
  app.get("/api/data", (c) => c.json({ ok: true }));
  app.post("/api/data", (c) => c.json({ ok: true }));
  app.put("/api/data", (c) => c.json({ ok: true }));
  app.patch("/api/data", (c) => c.json({ ok: true }));
  app.delete("/api/data", (c) => c.json({ ok: true }));

  // Auth route — exempt from CSRF
  app.post("/api/auth/signin", (c) => c.json({ ok: true }));

  // Stripe webhook — exempt from CSRF
  app.post("/api/webhooks/stripe", (c) => c.json({ received: true }));

  app.get("/health", (c) => c.json({ status: "ok" }));

  return app;
}

describe("CSRF middleware", () => {
  it("allows GET requests without X-Requested-With", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", { method: "GET" });
    expect(res.status).toBe(200);
  });

  it("blocks POST without X-Requested-With header", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", { method: "POST" });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Missing X-Requested-With header");
  });

  it("blocks PUT without X-Requested-With header", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", { method: "PUT" });
    expect(res.status).toBe(403);
  });

  it("blocks PATCH without X-Requested-With header", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", { method: "PATCH" });
    expect(res.status).toBe(403);
  });

  it("blocks DELETE without X-Requested-With header", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", { method: "DELETE" });
    expect(res.status).toBe(403);
  });

  it("allows POST with X-Requested-With: XMLHttpRequest", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    expect(res.status).toBe(200);
  });

  it("allows PUT with X-Requested-With header", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", {
      method: "PUT",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    expect(res.status).toBe(200);
  });

  it("allows DELETE with X-Requested-With header", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/data", {
      method: "DELETE",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    expect(res.status).toBe(200);
  });

  it("exempts /api/auth/* from CSRF check (POST without header allowed)", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/auth/signin", { method: "POST" });
    expect(res.status).toBe(200);
  });

  it("exempts /api/webhooks/* from CSRF check (Stripe webhook, POST without header allowed)", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/api/webhooks/stripe", { method: "POST" });
    expect(res.status).toBe(200);
  });

  it("non-API routes are not affected by CSRF middleware", async () => {
    const app = buildCsrfApp();
    const res = await app.request("/health", { method: "GET" });
    expect(res.status).toBe(200);
  });
});

// ─── CORS expanded to /api/* ──────────────────────────────────────────────────

describe("CORS coverage for /api/*", () => {
  it("CORS headers include X-Requested-With in allowHeaders", async () => {
    const app = new Hono();
    app.use(
      "/api/*",
      cors({
        origin: "http://localhost:3000",
        allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Requested-With"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
        maxAge: 600,
      }),
    );
    app.get("/api/data", (c) => c.json({ ok: true }));

    const res = await app.request("/api/data", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "X-Requested-With",
      },
    });

    // The allow-headers should include X-Requested-With
    const allowHeaders = res.headers.get("Access-Control-Allow-Headers") ?? "";
    expect(allowHeaders.toLowerCase()).toContain("x-requested-with");
  });

  it("CORS covers /api/data (not just /api/auth/*)", async () => {
    const app = new Hono();
    app.use(
      "/api/*",
      cors({
        origin: "http://localhost:3000",
        allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Requested-With"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
        maxAge: 600,
      }),
    );
    app.get("/api/data", (c) => c.json({ ok: true }));

    const res = await app.request("/api/data", {
      headers: { Origin: "http://localhost:3000" },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });
});
