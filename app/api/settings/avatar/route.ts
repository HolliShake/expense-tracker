import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import userService from '@/services/user.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionUser = { id?: number; name?: string; email?: string };

export const dynamic = "force-dynamic";

const VALID_AVATARS = [
  '',
  '/avatars/default.png',
  '/avatars/boy.png',
  '/avatars/girl.png',
  '/avatars/man.png',
  '/avatars/woman.png',
  '/avatars/cat.png',
  '/avatars/dog.png',
  '/avatars/robot.png',
  '/avatars/alien.png',
];

// Fallback avatars using DiceBear or UI Avatars API (no local files needed)
const AVATAR_OPTIONS = [
  { value: '', label: 'None (initials)', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=default', label: 'Default Avatar', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=boy', label: 'Boy', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=girl', label: 'Girl', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=man', label: 'Man', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=woman', label: 'Woman', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=cat', label: 'Cat', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dog', label: 'Dog', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=robot', label: 'Robot', preview: null },
  { value: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alien', label: 'Alien', preview: null },
  { value: 'https://api.dicebear.com/9.x/bottts/svg?seed=custom', label: 'Bot', preview: null },
  { value: 'https://api.dicebear.com/9.x/icons/svg?seed=face', label: 'Icon Face', preview: null },
];

export async function GET() {
  return NextResponse.json({ avatars: AVATAR_OPTIONS });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { avatarUrl } = await request.json();

    if (avatarUrl === undefined) {
      return NextResponse.json(
        { error: 'avatarUrl is required' },
        { status: 400 }
      );
    }

    await userService.updateAvatar(Number(userId), avatarUrl);

    return NextResponse.json({ message: 'Avatar updated successfully', avatarUrl });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar' },
      { status: 500 }
    );
  }
}