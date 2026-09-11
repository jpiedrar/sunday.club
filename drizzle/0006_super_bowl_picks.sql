CREATE TABLE `super_bowl_picks` (
	`league` text NOT NULL,
	`user` text NOT NULL,
	`team` text NOT NULL,
	PRIMARY KEY(`league`, `user`),
	FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
