import type {
  User,
  Player,
  Group,
  GroupMember,
  Tournament,
  TournamentParticipant,
  Team,
  TeamMember,
  Match,
  Invitation,
  ActivityLog,
  PlayerStatus,
  TournamentStatus,
  TournamentFormat,
  MatchStatus,
  InvitationStatus,
  PlayoffMatch,
} from "@prisma/client";

export type {
  User,
  Player,
  Group,
  GroupMember,
  Tournament,
  TournamentParticipant,
  Team,
  TeamMember,
  Match,
  Invitation,
  ActivityLog,
  PlayerStatus,
  TournamentStatus,
  TournamentFormat,
  MatchStatus,
  InvitationStatus,
  PlayoffMatch,
};

// Extended types with relations
export type PlayerWithGroup = Player & {
  groupMembers: (GroupMember & { group: Group })[];
};

export type GroupWithMembers = Group & {
  members: (GroupMember & { player: Player })[];
  _count: { members: number };
};

export type TournamentWithCounts = Tournament & {
  _count: { matches: number; teams: number; participants: number };
};

export type TeamWithMembers = Team & {
  members: (TeamMember & { player: Player })[];
};

export type MatchWithTeams = Match & {
  homeTeam: TeamWithMembers;
  awayTeam: TeamWithMembers;
};

export type TournamentDetail = Tournament & {
  teams: TeamWithMembers[];
  matches: MatchWithTeams[];
  participants: (TournamentParticipant & { player: Player })[];
};

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalPlayers: number;
  totalGroups: number;
  activeTournaments: number;
  completedTournaments: number;
  matchesPlayed: number;
  recentMatches: MatchWithTeams[];
  recentActivity: ActivityLog[];
}

// Analytics types
export interface TournamentStat {
  status: TournamentStatus;
  count: number;
}

export interface TeamWinRate {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  winRate: number;
}

export interface MatchCountByDate {
  date: string;
  count: number;
}

export type PlayoffMatchWithTeams = PlayoffMatch & {
  homeTeam: TeamWithMembers | null;
  awayTeam: TeamWithMembers | null;
};

// Re-export RankedTeam
export type { RankedTeam, TeamStats } from "@/lib/utils/rankings";
