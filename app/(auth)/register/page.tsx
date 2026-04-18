"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--color-muted)] max-w-xs">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="mt-6 text-sm text-orange-500 font-medium hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-surface)] px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500 shadow-lg mb-4">
          <span className="text-3xl">🏸</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Create Account</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Join Smash and start playing.</p>
      </div>

      <div className="w-full max-w-sm">
        <Button
          variant="outline"
          className="w-full mb-4 gap-3"
          onClick={handleGoogleLogin}
          loading={googleLoading}
          size="lg"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--color-surface)] px-3 text-xs text-[var(--color-muted)]">
              or create with email
            </span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <Input
            label="Full Name"
            type="text"
            placeholder="Alex Smash"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading} size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
