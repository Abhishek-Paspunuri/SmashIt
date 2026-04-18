"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shuffle,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type { Player, Group } from "@prisma/client";

type GroupWithCount = Group & { _count: { members: number } };

interface TournamentWizardProps {
  players: Player[];
  groups: GroupWithCount[];
  defaultGroupId?: string;
}

interface TeamDraft {
  id: string;
  name: string;
  playerIds: string[];
}

const STEPS = ["Details", "Players", "Teams", "Review"];

export function TournamentWizard({ players, groups, defaultGroupId }: TournamentWizardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"ROUND_ROBIN" | "KNOCKOUT">("ROUND_ROBIN");
  const [teamSize, setTeamSize] = useState(2);

  // Step 2: Player selection
  const [sourceGroupId, setSourceGroupId] = useState<string | undefined>(defaultGroupId);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");

  // Step 3: Teams
  const [teams, setTeams] = useState<TeamDraft[]>([]);
  const [randomAssign, setRandomAssign] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Players available for selection
  const availablePlayers = useMemo(() => {
    const base = sourceGroupId
      ? players.filter((p) =>
          groups
            .find((g) => g.id === sourceGroupId)
            // We'll use all players if group found, but since we don't have members
            // in this context just use all players as fallback
            ? true
            : true
        )
      : players;
    return base.filter((p) =>
      p.name.toLowerCase().includes(playerSearch.toLowerCase())
    );
  }, [players, groups, sourceGroupId, playerSearch]);

  const selectedPlayers = useMemo(
    () => players.filter((p) => selectedPlayerIds.includes(p.id)),
    [players, selectedPlayerIds]
  );

  // Generate teams with random assignment
  function generateTeams() {
    if (selectedPlayers.length < 2) return;

    const shuffled = randomAssign ? [...selectedPlayers].sort(() => Math.random() - 0.5) : selectedPlayers;

    const numTeams = Math.floor(shuffled.length / teamSize);
    const newTeams: TeamDraft[] = Array.from({ length: numTeams }, (_, i) => ({
      id: `team-${i}`,
      name: `Team ${String.fromCharCode(65 + i)}`,
      playerIds: shuffled.slice(i * teamSize, (i + 1) * teamSize).map((p) => p.id),
    }));

    // Assign remaining players to last team
    const remaining = shuffled.slice(numTeams * teamSize);
    if (remaining.length > 0 && newTeams.length > 0) {
      newTeams[newTeams.length - 1].playerIds.push(...remaining.map((p) => p.id));
    }

    setTeams(newTeams);
  }

  function addTeam() {
    const assigned = new Set(teams.flatMap((t) => t.playerIds));
    const unassigned = selectedPlayerIds.filter((id) => !assigned.has(id));
    setTeams((prev) => [
      ...prev,
      { id: `team-${Date.now()}`, name: `Team ${String.fromCharCode(65 + prev.length)}`, playerIds: unassigned.slice(0, teamSize) },
    ]);
  }

  function updateTeamName(id: string, name: string) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function removeFromTeam(teamId: string, playerId: string) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, playerIds: t.playerIds.filter((id) => id !== playerId) } : t
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source team
    const sourceTeam = teams.find((t) => t.playerIds.includes(activeId));
    const destTeam = teams.find((t) => t.id === overId || t.playerIds.includes(overId));

    if (!sourceTeam || !destTeam || sourceTeam.id === destTeam.id) return;

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === sourceTeam.id) {
          return { ...t, playerIds: t.playerIds.filter((id) => id !== activeId) };
        }
        if (t.id === destTeam.id) {
          return { ...t, playerIds: [...t.playerIds, activeId] };
        }
        return t;
      })
    );
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          format,
          teamSize,
          sourceGroupId,
          playerIds: selectedPlayerIds,
          teams: teams.map((t) => ({ name: t.name, playerIds: t.playerIds })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json.error));
      toast("Tournament created!", "success");
      router.push(`/tournaments/${json.data.id}`);
    } catch (err) {
      toast((err as Error).message, "error");
      setSaving(false);
    }
  }

  // Validation per step
  const canProceed = [
    name.trim().length > 0,
    selectedPlayerIds.length >= 4,
    teams.length >= 2 && teams.every((t) => t.playerIds.length >= 1),
    true,
  ][step];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Back */}
      <button
        onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-orange-500 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {step === 0 ? "Back" : "Previous"}
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? "bg-orange-500 text-white"
                  : i === step
                  ? "bg-orange-500 text-white"
                  : "bg-[var(--color-surface-3)] text-[var(--color-muted)]"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-orange-500" : "text-[var(--color-muted)]"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-4 sm:w-8 ${i < step ? "bg-orange-500" : "bg-[var(--color-border)]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepDetails
          name={name} setName={setName}
          description={description} setDescription={setDescription}
          format={format} setFormat={setFormat}
          teamSize={teamSize} setTeamSize={setTeamSize}
        />
      )}

      {step === 1 && (
        <StepPlayers
          players={players}
          groups={groups}
          sourceGroupId={sourceGroupId}
          setSourceGroupId={setSourceGroupId}
          selectedPlayerIds={selectedPlayerIds}
          setSelectedPlayerIds={setSelectedPlayerIds}
          playerSearch={playerSearch}
          setPlayerSearch={setPlayerSearch}
        />
      )}

      {step === 2 && (
        <StepTeams
          teams={teams}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          teamSize={teamSize}
          randomAssign={randomAssign}
          setRandomAssign={setRandomAssign}
          onGenerate={generateTeams}
          onDragEnd={handleDragEnd}
          onUpdateName={updateTeamName}
          onRemovePlayer={removeFromTeam}
          onAddTeam={addTeam}
          sensors={sensors}
        />
      )}

      {step === 3 && (
        <StepReview
          name={name}
          description={description}
          format={format}
          teamSize={teamSize}
          teams={teams}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
        />
      )}

      {/* Footer */}
      <div className="mt-6">
        {step < 3 ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (step === 1) generateTeams();
              setStep((s) => s + 1);
            }}
            disabled={!canProceed}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={handleSubmit} loading={saving}>
            <Check className="h-4 w-4" />
            Create Tournament
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Details ──────────────────────────────────────────────────────────

