import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ── DB mock ──────────────────────────────────────────────────────────────────
// vi.hoisted ensures mockSelect is initialised before vi.mock factory runs
// (vi.mock calls are hoisted to the top of the file by vitest's transformer).

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock("../db/index.js", () => ({
  db: {
    select: mockSelect,
  },
  schema: {
    clients: { id: "id", email: "email" },
  },
}));

// Mock drizzle-orm eq so it doesn't need a real DB connection
vi.mock("drizzle-orm", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
}));

// ── Import after mocks ───────────────────────────────────────────────────────
import { requireTenantMatch } from "./tenant-guard";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Hono app that sets `user` on context then runs requireTenantMatch */
function buildApp(
  user: { id: string; email: string; role?: string } | undefined,
  routePattern: string = "/test/:clientId",
) {
  const app = new Hono<{ Variables: { user: any; tenantId: string } }>();

  app.use(routePattern, async (c, next) => {
    if (user) c.set("user", user);
    await next();
  });

  app.use(routePattern, requireTenantMatch);

  app.get(routePattern, (c) => c.json({ ok: true, tenantId: c.get("tenantId") ?? null }));

  return app;
}

/** Reset the mock so each test gets a clean chain */
function setupDbMock(clientId: string | null) {
  const limit = vi.fn().mockResolvedValue(clientId ? [{ id: clientId }] : []);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mockSelect.mockReturnValue({ from });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("requireTenantMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin user can access any clientId — passes", async () => {
    setupDbMock("client-abc");
    const app = buildApp({ id: "u1", email: "admin@test.com", role: "admin" });
    const res = await app.request("/test/some-other-client");
    expect(res.status).toBe(200);
    // DB should not be called for admin
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("regular user accessing their own clientId — passes", async () => {
    const clientId = "550e8400-e29b-41d4-a716-446655440000";
    setupDbMock(clientId);
    const app = buildApp({ id: "u2", email: "user@test.com", role: "client" });
    const res = await app.request(`/test/${clientId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.tenantId).toBe(clientId);
  });

  it("regular user accessing different clientId — returns 403", async () => {
    setupDbMock("550e8400-e29b-41d4-a716-446655440000");
    const app = buildApp({ id: "u3", email: "user@test.com", role: "client" });
    const res = await app.request("/test/different-client-id");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden: tenant mismatch");
  });

  it("no user in context (API key auth) — passes", async () => {
    const app = buildApp(undefined);
    const res = await app.request("/test/any-client");
    expect(res.status).toBe(200);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("route without :clientId param — passes without checking", async () => {
    const clientId = "550e8400-e29b-41d4-a716-446655440000";
    setupDbMock(clientId);

    // Build an app with a route that has no :clientId param
    const app = new Hono<{ Variables: { user: any; tenantId: string } }>();

    app.use("/test/status", async (c, next) => {
      c.set("user", { id: "u4", email: "user@test.com", role: "client" });
      await next();
    });
    app.use("/test/status", requireTenantMatch);
    app.get("/test/status", (c) => c.json({ ok: true }));

    const res = await app.request("/test/status");
    expect(res.status).toBe(200);
  });

  it("regular user with no matching client record — returns 403 on clientId route", async () => {
    setupDbMock(null); // no client found for this user
    const app = buildApp({ id: "u5", email: "unknown@test.com", role: "client" });
    const res = await app.request("/test/some-client-id");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden: tenant mismatch");
  });
});
