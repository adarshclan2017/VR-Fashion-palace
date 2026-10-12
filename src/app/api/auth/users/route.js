import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET all users (admin only)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create new user (admin only)
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only admins can create users.' }, { status: 403 });
    }

    await connectDB();
    const { username, password, displayName, role } = await request.json();

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const user = new User({
      username: username.toLowerCase(),
      password,
      displayName,
      role: role || 'employee',
    });

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
