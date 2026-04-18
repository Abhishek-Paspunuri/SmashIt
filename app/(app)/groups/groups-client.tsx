"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Plus, FolderOpen, Users, Trash2, ChevronRight } from "lucide-react";
import type { Group, Player } from "@prisma/client";

type GroupWithCount = Group & { _count: { members: number } };

interface GroupsClientProps {
  initialGroups: GroupWithCount[];
  allPlayers: Player[];
}

export function GroupsClient({ initialGroups, allPlayers }: GroupsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [groups, setGroups] = useState(initialGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");

  const filteredPlayers = useMemo(
    () =>
      allPlayers.filter((p) =>
        p.name.toLowerCase().includes(playerSearch.toLowerCase())
      ),
    [allPlayers, playerSearch]
  );

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    if (!groupName.trim() || selectedPlayers.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDesc.trim() || undefined,
          playerIds: selectedPlayers,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setGroups((prev) => [json.data, ...prev]);
      toast("Group created!", "success");
      setShowCreate(false);
      setGroupName("");
      setGroupDesc("");
      setSelectedPlayers([]);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this group?")) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setGroups((prev) => prev.filter((g) => g.id !== id));
      toast("Group deleted", "success");
    } catch {
      toast("Failed to delete group", "error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Groups</h1>
          <p className="text-sm text-[var(--color-muted)]">{groups.length} groups</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4" />
          New Group
        </Button>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No groups yet"
          description="Create a group to organize your players for tournaments."
          action={{ label: "Create Group", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card
              key={group.id}
              padded={false}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <button
                onClick={() => router.push(`/groups/${group.id}`)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--color-foreground)] truncate">{group.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {group._count.members} player{group._count.members !== 1 ? "s" : ""}
                  </p>
                  {group.description && (
                    <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{group.description}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-muted)] shrink-0" />
              </button>
              <button
                onClick={() => handleDelete(group.id)}
                className="p-2 rounded-lg text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Group" size="lg">
        <div className="space-y-4">
          <Input
            label="Group Name *"
            placeholder="Tuesday Night League"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Optional description..."
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
          />

          <div>
            <label className="text-sm font-medium text-[var(--color-foreground)] mb-2 block">
              Select Players ({selectedPlayers.length} selected)
            </label>
            <input
              type="search"
              placeholder="Search players..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm mb-2 focus:outline-none focus:border-orange-500"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {allPlayers.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] text-center py-4">
                  No players. Add players first.
                </p>
              ) : (
                filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      selectedPlayers.includes(player.id)
                        ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                        : "hover:bg-[var(--color-surface-3)]"
                    }`}
                  >
                    <Avatar name={player.name} src={player.avatarUrl} size="sm" />
                    <span className="text-sm font-medium text-[var(--color-foreground)]">
                      {player.name}
                    </span>
                    {selectedPlayers.includes(player.id) && (
                      <span className="ml-auto text-orange-500 text-xs font-semibold">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            loading={saving}
            disabled={!groupName.trim() || selectedPlayers.length === 0}
          >
            Create Group
          </Button>
        </div>
      </Modal>
    </div>
  );
}
