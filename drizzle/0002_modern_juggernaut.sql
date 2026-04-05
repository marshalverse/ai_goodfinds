CREATE TABLE `post_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`toolId` int NOT NULL,
	CONSTRAINT `post_tools_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_tools_unique` UNIQUE(`postId`,`toolId`)
);
