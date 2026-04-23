"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SmashLogo } from "@/components/ui/smash-logo";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  Copy, Check, Link2, Users, Mail, UserPlus, LogIn,
  Clock, CheckCircle2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlayerStatus, InvitationStatus } from "@prisma/client";

interface OrgPlayer {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  userId: string | null;
  status: PlayerStatus;
}

interface OrgInvitation {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
}

interface OrganisationClientProps {
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  players: OrgPlayer[];
  invitations: OrgInvitation[];
}

export function OrganisationClient({ user, players, invitations }: OrganisationClientProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"invite" | "join">("invite");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Join flow
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const members = players.filter((p) => p.userId !== null);
  const linkedCount = members.length;

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      const link = `${origin}/join/${json.data.token}`;
      setInviteLink(link);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSending(false);
    }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast("Link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      // The code is either a full URL or just the token
      const token = joinCode.trim().split("/").pop()!;
      const res = await fetch(`/api/invitations/${token}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast(`Joined ${json.data.orgOwnerName ?? "organisation"} successfully!`, "success");
      setJoinCode("");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setJoining(false);
    }
  }

  const pendingInvites = invitations.filter((i) => i.status === "PENDING");
  const acceptedInvites = invitations.filter((i) => i.status === "ACCEPTED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-orange-500 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-lg shadow-orange-500/25 shrink-0">
          <SmashLogo size={56} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">
            {user.name ? `${user.name}'s Organisation` : "My Organisation"}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
          <div className="flex gap-2 mt-1 text-xs text-[var(--color-muted)]">
            <span>{players.length} players</span>
            <span>·</span>
            <span>{linkedCount} members</span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 bg-[var(--color-surface-3)] rounded-xl">
        <button
          onClick={() => setActiveTab("invite")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "invite"
              ? "bg-[var(--color-surface)] text-orange-500 shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          )}
        >
          <UserPlus className="h-4 w-4" /> Invite Friend
        </button>
        <button
          onClick={() => setActiveTab("join")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "join"
              ? "bg-[var(--color-surface)] text-orange-500 shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          )}
        >
          <LogIn className="h-4 w-4" /> Join Organisation
        </button>
      </div>

      {/* Invite tab */}
      {activeTab === "invite" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-orange-500" />
                Invite by Link
              </span>
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-[var(--color-muted)] mb-3">
            Enter a friend&apos;s email to generate a personal invite link. They&apos;ll be added to your players when they accept.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="friend@example.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
            <Button onClick={handleInvite} loading={inviting} disabled={!inviteEmail.trim()}>
              Generate
            </Button>
          </div>

          {/* Generated link */}
          {inviteLink && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--color-surface-3)] border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted)] mb-2 font-medium">Share this link:</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-orange-500 font-mono truncate">{inviteLink}</p>
                <button
                  onClick={() => copyLink(inviteLink)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-muted)]"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Pending invites list */}
          {pendingInvites.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Pending ({pendingInvites.length})</p>
              {pendingInvites.map((inv) => (
                <InviteRow key={inv.id} invite={inv} origin={origin} onCopy={copyLink} copied={copied} />
              ))}
            </div>
          )}
          {acceptedInvites.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Accepted ({acceptedInvites.length})</p>
              {acceptedInvites.map((inv) => (
                <InviteRow key={inv.id} invite={inv} origin={origin} onCopy={copyLink} copied={copied} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Join tab */}
      {activeTab === "join" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-orange-500" />
                Join an Organisation
              </span>
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-[var(--color-muted)] mb-3">
            Got an invite link from a friend? Paste the full link or just the invite code to join their organisation.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste invite link or code…"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <Button onClick={handleJoin} loading={joining} disabled={!joinCode.trim()}>
              Join
            </Button>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-2">
            Your name and email will be added as a player in their organisation.
          </p>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              Players ({players.length})
            </span>
          </CardTitle>
        </CardHeader>
        {players.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No players yet. Invite friends to get started.</p>
        ) : (
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar name={p.name} src={p.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{p.name}</p>
                  {p.email && <p className="text-xs text-[var(--color-muted)] truncate">{p.email}</p>}
                </div>
                {p.userId ? (
                  <Badge variant="success" className="text-[10px] shrink-0">Joined</Badge>
                ) : (
                  <Badge variant="muted" className="text-[10px] shrink-0">Invited</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InviteRow({ invite, origin, onCopy, copied }: {
  invite: OrgInvitation;
  origin: string;
  onCopy: (link: string) => void;
  copied: boolean;
}) {
  const link = `${origin}/join/${invite.token}`;
  const isExpired = invite.expiresAt < new Date();
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-3)]">
      <Mail className="h-3.5 w-3.5 text-[var(--color-muted)] shrink-0" />
      <span className="flex-1 text-xs text-[var(--color-foreground)] truncate">{invite.email}</span>
      {invite.status === "ACCEPTED" ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : isExpired ? (
        <span className="text-[10px] text-red-400 shrink-0">Expired</span>
      ) : (
        <>
          <Clock className="h-3 w-3 text-[var(--color-muted)] shrink-0" />
          <button
            onClick={() => onCopy(link)}
            className="p-1 rounded hover:bg-[var(--color-surface)] transition-colors text-[var(--color-muted)]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </div>
  );
}
