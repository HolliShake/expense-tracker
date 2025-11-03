import { ExpensesTable, SalaryTable } from '@/db/schema';
import { GenericService, PaginatedResponse } from './generic.service';
import { eq, count, sum, avg, and, desc } from 'drizzle-orm';
import { Payroll, PayrollTile } from '@/models/Payroll';

export class SalaryService extends GenericService<typeof SalaryTable> {
    constructor() {
        super(SalaryTable);
    }

    public async findByUserIdPaginated(userId: number, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Payroll>> {
        // Ensure page and pageSize are positive integers
        page = Math.max(1, Math.floor(page));
        pageSize = Math.max(1, Math.floor(pageSize));
        
        const offset = (page - 1) * pageSize;

        // Get total count for the user
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(eq(this.table.userId, userId));
        const totalItems = totalResult[0]?.count ?? 0;

        // Get paginated data
        const data = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.userId, userId))
            .orderBy(desc(this.table.year), desc(this.table.month), desc(this.table.day))
            .limit(pageSize)
            .offset(offset);

        const totalPages = Math.ceil(totalItems / pageSize);
        
        return {
            data,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    public async getPayrollTile(userId: number): Promise<PayrollTile> {
        const totalSalary = await this.db
            .select({ total: sum(this.table.totalBudget) })
            .from(this.table)
            .where(eq(this.table.userId, userId));

        const averageBudget = await this.db
            .select({ average: avg(this.table.totalBudget) })
            .from(this.table)
            .where(eq(this.table.userId, userId));

        const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed, but DB months are 1-indexed
        const currentYear = new Date().getFullYear();
        
        const thisMonthsTotalExpenses = await this.db
            .select({ total: sum(ExpensesTable.amount) })
            .from(ExpensesTable)
            .innerJoin(this.table, eq(ExpensesTable.salaryId, this.table.id))
            .where(and(
                eq(this.table.userId, userId),
                eq(this.table.month, currentMonth.toString()),
                eq(this.table.year, currentYear)
            ));

        return {
            totalSalary: Number(totalSalary[0]?.total ?? 0),
            averageBudget: Number(averageBudget[0]?.average ?? 0),
            thisMonthsTotalExpenses: Number(thisMonthsTotalExpenses[0]?.total ?? 0),
        } as PayrollTile;
    }
}

const salaryService = new SalaryService();

export default salaryService;