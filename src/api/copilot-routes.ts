import { Hono } from "hono";
import { startSession, processMessage } from "../services/brief-copilot.js";

export const copilotRoutes = new Hono();

// POST /api/copilot/message
copilotRoutes.post("/api/copilot/message", async (c) => {
  const body = await c.req.json();
  const { sessionId, message, clientId } = body;

  // No sessionId → start a new session
  if (!sessionId) {
    const result = await startSession(clientId);
    return c.json(result, 201);
  }

  // Existing session → process client message
  if (!message || typeof message !== "string") {
    return c.json({ error: "message is required for existing sessions" }, 400);
  }

  try {
    const result = await processMessage(sessionId, message);
    return c.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg.includes("not found") ? 404 : 400;
    return c.json({ error: msg }, status);
  }
});
