import { UserRole, UserStatus } from '@/types';

export type AuthMode = 'prototype' | 'production';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mobileNo?: string;
  lastLoginAt?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export interface AuthSession {
  user: AuthUser | null;
  expiresAt?: number;
  mode: AuthMode;
}

export interface IAuthProvider {
  readonly mode: AuthMode;
  readonly providerName: string;
  login(credentials: AuthCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  validateSession(): Promise<{ valid: boolean; reason?: 'expired' | 'revoked' | 'notFound' }>;
  resetPassword(email: string, recoveryKey: string, newPassword: string): Promise<AuthResult>;
}

