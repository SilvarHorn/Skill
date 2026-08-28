import { pgTable, text, timestamp, integer, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./user.js";
import { user } from "./user.js";

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  email: text("email"),
  role: userRoleEnum("role").default("STUDENT"),
  headline: text("headline"),
  bio: text("bio"),
  skills: jsonb("skills").default([]),
  projects: jsonb("projects").default([]),
  certifications: jsonb("certifications").default([]),
  experience: jsonb("experience").default([]),
  careerPreferences: jsonb("career_preferences").default({}),
  profileCompletion: integer("profile_completion").default(0),
  currentOnboardingStep: integer("current_onboarding_step").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index("students_user_id_idx").on(table.userId),
}));
