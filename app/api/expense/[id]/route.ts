import { NextRequest, NextResponse } from 'next/server';
import expenseService from '@/services/expense.service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const expense = await expenseService.read(parseInt(id));
        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expense' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, amount, quantity, note, withDue, dueDate, salaryId, expensesCategoryId } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        if (!title || !amount || !salaryId) {
            return NextResponse.json(
                { error: 'Title, amount, and salaryId are required' },
                { status: 400 }
            );
        }

        const result = await expenseService.update(parseInt(id), {
            title,
            amount: parseFloat(amount),
            quantity: quantity || 1,
            note: note || '',
            withDue: withDue ? 1 : 0,
            dueDate: dueDate || null,
            salaryId: parseInt(salaryId),
            expensesCategoryId: expensesCategoryId || null,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json(
            { error: 'Failed to update expense' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        await expenseService.delete(parseInt(id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense' },
            { status: 500 }
        );
    }
}
