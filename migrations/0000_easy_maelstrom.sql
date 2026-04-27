CREATE TABLE `agent_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`turn_count` integer NOT NULL,
	`tool_call_count` integer NOT NULL,
	`tool_failures` integer DEFAULT 0 NOT NULL,
	`reply_latency_ms` integer,
	`tokens_in` integer,
	`tokens_out` integer,
	`cost_usd` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`messages_json` text NOT NULL,
	`help_level` text DEFAULT 'guide_me' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`site_id` text,
	`event` text NOT NULL,
	`metadata` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`zone_id` text NOT NULL,
	`order` integer NOT NULL,
	`type` text NOT NULL,
	`size` text NOT NULL,
	`content_json` text NOT NULL,
	`style_overrides` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hosted_sites` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`r2_prefix` text NOT NULL,
	`last_deployed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`stack` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`links` text NOT NULL,
	`media` text NOT NULL,
	`tags` text NOT NULL,
	`date_range` text,
	`highlights` text,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`template_id` text,
	`style_layer_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_slug_unique` ON `sites` (`slug`);--> statement-breakpoint
CREATE TABLE `style_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`fonts` text NOT NULL,
	`colors` text NOT NULL,
	`spacing` text DEFAULT 'comfortable' NOT NULL,
	`custom_css` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`workos_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_workos_id_unique` ON `users` (`workos_id`);--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`name` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`zone_id` integer NOT NULL,
	`label` text NOT NULL,
	`order` integer NOT NULL,
	`style_overrides` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
