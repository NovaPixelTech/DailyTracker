import { Router, type IRouter } from "express";
import { db, profileTable } from "@workspace/db";
import { UpsertProfileBody } from "@workspace/api-zod";
import { calculateTDEE } from "../lib/calorie.js";

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  const [profile] = await db.select().from(profileTable).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const tdee = calculateTDEE(
    data.weightKg,
    data.heightCm,
    data.age,
    data.gender,
    data.activityLevel
  );

  const [existing] = await db.select().from(profileTable).limit(1);

  let profile;
  if (existing) {
    [profile] = await db
      .update(profileTable)
      .set({ ...data, tdee, updatedAt: new Date() })
      .returning();
  } else {
    [profile] = await db
      .insert(profileTable)
      .values({ ...data, tdee })
      .returning();
  }

  res.json({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

export default router;
