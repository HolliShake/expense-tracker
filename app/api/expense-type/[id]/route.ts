import { NextRequest, NextResponse } from 'next/server';
import expenseTypeService from '@/services/expense-type.service';

export const dynamic = "force-dynamic";


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

        if (!name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await expenseTypeService.update(parseInt(id), {
            name,
            auto,
            active,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating expense type:', error);
        return NextResponse.json(
            { error: 'Failed to update expense type' },
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

        await expenseTypeService.delete(parseInt(id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense type:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense type' },
            { status: 500 }
        );
    }
}
