CREATE TABLE `outright_picks` (
  `league` text NOT NULL,
  `user` text NOT NULL,
  `category` text NOT NULL,
  `team` text NOT NULL,
  PRIMARY KEY(`league`, `user`, `category`),
  FOREIGN KEY (`league`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
