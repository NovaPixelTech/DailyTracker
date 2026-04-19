import { Router, type IRouter } from "express";
import { db, entriesTable } from "@workspace/db";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { CreateEntryBody, UpsertEntryByDateBody, ListEntriesQueryParams, GetEntryByDateParams, UpsertEntryByDateParams, DeleteEntryParams } from "@workspace/api-zod";
import { formatEntry } from "../lib/calorie.js";

const router: IRouter = Router();

router.get("/entries", async (req, res): Promise<void> => {
  const params = ListEntriesQueryParams.safeParse(req.query);
  const conditions = [];
  if (params.success) {
    if (params.data.startDate) conditions.push(gte(entriesTable.date, params.data.startDate));
    if (params.data.endDate) conditions.push(lte(entriesTable.date, params.data.endDate));
  }

  const rows = await db
    .select()
    .from(entriesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(entriesTable.date));

  res.json(rows.map(formatEntry));
});

router.post("/entries", async (req, res): Promise<void> => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(entriesTable).values(parsed.data).returning();
  res.status(201).json(formatEntry(entry));
});

router.get("/entries/today", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.date, today));

  if (!entry) {
    res.status(404).json({ error: "No entry for today" });
    return;
  }
  res.json(formatEntry(entry));
});

router.get("/entries/:date", async (req, res): Promise<void> => {
  const params = GetEntryByDateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.date, params.data.date));

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(formatEntry(entry));
});

router.put("/entries/:date", async (req, res): Promise<void> => {
  const params = UpsertEntryByDateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpsertEntryByDateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.date, params.data.date));

  let entry;
  if (existing) {
    [entry] = await db
      .update(entriesTable)
      .set({ ...parsed.data, date: params.data.date, updatedAt: new Date() })
      .where(eq(entriesTable.date, params.data.date))
      .returning();
  } else {
    [entry] = await db
      .insert(entriesTable)
      .values({ ...parsed.data, date: params.data.date })
      .returning();
  }

  res.json(formatEntry(entry));
});

router.delete("/entries/:date", async (req, res): Promise<void> => {
  const params = DeleteEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(entriesTable).where(eq(entriesTable.date, params.data.date));
  res.sendStatus(204);
});

export default router;
