import { describe, it, expect, vi, beforeEach } from "vitest";
import { intelligenceRoutes } from "./intelligence-routes.js";
import { Hono } from "hono";

vi.mock("@/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "alert-1", status: "acknowledged" }]),
        }),
      }),
    }),
  },
  schema: {
    continuousAgentRuns: {},
    alerts: {},
    alertRules: {},
    dataSourceConfigs: {},
  },
}));

describe("intelligence-routes", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route("/", intelligenceRoutes);
  });

  it("GET /api/intelligence/:clientId/dashboard returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/dashboard");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("brand");
    expect(body).toHaveProperty("culture");
    expect(body).toHaveProperty("industry");
    expect(body).toHaveProperty("competitive");
    expect(body).toHaveProperty("opportunities");
  });

  it("GET /api/intelligence/:clientId/brand returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/brand");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/culture returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/culture");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/industry returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/industry");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/competitive returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/competitive");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/opportunities returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/opportunities");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/alerts returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/alerts");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/history returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/history");
    expect(res.status).toBe(200);
  });

  it("GET /api/intelligence/:clientId/config returns 200", async () => {
    const res = await app.request("/api/intelligence/client-1/config");
    expect(res.status).toBe(200);
  });
});
