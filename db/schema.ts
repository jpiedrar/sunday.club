import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
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
  superBowlLockWeek: integer('super_bowl_lock_week').notNull().default(5),
  superBowlPoints: integer('super_bowl_points').notNull().default(0),
  sponsorEnabled: integer('sponsor_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  sponsorName: text('sponsor_name'),
  sponsorMessage: text('sponsor_message'),
  sponsorLogoUrl: text('sponsor_logo_url'),
  sponsorLinkUrl: text('sponsor_link_url'),
  sponsorStartsAt: integer('sponsor_starts_at'),
  sponsorEndsAt: integer('sponsor_ends_at'),
  survivorEnabled: integer('survivor_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
});
export const leagueBadgeSettings = sqliteTable(
  'league_badge_settings',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    badge: text('badge').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.league, t.badge] })],
);
export const members = sqliteTable(
  'members',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
    joinedAt: integer('joined_at').notNull().default(0),
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
export const offsetPickChanges = sqliteTable(
  'offset_pick_changes',
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
    changedAt: integer('changed_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.user, t.game] })],
);
export const gameMarketOdds = sqliteTable('game_market_odds', {
  game: text('game')
    .primaryKey()
    .references(() => games.id),
  awayChance: integer('away_chance').notNull(),
  homeChance: integer('home_chance').notNull(),
  source: text('source').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
export const superBowlPicks = sqliteTable(
  'super_bowl_picks',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
    team: text('team').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.user] })],
);
export const outrightPicks = sqliteTable(
  'outright_picks',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
    category: text('category').notNull(),
    team: text('team').notNull(),
  },
  (t) => [primaryKey({ columns: [t.league, t.user, t.category] })],
);
export const survivorPicks = sqliteTable(
  'survivor_picks',
  {
    league: text('league')
      .notNull()
      .references(() => leagues.id),
    user: text('user')
      .notNull()
      .references(() => profiles.id),
    week: integer('week').notNull(),
    team: text('team').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.league, t.user, t.week] }),
    uniqueIndex('idx_survivor_team_once').on(t.league, t.user, t.team),
  ],
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
