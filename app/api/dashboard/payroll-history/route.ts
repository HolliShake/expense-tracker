import { NextRequest, NextResponse } from 'next/server';
import salaryService from '@/services/salary.service';
import expenseService from '@/services/expense.service';
import { eq, and, sum, count } from 'drizzle-orm';

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

        // Get all salary records for this user grouped by month/year
        const salaryMonths = await salaryService.db
            .select({
                month: salaryService.table.month,
                year: salaryService.table.year,
                totalBudget: sum(salaryService.table.totalBudget),
                salaryCount: count(),
            })
            .from(salaryService.table)
            .where(eq(salaryService.table.userId, userIdNum))
            .groupBy(salaryService.table.year, salaryService.table.month)
            .orderBy(salaryService.table.year, salaryService.table.month);

        // For each month/year, get total expenses
        const monthlyHistory = await Promise.all(
            salaryMonths.map(async (row) => {
                const expenseResult = await expenseService.db
                    .select({
                        totalExpenses: sum(expenseService.table.amount),
                        expenseCount: count(),
                    })
                    .from(expenseService.table)
                    .innerJoin(salaryService.table, eq(expenseService.table.salaryId, salaryService.table.id))
                    .where(and(
                        eq(salaryService.table.userId, userIdNum),
                        eq(salaryService.table.month, row.month),
                        eq(salaryService.table.year, row.year)
                    ));

                const totalExpenses = Number(expenseResult[0]?.totalExpenses ?? 0);
                const totalBudget = Number(row.totalBudget ?? 0);
                const remaining = totalBudget - totalExpenses;

                return {
                    month: row.month,
                    year: row.year,
                    totalBudget,
                    totalExpenses,
                    remaining,
                    utilization: totalBudget > 0
                        ? Math.round((totalExpenses / totalBudget) * 100)
                        : 0,
                };
            })
        );

        return NextResponse.json({
            history: monthlyHistory,
        });
    } catch (error) {
        console.error('Error fetching payroll history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payroll history' },
            { status: 500 }
        );
    }
}