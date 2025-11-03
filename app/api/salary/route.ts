import { NextRequest, NextResponse } from 'next/server';
import salaryService from '@/services/salary.service';

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

        const result = await salaryService.findByUserIdPaginated(
            parseInt(userId),
            page,
            pageSize
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching salaries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch salaries' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { month, year, day, title, totalBudget, userId } = body;

        if (!month || !year || !day || !title || !totalBudget || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await salaryService.db.insert(salaryService.table).values({
            month,
            year,
            day,
            title,
            totalBudget,
            userId,
        }).returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        console.error('Error creating salary:', error);
        return NextResponse.json(
            { error: 'Failed to create salary' },
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
