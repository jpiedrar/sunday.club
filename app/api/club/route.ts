import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database, seed } from '@/db/store';
import { getMarketOdds } from '@/lib/odds';
import { getPickNews } from '@/lib/news';
import { syncLiveResults } from '@/lib/results';
import { syncOfficialSchedule } from '@/lib/schedule';
import { teams, type Game } from '@/lib/games';
import {
  SUPER_BOWL_PICK_DEADLINE,
  syncSuperBowlWinner,
} from '@/lib/super-bowl';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const validTeams = new Set(teams.map((item) => item[0]));
const badgeKeys = [
  'vende-patrias',
  'wild-picker',
  'titanic-musician',
  'mama-pichas',
  'nostradamus',
  'perfect-week',
  'lone-wolf',
  'upset-king',
  'no-guts-no-glory',
] as const;
const outrightDivisions: Record<string, readonly string[]> = {
  afc_east: ['BUF', 'MIA', 'NE', 'NYJ'],
  afc_north: ['BAL', 'CIN', 'CLE', 'PIT'],
  afc_south: ['HOU', 'IND', 'JAX', 'TEN'],
  afc_west: ['DEN', 'KC', 'LV', 'LAC'],
  nfc_east: ['DAL', 'NYG', 'PHI', 'WAS'],
  nfc_north: ['CHI', 'DET', 'GB', 'MIN'],
  nfc_south: ['ATL', 'CAR', 'NO', 'TB'],
  nfc_west: ['ARI', 'LAR', 'SF', 'SEA'],
};
async function superBowlConfig(league: string) {
  const db = database();
  const settings = await db
    .prepare(
      'SELECT super_bowl_lock_week lockWeek,super_bowl_points points FROM leagues WHERE id=?',
    )
    .bind(league)
    .first<{ lockWeek: number; points: number }>();
  const lockWeek = settings?.lockWeek ?? 5;
  const firstGame = await db
    .prepare('SELECT MIN(kickoff) deadline FROM games WHERE week=?')
    .bind(lockWeek)
    .first<{ deadline: number | null }>();
  return {
    lockWeek,
    points: settings?.points ?? 0,
    deadline: firstGame?.deadline ?? SUPER_BOWL_PICK_DEADLINE,
  };
}
class Problem extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
async function identity() {
  const u = await getChatGPTUser();
  if (!u) throw new Problem('Sign in to save picks and join a league.', 401);
  return u;
}
async function membership(league: string, user: string, owner = false) {
  const row = await database()
    .prepare(
      'SELECT l.* FROM leagues l JOIN members m ON m.league=l.id WHERE l.id=? AND m.user=?',
    )
    .bind(league, user)
    .first<{ id: string; owner: string; code: string; name: string }>();
  if (!row)
    throw new Problem(
      'This league is private. Join with an invite code first.',
      403,
    );
  if (owner && row.owner !== user)
    throw new Problem('Only the commissioner can do that.', 403);
  return row;
}
function fail(e: unknown) {
  if (e instanceof Problem) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}
