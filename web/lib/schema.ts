/**
 * Waitlist schema for Next.js API routes.
 * IMPORTANT: Keep in sync with src/db/schema.ts (waitlistEntries table).
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "pending",
  "nurturing",
  "invited",
  "converted",
]);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  videoType: varchar("video_type", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  source: varchar("source", { length: 100 }).default("landing").notNull(),
  status: waitlistStatusEnum("status").default("pending").notNull(),
  nurtureStep: integer("nurture_step").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
