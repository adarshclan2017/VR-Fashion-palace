import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { username, password } = await request.json();

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user with password field included
    const user = await User.findOne({ username: cleanUsername }).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Explicit check for deactivated account
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'This user account is currently deactivated. Please contact your store administrator.' },
        { status: 403 }
      );
    }

    // Compare password
    const isMatch = await user.comparePassword(cleanPassword);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update lastLogin without triggering pre-save hooks
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Sign token
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
