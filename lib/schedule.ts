import type { D1Database } from '@cloudflare/workers-types';
import officialSchedule2026 from '@/lib/schedule-2026.json';

export async function syncOfficialSchedule(week: number, db: D1Database) {
  if (week === 1) return true;
  const key = `schedule_2026_week_${week}`;
  const existing = await db
    .prepare('SELECT value FROM app_metadata WHERE key=?')
    .bind(key)
    .first<{ value: string }>();
  if (existing) return true;
  try {
    const games = officialSchedule2026
      .filter((game) => game.week === week)
      .map((game) => ({ ...game, kickoff: Date.parse(game.kickoff) }));
    if (!games.length) return Boolean(existing);
    const writes = games.map((game) =>
      db
        .prepare(
          `INSERT INTO games(id,week,away,home,kickoff,status,winner) VALUES(?,?,?,?,?,'scheduled',NULL) ON CONFLICT(id) DO UPDATE SET week=excluded.week,away=excluded.away,home=excluded.home,kickoff=excluded.kickoff`,
        )
        .bind(game.id, week, game.away, game.home, game.kickoff),
    );
    await db.batch([
      db
        .prepare(
          'DELETE FROM published_pick_entries WHERE week=? AND league IN (SELECT id FROM leagues WHERE season=2026)',
        )
        .bind(week),
      db
        .prepare(
          'DELETE FROM pick_publications WHERE week=? AND league IN (SELECT id FROM leagues WHERE season=2026)',
        )
        .bind(week),
      db
        .prepare(
          'DELETE FROM picks WHERE game IN (SELECT id FROM games WHERE week=?)',
        )
        .bind(week),
      db
        .prepare(
          'DELETE FROM results WHERE game IN (SELECT id FROM games WHERE week=?)',
        )
        .bind(week),
      db.prepare('DELETE FROM games WHERE week=?').bind(week),
      ...writes,
      db
        .prepare('INSERT INTO app_metadata(key,value) VALUES(?,?)')
        .bind(key, 'official-2026-v1'),
    ]);
    return true;
  } catch (error) {
    console.error('Official NFL schedule synchronization failed.', error);
    return false;
  }
}
