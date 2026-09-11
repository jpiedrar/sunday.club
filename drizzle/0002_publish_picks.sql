CREATE TABLE `pick_publications` (
	`league` text NOT NULL,
	`week` integer NOT NULL,
	`published_at` integer NOT NULL,
	PRIMARY KEY(`league`, `week`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action
);
