"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player, Group } from "@prisma/client";

type GroupWithCount = Group & {
  _count: { members: number };
  members: { playerId: string }[];
};

interface TournamentWizardProps {
  players: Player[];
  groups: GroupWithCount[];
  defaultGroupId?: string;
  defaultPlayerIds?: string[];
}

interface TeamDraft {
  id: string;
  name: string;
  playerIds: string[];
}

export function TournamentWizard({
  players,
  groups,
  defaultGroupId,
  defaultPlayerIds,
}: TournamentWizardProps) {
  const router = useRouter();
  const { toast } = useToast();

  // If navigating from a group, pre-select players and skip step 2
  const hasDefaultPlayers = !!defaultPlayerIds?.length;
  const STEPS = hasDefaultPlayers
    ? ["Details", "Teams", "Review"]
    : ["Details", "Players", "Teams", "Review"];

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"ROUND_ROBIN" | "KNOCKOUT">(
    "ROUND_ROBIN",
  );
  const [teamSize, setTeamSize] = useState(2);

  // Step 2: Player selection
  const [sourceGroupId, setSourceGroupId] = useState<string | undefined>(
    defaultGroupId,
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    defaultPlayerIds ?? [],
  );
  const [playerSearch, setPlayerSearch] = useState("");

  // Step 3: Teams
  const [teams, setTeams] = useState<TeamDraft[]>([]);
  const [randomAssign, setRandomAssign] = useState(false); // default OFF
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const selectedPlayers = useMemo(
    () => players.filter((p) => selectedPlayerIds.includes(p.id)),
    [players, selectedPlayerIds],
  );

  const playerMap = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  // Init empty team slots (used when entering Step 3 from Step 2)
  function initTeams() {
    if (selectedPlayers.length < 2) return;
    const numTeams = Math.max(2, Math.floor(selectedPlayers.length / teamSize));
    setTeams(
      Array.from({ length: numTeams }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${String.fromCharCode(65 + i)}`,
        playerIds: [],
      })),
    );
  }

  // Generate / re-shuffle teams (fills players into slots)
  function generateTeams() {
    if (selectedPlayers.length < 2) return;
    const pool = randomAssign
      ? [...selectedPlayers].sort(() => Math.random() - 0.5)
      : selectedPlayers;

    const numTeams = Math.max(2, Math.floor(pool.length / teamSize));
    const newTeams: TeamDraft[] = Array.from({ length: numTeams }, (_, i) => {
      const slice = pool.slice(i * teamSize, (i + 1) * teamSize);
      const name = slice
        .map((p) => p.name.replace(/\s+/g, "").slice(0, 4))
        .join("_");
      return { id: `team-${i}`, name, playerIds: slice.map((p) => p.id) };
    });

    // Distribute remaining players
    const remaining = pool.slice(numTeams * teamSize);
    remaining.forEach((p, i) => {
      newTeams[i % newTeams.length].playerIds.push(p.id);
    });

    setTeams(newTeams);
  }

  function addTeam() {
    setTeams((prev) => [
      ...prev,
      {
        id: `team-${Date.now()}`,
        name: `Team ${String.fromCharCode(65 + prev.length)}`,
        playerIds: [],
      },
    ]);
  }

  function removeTeam(teamId: string) {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }

  function updateTeamName(id: string, newName: string) {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t)),
    );
  }

  // Derive team name from current player IDs (first 4 chars of each name, joined by _)
  function autoNameTeam(playerIds: string[]): string {
    if (playerIds.length === 0) return "";
    return playerIds
      .map((id) => (playerMap[id]?.name ?? "").replace(/\s+/g, "").slice(0, 4))
      .filter(Boolean)
      .join("_");
  }

  function removeFromTeam(teamId: string, playerId: string) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const newIds = t.playerIds.filter((id) => id !== playerId);
        return {
          ...t,
          playerIds: newIds,
          name: autoNameTeam(newIds) || t.name,
        };
      }),
    );
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const playerId = active.id as string;
    const sourceId = (active.data.current as any)?.sourceId as string; // "pool" | teamId
    const destId = over.id as string; // "pool" | teamId

    if (sourceId === destId) return;

    setTeams((prev) => {
      let next: TeamDraft[];

      if (sourceId === "pool") {
        if (destId === "pool") return prev;
        const destTeam = prev.find((t) => t.id === destId);
        if (!destTeam || destTeam.playerIds.length >= teamSize) return prev;
        next = prev.map((t) =>
          t.id === destId ? { ...t, playerIds: [...t.playerIds, playerId] } : t,
        );
      } else if (destId === "pool") {
        next = prev.map((t) =>
          t.id === sourceId
            ? { ...t, playerIds: t.playerIds.filter((id) => id !== playerId) }
            : t,
        );
      } else {
        const destTeam = prev.find((t) => t.id === destId);
        if (!destTeam || destTeam.playerIds.length >= teamSize) return prev;
        next = prev.map((t) => {
          if (t.id === sourceId)
            return {
              ...t,
              playerIds: t.playerIds.filter((id) => id !== playerId),
            };
          if (t.id === destId)
            return { ...t, playerIds: [...t.playerIds, playerId] };
          return t;
        });
      }

      // Auto-rename each team based on its current players
      return next.map((t) => {
        const derived = autoNameTeam(t.playerIds);
        return derived ? { ...t, name: derived } : t;
      });
    });
  }

  // Prefer pointer-within collision so empty containers register correctly
  const collisionDetection = useCallback(
    (...args: Parameters<typeof pointerWithin>) => {
      const pw = pointerWithin(...args);
      return pw.length > 0 ? pw : rectIntersection(...args);
    },
    [],
  );

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

  // Map logical step name to index for rendering
  const stepName = STEPS[step]; // "Details" | "Players" | "Teams" | "Review"

  const canProceed =
    stepName === "Details"
      ? name.trim().length > 0
      : stepName === "Players"
        ? selectedPlayerIds.length >= 4
        : stepName === "Teams"
          ? teams.length >= 2 && teams.every((t) => t.playerIds.length >= 1)
          : true;

  // Unassigned players (for pool display in step 3)
  const assignedIds = useMemo(
    () => new Set(teams.flatMap((t) => t.playerIds)),
    [teams],
  );
  const unassignedPlayers = useMemo(
    () => selectedPlayers.filter((p) => !assignedIds.has(p.id)),
    [selectedPlayers, assignedIds],
  );

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-3 pb-8 sm:pb-5">
        {/* Back + Step indicator row */}
        <div className="flex items-center gap-4 mb-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5">
          <button
            onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-orange-500 shrink-0 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step === 0 ? "Back" : "Previous"}
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-colors",
                    i <= step
                      ? "bg-orange-500 text-white"
                      : "bg-surface-3 text-muted",
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    i === step ? "text-orange-500" : "text-muted",
                  )}
                >
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-4 sm:w-8",
                      i < step ? "bg-orange-500" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        {stepName === "Details" && (
          <StepDetails
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            format={format}
            setFormat={setFormat}
            teamSize={teamSize}
            setTeamSize={setTeamSize}
          />
        )}

        {stepName === "Players" && (
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

        {stepName === "Teams" && (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <StepTeams
              teams={teams}
              playerMap={playerMap}
              unassignedPlayers={unassignedPlayers}
              selectedPlayerIds={selectedPlayerIds}
              teamSize={teamSize}
              randomAssign={randomAssign}
              setRandomAssign={setRandomAssign}
              onGenerate={generateTeams}
              onUpdateName={updateTeamName}
              onRemovePlayer={removeFromTeam}
              onAddTeam={addTeam}
              onRemoveTeam={removeTeam}
            />
            <DragOverlay dropAnimation={null}>
              {activeDragId && playerMap[activeDragId] ? (
                <PlayerDragGhost player={playerMap[activeDragId]} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {stepName === "Review" && (
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

        {/* Desktop footer — in normal flow */}
        <div className="hidden sm:block mt-6">
          {stepName !== "Review" ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (
                  stepName === "Players" ||
                  (stepName === "Details" && hasDefaultPlayers)
                )
                  initTeams();
                setStep((s) => s + 1);
              }}
              disabled={!canProceed}
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              loading={saving}
            >
              <Check className="h-4 w-4" /> Create Tournament
            </Button>
          )}
        </div>
      </div>

      {/* Mobile footer — fixed just above the bottom nav (h-16 = bottom-16) */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-2 pt-2 bg-[var(--color-surface-2)]/95 backdrop-blur-sm border-t border-[var(--color-border)]">
        {stepName !== "Review" ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (
                stepName === "Players" ||
                (stepName === "Details" && hasDefaultPlayers)
              )
                initTeams();
              setStep((s) => s + 1);
            }}
            disabled={!canProceed}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            loading={saving}
          >
            <Check className="h-4 w-4" /> Create Tournament
          </Button>
        )}
      </div>
    </>
  );
}

// ── Step 1: Details ──────────────────────────────────────────────────────────

function StepDetails({
  name,
  setName,
  description,
  setDescription,
  format,
  setFormat,
  teamSize,
  setTeamSize,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  format: string;
  setFormat: (v: "ROUND_ROBIN" | "KNOCKOUT") => void;
  teamSize: number;
  setTeamSize: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">
          Tournament Details
        </h2>
        <p className="text-sm text-muted">
          Give your tournament a name and set the format.
        </p>
      </div>

      <Input
        label="Tournament Name *"
        placeholder="Summer Smash Open"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          rows={2}
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Format</label>
        <div className="grid grid-cols-2 gap-2">
          {(["ROUND_ROBIN", "KNOCKOUT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={cn(
                "py-3 rounded-xl border text-sm font-medium transition-colors",
                format === f
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                  : "border-border text-muted hover:border-orange-300",
              )}
            >
              {f === "ROUND_ROBIN" ? "Round Robin" : "Knockout"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          Players per Team
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setTeamSize(n)}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors",
                teamSize === n
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-border text-muted hover:border-orange-300",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">Default: 2 (Doubles)</p>
      </div>
    </div>
  );
}

// ── Step 2: Players ──────────────────────────────────────────────────────────

function StepPlayers({
  players,
  groups,
  sourceGroupId,
  setSourceGroupId,
  selectedPlayerIds,
  setSelectedPlayerIds,
  playerSearch,
  setPlayerSearch,
}: {
  players: Player[];
  groups: GroupWithCount[];
  sourceGroupId: string | undefined;
  setSourceGroupId: (v: string | undefined) => void;
  selectedPlayerIds: string[];
  setSelectedPlayerIds: (v: string[]) => void;
  playerSearch: string;
  setPlayerSearch: (v: string) => void;
}) {
  // Players visible in the list (filtered by active group tab + search)
  const activeGroup = groups.find((g) => g.id === sourceGroupId);
  const groupPlayerIds = activeGroup
    ? new Set(activeGroup.members.map((m) => m.playerId))
    : null;

  const listPlayers = players.filter((p) => {
    const inGroup = groupPlayerIds ? groupPlayerIds.has(p.id) : true;
    const matchSearch = p.name
      .toLowerCase()
      .includes(playerSearch.toLowerCase());
    return inGroup && matchSearch;
  });

  function toggle(id: string) {
    setSelectedPlayerIds(
      selectedPlayerIds.includes(id)
        ? selectedPlayerIds.filter((x) => x !== id)
        : [...selectedPlayerIds, id],
    );
  }

  function selectGroup(g: GroupWithCount) {
    const ids = g.members.map((m) => m.playerId);
    setSourceGroupId(g.id);
    setSelectedPlayerIds(ids);
    setPlayerSearch("");
  }

  function clearGroup() {
    setSourceGroupId(undefined);
    setSelectedPlayerIds([]);
    setPlayerSearch("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">
          Select Players
        </h2>
        <p className="text-sm text-muted">
          Choose at least 4 players for the tournament.
        </p>
      </div>

      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={clearGroup}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              !sourceGroupId
                ? "bg-orange-500 text-white"
                : "bg-surface-3 text-muted",
            )}
          >
            All Players
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => selectGroup(g)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                sourceGroupId === g.id
                  ? "bg-orange-500 text-white"
                  : "bg-surface-3 text-muted",
              )}
            >
              {g.name} ({g._count.members})
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="search"
          placeholder="Search players..."
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={() => setSelectedPlayerIds(listPlayers.map((p) => p.id))}
          className="text-xs text-orange-500 font-medium shrink-0 hover:underline"
        >
          All
        </button>
        <button
          onClick={() => setSelectedPlayerIds([])}
          className="text-xs text-muted font-medium shrink-0 hover:underline"
        >
          Clear
        </button>
      </div>

      <div className="text-xs text-muted">
        {selectedPlayerIds.length} selected
        {activeGroup && (
          <span className="ml-1 text-orange-500">
            · from {activeGroup.name}
          </span>
        )}
      </div>

      <div className="space-y-1 max-h-[44vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-2">
        {listPlayers.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">
            No players found.
          </p>
        ) : (
          listPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => toggle(player.id)}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left",
                selectedPlayerIds.includes(player.id)
                  ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700"
                  : "hover:bg-surface-3 border border-transparent",
              )}
            >
              <Avatar name={player.name} src={player.avatarUrl} size="sm" />
              <span className="flex-1 text-sm font-medium text-foreground">
                {player.name}
              </span>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  selectedPlayerIds.includes(player.id)
                    ? "border-orange-500 bg-orange-500"
                    : "border-border",
                )}
              >
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

function StepTeams({
  teams,
  playerMap,
  unassignedPlayers,
  selectedPlayerIds,
  teamSize,
  randomAssign,
  setRandomAssign,
  onGenerate,
  onUpdateName,
  onRemovePlayer,
  onAddTeam,
  onRemoveTeam,
}: {
  teams: TeamDraft[];
  playerMap: Record<string, Player>;
  unassignedPlayers: Player[];
  selectedPlayerIds: string[];
  teamSize: number;
  randomAssign: boolean;
  setRandomAssign: (v: boolean) => void;
  onGenerate: () => void;
  onUpdateName: (id: string, name: string) => void;
  onRemovePlayer: (teamId: string, playerId: string) => void;
  onAddTeam: () => void;
  onRemoveTeam: (teamId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Build Teams</h2>
        <p className="text-sm text-muted">
          Assign {selectedPlayerIds.length} players into teams of {teamSize}.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={randomAssign}
            onClick={() => setRandomAssign(!randomAssign)}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors focus:outline-none",
              randomAssign ? "bg-orange-500" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                randomAssign ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <span className="text-sm text-foreground">Random shuffle</span>
        </label>
        <Button variant="secondary" size="sm" onClick={onGenerate}>
          <Shuffle className="h-3.5 w-3.5" />
          {teams.length > 0 ? "Re-shuffle" : "Generate"}
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
          <p className="text-sm text-muted">
            Click <strong>Generate</strong> to create team slots, then drag
            players in.
          </p>
        </div>
      ) : (
        /* Pool sticks within this container so it never covers the title above */
        <div className="overflow-y-auto max-h-[58vh] rounded-xl border border-border">
          {/* ── Sticky Player Pool (sticks to top of this inner scroll box) ── */}
          <div className="sticky top-0 z-10">
            <PlayerPool unassignedPlayers={unassignedPlayers} />
          </div>

          {/* ── Team Slots ── */}
          <div className="space-y-3 p-3 pt-2">
            {teams.map((team) => (
              <TeamDropZone
                key={team.id}
                team={team}
                playerMap={playerMap}
                teamSize={teamSize}
                onUpdateName={onUpdateName}
                onRemovePlayer={onRemovePlayer}
                onRemoveTeam={onRemoveTeam}
                canDelete={teams.length > 2}
              />
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={onAddTeam}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Add Team
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Player Pool (sticky, droppable "unassigned" zone) ────────────────────────

function PlayerPool({ unassignedPlayers }: { unassignedPlayers: Player[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "sticky top-0 z-10 rounded-xl border transition-all duration-150 p-3",
        "bg-surface shadow-sm",
        isOver
          ? "border-orange-400 ring-2 ring-orange-400/25 bg-orange-50/50 dark:bg-orange-900/10"
          : "border-border",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-3.5 w-3.5 text-orange-500 shrink-0" />
        <span className="text-xs font-semibold text-foreground">
          Player Pool
        </span>
        <span className="text-xs text-muted">
          {unassignedPlayers.length} unassigned — drag to a team below
        </span>
      </div>

      {unassignedPlayers.length === 0 ? (
        <div
          className={cn(
            "text-center py-2 rounded-lg border-2 border-dashed text-xs text-muted transition-colors",
            isOver ? "border-orange-400 text-orange-500" : "border-border",
          )}
        >
          {isOver ? "Drop here to unassign" : "All players assigned ✓"}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {unassignedPlayers.map((player) => (
            <DraggablePoolChip key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Draggable chip in the pool ───────────────────────────────────────────────

function DraggablePoolChip({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: { sourceId: "pool" },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-dnd-draggable="true"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none",
        "bg-surface-2 border-border",
        "hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all duration-100",
        isDragging && "opacity-30",
      )}
    >
      <Avatar name={player.name} src={player.avatarUrl} size="xs" />
      <span className="text-xs font-medium text-foreground">{player.name}</span>
      <GripVertical className="h-3 w-3 text-muted" />
    </div>
  );
}

// ── Team drop zone ───────────────────────────────────────────────────────────

function TeamDropZone({
  team,
  playerMap,
  teamSize,
  onUpdateName,
  onRemovePlayer,
  onRemoveTeam,
  canDelete,
}: {
  team: TeamDraft;
  playerMap: Record<string, Player>;
  teamSize: number;
  onUpdateName: (id: string, name: string) => void;
  onRemovePlayer: (teamId: string, playerId: string) => void;
  onRemoveTeam: (teamId: string) => void;
  canDelete: boolean;
}) {
  const isFull = team.playerIds.length >= teamSize;
  const { setNodeRef, isOver } = useDroppable({
    id: team.id,
    disabled: isFull,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border transition-all duration-150 overflow-hidden",
        isOver
          ? "border-orange-400 ring-2 ring-orange-400/25 bg-orange-50/30 dark:bg-orange-900/10"
          : "border-border bg-surface",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <input
          value={team.name}
          onChange={(e) => onUpdateName(team.id, e.target.value)}
          className="flex-1 text-sm font-semibold bg-transparent border-b border-dashed border-border focus:outline-none focus:border-orange-500 text-foreground"
        />
        <span
          className={cn(
            "text-xs shrink-0 font-medium",
            isFull ? "text-orange-500" : "text-muted",
          )}
        >
          {team.playerIds.length}/{teamSize}
          {isFull && " · Full"}
        </span>
        {canDelete && (
          <button
            onClick={() => onRemoveTeam(team.id)}
            className="p-0.5 text-muted hover:text-red-500 transition-colors shrink-0"
            title="Remove team"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Player list / empty drop area */}
      <div className="px-3 pb-3 min-h-14">
        {team.playerIds.length === 0 ? (
          <div
            className={cn(
              "flex items-center justify-center h-12 rounded-lg border-2 border-dashed text-xs transition-colors",
              isOver
                ? "border-orange-400 text-orange-500 bg-orange-50/50 dark:bg-orange-900/10"
                : "border-border text-muted",
            )}
          >
            {isOver ? "Release to drop here" : "Drop players here"}
          </div>
        ) : (
          <div className="space-y-1.5">
            {team.playerIds.map((playerId) => {
              const player = playerMap[playerId];
              if (!player) return null;
              return (
                <DraggableTeamRow
                  key={playerId}
                  player={player}
                  teamId={team.id}
                  onRemove={() => onRemovePlayer(team.id, playerId)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draggable row inside a team ──────────────────────────────────────────────

function DraggableTeamRow({
  player,
  teamId,
  onRemove,
}: {
  player: Player;
  teamId: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: { sourceId: teamId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-surface-2 transition-opacity",
        isDragging && "opacity-30",
      )}
      data-dnd-draggable="true"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted shrink-0"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Avatar name={player.name} src={player.avatarUrl} size="xs" />
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {player.name}
      </span>
      <button
        onClick={onRemove}
        className="p-0.5 text-muted hover:text-red-500 transition-colors shrink-0"
        title="Remove from team"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Drag overlay ghost ───────────────────────────────────────────────────────

function PlayerDragGhost({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-orange-400 shadow-xl ring-2 ring-orange-400/30 cursor-grabbing">
      <Avatar name={player.name} src={player.avatarUrl} size="xs" />
      <span className="text-sm font-medium text-foreground">{player.name}</span>
    </div>
  );
}

// ── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview({
  name,
  description,
  format,
  teamSize,
  teams,
  players,
  selectedPlayerIds,
}: {
  name: string;
  description: string;
  format: string;
  teamSize: number;
  teams: TeamDraft[];
  players: Player[];
  selectedPlayerIds: string[];
}) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Review</h2>
        <p className="text-sm text-muted">
          Confirm everything looks good before creating.
        </p>
      </div>

      <Card>
        <div className="space-y-2">
          {[
            ["Name", name],
            ["Format", format === "ROUND_ROBIN" ? "Round Robin" : "Knockout"],
            ["Team size", `${teamSize} players`],
            ["Players", String(selectedPlayerIds.length)],
            ["Teams", String(teams.length)],
            [
              "Matches (Round Robin)",
              String((teams.length * (teams.length - 1)) / 2),
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Teams</h3>
        {teams.map((team) => (
          <Card key={team.id} padded={false} className="p-3">
            <p className="text-sm font-semibold text-foreground mb-2">
              {team.name}
            </p>
            <div className="flex gap-2 flex-wrap">
              {team.playerIds.map((pid) => {
                const p = playerMap[pid];
                return p ? (
                  <div key={pid} className="flex items-center gap-1.5">
                    <Avatar name={p.name} src={p.avatarUrl} size="xs" />
                    <span className="text-xs text-muted">{p.name}</span>
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
