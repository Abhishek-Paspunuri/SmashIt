"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { PlayerStatusBadge } from "@/components/ui/badge";
import { UserPlus, Trash2, ArrowLeft, Trophy } from "lucide-react";
import type { Group, GroupMember, Player } from "@prisma/client";
import Link from "next/link";

type GroupWithMembers = Group & {
  members: (GroupMember & { player: Player })[];
};

interface GroupDetailClientProps {
  group: GroupWithMembers;
  allPlayers: Player[];
}

export function GroupDetailClient({ group: initial, allPlayers }: GroupDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [group, setGroup] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const memberIds = group.members.map((m) => m.player.id);
  const availablePlayers = useMemo(
    () =>
      allPlayers.filter(
        (p) =>
          !memberIds.includes(p.id) &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [allPlayers, memberIds, search]
  );

  function togglePlayer(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAddMembers() {
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_members", playerIds: selectedIds }),
      });
      if (!res.ok) throw new Error("Failed");

      // Optimistically add
      const newMembers = allPlayers
        .filter((p) => selectedIds.includes(p.id))
        .map((player) => ({
          id: `temp-${player.id}`,
          groupId: group.id,
          playerId: player.id,
          joinedAt: new Date(),
          player,
        }));
      setGroup((prev) => ({ ...prev, members: [...prev.members, ...newMembers] }));
      toast("Members added!", "success");
      setShowAdd(false);
      setSelectedIds([]);
      setSearch("");
      router.refresh();
    } catch {
      toast("Failed to add members", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(playerId: string) {
    if (!confirm("Remove this player from the group?")) return;
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_member", playerId }),
      });
      if (!res.ok) throw new Error("Failed");
      setGroup((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.player.id !== playerId),
      }));
      toast("Player removed", "success");
    } catch {
      toast("Failed to remove player", "error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-orange-500 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Groups
      </Link>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-[var(--color-muted)] mt-0.5">{group.description}</p>
          )}
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {group.members.length} player{group.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tournaments/new?groupId=${group.id}`}>
            <Button variant="secondary" size="sm">
              <Trophy className="h-4 w-4" />
              Tournament
            </Button>
          </Link>
          <Button onClick={() => setShowAdd(true)} size="sm">
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Members */}
      <Card padded={false}>
        {group.members.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted)] text-sm">
            No members yet. Add some players!
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {group.members.map((member) => (
              <div key={member.player.id} className="flex items-center gap-3 p-3">
                <Avatar name={member.player.name} src={member.player.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {member.player.name}
                  </p>
                  {member.player.email && (
                    <p className="text-xs text-[var(--color-muted)] truncate">{member.player.email}</p>
                  )}
                </div>
                <PlayerStatusBadge status={member.player.status} />
                <button
                  onClick={() => handleRemoveMember(member.player.id)}
                  className="p-1.5 text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add members modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Members" size="md">
        <div className="space-y-3">
          <input
            type="search"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-orange-500"
          />
          <div className="max-h-56 overflow-y-auto space-y-1">
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] text-center py-4">All players are already in this group.</p>
            ) : (
              availablePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                    selectedIds.includes(player.id)
                      ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                      : "hover:bg-[var(--color-surface-3)]"
                  }`}
                >
                  <Avatar name={player.name} src={player.avatarUrl} size="sm" />
                  <span className="text-sm font-medium text-[var(--color-foreground)]">{player.name}</span>
                  {selectedIds.includes(player.id) && (
                    <span className="ml-auto text-orange-500 text-xs font-semibold">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleAddMembers}
            loading={saving}
            disabled={selectedIds.length === 0}
          >
            Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}Player{selectedIds.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
