import { NextRequest, NextResponse } from "next/server";
import expenseService from "@/services/expense.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salaryId = parseInt(id);
    
    if (isNaN(salaryId)) {
      return NextResponse.json(
        { error: "Invalid salary ID" },
        { status: 400 }
      );
    }

    const expenses = await expenseService.getExpensesBySalaryId(salaryId);
    
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
