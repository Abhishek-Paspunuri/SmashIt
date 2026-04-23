"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge, PlayerStatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayerCardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, Users, Mail, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Player, PlayerStatus } from "@prisma/client";

interface PlayerWithGroups extends Player {
  groupMembers: { group: { id: string; name: string } }[];
}

interface PlayersClientProps {
  initialPlayers: PlayerWithGroups[];
}

type FilterStatus = PlayerStatus | "ALL";

export function PlayersClient({ initialPlayers }: PlayersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [editPlayer, setEditPlayer] = useState<PlayerWithGroups | null>(null);
  const [menuPlayerId, setMenuPlayerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filter === "ALL" || p.status === filter;
      return matchSearch && matchStatus;
    });
  }, [players, search, filter]);

  async function handleSave(formData: FormData, mode: "add" | "edit") {
    setSaving(true);
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (mode === "add") {
        const res = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setPlayers((prev) => [{ ...json.data, groupMembers: [] }, ...prev]);
        toast("Player added!", "success");
        setShowAdd(false);
      } else if (editPlayer) {
        const res = await fetch(`/api/players/${editPlayer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setPlayers((prev) =>
          prev.map((p) => (p.id === editPlayer.id ? { ...p, ...json.data, groupMembers: p.groupMembers } : p))
        );
        toast("Player updated!", "success");
        setEditPlayer(null);
      }
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this player?")) return;
    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      toast("Player deleted", "success");
    } catch {
      toast("Failed to delete player", "error");
    }
  }

  const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Invited", value: "INVITED" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Players</h1>
          <p className="text-sm text-[var(--color-muted)]">{players.length} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="h-4 w-4" />
          Add Player
        </Button>
      </div>

      {/* Search + filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="search"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-orange-500 text-white"
                  : "bg-[var(--color-surface-3)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        search || filter !== "ALL" ? (
          <div className="text-center py-12 text-[var(--color-muted)] text-sm">
            No players match your search.
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No players yet"
            description="Add your first player to get started building your group."
            action={{ label: "Add Player", onClick: () => setShowAdd(true) }}
          />
        )
      ) : (
        <div className="space-y-2">
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              menuOpen={menuPlayerId === player.id}
              onMenuToggle={() =>
                setMenuPlayerId(menuPlayerId === player.id ? null : player.id)
              }
              onEdit={() => { setEditPlayer(player); setMenuPlayerId(null); }}
              onDelete={() => { handleDelete(player.id); setMenuPlayerId(null); }}
              onViewProfile={() => router.push(`/players/${player.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Player">
        <PlayerForm onSubmit={(fd) => handleSave(fd, "add")} saving={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editPlayer} onClose={() => setEditPlayer(null)} title="Edit Player">
        {editPlayer && (
          <PlayerForm
            defaultValues={editPlayer}
            onSubmit={(fd) => handleSave(fd, "edit")}
            saving={saving}
          />
        )}
      </Modal>
    </div>
  );
}

function PlayerCard({
  player,
  menuOpen,
  onMenuToggle,
  onEdit,
  onDelete,
  onViewProfile,
}: {
  player: PlayerWithGroups;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewProfile: () => void;
}) {
  return (
    <Card
      padded={false}
      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors relative"
    >
      <button onClick={onViewProfile} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <Avatar name={player.name} src={player.avatarUrl} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--color-foreground)] truncate">
              {player.name}
            </span>
            <PlayerStatusBadge status={player.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {player.email && (
              <span className="text-xs text-[var(--color-muted)] flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                {player.email}
              </span>
            )}
          </div>
          {player.groupMembers.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {player.groupMembers.slice(0, 2).map((gm) => (
                <Badge key={gm.group.id} variant="muted" className="text-[10px]">
                  {gm.group.name}
                </Badge>
              ))}
              {player.groupMembers.length > 2 && (
                <Badge variant="muted" className="text-[10px]">
                  +{player.groupMembers.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Menu */}
      <div className="relative">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-3)] text-[var(--color-muted)] transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg py-1 min-w-[140px]">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)]"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function PlayerForm({
  defaultValues,
  onSubmit,
  saving,
}: {
  defaultValues?: Partial<Player>;
  onSubmit: (fd: FormData) => void;
  saving: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-3"
    >
      <Input label="Name *" name="name" defaultValue={defaultValues?.name} required placeholder="Alex Smash" />
      <Input label="Email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} placeholder="alex@example.com" />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Notes</label>
        <textarea
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          rows={2}
          placeholder="Optional notes..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={saving} className="flex-1">
          {defaultValues ? "Save Changes" : "Add Player"}
        </Button>
      </div>
    </form>
  );
}
