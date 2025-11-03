

import { ExpensesCategoryTable } from '@/db/schema';

export type ExpenseCategory = typeof ExpensesCategoryTable.$inferSelect;
export type NewExpenseCategory = typeof ExpensesCategoryTable.$inferInsert;