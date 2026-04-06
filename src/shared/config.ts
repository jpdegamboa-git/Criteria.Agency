import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://criteriafilms:criteriafilms@localhost:5432/criteriafilms",
  storagePath: path.resolve(
    ROOT_DIR,
    process.env.STORAGE_PATH ?? "./storage"
  ),
  agentsPath: path.resolve(ROOT_DIR, "agents"),
  port: parseInt(process.env.PORT ?? "3000", 10),
  gatePassRate: parseFloat(process.env.GATE_PASS_RATE ?? "0.8"),
};
