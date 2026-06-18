import { NextRequest, NextResponse } from 'next/server';
import salaryService from '@/services/salary.service';
import expenseService from '@/services/expense.service';
import expenseTypeService from '@/services/expense-type.service';
import { eq, and, sum, count, avg, desc } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId parameter is required' },
                { status: 400 }
            );
        }

        const userIdNum = parseInt(userId);

        // Total salaries count and sum
        const salaryStats = await salaryService.db
            .select({
                totalCount: count(),
                totalBudget: sum(salaryService.table.totalBudget),
            })
            .from(salaryService.table)
            .where(eq(salaryService.table.userId, userIdNum));

        // Total expenses count and sum via salary join
        const expenseStats = await expenseService.db
            .select({
                totalCount: count(),
                totalAmount: sum(expenseService.table.amount),
            })
            .from(expenseService.table)
            .innerJoin(salaryService.table, eq(expenseService.table.salaryId, salaryService.table.id))
            .where(eq(salaryService.table.userId, userIdNum));

        // Expense categories count
        const categoryCount = await expenseTypeService.db
            .select({ count: count() })
            .from(expenseTypeService.table)
            .where(eq(expenseTypeService.table.userId, userIdNum));

        // Current month (DB stores full month name strings like "June", "November")
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const currentMonth = new Date().getMonth(); // 0-indexed
        const currentMonthName = monthNames[currentMonth];
        const currentYear = new Date().getFullYear();

        // Current month expenses
        const currentMonthExpenses = await expenseService.db
            .select({
                totalAmount: sum(expenseService.table.amount),
                totalCount: count(),
            })
            .from(expenseService.table)
            .innerJoin(salaryService.table, eq(expenseService.table.salaryId, salaryService.table.id))
            .where(and(
                eq(salaryService.table.userId, userIdNum),
                eq(salaryService.table.month, currentMonthName),
                eq(salaryService.table.year, currentYear)
            ));

        // Current month salary budgets
        const currentMonthSalaries = await salaryService.db
            .select({
                totalBudget: sum(salaryService.table.totalBudget),
                count: count(),
            })
            .from(salaryService.table)
            .where(and(
                eq(salaryService.table.userId, userIdNum),
                eq(salaryService.table.month, currentMonthName),
                eq(salaryService.table.year, currentYear)
            ));

        // Recent salaries (last 5)
        const recentSalaries = await salaryService.db
            .select({
                id: salaryService.table.id,
                title: salaryService.table.title,
                month: salaryService.table.month,
                year: salaryService.table.year,
                totalBudget: salaryService.table.totalBudget,
            })
            .from(salaryService.table)
            .where(eq(salaryService.table.userId, userIdNum))
            .orderBy(desc(salaryService.table.year), desc(salaryService.table.month))
            .limit(5);

        // Average expense amount
        const avgExpenseAmount = await expenseService.db
            .select({ average: avg(expenseService.table.amount) })
            .from(expenseService.table)
            .innerJoin(salaryService.table, eq(expenseService.table.salaryId, salaryService.table.id))
            .where(eq(salaryService.table.userId, userIdNum));

        return NextResponse.json({
            totalSalaries: Number(salaryStats[0]?.totalCount ?? 0),
            totalBudget: Number(salaryStats[0]?.totalBudget ?? 0),
            totalExpenses: Number(expenseStats[0]?.totalCount ?? 0),
            totalExpenseAmount: Number(expenseStats[0]?.totalAmount ?? 0),
            totalCategories: Number(categoryCount[0]?.count ?? 0),
            currentMonth: currentMonthName,
            currentMonthExpenses: Number(currentMonthExpenses[0]?.totalAmount ?? 0),
            currentMonthExpenseCount: Number(currentMonthExpenses[0]?.totalCount ?? 0),
            currentMonthBudget: Number(currentMonthSalaries[0]?.totalBudget ?? 0),
            currentMonthSalaryCount: Number(currentMonthSalaries[0]?.count ?? 0),
            averageExpenseAmount: Number(avgExpenseAmount[0]?.average ?? 0),
            recentSalaries,
            budgetUtilization: Number(currentMonthSalaries[0]?.totalBudget ?? 0) > 0
                ? Math.round((Number(currentMonthExpenses[0]?.totalAmount ?? 0) / Number(currentMonthSalaries[0]?.totalBudget ?? 0)) * 100)
                : 0,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}