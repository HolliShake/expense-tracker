import { SalaryTable } from '@/db/schema';

export type Payroll = typeof SalaryTable.$inferSelect;
export type NewPayroll = typeof SalaryTable.$inferInsert;


export type PayrollTile = {
    totalSalary: number;
    averageBudget: number;
    thisMonthsTotalExpenses: number;
};