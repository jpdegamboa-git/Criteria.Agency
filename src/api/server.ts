import { serve } from "@hono/node-server";
import { app } from "./routes.js";
import { config } from "../shared/config.js";

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`CriteriaFilms API running on http://localhost:${info.port}`);
});
