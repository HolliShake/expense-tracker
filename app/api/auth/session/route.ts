import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { session },
            { status: 200 }
        );
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve session' },
            { status: 500 }
        );
    }
}