function StepDetails({ name, setName, description, setDescription, format, setFormat, teamSize, setTeamSize }: {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  format: string; setFormat: (v: "ROUND_ROBIN" | "KNOCKOUT") => void;
  teamSize: number; setTeamSize: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-1">Tournament Details</h2>
        <p className="text-sm text-[var(--color-muted)]">Give your tournament a name and set the format.</p>
      </div>

      <Input label="Tournament Name *" placeholder="Summer Smash Open" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Description</label>
        <textarea
          rows={2}
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Format</label>
        <div className="grid grid-cols-2 gap-2">
          {(["ROUND_ROBIN", "KNOCKOUT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                format === f
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-orange-300"
              }`}
            >
              {f === "ROUND_ROBIN" ? "Round Robin" : "Knockout"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Players per Team</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setTeamSize(n)}
              className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                teamSize === n
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-orange-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted)]">Default: 2 (Doubles)</p>
      </div>
    </div>
  );
}

// ── Step 2: Players ──────────────────────────────────────────────────────────

function StepPlayers({ players, groups, sourceGroupId, setSourceGroupId, selectedPlayerIds, setSelectedPlayerIds, playerSearch, setPlayerSearch }: {
  players: Player[]; groups: GroupWithCount[];
  sourceGroupId: string | undefined; setSourceGroupId: (v: string | undefined) => void;
  selectedPlayerIds: string[]; setSelectedPlayerIds: (v: string[]) => void;
  playerSearch: string; setPlayerSearch: (v: string) => void;
}) {
  function toggle(id: string) {
    setSelectedPlayerIds(
      selectedPlayerIds.includes(id)
        ? selectedPlayerIds.filter((x) => x !== id)
        : [...selectedPlayerIds, id]
    );
  }

  function selectAll() {
    setSelectedPlayerIds(players.map((p) => p.id));
  }

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-1">Select Players</h2>
        <p className="text-sm text-[var(--color-muted)]">Choose at least 4 players for the tournament.</p>
      </div>

      {/* Source group quick-select */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSourceGroupId(undefined)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !sourceGroupId ? "bg-orange-500 text-white" : "bg-[var(--color-surface-3)] text-[var(--color-muted)]"
            }`}
          >
            All Players
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSourceGroupId(g.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sourceGroupId === g.id ? "bg-orange-500 text-white" : "bg-[var(--color-surface-3)] text-[var(--color-muted)]"
              }`}
            >
              {g.name} ({g._count.members})
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <input
          type="search"
          placeholder="Search players..."
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm mr-2 focus:outline-none focus:border-orange-500"
        />
        <span className="text-xs text-orange-500 font-medium cursor-pointer shrink-0" onClick={selectAll}>
          Select All
        </span>
      </div>

      <div className="text-xs text-[var(--color-muted)] -mt-2">
        {selectedPlayerIds.length} selected
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {players.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-8">
            No players found. Add players first.
          </p>
        ) : (
          filtered.map((player) => (
            <button
              key={player.id}
              onClick={() => toggle(player.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
                selectedPlayerIds.includes(player.id)
                  ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700"
                  : "hover:bg-[var(--color-surface-3)] border border-transparent"
              }`}
            >
              <Avatar name={player.name} src={player.avatarUrl} size="sm" />
              <span className="flex-1 text-sm font-medium text-[var(--color-foreground)]">
                {player.name}
              </span>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedPlayerIds.includes(player.id)
                  ? "border-orange-500 bg-orange-500"
                  : "border-[var(--color-border)]"
              }`}>
                {selectedPlayerIds.includes(player.id) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Step 3: Teams ────────────────────────────────────────────────────────────

function StepTeams({ teams, players, selectedPlayerIds, teamSize, randomAssign, setRandomAssign, onGenerate, onDragEnd, onUpdateName, onRemovePlayer, onAddTeam, sensors }: {
  teams: TeamDraft[];
  players: Player[];
  selectedPlayerIds: string[];
  teamSize: number;
  randomAssign: boolean;
  setRandomAssign: (v: boolean) => void;
  onGenerate: () => void;
  onDragEnd: (e: DragEndEvent) => void;
  onUpdateName: (id: string, name: string) => void;
  onRemovePlayer: (teamId: string, playerId: string) => void;
  onAddTeam: () => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const playerMap = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );

  const assignedIds = new Set(teams.flatMap((t) => t.playerIds));
  const unassignedPlayers = selectedPlayerIds
    .filter((id) => !assignedIds.has(id))
    .map((id) => playerMap[id])
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-1">Build Teams</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Assign {selectedPlayerIds.length} players into teams of {teamSize}.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setRandomAssign(!randomAssign)}
            className={`relative h-5 w-9 rounded-full transition-colors ${randomAssign ? "bg-orange-500" : "bg-[var(--color-border)]"}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${randomAssign ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-[var(--color-foreground)]">Random assignment</span>
        </label>
        <Button variant="secondary" size="sm" onClick={onGenerate}>
          <Shuffle className="h-3.5 w-3.5" />
          {teams.length > 0 ? "Re-shuffle" : "Generate"}
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[var(--color-border)] rounded-xl">
          <p className="text-sm text-[var(--color-muted)]">
            Click &quot;Generate&quot; to auto-assign players into teams.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="space-y-3">
            {teams.map((team) => (
              <Card key={team.id} padded={false} className="overflow-hidden">
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <input
                    value={team.name}
                    onChange={(e) => onUpdateName(team.id, e.target.value)}
                    className="text-sm font-semibold bg-transparent border-b border-dashed border-[var(--color-border)] focus:outline-none focus:border-orange-500 text-[var(--color-foreground)] w-32"
                  />
                  <span className="text-xs text-[var(--color-muted)]">
                    {team.playerIds.length} player{team.playerIds.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <SortableContext
                  items={team.playerIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="px-3 pb-3 space-y-1.5">
                    {team.playerIds.map((playerId) => {
                      const player = playerMap[playerId];
                      if (!player) return null;
                      return (
                        <DraggablePlayerItem
                          key={playerId}
                          player={player}
                          onRemove={() => onRemovePlayer(team.id, playerId)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </Card>
            ))}

            {/* Unassigned */}
            {unassignedPlayers.length > 0 && (
              <Card padded={false} className="border-dashed">
                <div className="px-3 pt-3 pb-2">
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                    Unassigned ({unassignedPlayers.length})
                  </p>
                </div>
                <div className="px-3 pb-3 space-y-1.5">
                  {unassignedPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-3)]">
                      <Avatar name={player.name} src={player.avatarUrl} size="xs" />
                      <span className="text-xs text-[var(--color-muted)]">{player.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </DndContext>
      )}

      {teams.length > 0 && (
        <Button variant="outline" size="sm" onClick={onAddTeam} className="w-full">
          <Plus className="h-4 w-4" />
          Add Team
        </Button>
      )}
    </div>
  );
}

function DraggablePlayerItem({ player, onRemove }: { player: Player; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] transition-opacity ${isDragging ? "opacity-50" : ""}`}
      data-dnd-draggable="true"
    >
      <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-[var(--color-muted)]">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Avatar name={player.name} src={player.avatarUrl} size="xs" />
      <span className="flex-1 text-sm font-medium text-[var(--color-foreground)]">{player.name}</span>
      <button onClick={onRemove} className="p-0.5 text-[var(--color-muted)] hover:text-red-500 transition-colors">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview({ name, description, format, teamSize, teams, players, selectedPlayerIds }: {
  name: string; description: string;
  format: string; teamSize: number;
  teams: TeamDraft[]; players: Player[]; selectedPlayerIds: string[];
}) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-1">Review</h2>
        <p className="text-sm text-[var(--color-muted)]">Confirm everything looks good before creating.</p>
      </div>

      <Card>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Name</span>
            <span className="font-semibold text-[var(--color-foreground)]">{name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Format</span>
            <span className="font-semibold text-[var(--color-foreground)]">{format === "ROUND_ROBIN" ? "Round Robin" : "Knockout"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Team size</span>
            <span className="font-semibold text-[var(--color-foreground)]">{teamSize} players</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Players</span>
            <span className="font-semibold text-[var(--color-foreground)]">{selectedPlayerIds.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Teams</span>
            <span className="font-semibold text-[var(--color-foreground)]">{teams.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Matches (Round Robin)</span>
            <span className="font-semibold text-[var(--color-foreground)]">
              {(teams.length * (teams.length - 1)) / 2}
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Teams</h3>
        {teams.map((team) => (
          <Card key={team.id} padded={false} className="p-3">
            <p className="text-sm font-semibold text-[var(--color-foreground)] mb-2">{team.name}</p>
            <div className="flex gap-2 flex-wrap">
              {team.playerIds.map((pid) => {
                const p = playerMap[pid];
                return p ? (
                  <div key={pid} className="flex items-center gap-1.5">
                    <Avatar name={p.name} src={p.avatarUrl} size="xs" />
                    <span className="text-xs text-[var(--color-muted)]">{p.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
