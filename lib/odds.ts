import type { Game } from '@/lib/games';

export type MarketOdds = {
  away: number;
  home: number;
  source: string;
  updatedAt: number;
};

type EspnOdds = {
  provider?: { displayName?: string; name?: string };
  moneyline?: {
    away?: { close?: { odds?: string | number } };
    home?: { close?: { odds?: string | number } };
  };
};

type EspnCompetition = {
  competitors?: Array<{
    homeAway?: 'home' | 'away';
    team?: { abbreviation?: string };
  }>;
  odds?: EspnOdds[];
};

type EspnResponse = {
  events?: Array<{ competitions?: EspnCompetition[] }>;
};

const weekOneSnapshot: Record<string, [number, number]> = {
  '2026-1-0': [40, 60],
  '2026-1-1': [36, 64],
  '2026-1-2': [59, 41],
  '2026-1-3': [36, 64],
  '2026-1-4': [27, 73],
  '2026-1-5': [52, 48],
  '2026-1-6': [61, 39],
  '2026-1-7': [21, 79],
  '2026-1-8': [38, 62],
  '2026-1-9': [47, 53],
  '2026-1-10': [20, 80],
  '2026-1-11': [37, 63],
  '2026-1-12': [48, 52],
  '2026-1-13': [34, 66],
  '2026-1-14': [59, 41],
  '2026-1-15': [42, 58],
};

function fallbackOdds(games: Game[]) {
  const updatedAt = Date.UTC(2026, 8, 9, 18);
  return Object.fromEntries(
    games.flatMap((game) => {
      const probabilities = weekOneSnapshot[game.id];
      return probabilities
        ? [
            [
              game.id,
              {
                away: probabilities[0],
                home: probabilities[1],
                source: 'DraftKings · last available',
                updatedAt,
              },
            ],
          ]
        : [];
    }),
  ) as Record<string, MarketOdds>;
}

function impliedProbability(value: string | number | undefined) {
  const odds = Number(value);
  if (!Number.isFinite(odds) || odds === 0) return null;
  return odds < 0 ? -odds / (-odds + 100) : 100 / (odds + 100);
}

export function fairProbabilities(
  awayMoneyline: string | number | undefined,
  homeMoneyline: string | number | undefined,
) {
  const away = impliedProbability(awayMoneyline);
  const home = impliedProbability(homeMoneyline);
  if (away === null || home === null) return null;
  const total = away + home;
  return {
    away: Math.round((away / total) * 100),
    home: Math.round((home / total) * 100),
  };
}

export async function getMarketOdds(week: number, games: Game[]) {
  const result = fallbackOdds(games);
  if (!games.length) return result;
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } },
    );
    if (!response.ok) return result;
    const payload = (await response.json()) as EspnResponse;
    const byMatchup = new Map(
      games.map((game) => [`${game.away}-${game.home}`, game]),
    );
    const updatedAt = Date.now();
    for (const event of payload.events ?? []) {
      const competition = event.competitions?.[0];
      const away = competition?.competitors?.find(
        (item) => item.homeAway === 'away',
      )?.team?.abbreviation;
      const home = competition?.competitors?.find(
        (item) => item.homeAway === 'home',
      )?.team?.abbreviation;
      const appAway = away === 'WSH' ? 'WAS' : away;
      const appHome = home === 'WSH' ? 'WAS' : home;
      const game =
        appAway && appHome ? byMatchup.get(`${appAway}-${appHome}`) : undefined;
      const market = competition?.odds?.find(
        (item) =>
          item.moneyline?.away?.close?.odds &&
          item.moneyline?.home?.close?.odds,
      );
      const fair = fairProbabilities(
        market?.moneyline?.away?.close?.odds,
        market?.moneyline?.home?.close?.odds,
      );
      if (!game || !market || !fair) continue;
      result[game.id] = {
        ...fair,
        source:
          market.provider?.displayName ?? market.provider?.name ?? 'Sportsbook',
        updatedAt,
      };
    }
  } catch (error) {
    console.warn('Live market odds are temporarily unavailable.', error);
  }
  return result;
}
