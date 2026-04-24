"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

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
    const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: callbackUrl,
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
    const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const inputFocusStyle = {
    border: "1px solid rgba(249,115,22,0.5)",
    background: "rgba(249,115,22,0.06)",
  };

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center animate-scale-bounce-in">
        <div
          className="rounded-2xl p-8 max-w-sm w-full"
          style={{
            background: "rgba(28,28,30,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 64px -12px rgba(0,0,0,0.8)",
          }}
        >
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm text-[#888] max-w-xs mx-auto">
            We sent a confirmation link to{" "}
            <strong className="text-white">{email}</strong>.
            Click it to activate your account
            {next !== "/dashboard" ? " — you'll be taken straight to the invite after confirming." : "."}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-orange-400 font-semibold hover:text-orange-300 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-12">

      {/* ── Logo ── */}
      <div className="mb-10 text-center animate-scale-bounce-in">
        <div className="relative inline-flex items-center justify-center mb-5">
          <span className="absolute h-28 w-28 rounded-3xl bg-orange-500/15 blur-2xl animate-pulse" />
          <span className="absolute h-20 w-20 rounded-2xl bg-orange-500/20 blur-lg" />
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/40 ring-1 ring-orange-500/30">
            <Image
              src="/logo.png"
              alt="Smash"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white animate-fade-in-up delay-75">
          Create Account
        </h1>
        <p className="text-sm text-[#888] mt-1.5 animate-fade-in-up delay-150">
          Join Smash and start playing.
        </p>
      </div>

      {/* ── Card ── */}
      <div className="w-full max-w-sm animate-fade-in-up delay-150">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(28, 28, 30, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 64px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
        >
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-white transition-all duration-150 active:scale-95 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {googleLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs text-[#555] shrink-0">or create with email</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-3">
            {[
              { label: "Full Name", type: "text", placeholder: "Alex Smash", value: name, onChange: (v: string) => setName(v), autoComplete: "name" },
              { label: "Email", type: "email", placeholder: "you@example.com", value: email, onChange: (v: string) => setEmail(v), autoComplete: "email" },
              { label: "Password", type: "password", placeholder: "Min. 8 characters", value: password, onChange: (v: string) => setPassword(v), autoComplete: "new-password" },
            ].map(({ label, type, placeholder, value, onChange, autoComplete }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#999]">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  required
                  autoComplete={autoComplete}
                  minLength={label === "Password" ? 8 : undefined}
                  className="h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-[#444] outline-none transition-all duration-150"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
            ))}

            {error && (
              <div
                className="text-sm text-red-400 rounded-xl p-3 animate-fade-in-up"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-50 btn-shine mt-1"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                boxShadow: "0 4px 16px -2px rgba(249,115,22,0.45)",
              }}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#666] mt-5">
            Already have an account?{" "}
            <Link
              href={next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="text-orange-400 font-semibold hover:text-orange-300 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-[#444] mt-4">
          🏸 Track your game. Rise on the leaderboard.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
