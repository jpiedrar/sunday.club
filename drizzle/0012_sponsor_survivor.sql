ALTER TABLE `leagues` ADD `sponsor_enabled` integer DEFAULT false NOT NULL;
ALTER TABLE `leagues` ADD `sponsor_name` text;
ALTER TABLE `leagues` ADD `sponsor_message` text;
ALTER TABLE `leagues` ADD `sponsor_logo_url` text;
ALTER TABLE `leagues` ADD `sponsor_link_url` text;
ALTER TABLE `leagues` ADD `sponsor_starts_at` integer;
ALTER TABLE `leagues` ADD `sponsor_ends_at` integer;
ALTER TABLE `leagues` ADD `survivor_enabled` integer DEFAULT false NOT NULL;

CREATE TABLE `survivor_picks` (
  `league` text NOT NULL,
  `user` text NOT NULL,
  `week` integer NOT NULL,
  `team` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY(`league`, `user`, `week`),
  FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX `idx_survivor_team_once` ON `survivor_picks` (`league`,`user`,`team`);
