CREATE TABLE `game_market_odds` (
	`game` text PRIMARY KEY NOT NULL,
	`away_chance` integer NOT NULL,
	`home_chance` integer NOT NULL,
	`source` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
