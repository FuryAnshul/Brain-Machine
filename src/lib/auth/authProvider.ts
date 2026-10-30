import { IAuthProvider, AuthMode, AuthCredentials, AuthResult, AuthSession, AuthUser } from './types';
import { initialUsers } from '@/lib/mockData';
import { UserProfile } from '@/types';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { validateAllowedEmail } from '@/lib/validation';

/**
 * CLIENT-SIDE PROTOTYPE AUTHENTICATION PROVIDER
 *
 * ARCHITECTURAL NOTICE & SECURITY DISCLOSURE:
 * This provider runs entirely in browser memory for development, UI review,
 * and static demonstrations. It does NOT constitute genuine production security.
 *
 * Limitations of Frontend-Only Prototype Mode:
 * 1. No Server Boundary: Any data sent in client bundles or API payloads is inspectable.
 * 2. Client-side route guards can be inspected and bypassed in browser DevTools.
 * 3. Passwords and recovery keys cannot be safely authenticated without a cryptographic backend.
 *
 * To deploy in true production, replace this provider with a trusted authentication
 * service (e.g. NextAuth.js/Auth.js with HTTP-only cookies, Supabase Auth, Firebase Auth, or a custom OAuth/JWT API).
 */
export class ClientPrototypeAuthProvider implements IAuthProvider {
  readonly mode: AuthMode = 'prototype';
  readonly providerName: string = 'Client-Side Prototype Provider';

  private getUsers(): UserProfile[] {
    if (typeof window === 'undefined') return initialUsers;
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        if (parsedAuth.users && parsedAuth.users.length > 0) {
          return parsedAuth.users;
        }
      }
    } catch {}
    return initialUsers;
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    const { email, password } = credentials;
    const emailVal = validateAllowedEmail(email);
    if (!emailVal.valid) {
      return { success: false, error: emailVal.error || 'Please use your @brainmachine.com email address.' };
    }
    const trimmedEmail = emailVal.normalized;

    // Verify on trusted server route
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid email address or password. Please verify your credentials.',
        };
      }
      return { success: true, user: data.user as AuthUser };
    } catch {
      // Fallback if offline
      const users = this.getUsers();
      const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (!user) {
        return { success: false, error: 'Invalid email address or password. Please verify your credentials.' };
      }
      if (user.status === 'revoked') {
        return {
          success: false,
          error:
            'Access Revoked. Your login profile has been deactivated by an administrator. Please contact your system administrator.',
        };
      }
      if (user.password && user.password !== password) {
        return {
          success: false,
          error: 'Invalid email address or password. Please verify your credentials.',
        };
      }
      if (!user.password) {
        return {
          success: false,
          error: 'Authentication server is unreachable. Please verify your network connection or try again.',
        };
      }
      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mobileNo: user.mobileNo,
        lastLoginAt: new Date().toISOString(),
      };
      return { success: true, user: authUser };
    }
  }

  async logout(): Promise<void> {
    // Session clearing handled in store and cookies
  }

  async getSession(): Promise<AuthSession | null> {
    if (typeof window === 'undefined') return null;
    try {
      // 1. Check dedicated auth session partition first
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        if (parsedAuth.currentUser) {
          return {
            user: parsedAuth.currentUser,
            expiresAt: parsedAuth.currentUser.sessionExpiry,
            mode: 'prototype',
          };
        }
      }

      // 2. Fallback to legacy key
      const savedLegacy = localStorage.getItem(STORAGE_KEYS.LEGACY_MONOLITH);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (parsed.currentUser) {
          return {
            user: parsed.currentUser,
            expiresAt: parsed.currentUser.sessionExpiry,
            mode: 'prototype',
          };
        }
      }
    } catch {}
    return null;
  }

  async validateSession(): Promise<{ valid: boolean; reason?: 'expired' | 'revoked' | 'notFound' }> {
    const session = await this.getSession();
    if (!session || !session.user) return { valid: false };

    if (session.expiresAt && Date.now() > session.expiresAt) {
      return { valid: false, reason: 'expired' };
    }

    const users = this.getUsers();
    const freshUser = users.find((u) => u.id === session.user?.id);
    if (!freshUser) {
      return { valid: false, reason: 'notFound' };
    }
    if (freshUser.status === 'revoked') {
      return { valid: false, reason: 'revoked' };
    }

    return { valid: true };
  }

  async resetPassword(email: string, recoveryKey: string, newPassword: string): Promise<AuthResult> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedKey = recoveryKey.trim();

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, recoveryKey: trimmedKey, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Password reset failed.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network communication error.' };
    }
  }
}

// Global Auth Provider Factory
let activeAuthProvider: IAuthProvider = new ClientPrototypeAuthProvider();

export function getAuthProvider(): IAuthProvider {
  return activeAuthProvider;
}

export function setAuthProvider(provider: IAuthProvider): void {
  activeAuthProvider = provider;
}

