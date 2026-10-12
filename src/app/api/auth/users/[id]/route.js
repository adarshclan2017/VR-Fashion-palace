import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Toggle user active/inactive or update role (admin only)
export async function PUT(request, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const params = await context.params;
    const id = params?.id;
    const body = await request.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deactivating themselves
    if (id === currentUser._id && body.isActive === false) {
      return NextResponse.json({ success: false, error: 'You cannot deactivate your own account' }, { status: 400 });
    }

    if (body.displayName) user.displayName = body.displayName;
    if (body.role && ['admin', 'employee'].includes(body.role)) user.role = body.role;
    if (typeof body.isActive === 'boolean') user.isActive = body.isActive;
    if (body.password && body.password.length >= 4) user.password = body.password;

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
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete a user permanently (admin only, cannot delete yourself or last admin)
export async function DELETE(request, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const params = await context.params;
    const id = params?.id;

    if (id === String(currentUser._id)) {
      return NextResponse.json({ success: false, error: 'You cannot delete your own account' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json({ success: false, error: 'Cannot delete the last admin account' }, { status: 400 });
      }
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: `User "${user.displayName}" deleted permanently` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

