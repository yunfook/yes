"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";

const LoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginState =
  | {
      error?: string;
      fieldErrors?: { username?: string[]; password?: string[] };
    }
  | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await verifyCredentials(parsed.data.username, parsed.data.password);
  if (!user) return { error: "Invalid username or password." };

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
