import { NextRequest, NextResponse } from 'next/server';
import { AuthSignup } from '@/models/AuthSignup';
import userService from '@/services/user.service';
import bcrypt from 'bcrypt';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body: AuthSignup = await request.json();
        
        const { name, email, password, confirmPassword } = body;
        
        if (!name || !email || !password || !confirmPassword) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'Passwords do not match' },
                { status: 400 }
            );
        }
        
        // Create new user
        const newUser = await userService.create({
            name,
            email,
            passwordHash: await bcrypt.hash(password, 16),
        });
        
        return NextResponse.json(
            { 
                message: 'User created successfully',
                user: newUser
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
