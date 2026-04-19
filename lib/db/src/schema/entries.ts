import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const entriesTable = pgTable("entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  breakfastKcal: integer("breakfast_kcal").notNull().default(0),
  lunchKcal: integer("lunch_kcal").notNull().default(0),
  dinnerKcal: integer("dinner_kcal").notNull().default(0),
  snacksKcal: integer("snacks_kcal").notNull().default(0),
  walkingKcal: integer("walking_kcal").notNull().default(0),
  workoutKcal: integer("workout_kcal").notNull().default(0),
  otherBurnedKcal: integer("other_burned_kcal").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEntrySchema = createInsertSchema(entriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entriesTable.$inferSelect;
