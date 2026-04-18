import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sync user to our DB
      const supabaseUser = data.user;
      await prisma.user.upsert({
        where: { supabaseId: supabaseUser.id },
        create: {
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
        update: {
          email: supabaseUser.email!,
          name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.user_metadata?.name ??
            undefined,
          avatarUrl:
            supabaseUser.user_metadata?.avatar_url ??
            supabaseUser.user_metadata?.picture ??
            undefined,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
