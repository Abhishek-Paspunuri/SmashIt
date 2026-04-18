export interface MatchPair {
  homeTeamId: string;
  awayTeamId: string;
  round: number;
  sequence: number;
}

export function generateRoundRobin(teamIds: string[]): MatchPair[] {
  const pairs: MatchPair[] = [];
  let sequence = 1;

  // If odd number of teams, add a "bye" placeholder (not needed for our use case but robust)
  const teams = [...teamIds];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push({
        homeTeamId: teams[i],
        awayTeamId: teams[j],
        round: 1,
        sequence: sequence++,
      });
    }
  }

  return pairs;
}
