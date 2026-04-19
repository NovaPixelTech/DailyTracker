import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profileTable = pgTable("profile", {
  id: serial("id").primaryKey(),
  weightKg: real("weight_kg").notNull(),
  heightCm: real("height_cm").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  activityLevel: text("activity_level").notNull(),
  goal: text("goal").notNull(),
  targetCalorieDelta: integer("target_calorie_delta").notNull().default(-500),
  tdee: integer("tdee"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProfileSchema = createInsertSchema(profileTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profileTable.$inferSelect;
