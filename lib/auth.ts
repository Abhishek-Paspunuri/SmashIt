import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

/**
 * Get the currently authenticated user from DB.
 * Redirects to /login if not authenticated.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  let user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  // Auto-create user record if missing (e.g. first login via email)
  if (!user) {
    user = await prisma.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        name:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          null,
        avatarUrl:
          supabaseUser.user_metadata?.avatar_url ??
          supabaseUser.user_metadata?.picture ??
          null,
      },
    });
  }

  return user;
}

/**
 * Get the currently authenticated user from DB without redirecting.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) return null;

    return await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });
  } catch {
    return null;
  }
}
