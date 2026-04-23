"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmashLogo } from "@/components/ui/smash-logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, Users } from "lucide-react";

interface JoinClientProps {
  token: string;
  orgOwnerName: string;
  invitedEmail: string;
  alreadyMember: boolean;
}

export function JoinClient({ token, orgOwnerName, invitedEmail, alreadyMember }: JoinClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(alreadyMember);

  async function handleAccept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setJoined(true);
      toast("Welcome to the organisation!", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[var(--color-surface-2)]">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-xl shadow-orange-500/30">
            <SmashLogo size={64} />
          </div>
        </div>

        {joined ? (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">You&apos;re in!</h1>
              <p className="text-sm text-[var(--color-muted)] mt-2">
                You&apos;ve joined <span className="text-orange-500 font-semibold">{orgOwnerName}&apos;s</span> organisation.
              </p>
            </div>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                Join Organisation
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-2">
                You&apos;ve been invited to join{" "}
                <span className="text-orange-500 font-semibold">{orgOwnerName}&apos;s</span>{" "}
                Smash organisation.
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Invited: {invitedEmail}
              </p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={handleAccept} loading={loading}>
                Accept &amp; Join
              </Button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Decline
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
