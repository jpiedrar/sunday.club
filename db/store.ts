import { env } from 'cloudflare:workers';
import { mockGames, officialWeek1Games } from '@/lib/games';

const SCHEDULE_VERSION = 'official-2026-week-1-v1';
export function database() {
  if (!env.DB) throw new Error('Database unavailable');
  return env.DB;
}
export async function seed() {
  const db = database();
  const found = await db.prepare('SELECT id FROM games LIMIT 1').first();
  if (!found)
    await db.batch(
      mockGames.map((g) =>
        db
          .prepare(
            'INSERT OR IGNORE INTO games(id,week,away,home,kickoff,status,winner) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(g.id, g.week, g.away, g.home, g.kickoff, g.status, g.winner),
      ),
    );

  const currentSchedule = await db
    .prepare("SELECT value FROM app_metadata WHERE key='schedule_version'")
    .first<{ value: string }>();
  if (currentSchedule?.value !== SCHEDULE_VERSION) {
    await db.batch([
      db.prepare(
        'DELETE FROM picks WHERE game IN (SELECT id FROM games WHERE week=1)',
      ),
      db.prepare(
        'DELETE FROM results WHERE game IN (SELECT id FROM games WHERE week=1)',
      ),
      db.prepare('DELETE FROM games WHERE week=1'),
      ...officialWeek1Games.map((g) =>
        db
          .prepare(
            'INSERT INTO games(id,week,away,home,kickoff,status,winner) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(g.id, g.week, g.away, g.home, g.kickoff, g.status, g.winner),
      ),
      db
        .prepare(
          "INSERT INTO app_metadata(key,value) VALUES('schedule_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .bind(SCHEDULE_VERSION),
    ]);
  }
}
