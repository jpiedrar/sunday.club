CREATE TABLE `published_pick_entries` (
	`league` text NOT NULL,
	`week` integer NOT NULL,
	`user` text NOT NULL,
	`game` text NOT NULL,
	`team` text NOT NULL,
	PRIMARY KEY(`league`, `week`, `user`, `game`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
