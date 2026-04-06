#!/usr/bin/env tsx
import { Command } from "commander";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { AGENT_REGISTRY } from "../agents/registry.js";
import {
  advanceProject,
  runFullPipeline,
  pauseProject,
  resumeProject,
} from "../orchestrator/state-machine.js";
import { getArtifacts } from "../storage/artifacts.js";
import type { ProjectType } from "../shared/types.js";

const program = new Command();

program.name("criteriafilms").description("CriteriaFilms Pipeline MVP CLI").version("0.1.0");

// ── Project commands ──

const project = program.command("project").description("Manage projects");

project
  .command("create")
  .description("Create a new project")
  .requiredOption("--name <name>", "Project name")
  .option("--type <type>", "Project type", "corporate")
  .option("--client <client>", "Client name", "Demo Client")
  .option("--email <email>", "Client email", "demo@example.com")
  .action(async (opts) => {
    // Find or create client
    let [client] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.email, opts.email));

    if (!client) {
      [client] = await db
        .insert(schema.clients)
        .values({ name: opts.client, email: opts.email })
        .returning();
    }

    const [proj] = await db
      .insert(schema.projects)
      .values({
        clientId: client.id,
        name: opts.name,
        type: opts.type as ProjectType,
      })
      .returning();

    console.log(`\nProject created:`);
    console.log(`  ID:     ${proj.id}`);
    console.log(`  Name:   ${proj.name}`);
    console.log(`  Type:   ${proj.type}`);
    console.log(`  Status: ${proj.status}`);
    console.log(`  Client: ${client.name}`);
    process.exit(0);
  });

project
  .command("list")
  .description("List all projects")
  .action(async () => {
    const projects = await db.select().from(schema.projects);
    if (projects.length === 0) {
      console.log("No projects found.");
      process.exit(0);
    }
    console.log("\nProjects:");
    console.log("─".repeat(80));
    for (const p of projects) {
      console.log(
        `  ${p.id.slice(0, 8)}  ${p.status.padEnd(12)}  ${p.type.padEnd(12)}  ${p.name}`
      );
    }
    console.log(`\nTotal: ${projects.length}`);
    process.exit(0);
  });

project
  .command("status")
  .description("Get project status")
  .argument("<id>", "Project ID (or prefix)")
  .action(async (id) => {
    const project = await findProject(id);
    if (!project) return;

    const arts = await getArtifacts(project.id);
    const gates = await db
      .select()
      .from(schema.gateReviews)
      .where(eq(schema.gateReviews.projectId, project.id));
    const execs = await db
      .select()
      .from(schema.agentExecutions)
      .where(eq(schema.agentExecutions.projectId, project.id));

    console.log(`\nProject: ${project.name}`);
    console.log(`  ID:       ${project.id}`);
    console.log(`  Type:     ${project.type}`);
    console.log(`  Status:   ${project.status}`);
    console.log(`  Gate:     ${project.currentGate ?? "none"}`);
    console.log(`  Artifacts: ${arts.length}`);
    console.log(`  Gates:     ${gates.length}`);
    console.log(`  Executions: ${execs.length}`);
    console.log(`  Created:  ${project.createdAt}`);
    console.log(`  Updated:  ${project.updatedAt}`);
    process.exit(0);
  });

project
  .command("advance")
  .description("Advance project one step")
  .argument("<id>", "Project ID (or prefix)")
  .action(async (id) => {
    const project = await findProject(id);
    if (!project) return;

    console.log(`\nAdvancing project "${project.name}" from ${project.status}...`);
    const result = await advanceProject(project.id);

    console.log(`  ${result.previousStatus} → ${result.newStatus}`);
    if (result.gateEvaluated) {
      console.log(
        `  Gate ${result.gateEvaluated.toUpperCase()}: ${result.gateDecision?.toUpperCase()} (iteration ${result.gateIteration})`
      );
    }
    if (result.maxIterationsReached) {
      console.log(`  ⚠ Max iterations reached — project paused for human review`);
    }
    if (result.completed) {
      console.log(`  Project delivered!`);
    }
    process.exit(0);
  });

project
  .command("run")
  .description("Run full pipeline until delivery or gate failure")
  .argument("<id>", "Project ID (or prefix)")
  .action(async (id) => {
    const project = await findProject(id);
    if (!project) return;

    console.log(`\nRunning full pipeline for "${project.name}"...\n`);
    const results = await runFullPipeline(project.id);

    for (const r of results) {
      let line = `  ${r.previousStatus.padEnd(12)} → ${r.newStatus.padEnd(12)}`;
      if (r.gateEvaluated) {
        line += `  [${r.gateEvaluated.toUpperCase()} ${r.gateDecision?.toUpperCase()}]`;
      }
      console.log(line);
    }

    const last = results[results.length - 1];
    console.log();
    if (last.completed) {
      console.log(`Pipeline complete! Project delivered.`);
    } else if (last.newStatus === "paused") {
      console.log(`Pipeline paused — human intervention required.`);
    } else if (last.gateDecision === "fail") {
      console.log(
        `Pipeline stopped at gate ${last.gateEvaluated?.toUpperCase()} — iteration needed.`
      );
    }

    // Summary
    const arts = await getArtifacts(project.id);
    const execs = await db
      .select()
      .from(schema.agentExecutions)
      .where(eq(schema.agentExecutions.projectId, project.id));

    console.log(`\nSummary:`);
    console.log(`  Steps executed: ${results.length}`);
    console.log(`  Artifacts created: ${arts.length}`);
    console.log(`  Agent executions: ${execs.length}`);
    process.exit(0);
  });

