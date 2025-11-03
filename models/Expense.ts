

import { ExpensesTable } from '@/db/schema';

export type Expense = typeof ExpensesTable.$inferSelect;
export type NewExpense = typeof ExpensesTable.$inferInsert;