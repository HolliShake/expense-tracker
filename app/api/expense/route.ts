import { NextRequest, NextResponse } from 'next/server';
import expenseService from '@/services/expense.service';

export async function GET(request: NextRequest) {
  try {
    const expenses = await expenseService.readAll();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, amount, quantity, note, withDue, dueDate, salaryId, expensesCategoryId } = body;

    if (!title || !amount || !salaryId) {
      return NextResponse.json(
        { error: 'Title, amount, and salaryId are required' },
        { status: 400 }
      );
    }

    const expense = await expenseService.create({
      title,
      amount: parseFloat(amount),
      quantity: quantity || 1,
      note: note || '',
      withDue: withDue ? 1 : 0,
      dueDate: dueDate || null,
      salaryId: parseInt(salaryId),
      expensesCategoryId: expensesCategoryId || null,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