project
  .command("artifacts")
  .description("List project artifacts")
  .argument("<id>", "Project ID (or prefix)")
  .option("--step <step>", "Filter by step")
  .action(async (id, opts) => {
    const project = await findProject(id);
    if (!project) return;

    const arts = await getArtifacts(project.id, opts.step);
    if (arts.length === 0) {
      console.log("No artifacts found.");
      process.exit(0);
    }

    console.log(`\nArtifacts for "${project.name}":`);
    console.log("─".repeat(90));
    for (const a of arts) {
      console.log(
        `  ${a.step.padEnd(12)}  ${a.type.padEnd(10)}  ${a.createdByAgent.padEnd(8)}  ${a.name}`
      );
    }
    console.log(`\nTotal: ${arts.length}`);
    process.exit(0);
  });

project
  .command("gates")
  .description("Show gate review history")
  .argument("<id>", "Project ID (or prefix)")
  .action(async (id) => {
    const project = await findProject(id);
    if (!project) return;

    const gates = await db
      .select()
      .from(schema.gateReviews)
      .where(eq(schema.gateReviews.projectId, project.id));

    if (gates.length === 0) {
      console.log("No gate reviews yet.");
      process.exit(0);
    }

    console.log(`\nGate Reviews for "${project.name}":`);
    console.log("─".repeat(70));
    for (const g of gates) {
      console.log(
        `  ${g.gate.toUpperCase().padEnd(4)}  ${g.decision.toUpperCase().padEnd(5)}  iter ${g.iteration}  by ${g.reviewer}  ${g.createdAt}`
      );
    }
    process.exit(0);
  });

project
  .command("executions")
  .description("Show agent execution audit trail")
  .argument("<id>", "Project ID (or prefix)")
  .action(async (id) => {
    const project = await findProject(id);
    if (!project) return;

    const execs = await db
      .select()
      .from(schema.agentExecutions)
      .where(eq(schema.agentExecutions.projectId, project.id));

    if (execs.length === 0) {
      console.log("No executions yet.");
      process.exit(0);
    }

    console.log(`\nAgent Executions for "${project.name}":`);
    console.log("─".repeat(80));
    for (const e of execs) {
      console.log(
        `  ${e.agentId.padEnd(8)}  ${e.step.padEnd(12)}  ${e.status.padEnd(10)}  attempt ${e.attempt}  ${e.startedAt}`
      );
    }
    console.log(`\nTotal: ${execs.length}`);
    process.exit(0);
  });

project
  .command("pause")
  .description("Pause a project")
  .argument("<id>", "Project ID (or prefix)")
  .action(async (id) => {
    const project = await findProject(id);
    if (!project) return;
    await pauseProject(project.id);
    console.log(`Project "${project.name}" paused.`);
    process.exit(0);
  });

project
  .command("resume")
  .description("Resume a paused project")
  .argument("<id>", "Project ID (or prefix)")
  .option("--to <status>", "Resume to status", "brief")
  .action(async (id, opts) => {
    const project = await findProject(id);
    if (!project) return;
    await resumeProject(project.id, opts.to as any);
    console.log(`Project "${project.name}" resumed to ${opts.to}.`);
    process.exit(0);
  });

// ── Agents command ──

program
  .command("agents")
  .description("List registered agents")
  .action(() => {
    console.log("\nPhase 1 Agents (20):");
    console.log("─".repeat(70));
    for (const a of Object.values(AGENT_REGISTRY)) {
      const team = a.team === 0 ? "Top" : `T${a.team}`;
      console.log(
        `  ${a.id.padEnd(8)}  ${team.padEnd(5)}  ${a.level.padEnd(16)}  ${a.name}`
      );
    }
    process.exit(0);
  });

// ── Helper ──

async function findProject(idOrPrefix: string) {
  // Try exact match first
  let [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, idOrPrefix));

  if (!project) {
    // Try prefix match
    const all = await db.select().from(schema.projects);
    const matches = all.filter((p) => p.id.startsWith(idOrPrefix));
    if (matches.length === 1) {
      project = matches[0];
    } else if (matches.length > 1) {
      console.error(`Multiple projects match prefix "${idOrPrefix}":`);
      for (const m of matches) {
        console.error(`  ${m.id}  ${m.name}`);
      }
      process.exit(1);
      return null;
    } else {
      console.error(`Project not found: ${idOrPrefix}`);
      process.exit(1);
      return null;
    }
  }

  return project;
}

program.parse();
