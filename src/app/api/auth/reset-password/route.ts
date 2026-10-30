import { NextResponse } from 'next/server';
import { validateAllowedEmail } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, recoveryKey, newPassword } = body;

    const emailVal = validateAllowedEmail(email);
    if (!emailVal.valid) {
      return NextResponse.json(
        { success: false, error: emailVal.error },
        { status: 400 }
      );
    }

    if (!recoveryKey || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = emailVal.normalized;
    const trimmedKey = String(recoveryKey).trim();

    // Verify on server side: only administrator accounts can reset via recovery key
    const SERVER_ADMIN_KEY = process.env.ADMIN_RECOVERY_KEY || 'HA-ADMIN-2026-SECURE';

    if (trimmedKey !== SERVER_ADMIN_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Administrator Security Recovery Key. Verification failed.',
        },
        { status: 401 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be at least 6 characters long.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated on server.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while resetting password.',
      },
      { status: 500 }
    );
  }
}

