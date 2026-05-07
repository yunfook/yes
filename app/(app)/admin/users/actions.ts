"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userAreas } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/authz";

const BaseSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(120),
  isAdmin: z.boolean().default(false),
  areaIds: z.array(z.number().int().positive()).default([]),
});

const CreateSchema = BaseSchema.extend({
  password: z.string().min(6),
});

const UpdateSchema = BaseSchema.extend({
  password: z.string().min(6).optional().or(z.literal("")),
});

export async function createUser(input: z.infer<typeof CreateSchema>) {
  await requireAdmin();
  const data = CreateSchema.parse(input);
  const passwordHash = await hashPassword(data.password);
  const [created] = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase().trim(),
      name: data.name,
      passwordHash,
      isAdmin: data.isAdmin,
    })
    .returning();
  if (!data.isAdmin && data.areaIds.length > 0) {
    await db.insert(userAreas).values(
      data.areaIds.map((areaId) => ({ userId: created.id, areaId })),
    );
  }
  revalidatePath("/admin/users");
}

export async function updateUser(
  id: number,
  input: z.infer<typeof UpdateSchema>,
) {
  await requireAdmin();
  const data = UpdateSchema.parse(input);
  const update: Partial<typeof users.$inferInsert> = {
    email: data.email.toLowerCase().trim(),
    name: data.name,
    isAdmin: data.isAdmin,
  };
  if (data.password && data.password.length >= 6) {
    update.passwordHash = await hashPassword(data.password);
  }
  await db.update(users).set(update).where(eq(users.id, id));

  await db.delete(userAreas).where(eq(userAreas.userId, id));
  if (!data.isAdmin && data.areaIds.length > 0) {
    await db.insert(userAreas).values(
      data.areaIds.map((areaId) => ({ userId: id, areaId })),
    );
  }
  revalidatePath("/admin/users");
}

export async function deleteUser(id: number) {
  await requireAdmin();
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
}
