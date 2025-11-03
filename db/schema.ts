import { int, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const UsersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
});

export const SalaryTable = sqliteTable("salary_table", {
  id: int().primaryKey({ autoIncrement: true }),
  month: text().notNull(),
  year: int().notNull(),
  day: int().notNull(),
  title: text().notNull().unique(),
  totalBudget: real().notNull(),
  // Fk User
  userId: int().notNull().references(() => UsersTable.id),
}, (table) => [
  index("idx_salary_table_user_id").on(table.userId),
]);

export const ExpensesCategoryTable = sqliteTable("expenses_category_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  auto: int().notNull().default(1), // will automatically insert to the expenses table after create,
  active: int().notNull().default(1),
  // Fk User
  userId: int().references(() => UsersTable.id),
}, (table) => [
  index("idx_expenses_category_table_user_id").on(table.userId),
]);

export const ExpensesTable = sqliteTable("expenses_table", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull().unique(),
  amount: real().notNull(),
  quantity: int().notNull().default(1),
  note: text().default(''),
  withDue: int().notNull().default(0),
  dueDate: text().default(new Date(Date.now()).toISOString()), // if withDue is 1, this is the due date
  // Fk Expenses Category
  expensesCategoryId: int().notNull().references(() => ExpensesCategoryTable.id),
  // Fk Salary
  salaryId: int().notNull().references(() => SalaryTable.id),
}, (table) => [
  index("idx_expenses_table_expenses_category_id").on(table.expensesCategoryId),
  index("idx_expenses_table_salary_id").on(table.salaryId),
]);