CREATE TABLE `league_badge_settings` (
  `league` text NOT NULL,
  `badge` text NOT NULL,
  `enabled` integer DEFAULT true NOT NULL,
  PRIMARY KEY(`league`, `badge`),
  FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action
);
