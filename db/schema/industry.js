import { pgTable, text, timestamp, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { user, userRoleEnum } from "./user.js";

export const industries = pgTable("industries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").default("INDUSTRY"),
  companyName: text("company_name").notNull(),
  email: text("email"),
  industryType: text("industry_type"),
  companySize: text("company_size"),
  website: text("website"),
  description: text("description"),
  address: jsonb("address").default({}),
  documents: jsonb("documents").default([]),
  verificationDocs: jsonb("verification_docs").default([]),
  hiringPreferences: jsonb("hiring_preferences").default({}),
  verificationStatus: text("verification_status").default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index("industries_user_id_idx").on(table.userId),
}));
