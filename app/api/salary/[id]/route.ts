import { NextRequest, NextResponse } from 'next/server';
import salaryService from '@/services/salary.service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const salary = await salaryService.read(parseInt(id));
        return NextResponse.json(salary);
    } catch (error) {
        console.error('Error fetching salary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch salary' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, month, year, day, title, totalBudget } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        if (!month || !year || !day || !title || !totalBudget) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await salaryService.update(parseInt(id), {
            month,
            year,
            day,
            title,
            totalBudget,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating salary:', error);
        return NextResponse.json(
            { error: 'Failed to update salary' },
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

        await salaryService.delete(parseInt(id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting salary:', error);
        return NextResponse.json(
            { error: 'Failed to delete salary' },
            { status: 500 }
        );
    }
}

