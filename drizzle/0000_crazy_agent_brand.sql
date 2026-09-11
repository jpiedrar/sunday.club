CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`week` integer NOT NULL,
	`away` text NOT NULL,
	`home` text NOT NULL,
	`kickoff` integer NOT NULL,
	`status` text NOT NULL,
	`winner` text
);
--> statement-breakpoint
CREATE INDEX `idx_games_week` ON `games` (`week`);--> statement-breakpoint
CREATE TABLE `leagues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`code` text NOT NULL,
	`season` integer DEFAULT 2026 NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leagues_code_unique` ON `leagues` (`code`);--> statement-breakpoint
CREATE TABLE `members` (
	`league` text NOT NULL,
	`user` text NOT NULL,
	PRIMARY KEY(`league`, `user`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_members_user` ON `members` (`user`);--> statement-breakpoint
CREATE TABLE `picks` (
	`league` text NOT NULL,
	`user` text NOT NULL,
	`game` text NOT NULL,
	`team` text NOT NULL,
	PRIMARY KEY(`league`, `user`, `game`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `results` (
	`league` text NOT NULL,
	`game` text NOT NULL,
	`winner` text,
	`status` text NOT NULL,
	PRIMARY KEY(`league`, `game`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
