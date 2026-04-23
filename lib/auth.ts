import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

/**
 * Ensures the user has a linked Player record for themselves.
 * Idempotent — safe to call on every login; skips if the player already exists.
 */
export async function ensureSelfPlayer(user: User): Promise<void> {
  const existing = await prisma.player.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) return;

  await prisma.player.create({
    data: {
      name: user.name ?? user.email.split("@")[0],
      email: user.email,
      ownerId: user.id,
      userId: user.id,
      status: "ACTIVE",
    },
  });
}

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

  // Auto-create user record if missing (e.g. first login via email/password)
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

  // Always ensure a self-player exists — idempotent, so safe on every request.
  // Covers existing users who registered before this feature was added.
  await ensureSelfPlayer(user);

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
