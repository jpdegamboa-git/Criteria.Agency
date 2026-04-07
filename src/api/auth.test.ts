import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Mock config and auth before importing the middleware under test.
vi.mock("../shared/config.js", () => ({
  config: {
    adminApiKey: "",
    skipAuth: false,
    betterAuthSecret: "dev-secret-change-in-production",
  },
}));

vi.mock("../auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { requireSession, requireAdmin } from "./auth.js";
import { config } from "../shared/config.js";
import { auth } from "../auth.js";

// Convenience: mutable references to config fields under test
type MutableConfig = {
  adminApiKey: string;
  skipAuth: boolean;
  betterAuthSecret: string;
};

const mConfig = config as unknown as MutableConfig;
const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;

function createSessionApp() {
  const app = new Hono();
  app.use("/protected/*", requireSession);
  app.get("/protected/data", (c) => c.json({ ok: true, user: c.get("user") }));
  return app;
}

function createAdminApp() {
  const app = new Hono();
  app.use("/admin/*", requireSession, requireAdmin);
  app.get("/admin/data", (c) => c.json({ ok: true, user: c.get("user") }));
  return app;
}

// ─── requireSession ──────────────────────────────────────────────────────────

describe("requireSession", () => {
  beforeEach(() => {
    mConfig.adminApiKey = "";
    mConfig.skipAuth = false;
    mockGetSession.mockResolvedValue(null);
  });

  it("allows requests with a valid Better Auth session", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u1", role: "user", name: "Alice" },
      session: { id: "s1" },
    });
    const app = createSessionApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe("u1");
  });

  it("returns 401 when no session and no API key and SKIP_AUTH is not set", async () => {
    const app = createSessionApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("does NOT bypass auth when default dev secret is used but SKIP_AUTH is not set", async () => {
    // This verifies the old implicit bypass is gone
    mConfig.adminApiKey = "";
    mConfig.skipAuth = false;
    const app = createSessionApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(401);
  });

  it("allows requests when SKIP_AUTH=true is explicitly set", async () => {
    mConfig.skipAuth = true;
    const app = createSessionApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(200);
  });

  it("sets synthetic admin user when SKIP_AUTH=true", async () => {
    mConfig.skipAuth = true;
    const app = createSessionApp();
    const res = await app.request("/protected/data");
    const body = await res.json();
    expect(body.user.role).toBe("admin");
  });

  it("allows requests with valid Bearer token", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer secret-key-123" },
    });
    expect(res.status).toBe(200);
  });

  it("sets synthetic admin user on API key auth (Bearer)", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer secret-key-123" },
    });
    const body = await res.json();
    expect(body.user.role).toBe("admin");
  });

  it("returns 401 with wrong Bearer token", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer wrong-key" },
    });
    expect(res.status).toBe(401);
  });

  it("allows requests with valid X-API-Key header", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { "X-API-Key": "secret-key-123" },
    });
    expect(res.status).toBe(200);
  });

  it("sets synthetic admin user on API key auth (X-API-Key)", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { "X-API-Key": "secret-key-123" },
    });
    const body = await res.json();
    expect(body.user.role).toBe("admin");
  });

  it("returns 401 with wrong X-API-Key", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { "X-API-Key": "wrong-key" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 with Basic auth scheme (not supported)", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createSessionApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Basic secret-key-123" },
    });
    expect(res.status).toBe(401);
  });
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  beforeEach(() => {
    mConfig.adminApiKey = "";
    mConfig.skipAuth = false;
    mockGetSession.mockResolvedValue(null);
  });

  it("returns 403 when no user is in context (requireSession not called / no auth)", async () => {
    // No session, no API key, no SKIP_AUTH → requireSession returns 401 first.
    // Test requireAdmin directly with an app that skips requireSession.
    const app = new Hono();
    app.use("/admin/*", requireAdmin);
    app.get("/admin/data", (c) => c.json({ ok: true }));
    const res = await app.request("/admin/data");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("no user context");
  });

  it("returns 403 for non-admin user", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u2", role: "user", name: "Bob" },
      session: { id: "s2" },
    });
    const app = createAdminApp();
    const res = await app.request("/admin/data");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("admin role required");
  });

  it("allows admin user through", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "u3", role: "admin", name: "Charlie" },
      session: { id: "s3" },
    });
    const app = createAdminApp();
    const res = await app.request("/admin/data");
    expect(res.status).toBe(200);
  });

  it("allows API key user through (synthetic admin user has role=admin)", async () => {
    mConfig.adminApiKey = "secret-key-123";
    const app = createAdminApp();
    const res = await app.request("/admin/data", {
      headers: { Authorization: "Bearer secret-key-123" },
    });
    expect(res.status).toBe(200);
  });

  it("allows SKIP_AUTH user through (synthetic admin user has role=admin)", async () => {
    mConfig.skipAuth = true;
    const app = createAdminApp();
    const res = await app.request("/admin/data");
    expect(res.status).toBe(200);
  });
});
