import { pgTable, text, timestamp, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { user, userRoleEnum } from "./user.js";

export const institutes = pgTable("institutes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").default("INSTITUTE"),
  instituteName: text("institute_name").notNull(),
  email: text("email"),
  instituteType: text("institute_type"),
  aisheCode: text("aishe_code"),
  website: text("website"),
  address: jsonb("address").default({}),
  departments: jsonb("departments").default([]),
  placementContact: jsonb("placement_contact").default({}),
  verificationDocs: jsonb("verification_docs").default([]),
  verificationStatus: text("verification_status").default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index("institutes_user_id_idx").on(table.userId),
}));
