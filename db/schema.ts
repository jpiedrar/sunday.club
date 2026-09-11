import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  favoriteTeam: text('favorite_team'),
});
export const leagues = sqliteTable('leagues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  owner: text('owner')
    .notNull()
    .references(() => profiles.id),
  code: text('code').notNull().unique(),
  season: integer('season').notNull().default(2026),
});
export const members = sqliteTable(
  'members',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
  },
  (t) => [
    primaryKey({ columns: [t.league, t.user] }),
    index('idx_members_user').on(t.user),
  ],
);
export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey(),
    week: integer('week').notNull(),
    away: text('away').notNull(),
    home: text('home').notNull(),
    kickoff: integer('kickoff').notNull(),
    status: text('status').notNull(),
    winner: text('winner'),
  },
  (t) => [index('idx_games_week').on(t.week)],
);
export const picks = sqliteTable(
  'picks',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
    game: text('game')
      .notNull()
      .references(() => games.id),
    team: text('team').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.user, t.game] })],
);
export const results = sqliteTable(
  'results',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    game: text('game')
      .notNull()
      .references(() => games.id),
    winner: text('winner'),
    status: text('status').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.game] })],
);

export const pickPublications = sqliteTable(
  'pick_publications',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    week: integer('week').notNull(),
    publishedAt: integer('published_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.week] })],
);

export const publishedPickEntries = sqliteTable(
  'published_pick_entries',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    week: integer('week').notNull(),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
    game: text('game')
      .notNull()
      .references(() => games.id),
    team: text('team').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.week, t.user, t.game] })],
);

export const appMetadata = sqliteTable('app_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
