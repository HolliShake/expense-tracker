import { NextRequest, NextResponse } from 'next/server';
import salaryService from '@/services/salary.service';

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

        const tileData = await salaryService.getPayrollTile(parseInt(userId));

        return NextResponse.json(tileData);
    } catch (error) {
        console.error('Error fetching payroll tile data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payroll tile data' },
            { status: 500 }
        );
    }
}
