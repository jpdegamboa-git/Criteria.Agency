import { db, schema } from "./index.js";

async function main() {
  console.log("Seeding database...");

  // Create demo client
  const [client] = await db
    .insert(schema.clients)
    .values({
      name: "Demo Corp",
      email: "demo@democorp.com",
      brandAssets: {
        logo: ["logo.png", "logo.svg"],
        colors: ["#1a1a2e", "#16213e", "#0f3460"],
        fonts: ["Inter", "JetBrains Mono"],
      },
    })
    .returning();

  console.log(`  Client: ${client.name} (${client.id})`);

  // Create demo project
  const [project] = await db
    .insert(schema.projects)
    .values({
      clientId: client.id,
      name: "Demo SaaS Product Launch",
      type: "corporate",
    })
    .returning();

  console.log(`  Project: ${project.name} (${project.id})`);
  console.log("\nSeed complete. Run the pipeline:");
  console.log(`  npm run cli -- project run ${project.id}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
