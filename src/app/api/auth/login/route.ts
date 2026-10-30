import { NextResponse } from 'next/server';
import { SafeUserProfile, UserRole, UserStatus } from '@/types';
import { validateAllowedEmail } from '@/lib/validation';

// Server-side credential vault (never bundled into client-side JS)
// In production, verify against hashed passwords in Postgres/Supabase/LDAP
interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plaintext or bcrypt hash for demo verification
  role: UserRole;
  status: UserStatus;
  mobileNo?: string;
  createdAt: string;
}

// Temporary Admin Account for local development or an isolated staging environment only
// Disabled in production builds unless ALLOW_TEMP_ADMIN is explicitly enabled
const isProduction = process.env.NODE_ENV === 'production';
const isTempAdminEnabled = !isProduction || process.env.ALLOW_TEMP_ADMIN === 'true';

const TEMP_ADMIN_USER: ServerUserRecord = {
  id: 'user-admin-1',
  name: 'Admin Anshul',
  email: 'admin@brainmachine.com',
  passwordHash: 'admin@123',
  role: 'admin',
  status: 'active',
  mobileNo: '9876543210',
  createdAt: '2026-09-01',
};

const SERVER_USERS: ServerUserRecord[] = [
  {
    id: 'user-staff-1',
    name: 'Ankit Sir',
    email: 'ankit@brainmachine.com',
    passwordHash: 'ankit123',
    role: 'staff',
    status: 'active',
    mobileNo: '9826536260',
    createdAt: '2026-09-05',
  },
  {
    id: 'user-eng-1',
    name: 'Pushpak Sharma',
    email: 'pushpak@brainmachine.com',
    passwordHash: 'pushpak123',
    role: 'engineer',
    status: 'active',
    mobileNo: '9871031171',
    createdAt: '2026-09-10',
  },
  {
    id: 'user-revoked-1',
    name: 'Former Contractor',
    email: 'contractor@brainmachine.com',
    passwordHash: 'password123',
    role: 'staff',
    status: 'revoked',
    mobileNo: '9811223344',
    createdAt: '2026-08-15',
  },
];

// Simple server-side IP/Email rate limiter to mitigate brute-force attacks
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 10;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    // Check rate limit
    const attemptRecord = loginAttempts.get(ip);
    if (attemptRecord) {
      if (now - attemptRecord.firstAttempt < RATE_LIMIT_WINDOW_MS) {
        if (attemptRecord.count >= MAX_ATTEMPTS) {
          return NextResponse.json(
            {
              success: false,
              error: 'Too many failed login attempts. Please wait 60 seconds before trying again.',
            },
            { status: 429 }
          );
        }
      } else {
        loginAttempts.delete(ip);
      }
    }

    const body = await req.json();
    const { email, password } = body;

    // Validate email format and domain restriction (@brainmachine.com)
    const emailValidation = validateAllowedEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = emailValidation.normalized;

    // Check server user directory
    let user = SERVER_USERS.find((u) => u.email.toLowerCase() === normalizedEmail);

    // If temporary admin test account, allow only if enabled for dev/staging
    if (!user && normalizedEmail === TEMP_ADMIN_USER.email.toLowerCase()) {
      if (isTempAdminEnabled) {
        user = TEMP_ADMIN_USER;
      }
    }

    // Timing-attack mitigation: perform a comparison regardless
    const expectedPassword = user ? user.passwordHash : 'dummy-comparison-hash';
    const isPasswordValid = password === expectedPassword;

    if (!user || !isPasswordValid) {
      // Record failed attempt
      const current = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
      loginAttempts.set(ip, {
        count: current.count + 1,
        firstAttempt: current.firstAttempt,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address or password. Please verify your credentials.',
        },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'revoked') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Access Revoked. Your login profile has been deactivated by an administrator. Please contact your system administrator.',
        },
        { status: 403 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(ip);

    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    const safeUser: SafeUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mobileNo: user.mobileNo,
      createdAt: user.createdAt,
      lastLoginAt: new Date().toISOString(),
      sessionExpiry: Date.now() + SESSION_DURATION_MS,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Authentication successful',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}

