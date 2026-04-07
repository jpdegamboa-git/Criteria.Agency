import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Mock the config module before importing auth
vi.mock("../shared/config.js", () => ({
  config: {
    adminApiKey: "",
  },
}));

import { requireAuth } from "./auth.js";
import { config } from "../shared/config.js";

function createApp() {
  const app = new Hono();
  app.use("/protected/*", requireAuth);
  app.get("/protected/data", (c) => c.json({ ok: true }));
  return app;
}

describe("requireAuth middleware", () => {
  beforeEach(() => {
    // Reset to dev mode (no key)
    (config as { adminApiKey: string }).adminApiKey = "";
  });

  it("should allow requests when ADMIN_API_KEY is not set (dev mode)", async () => {
    const app = createApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should reject requests without auth when key is configured", async () => {
    (config as { adminApiKey: string }).adminApiKey = "secret-key-123";
    const app = createApp();
    const res = await app.request("/protected/data");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should allow requests with valid Bearer token", async () => {
    (config as { adminApiKey: string }).adminApiKey = "secret-key-123";
    const app = createApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer secret-key-123" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should reject requests with wrong Bearer token", async () => {
    (config as { adminApiKey: string }).adminApiKey = "secret-key-123";
    const app = createApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer wrong-key" },
    });
    expect(res.status).toBe(401);
  });

  it("should allow requests with valid X-API-Key header", async () => {
    (config as { adminApiKey: string }).adminApiKey = "secret-key-123";
    const app = createApp();
    const res = await app.request("/protected/data", {
      headers: { "X-API-Key": "secret-key-123" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("should reject requests with wrong X-API-Key", async () => {
    (config as { adminApiKey: string }).adminApiKey = "secret-key-123";
    const app = createApp();
    const res = await app.request("/protected/data", {
      headers: { "X-API-Key": "wrong-key" },
    });
    expect(res.status).toBe(401);
  });

  it("should reject requests with Basic auth scheme", async () => {
    (config as { adminApiKey: string }).adminApiKey = "secret-key-123";
    const app = createApp();
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Basic secret-key-123" },
    });
    expect(res.status).toBe(401);
  });
});
