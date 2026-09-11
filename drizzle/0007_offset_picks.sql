CREATE TABLE `offset_pick_changes` (
	`league` text NOT NULL,
	`user` text NOT NULL,
	`game` text NOT NULL,
	`team` text NOT NULL,
	`changed_at` integer NOT NULL,
	PRIMARY KEY(`league`, `user`, `game`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
