import { Hono } from "hono";
import { startSession, processMessage } from "../services/brief-copilot.js";
import { parseBody, copilotMessageSchema } from "./validators.js";

export const copilotRoutes = new Hono();

// POST /api/copilot/message
copilotRoutes.post("/api/copilot/message", async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(copilotMessageSchema, body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  const { sessionId, message, clientId } = parsed.data;

  // No sessionId → start a new session
  if (!sessionId) {
    const result = await startSession(clientId);
    return c.json(result, 201);
  }

  // Existing session → process client message
  if (!message) {
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
