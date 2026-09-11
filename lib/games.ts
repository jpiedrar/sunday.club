export const teams = [
  ['BAL', 'Baltimore', 'Ravens', '#663c91'],
  ['BUF', 'Buffalo', 'Bills', '#1354bc'],
  ['KC', 'Kansas City', 'Chiefs', '#cf2036'],
  ['LAC', 'Los Angeles', 'Chargers', '#0086bb'],
  ['DAL', 'Dallas', 'Cowboys', '#203b60'],
  ['PHI', 'Philadelphia', 'Eagles', '#00675f'],
  ['SF', 'San Francisco', '49ers', '#ba2832'],
  ['SEA', 'Seattle', 'Seahawks', '#527b32'],
  ['DET', 'Detroit', 'Lions', '#1683b6'],
  ['GB', 'Green Bay', 'Packers', '#285745'],
  ['MIA', 'Miami', 'Dolphins', '#008d92'],
  ['NE', 'New England', 'Patriots', '#29426a'],
  ['CIN', 'Cincinnati', 'Bengals', '#e8541d'],
  ['PIT', 'Pittsburgh', 'Steelers', '#bb9000'],
  ['HOU', 'Houston', 'Texans', '#213d55'],
  ['IND', 'Indianapolis', 'Colts', '#235aaa'],
  ['ATL', 'Atlanta', 'Falcons', '#be2340'],
  ['CAR', 'Carolina', 'Panthers', '#1982ad'],
  ['NO', 'New Orleans', 'Saints', '#8a753f'],
  ['TB', 'Tampa Bay', 'Buccaneers', '#ba2639'],
  ['MIN', 'Minnesota', 'Vikings', '#6b4299'],
  ['CHI', 'Chicago', 'Bears', '#bf501b'],
  ['LAR', 'Los Angeles', 'Rams', '#225dba'],
  ['ARI', 'Arizona', 'Cardinals', '#a82a46'],
  ['NYJ', 'New York', 'Jets', '#287359'],
  ['NYG', 'New York', 'Giants', '#294f9a'],
  ['JAX', 'Jacksonville', 'Jaguars', '#167b7e'],
  ['TEN', 'Tennessee', 'Titans', '#407b9d'],
  ['DEN', 'Denver', 'Broncos', '#d45b25'],
  ['LV', 'Las Vegas', 'Raiders', '#62686c'],
  ['CLE', 'Cleveland', 'Browns', '#97552b'],
  ['WAS', 'Washington', 'Commanders', '#833046'],
];
export type Game = {
  id: string;
  week: number;
  away: string;
  home: string;
  kickoff: number;
  winner: string | null;
  status: string;
};
export const team = (id: string) => teams.find((t) => t[0] === id)!;
export const officialWeek1Games: Game[] = [
  ['NE', 'SEA', Date.UTC(2026, 8, 10, 0, 20)],
  ['SF', 'LAR', Date.UTC(2026, 8, 11, 0, 35)],
  ['CHI', 'CAR', Date.UTC(2026, 8, 13, 17)],
  ['TB', 'CIN', Date.UTC(2026, 8, 13, 17)],
  ['NO', 'DET', Date.UTC(2026, 8, 13, 17)],
  ['BUF', 'HOU', Date.UTC(2026, 8, 13, 17)],
  ['BAL', 'IND', Date.UTC(2026, 8, 13, 17)],
  ['CLE', 'JAX', Date.UTC(2026, 8, 13, 17)],
  ['ATL', 'PIT', Date.UTC(2026, 8, 13, 17)],
  ['NYJ', 'TEN', Date.UTC(2026, 8, 13, 17)],
  ['ARI', 'LAC', Date.UTC(2026, 8, 13, 20, 25)],
  ['MIA', 'LV', Date.UTC(2026, 8, 13, 20, 25)],
  ['GB', 'MIN', Date.UTC(2026, 8, 13, 20, 25)],
  ['WAS', 'PHI', Date.UTC(2026, 8, 13, 20, 25)],
  ['DAL', 'NYG', Date.UTC(2026, 8, 14, 0, 20)],
  ['DEN', 'KC', Date.UTC(2026, 8, 15, 0, 15)],
].map(([away, home, kickoff], index) => ({
  id: `2026-1-${index}`,
  week: 1,
  away: String(away),
  home: String(home),
  kickoff: Number(kickoff),
  winner: null,
  status: 'scheduled',
}));

// Emergency display-only fallback while the API loads the bundled official schedule.
const fallbackFutureGames: Game[] = Array.from({ length: 17 }, (_, index) => {
  const w = index + 1;
  return Array.from({ length: 16 }, (_, i) => ({
    id: `2026-${w + 1}-${i}`,
    week: w + 1,
    away: teams[(i * 2 + w * 2) % 32][0],
    home: teams[(i * 2 + 1 + w * 2) % 32][0],
    kickoff: Date.UTC(2026, 8, 6 + w * 7, i === 0 ? 17 : i < 10 ? 20 : 23),
    winner: null,
    status: 'scheduled',
  }));
}).flat();

export const fallbackGames: Game[] = [
  ...officialWeek1Games,
  ...fallbackFutureGames,
];
