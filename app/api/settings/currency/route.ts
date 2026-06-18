import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import userService from '@/services/user.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionUser = { id?: number; name?: string; email?: string };

export const dynamic = "force-dynamic";

const SUPPORTED_CURRENCIES = ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'MYR', 'IDR', 'THB', 'VND', 'KRW', 'CNY', 'INR'];

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currency } = await request.json();

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      );
    }

    const normalized = currency.toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(normalized)) {
      return NextResponse.json(
        { error: `Unsupported currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    await userService.updateCurrency(Number(userId), normalized);

    return NextResponse.json({ message: 'Currency updated successfully', currency: normalized });
  } catch (error) {
    console.error('Error updating currency:', error);
    return NextResponse.json(
      { error: 'Failed to update currency' },
      { status: 500 }
    );
  }
}