export async function GET(req: Request) {
  try {
    const u = await identity();
    const db = database();
    await seed();
    await db
      .prepare('INSERT OR IGNORE INTO profiles(id,name) VALUES(?,?)')
      .bind(u.userId, u.fullName ?? u.email.split('@')[0])
      .run();
    const profile = await db
      .prepare(
        'SELECT id,name,favorite_team favoriteTeam FROM profiles WHERE id=?',
      )
      .bind(u.userId)
      .first();
    const leagues = (
      await db
        .prepare(
          'SELECT l.* FROM leagues l JOIN members m ON m.league=l.id WHERE m.user=? ORDER BY l.name',
        )
        .bind(u.userId)
        .all()
    ).results;
    const url = new URL(req.url);
    const week = Number(url.searchParams.get('week') ?? 1);
    if (!Number.isInteger(week) || week < 1 || week > 18)
      throw new Problem('Choose a week from 1 to 18.');
    const scheduleOfficial = await syncOfficialSchedule(week, db);
    const serverNow = Date.now();
    const league =
      url.searchParams.get('league') ||
      (typeof leagues[0]?.id === 'string' ? leagues[0].id : '');
    if (!league) {
      const games = (
        await db
          .prepare('SELECT * FROM games WHERE week=? ORDER BY kickoff,id')
          .bind(week)
          .all<Game>()
      ).results;
      return json({
        profile,
        leagues,
        games,
        picks: {},
        pickCounts: {},
        picksPublished: false,
        canPublishPicks: false,
        publishedPicks: {},
        offsetPicks: {},
        badgeSettings: Object.fromEntries(badgeKeys.map((key) => [key, true])),
        startedGames: games
          .filter((game) => game.kickoff <= serverNow)
          .map((game) => game.id),
        revealedGames: games
          .filter((game) => game.kickoff <= serverNow)
          .map((game) => game.id),
        allPicksComplete: false,
        memberCompletion: [],
        totalGames: games.length,
        marketOdds: await getMarketOdds(week, games),
        standings: [],
        remainingSeasonGames: 0,
        remainingGames: { weekly: 0, monthly: 0, season: 0 },
        members: [],
        superBowlPick: null,
        outrightPicks: {},
        superBowlWinner: await syncSuperBowlWinner(db),
        superBowlLockWeek: 5,
        superBowlPoints: 0,
        superBowlDeadline: SUPER_BOWL_PICK_DEADLINE,
        superBowlLocked: serverNow >= SUPER_BOWL_PICK_DEADLINE,
        league: null,
        scheduleOfficial,
        serverNow,
      });
    }
    await membership(league, u.userId);
    const initialSuperBowlConfig = await superBowlConfig(league);
    await syncOfficialSchedule(initialSuperBowlConfig.lockWeek, db);
    const superBowlSettings = await superBowlConfig(league);
    const savedBadgeSettings = (
      await db
        .prepare(
          'SELECT badge,enabled FROM league_badge_settings WHERE league=?',
        )
        .bind(league)
        .all<{ badge: string; enabled: number }>()
    ).results;
    const badgeSettings = Object.fromEntries(
      badgeKeys.map((key) => [
        key,
        savedBadgeSettings.find((setting) => setting.badge === key)?.enabled !==
          0,
      ]),
    );
    const superBowlWinner = await syncSuperBowlWinner(db);
    const superBowlPick = await db
      .prepare('SELECT team FROM super_bowl_picks WHERE league=? AND user=?')
      .bind(league, u.userId)
      .first<{ team: string }>();
    const superBowlPicks = (
      await db
        .prepare('SELECT user,team FROM super_bowl_picks WHERE league=?')
        .bind(league)
        .all<{ user: string; team: string }>()
    ).results;
    const outrightPicks = (
      await db
        .prepare(
          'SELECT category,team FROM outright_picks WHERE league=? AND user=?',
        )
        .bind(league, u.userId)
        .all<{ category: string; team: string }>()
    ).results;
    const selectedLeague = leagues.find((item) => item.id === league);
    let games = (
      await db
        .prepare(
          `SELECT g.id,g.week,g.away,g.home,g.kickoff,CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END status,CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END winner FROM games g LEFT JOIN results r ON r.game=g.id AND r.league=? WHERE g.week=? ORDER BY g.kickoff,g.id`,
        )
        .bind(league, week)
        .all<Game>()
    ).results;
    const liveResults = await syncLiveResults(week, games, db);
    if (liveResults.updated) {
      games = (
        await db
          .prepare(
            `SELECT g.id,g.week,g.away,g.home,g.kickoff,CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END status,CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END winner FROM games g LEFT JOIN results r ON r.game=g.id AND r.league=? WHERE g.week=? ORDER BY g.kickoff,g.id`,
          )
          .bind(league, week)
          .all<Game>()
      ).results;
    }
    const marketOdds = await getMarketOdds(week, games);
    const pickNews = await getPickNews(games);
    const marketWrites = Object.entries(marketOdds).map(([game, odds]) =>
      db
        .prepare(
          `INSERT INTO game_market_odds(game,away_chance,home_chance,source,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(game) DO UPDATE SET away_chance=excluded.away_chance,home_chance=excluded.home_chance,source=excluded.source,updated_at=excluded.updated_at WHERE (SELECT kickoff FROM games WHERE id=excluded.game)>unixepoch('now')*1000`,
        )
        .bind(game, odds.away, odds.home, odds.source, odds.updatedAt),
    );
    if (marketWrites.length) await db.batch(marketWrites);
    const picks = (
      await db
        .prepare('SELECT game,team FROM picks WHERE league=? AND user=?')
        .bind(league, u.userId)
        .all()
    ).results;
    const popularityRows = (
      await db
        .prepare(
          'SELECT game,team,COUNT(*) count FROM picks WHERE league=? AND game IN (SELECT id FROM games WHERE week=?) GROUP BY game,team',
        )
        .bind(league, week)
        .all<{ game: string; team: string; count: number }>()
    ).results;
    const pickCounts: Record<string, Record<string, number>> = {};
    for (const row of popularityRows) {
      pickCounts[row.game] ??= {};
      pickCounts[row.game][row.team] = row.count;
    }
    const publication = await db
      .prepare(
        'SELECT published_at publishedAt FROM pick_publications WHERE league=? AND week=?',
      )
      .bind(league, week)
      .first<{ publishedAt: number }>();
    const publishableGameCount = await db
      .prepare(
        `SELECT COUNT(*) count FROM (SELECT p.game FROM picks p JOIN games g ON g.id=p.game WHERE p.league=? AND g.week=? AND g.kickoff>unixepoch('now')*1000 GROUP BY p.game HAVING COUNT(DISTINCT p.user)=(SELECT COUNT(*) FROM members WHERE league=?))`,
      )
      .bind(league, week, league)
      .first<{ count: number }>();
    const members = (
      await db
        .prepare(
          'SELECT p.id,p.name,p.favorite_team favoriteTeam FROM profiles p JOIN members m ON m.user=p.id WHERE m.league=? ORDER BY p.name',
        )
        .bind(league)
        .all<{ id: string; name: string }>()
    ).results;
    const memberCompletion = (
      await db
        .prepare(
          'SELECT p.id,p.name,(SELECT COUNT(*) FROM picks k JOIN games g ON g.id=k.game WHERE k.league=? AND k.user=p.id AND g.week=?) picked FROM profiles p JOIN members m ON m.user=p.id WHERE m.league=? ORDER BY p.name',
        )
        .bind(league, week, league)
        .all<{ id: string; name: string; picked: number }>()
    ).results;
    const allPicksComplete =
      games.length > 0 &&
      memberCompletion.length > 0 &&
      memberCompletion.every((member) => member.picked === games.length);
    const startedGames = games
      .filter((game) => game.kickoff <= serverNow)
      .map((game) => game.id);
    const snapshotGames = (
      await db
        .prepare(
          'SELECT DISTINCT game FROM published_pick_entries WHERE league=? AND week=?',
        )
        .bind(league, week)
        .all<{ game: string }>()
    ).results.map((row) => row.game);
    const revealedGames = allPicksComplete
      ? games.map((game) => game.id)
      : [...new Set([...startedGames, ...snapshotGames])];
    const publishedRows = allPicksComplete
      ? (
          await db
            .prepare(
              'SELECT p.user,p.game,p.team FROM picks p JOIN games g ON g.id=p.game WHERE p.league=? AND g.week=?',
            )
            .bind(league, week)
            .all<{ user: string; game: string; team: string }>()
        ).results
      : (
          await db
            .prepare(
              `SELECT p.user,p.game,p.team FROM picks p JOIN games g ON g.id=p.game WHERE p.league=? AND g.week=? AND g.kickoff<=?
               UNION ALL
               SELECT e.user,e.game,e.team FROM published_pick_entries e JOIN games g ON g.id=e.game WHERE e.league=? AND e.week=? AND g.kickoff>?`,
            )
            .bind(league, week, serverNow, league, week, serverNow)
            .all<{ user: string; game: string; team: string }>()
        ).results;
    const publishedPicks: Record<string, Record<string, string>> = {};
    for (const row of publishedRows) {
      publishedPicks[row.user] ??= {};
      publishedPicks[row.user][row.game] = row.team;
    }
    const allOffsetRows = (
      await db
        .prepare(
          `SELECT o.user,o.game FROM offset_pick_changes o JOIN picks p ON p.league=o.league AND p.user=o.user AND p.game=o.game AND p.team=o.team WHERE o.league=? AND (SELECT COUNT(*) FROM picks same WHERE same.league=o.league AND same.game=o.game AND same.team=o.team)=1`,
        )
        .bind(league)
        .all<{ user: string; game: string }>()
    ).results;
    const offsetPicks: Record<string, string[]> = {};
    const currentWeekIds = new Set(games.map((game) => game.id));
    for (const row of allOffsetRows.filter((item) =>
      currentWeekIds.has(item.game),
    )) {
      offsetPicks[row.user] ??= [];
      offsetPicks[row.user].push(row.game);
    }
    const monthStart = Math.floor((week - 1) / 4) * 4 + 1;
    const monthEnd = Math.min(monthStart + 3, 18);
    const standings = (
      await db
        .prepare(
          `SELECT p.id,p.name,p.favorite_team favoriteTeam,COALESCE(SUM(CASE WHEN g.week=? AND CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END='final' AND k.team=CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END THEN 1 ELSE 0 END),0) weekly,COALESCE(SUM(CASE WHEN g.week BETWEEN ? AND ? AND CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END='final' AND k.team=CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END THEN 1 ELSE 0 END),0) monthly,COALESCE(SUM(CASE WHEN CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END='final' AND k.team=CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END THEN 1 ELSE 0 END),0) season FROM members m JOIN profiles p ON p.id=m.user LEFT JOIN picks k ON k.league=m.league AND k.user=m.user LEFT JOIN games g ON g.id=k.game LEFT JOIN results r ON r.league=m.league AND r.game=g.id WHERE m.league=? GROUP BY p.id,p.name,p.favorite_team`,
        )
        .bind(week, monthStart, monthEnd, league)
        .all()
    ).results;
    const rankHistoryRows = (
      await db
        .prepare(
          `SELECT p.id,
          COALESCE(SUM(CASE WHEN g.week<=? AND CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END='final' AND k.team=CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END THEN 1 ELSE 0 END),0) throughWeekSeason,
          COALESCE(SUM(CASE WHEN g.week<? AND CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END='final' AND k.team=CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END THEN 1 ELSE 0 END),0) previousSeason
          FROM members m JOIN profiles p ON p.id=m.user LEFT JOIN picks k ON k.league=m.league AND k.user=m.user LEFT JOIN games g ON g.id=k.game LEFT JOIN results r ON r.league=m.league AND r.game=g.id WHERE m.league=? GROUP BY p.id`,
        )
        .bind(week, week, league)
        .all<{
          id: string;
          throughWeekSeason: number;
          previousSeason: number;
        }>()
    ).results;
    const rankHistoryByPlayer = new Map(
      rankHistoryRows.map((row) => [row.id, row]),
    );
    const badgeRows = (
      await db
        .prepare(
          `SELECT k.user,k.game,k.team,g.week,g.away,g.home FROM picks k JOIN games g ON g.id=k.game WHERE k.league=? AND (g.kickoff<=? OR (SELECT COUNT(DISTINCT complete.user) FROM picks complete WHERE complete.league=k.league AND complete.game=k.game)=(SELECT COUNT(*) FROM members WHERE league=k.league))
           UNION ALL
           SELECT e.user,e.game,e.team,g.week,g.away,g.home FROM published_pick_entries e JOIN games g ON g.id=e.game WHERE e.league=? AND g.kickoff>? AND (SELECT COUNT(DISTINCT complete.user) FROM picks complete WHERE complete.league=e.league AND complete.game=e.game)<>(SELECT COUNT(*) FROM members WHERE league=e.league)`,
        )
        .bind(league, serverNow, league, serverNow)
        .all<{
          user: string;
          game: string;
          team: string;
          week: number;
          away: string;
          home: string;
        }>()
    ).results;
    const countsByGame = new Map<
      string,
      { total: number; teams: Map<string, number> }
    >();
    for (const row of badgeRows) {
      const entry = countsByGame.get(row.game) ?? {
        total: 0,
        teams: new Map(),
      };
      entry.total++;
      entry.teams.set(row.team, (entry.teams.get(row.team) ?? 0) + 1);
      countsByGame.set(row.game, entry);
    }
    const favoriteLossRows = (
      await db
        .prepare(
          `SELECT k.user,g.week FROM picks k JOIN profiles p ON p.id=k.user JOIN games g ON g.id=k.game LEFT JOIN results r ON r.league=k.league AND r.game=g.id WHERE k.league=? AND p.favorite_team=k.team AND CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END='final' AND CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END IS NOT NULL AND k.team<>CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END`,
        )
        .bind(league)
        .all<{ user: string; week: number }>()
    ).results;
    const missedPickRows = (
      await db
        .prepare(
          `SELECT m.user,g.week FROM members m CROSS JOIN games g LEFT JOIN results r ON r.league=m.league AND r.game=g.id WHERE m.league=? AND g.kickoff>=m.joined_at AND g.kickoff<=? AND CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END<>'cancelled' AND NOT EXISTS(SELECT 1 FROM picks missing WHERE missing.league=m.league AND missing.user=m.user AND missing.game=g.id)`,
        )
        .bind(league, serverNow)
        .all<{ user: string; week: number }>()
    ).results;
    const resolvedGames = (
      await db
        .prepare(
          `SELECT g.id,g.week,g.away,g.home,CASE WHEN g.status IN ('final','cancelled') THEN g.status ELSE COALESCE(r.status,g.status) END status,CASE WHEN g.status='final' THEN g.winner WHEN g.status='cancelled' THEN NULL WHEN r.game IS NOT NULL THEN r.winner ELSE g.winner END winner FROM games g LEFT JOIN results r ON r.league=? AND r.game=g.id`,
        )
        .bind(league)
        .all<{
          id: string;
          week: number;
          away: string;
          home: string;
          status: string;
          winner: string | null;
        }>()
    ).results;
    const remainingSeasonGames = resolvedGames.filter(
      (game) => game.status !== 'final' && game.status !== 'cancelled',
    ).length;
    const remainingGames = {
      weekly: resolvedGames.filter(
        (game) =>
          game.week === week &&
          game.status !== 'final' &&
          game.status !== 'cancelled',
      ).length,
      monthly: resolvedGames.filter(
        (game) =>
          game.week >= monthStart &&
          game.week <= monthEnd &&
          game.status !== 'final' &&
          game.status !== 'cancelled',
      ).length,
      season: remainingSeasonGames,
    };
    const storedOdds = (
      await db
        .prepare(
          'SELECT game,away_chance awayChance,home_chance homeChance FROM game_market_odds',
        )
        .all<{ game: string; awayChance: number; homeChance: number }>()
    ).results;
    const oddsByGame = new Map(storedOdds.map((row) => [row.game, row]));
    const picksByGame = new Map<string, typeof badgeRows>();
    for (const pick of badgeRows) {
      const gamePicks = picksByGame.get(pick.game) ?? [];
      gamePicks.push(pick);
      picksByGame.set(pick.game, gamePicks);
    }
    const offsetSet = new Set(
      allOffsetRows.map((row) => `${row.user}:${row.game}`),
    );
    const loneWolfRows: { user: string; week: number }[] = [];
    const upsetKingRows: { user: string; week: number }[] = [];
    const gutsRows: { user: string; week: number }[] = [];
    for (const game of resolvedGames.filter(
      (item) => item.status === 'final' && item.winner,
    )) {
      const gamePicks = picksByGame.get(game.id) ?? [];
      const correct = gamePicks.filter((pick) => pick.team === game.winner);
      if (correct.length === 1)
        loneWolfRows.push({ user: correct[0].user, week: game.week });
      const odds = oddsByGame.get(game.id);
      const underdog =
        odds && odds.awayChance !== odds.homeChance
          ? odds.awayChance < odds.homeChance
            ? game.away
            : game.home
          : null;
      for (const pick of correct) {
        if (pick.team === underdog)
          upsetKingRows.push({ user: pick.user, week: game.week });
        const popularity = countsByGame.get(game.id);
        const wild =
          Boolean(popularity?.total) &&
          (popularity?.teams.get(pick.team) ?? 0) * 5 <= popularity!.total;
        if (wild || offsetSet.has(`${pick.user}:${game.id}`))
          gutsRows.push({ user: pick.user, week: game.week });
      }
    }
    const perfectWeekRows: { user: string; week: number }[] = [];
    for (let candidateWeek = 1; candidateWeek <= 18; candidateWeek++) {
      const weekGames = resolvedGames.filter(
        (game) => game.week === candidateWeek && game.status !== 'cancelled',
      );
      if (
        !weekGames.length ||
        weekGames.some((game) => game.status !== 'final' || !game.winner)
      )
        continue;
      for (const standing of standings) {
        const player = standing as { id: string };
        if (
          weekGames.every((game) =>
            (picksByGame.get(game.id) ?? []).some(
              (pick) => pick.user === player.id && pick.team === game.winner,
            ),
          )
        )
          perfectWeekRows.push({ user: player.id, week: candidateWeek });
      }
    }
    const addPeriodStats = (
      stats: Record<string, number>,
      prefix: string,
      rows: { user: string; week: number }[],
      user: string,
    ) => {
      const playerRows = rows.filter((row) => row.user === user);
      stats[`${prefix}Season`] = playerRows.length;
      stats[`${prefix}Weekly`] = playerRows.filter(
        (row) => row.week === week,
      ).length;
      stats[`${prefix}Monthly`] = playerRows.filter(
        (row) => row.week >= monthStart && row.week <= monthEnd,
      ).length;
    };
    const standingsWithBadges = standings.map((standing) => {
      const player = standing as Record<string, unknown> & {
        id: string;
        favoriteTeam: string | null;
      };
      const stats = {
        againstTeamWeekly: 0,
        againstTeamMonthly: 0,
        againstTeamSeason: 0,
        wildWeekly: 0,
        wildMonthly: 0,
        wildSeason: 0,
        favoriteLossWeekly: 0,
        favoriteLossMonthly: 0,
        favoriteLossSeason: 0,
        missedPickWeekly: 0,
        missedPickMonthly: 0,
        missedPickSeason: 0,
        perfectWeekWeekly: 0,
        perfectWeekMonthly: 0,
        perfectWeekSeason: 0,
        loneWolfWeekly: 0,
        loneWolfMonthly: 0,
        loneWolfSeason: 0,
        upsetKingWeekly: 0,
        upsetKingMonthly: 0,
        upsetKingSeason: 0,
        gutsWeekly: 0,
        gutsMonthly: 0,
        gutsSeason: 0,
      };
      for (const row of badgeRows.filter((pick) => pick.user === player.id)) {
        const favoriteTeam = player.favoriteTeam;
        const against =
          favoriteTeam !== null &&
          [row.away, row.home].includes(favoriteTeam) &&
          row.team !== favoriteTeam;
        const popularity = countsByGame.get(row.game);
        const wild =
          Boolean(popularity?.total) &&
          (popularity?.teams.get(row.team) ?? 0) * 5 <= popularity!.total;
        if (against) {
          stats.againstTeamSeason++;
          if (row.week === week) stats.againstTeamWeekly++;
          if (row.week >= monthStart && row.week <= monthEnd)
            stats.againstTeamMonthly++;
        }
        if (wild) {
          stats.wildSeason++;
          if (row.week === week) stats.wildWeekly++;
          if (row.week >= monthStart && row.week <= monthEnd)
            stats.wildMonthly++;
        }
      }
      for (const loss of favoriteLossRows.filter(
        (result) => result.user === player.id,
      )) {
        stats.favoriteLossSeason++;
        if (loss.week === week) stats.favoriteLossWeekly++;
        if (loss.week >= monthStart && loss.week <= monthEnd)
          stats.favoriteLossMonthly++;
      }
      for (const missed of missedPickRows.filter(
        (result) => result.user === player.id,
      )) {
        stats.missedPickSeason++;
        if (missed.week === week) stats.missedPickWeekly++;
        if (missed.week >= monthStart && missed.week <= monthEnd)
          stats.missedPickMonthly++;
      }
      addPeriodStats(stats, 'perfectWeek', perfectWeekRows, player.id);
      addPeriodStats(stats, 'loneWolf', loneWolfRows, player.id);
      addPeriodStats(stats, 'upsetKing', upsetKingRows, player.id);
      addPeriodStats(stats, 'guts', gutsRows, player.id);
      const seasonPrediction = superBowlPicks.find(
        (prediction) => prediction.user === player.id,
      );
      return {
        ...standing,
        ...stats,
        throughWeekSeason:
          rankHistoryByPlayer.get(player.id)?.throughWeekSeason ?? 0,
        previousSeason: rankHistoryByPlayer.get(player.id)?.previousSeason ?? 0,
        season:
          Number((standing as { season: number }).season) +
          (superBowlWinner && seasonPrediction?.team === superBowlWinner
            ? superBowlSettings.points
            : 0),
        nostradamus: Boolean(
          superBowlWinner && seasonPrediction?.team === superBowlWinner,
        ),
      };
    });
    return json({
      profile,
      leagues,
      league,
      games,
      liveScores: liveResults.scores,
      pickNews,
      picks: Object.fromEntries(picks.map((p) => [p.game, p.team])),
      pickCounts,
      picksPublished: Boolean(publication),
      canPublishPicks:
        selectedLeague?.owner === u.userId &&
        Boolean(publishableGameCount?.count),
      publishedPicks,
      offsetPicks,
      badgeSettings,
      startedGames,
      revealedGames,
      allPicksComplete,
      memberCompletion,
      totalGames: games.length,
      marketOdds,
      standings: standingsWithBadges,
      remainingSeasonGames,
      remainingGames,
      members,
      superBowlPick: superBowlPick?.team ?? null,
      outrightPicks: Object.fromEntries(
        outrightPicks.map((prediction) => [
          prediction.category,
          prediction.team,
        ]),
      ),
      superBowlWinner,
      superBowlLockWeek: superBowlSettings.lockWeek,
      superBowlPoints: superBowlSettings.points,
      superBowlDeadline: superBowlSettings.deadline,
      superBowlLocked: serverNow >= superBowlSettings.deadline,
      scheduleOfficial,
      serverNow,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin)
      throw new Problem('Invalid request origin.', 403);
    const u = await identity();
    const db = database();
    const parsed: unknown = await req.json().catch(() => {
      throw new Problem('Invalid JSON request.');
    });
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Problem('Invalid request.');
    const body = parsed as Record<string, unknown>;
    const action = body.action;
    const league = typeof body.league === 'string' ? body.league : '';
    const str = (k: string, max = 80) => {
      const v = typeof body[k] === 'string' ? body[k].trim() : '';
      if (!v || v.length > max) throw new Problem(`Please enter a valid ${k}.`);
      return v;
    };
    await db
      .prepare('INSERT OR IGNORE INTO profiles(id,name) VALUES(?,?)')
      .bind(u.userId, u.fullName ?? u.email.split('@')[0])
      .run();
    if (action === 'profile') {
      await db
        .prepare('UPDATE profiles SET name=? WHERE id=?')
        .bind(str('name', 40), u.userId)
        .run();
      return json({ ok: true });
    }
    if (action === 'favorite-team') {
      const favoriteTeam = str('favoriteTeam', 3).toUpperCase();
      if (!validTeams.has(favoriteTeam))
        throw new Problem('Choose a valid NFL team.');
      await db
        .prepare('UPDATE profiles SET favorite_team=? WHERE id=?')
        .bind(favoriteTeam, u.userId)
        .run();
      return json({ ok: true });
    }
    if (action === 'create') {
      await seed();
      const id = crypto.randomUUID();
      const code = crypto
        .randomUUID()
        .replaceAll('-', '')
        .slice(0, 12)
        .toUpperCase();
      await db.batch([
        db
          .prepare('INSERT INTO leagues(id,name,owner,code) VALUES(?,?,?,?)')
          .bind(id, str('name', 50), u.userId, code),
        db
          .prepare(
            "INSERT INTO members(league,user,joined_at) VALUES(?,?,unixepoch('now')*1000)",
          )
          .bind(id, u.userId),
      ]);
      return json({ ok: true, league: id });
    }
    if (action === 'join') {
      const row = await db
        .prepare('SELECT id FROM leagues WHERE code=?')
        .bind(str('code', 20).toUpperCase())
        .first<{ id: string }>();
      if (!row)
        throw new Problem(
          'That invite code was not found. Check it and try again.',
          404,
        );
      await db
        .prepare(
          "INSERT OR IGNORE INTO members(league,user,joined_at) VALUES(?,?,unixepoch('now')*1000)",
        )
        .bind(row.id, u.userId)
        .run();
      return json({ ok: true, league: row.id });
    }
    await membership(
      league,
      u.userId,
      ![
        'pick',
        'unpick',
        'super-bowl-pick',
        'super-bowl-unpick',
        'outright-pick',
        'outright-unpick',
      ].includes(String(action)),
    );
    if (action === 'super-bowl-pick') {
      const settings = await superBowlConfig(league);
      const team = str('team', 3).toUpperCase();
      if (!validTeams.has(team)) throw new Problem('Choose a valid NFL team.');
      const result = await db
        .prepare(
          `INSERT INTO super_bowl_picks(league,user,team) SELECT ?,?,? WHERE unixepoch('now')*1000<? AND EXISTS(SELECT 1 FROM members WHERE league=? AND user=?) ON CONFLICT(league,user) DO UPDATE SET team=excluded.team`,
        )
        .bind(league, u.userId, team, settings.deadline, league, u.userId)
        .run();
      if (!result.meta.changes)
        throw new Problem(
          `Super Bowl predictions locked at the start of Week ${settings.lockWeek}.`,
          409,
        );
      return json({ ok: true });
    }
    if (action === 'super-bowl-unpick') {
      const settings = await superBowlConfig(league);
      const result = await db
        .prepare(
          `DELETE FROM super_bowl_picks WHERE league=? AND user=? AND unixepoch('now')*1000<?`,
        )
        .bind(league, u.userId, settings.deadline)
        .run();
      if (!result.meta.changes)
        throw new Problem('The prediction is already clear or locked.', 409);
      return json({ ok: true });
    }
    if (action === 'outright-pick') {
      const settings = await superBowlConfig(league);
      const category = str('category', 20).toLowerCase();
      const team = str('team', 3).toUpperCase();
      if (!outrightDivisions[category]?.includes(team))
        throw new Problem('Choose a valid team for that division.');
      const result = await db
        .prepare(
          `INSERT INTO outright_picks(league,user,category,team) SELECT ?,?,?,? WHERE unixepoch('now')*1000<? AND EXISTS(SELECT 1 FROM members WHERE league=? AND user=?) ON CONFLICT(league,user,category) DO UPDATE SET team=excluded.team`,
        )
        .bind(
          league,
          u.userId,
          category,
          team,
          settings.deadline,
          league,
          u.userId,
        )
        .run();
      if (!result.meta.changes)
        throw new Problem(
          `Outright predictions locked at the start of Week ${settings.lockWeek}.`,
          409,
        );
      return json({ ok: true });
    }
    if (action === 'outright-unpick') {
      const settings = await superBowlConfig(league);
      const category = str('category', 20).toLowerCase();
      if (!(category in outrightDivisions))
        throw new Problem('Choose a valid division.');
      const result = await db
        .prepare(
          "DELETE FROM outright_picks WHERE league=? AND user=? AND category=? AND unixepoch('now')*1000<?",
        )
        .bind(league, u.userId, category, settings.deadline)
        .run();
      if (!result.meta.changes)
        throw new Problem('The prediction is already clear or locked.', 409);
      return json({ ok: true });
    }
    if (action === 'pick') {
      const favorite = await db
        .prepare('SELECT favorite_team favoriteTeam FROM profiles WHERE id=?')
        .bind(u.userId)
        .first<{ favoriteTeam: string | null }>();
      if (!favorite?.favoriteTeam)
        throw new Problem(
          'Select your favorite NFL team before making picks.',
          409,
        );
      const game = str('game');
      const team = str('team', 3);
      const previous = await db
        .prepare(
          `SELECT p.team,(EXISTS(SELECT 1 FROM published_pick_entries e WHERE e.league=p.league AND e.game=p.game) OR (SELECT COUNT(DISTINCT complete.user) FROM picks complete WHERE complete.league=p.league AND complete.game=p.game)=(SELECT COUNT(*) FROM members WHERE league=p.league)) wasPublic FROM picks p WHERE p.league=? AND p.user=? AND p.game=?`,
        )
        .bind(league, u.userId, game)
        .first<{ team: string; wasPublic: number }>();
      const result = await db
        .prepare(
          `INSERT INTO picks(league,user,game,team) SELECT ?,?,g.id,? FROM games g WHERE g.id=? AND g.kickoff>unixepoch('now')*1000 AND g.status='scheduled' AND ? IN (g.away,g.home) AND EXISTS(SELECT 1 FROM members WHERE league=? AND user=?) AND NOT EXISTS(SELECT 1 FROM results WHERE league=? AND game=g.id AND status IN ('final','cancelled')) ON CONFLICT(league,user,game) DO UPDATE SET team=excluded.team`,
        )
        .bind(league, u.userId, team, game, team, league, u.userId, league)
        .run();
      if (!result.meta.changes)
        throw new Problem(
          'This pick is locked or the team is invalid. Refresh to see the latest game status.',
          409,
        );
      if (previous && previous.team !== team) {
        if (previous.wasPublic)
          await db
            .prepare(
              `INSERT INTO offset_pick_changes(league,user,game,team,changed_at) VALUES(?,?,?,?,unixepoch('now')*1000) ON CONFLICT(league,user,game) DO UPDATE SET team=excluded.team,changed_at=excluded.changed_at`,
            )
            .bind(league, u.userId, game, team)
            .run();
        else
          await db
            .prepare(
              'DELETE FROM offset_pick_changes WHERE league=? AND user=? AND game=?',
            )
            .bind(league, u.userId, game)
            .run();
      }
      return json({ ok: true });
    }
    if (action === 'unpick') {
      const game = str('game');
      const result = await db
        .prepare(
          `DELETE FROM picks WHERE league=? AND user=? AND game=? AND game IN (SELECT id FROM games WHERE kickoff>unixepoch('now')*1000 AND status='scheduled') AND NOT EXISTS(SELECT 1 FROM results WHERE league=? AND game=? AND status IN ('final','cancelled'))`,
        )
        .bind(league, u.userId, game, league, game)
        .run();
      if (!result.meta.changes)
        throw new Problem(
          'This pick is already clear or locked. Refresh to see the latest game status.',
          409,
        );
      await db
        .prepare(
          'DELETE FROM offset_pick_changes WHERE league=? AND user=? AND game=?',
        )
        .bind(league, u.userId, game)
        .run();
      return json({ ok: true });
    }
    if (action === 'publish-picks') {
      const week = Number(body.week);
      if (!Number.isInteger(week) || week < 1 || week > 18)
        throw new Problem('Choose a valid week.');
      const available = await db
        .prepare(
          `SELECT COUNT(*) games FROM (SELECT p.game FROM picks p JOIN games g ON g.id=p.game WHERE p.league=? AND g.week=? AND g.kickoff>unixepoch('now')*1000 GROUP BY p.game HAVING COUNT(DISTINCT p.user)=(SELECT COUNT(*) FROM members WHERE league=?))`,
        )
        .bind(league, week, league)
        .first<{ games: number }>();
      if (!available?.games)
        throw new Problem(
          'No matchup is ready yet. Every league member must submit a pick for the same game before it can be published.',
        );
      await db.batch([
        db
          .prepare(
            'DELETE FROM published_pick_entries WHERE league=? AND week=?',
          )
          .bind(league, week),
        db
          .prepare(
            `INSERT INTO published_pick_entries(league,week,user,game,team) SELECT p.league,?,p.user,p.game,p.team FROM picks p JOIN games g ON g.id=p.game WHERE p.league=? AND g.week=? AND g.kickoff>unixepoch('now')*1000 AND p.game IN (SELECT p2.game FROM picks p2 JOIN games g2 ON g2.id=p2.game WHERE p2.league=? AND g2.week=? AND g2.kickoff>unixepoch('now')*1000 GROUP BY p2.game HAVING COUNT(DISTINCT p2.user)=(SELECT COUNT(*) FROM members WHERE league=?))`,
          )
          .bind(week, league, week, league, week, league),
        db
          .prepare(
            `INSERT INTO pick_publications(league,week,published_at) VALUES(?,?,unixepoch('now')*1000) ON CONFLICT(league,week) DO UPDATE SET published_at=excluded.published_at`,
          )
          .bind(league, week),
      ]);
      return json({ ok: true });
    }
    if (action === 'unpublish-picks') {
      const week = Number(body.week);
      if (!Number.isInteger(week) || week < 1 || week > 18)
        throw new Problem('Choose a valid week.');
      await db.batch([
        db
          .prepare(
            'DELETE FROM published_pick_entries WHERE league=? AND week=?',
          )
          .bind(league, week),
        db
          .prepare('DELETE FROM pick_publications WHERE league=? AND week=?')
          .bind(league, week),
      ]);
      return json({ ok: true });
    }
    if (action === 'rename') {
      await db
        .prepare('UPDATE leagues SET name=? WHERE id=?')
        .bind(str('name', 50), league)
        .run();
      return json({ ok: true });
    }
    if (action === 'badge-settings') {
      if (
        !Array.isArray(body.badges) ||
        body.badges.some(
          (badge) =>
            typeof badge !== 'string' ||
            !badgeKeys.includes(badge as (typeof badgeKeys)[number]),
        )
      )
        throw new Problem('Choose valid league badges.');
      const enabled = new Set(body.badges as string[]);
      await db.batch([
        db
          .prepare('DELETE FROM league_badge_settings WHERE league=?')
          .bind(league),
        ...badgeKeys.map((badge) =>
          db
            .prepare(
              'INSERT INTO league_badge_settings(league,badge,enabled) VALUES(?,?,?)',
            )
            .bind(league, badge, enabled.has(badge) ? 1 : 0),
        ),
      ]);
      return json({ ok: true });
    }
    if (action === 'super-bowl-settings') {
      const lockWeek = Number(body.lockWeek);
      const points = Number(body.points);
      if (!Number.isInteger(lockWeek) || lockWeek < 2 || lockWeek > 18)
        throw new Problem('Choose a lock week from Week 2 through Week 18.');
      if (!Number.isInteger(points) || points < 0 || points > 100)
        throw new Problem(
          'Super Bowl points must be a whole number from 0 to 100.',
        );
      await db
        .prepare(
          'UPDATE leagues SET super_bowl_lock_week=?,super_bowl_points=? WHERE id=?',
        )
        .bind(lockWeek, points, league)
        .run();
      return json({ ok: true });
    }
    if (action === 'rotate') {
      await db
        .prepare('UPDATE leagues SET code=? WHERE id=?')
        .bind(
          crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase(),
          league,
        )
        .run();
      return json({ ok: true });
    }
    if (action === 'remove') {
      const member = str('member');
      if (member === u.userId)
        throw new Problem('The commissioner cannot be removed.');
      await db.batch([
        db
          .prepare('DELETE FROM picks WHERE league=? AND user=?')
          .bind(league, member),
        db
          .prepare('DELETE FROM offset_pick_changes WHERE league=? AND user=?')
          .bind(league, member),
        db
          .prepare('DELETE FROM super_bowl_picks WHERE league=? AND user=?')
          .bind(league, member),
        db
          .prepare('DELETE FROM outright_picks WHERE league=? AND user=?')
          .bind(league, member),
        db
          .prepare('DELETE FROM members WHERE league=? AND user=?')
          .bind(league, member),
      ]);
      return json({ ok: true });
    }
    throw new Problem('Unknown action.');
  } catch (e) {
    return fail(e);
  }
}
