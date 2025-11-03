import { NextRequest, NextResponse } from 'next/server';
import expenseTypeService from '@/services/expense-type.service';
import { ExpensesCategoryTable } from '@/db/schema';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId parameter is required' },
                { status: 400 }
            );
        }

        const result = await expenseTypeService.findByUserIdPaginated(
            parseInt(userId),
            page,
            pageSize
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching expense types:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expense types' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, auto, active, userId } = body;

        if (!name || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await expenseTypeService.db.insert(expenseTypeService.table).values({
            name,
            auto: auto ?? 1,
            active: active ?? 1,
            userId,
        }).returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        console.error('Error creating expense type:', error);
        return NextResponse.json(
            { error: 'Failed to create expense type' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, auto, active } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        const updateData: Partial<typeof ExpensesCategoryTable.$inferInsert> = {};
        if (name !== undefined) updateData.name = name;
        if (auto !== undefined) updateData.auto = auto;
        if (active !== undefined) updateData.active = active;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const result = await expenseTypeService.update(parseInt(id), updateData);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating expense type:', error);
        return NextResponse.json(
            { error: 'Failed to update expense type' },
            { status: 500 }
        );
    }
}
