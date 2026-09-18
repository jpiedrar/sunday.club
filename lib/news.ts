import type { Game } from './games';

export type PickNews = {
  id: string;
  headline: string;
  url: string;
  publishedAt: number;
  topic: 'Injury / availability' | 'Quarterback' | 'Roster update';
};
type Article = {
  id?: number;
  headline?: string;
  description?: string;
  published?: string;
  categories?: Array<{ type?: string; team?: { abbreviation?: string } }>;
  links?: { web?: { href?: string } };
};
const TTL = 5 * 60 * 1000;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
let cached:
  | {
      articles: Article[];
      checkedAt: number;
      updatedAt: number;
      unavailable: boolean;
    }
  | undefined;
let pending: Promise<void> | undefined;

export function matchupNews(
  articles: Article[],
  games: Game[],
  now: number,
): Record<string, PickNews[]> {
  const result: Record<string, PickNews[]> = {};
  const seen = new Set<string>();
  for (const article of [...articles].sort(
    (a, b) => Date.parse(b.published ?? '') - Date.parse(a.published ?? ''),
  )) {
    const publishedAt = Date.parse(article.published ?? '');
    const url = article.links?.web?.href;
    if (
      !article.headline ||
      !url ||
      !Number.isFinite(publishedAt) ||
      publishedAt > now ||
      now - publishedAt > MAX_AGE
    )
      continue;
    try {
      const link = new URL(url);
      if (
        link.protocol !== 'https:' ||
        !(link.hostname === 'espn.com' || link.hostname.endsWith('.espn.com'))
      )
        continue;
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    const text = `${article.headline} ${article.description ?? ''}`;
    const topic =
      /\b(injur\w*|concussion|questionable|doubtful|ruled out|inactive|sidelined|surgery|hurt|illness|practice|availability|will (?:not |miss |play)|won't play)\b/i.test(
        text,
      )
        ? 'Injury / availability'
        : /\b(quarterback|QB|starter|starting)\b/i.test(text)
          ? 'Quarterback'
          : /\b(suspend\w*|suspension|trade\w*|signs?|signed|released|roster|benched)\b/i.test(
                article.headline,
              )
            ? 'Roster update'
            : null;
    if (!topic) continue;
    const teams =
      article.categories
        ?.filter((category) => category.type === 'team')
        .map((category) =>
          category.team?.abbreviation === 'WSH'
            ? 'WAS'
            : category.team?.abbreviation,
        ) ?? [];
    for (const game of games) {
      if (
        ['final', 'cancelled'].includes(game.status) ||
        !teams.some((team) => team === game.away || team === game.home)
      )
        continue;
      const items = (result[game.id] ??= []);
      if (items.length < 3)
        items.push({
          id: String(article.id ?? url),
          headline: article.headline,
          url,
          publishedAt,
          topic,
        });
    }
  }
  return result;
}

export async function getPickNews(games: Game[]) {
  const now = Date.now();
  if (
    !cached ||
    now - cached.checkedAt >= (cached.unavailable ? 60_000 : TTL)
  ) {
    pending ??= (async () => {
      try {
        const response = await fetch(
          'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50',
          {
            signal: AbortSignal.timeout(5000),
            headers: {
              Accept: 'application/json',
              'User-Agent': 'SundayClub/1.0',
            },
            cache: 'no-store',
          },
        );
        if (!response.ok)
          throw new Error(`News feed unavailable (HTTP ${response.status})`);
        const payload = (await response.json()) as { articles?: Article[] };
        if (!Array.isArray(payload.articles))
          throw new Error('Invalid news feed');
        cached = {
          articles: payload.articles,
          checkedAt: now,
          updatedAt: now,
          unavailable: false,
        };
      } catch (error) {
        console.error(
          'NFL news feed failed:',
          error instanceof Error ? error.message : String(error),
        );
        cached = {
          articles: cached?.articles ?? [],
          checkedAt: now,
          updatedAt: cached?.updatedAt ?? 0,
          unavailable: true,
        };
      }
    })();
    await pending;
    pending = undefined;
  }
  return {
    games: matchupNews(cached!.articles, games, now),
    updatedAt: cached!.updatedAt,
    unavailable: cached!.unavailable,
  };
}
