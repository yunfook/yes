"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState =
  | { error?: string; fieldErrors?: { email?: string[]; password?: string[] } }
  | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) return { error: "Invalid email or password." };

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  });

  const next = (formData.get("next") as string) || "/dashboard";
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
