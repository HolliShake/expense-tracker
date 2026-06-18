PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_expenses_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`amount` real NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`note` text DEFAULT '',
	`withDue` integer DEFAULT 0 NOT NULL,
	`dueDate` text DEFAULT '2026-06-17T22:39:38.708Z',
	`expensesCategoryId` integer NOT NULL,
	`salaryId` integer NOT NULL,
	FOREIGN KEY (`expensesCategoryId`) REFERENCES `expenses_category_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salaryId`) REFERENCES `salary_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_expenses_table`("id", "title", "amount", "quantity", "note", "withDue", "dueDate", "expensesCategoryId", "salaryId") SELECT "id", "title", "amount", "quantity", "note", "withDue", "dueDate", "expensesCategoryId", "salaryId" FROM `expenses_table`;--> statement-breakpoint
DROP TABLE `expenses_table`;--> statement-breakpoint
ALTER TABLE `__new_expenses_table` RENAME TO `expenses_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_table_title_unique` ON `expenses_table` (`title`);--> statement-breakpoint
CREATE INDEX `idx_expenses_table_expenses_category_id` ON `expenses_table` (`expensesCategoryId`);--> statement-breakpoint
CREATE INDEX `idx_expenses_table_salary_id` ON `expenses_table` (`salaryId`);