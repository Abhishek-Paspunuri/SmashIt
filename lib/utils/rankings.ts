export interface TeamStats {
  teamId: string;
  name: string;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface RankedTeam extends TeamStats {
  rank: number;
  pointDiff: number;
}

export function rankTeams(teams: TeamStats[]): RankedTeam[] {
  return [...teams]
    .sort((a, b) => {
      // 1. Most wins
      if (b.wins !== a.wins) return b.wins - a.wins;
      // 2. Fewest points conceded
      if (a.pointsAgainst !== b.pointsAgainst)
        return a.pointsAgainst - b.pointsAgainst;
      // 3. Alphabetical by team name
      return a.name.localeCompare(b.name);
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
      pointDiff: team.pointsFor - team.pointsAgainst,
    }));
}
