import { Injectable, signal, computed, isDevMode } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onIdTokenChanged,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';

export type UserRole = 'admin' | 'researcher' | 'viewer';

export interface SecurityFlag {
  type: 'HIGH_CALL_RATE' | 'HIGH_JOB_RATE' | 'STORAGE_QUOTA_EXCEEDED' | string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  value?: number;
  threshold?: number;
  endpoint?: string;
}

export interface UserProfile {
  username: string;
  email: string;
  token: string;
  uid?: string;
  photoURL?: string;
  providerId?: string;
  emailVerified?: boolean;
  role?: UserRole;
  isAdmin?: boolean;
  authorized?: boolean;
  blocked?: boolean;
  storageUsedBytes?: number;
  securityFlags?: SecurityFlag[];
}

const firebaseConfig = {
  projectId: "blurock-database",
  appId: "1:315685320181:web:212000ed2f64b4c730419d",
  storageBucket: "blurock-database.firebasestorage.app",
  apiKey: "AIzaSyBFHXqA8MXdv-KbON_IU78BItS9KangM1Y",
  authDomain: "blurock-database.firebaseapp.com",
  messagingSenderId: "315685320181"
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'reactcloud_auth_token';
  private readonly USER_KEY = 'reactcloud_user';
  private readonly SCOPE_KEY = 'reactcloud_data_scope';
  private readonly apiBaseUrl = 'http://localhost:8085';

  private firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  private firebaseAuth = getAuth(this.firebaseApp);

  // Reactive UI State Signals
  public currentUser = signal<UserProfile | null>(this.getStoredUser());
  public isAuthenticated = signal<boolean>(!!this.getStoredToken());
  public isAuthorized = computed<boolean>(() => {
    const u = this.currentUser();
    if (!u) return false;
    return u.blocked !== true && u.authorized !== false;
  });
  public isAdmin = computed<boolean>(() => {
    const u = this.currentUser();
    if (!u || u.blocked) return false;
    return u.role === 'admin' || u.isAdmin === true;
  });

  // Data scope selector ('personal' vs 'system') — Admins can switch to 'system' to manage global catalog
  public activeDataScope = signal<'personal' | 'system'>(
    (localStorage.getItem(this.SCOPE_KEY) as 'personal' | 'system') || 'personal'
  );

  private initialTokenRefreshed = false;

  constructor() {
    // Automatically keep Firebase ID Token and custom claims fresh in localStorage
    onIdTokenChanged(this.firebaseAuth, async (fbUser) => {
      if (fbUser) {
        try {
          const force = !this.initialTokenRefreshed;
          this.initialTokenRefreshed = true;
          await this.hydrateProfileFromFirebaseUser(fbUser, force);
        } catch (err) {
          console.warn('[AuthService] Token refresh warning:', err);
        }
      } else {
        this.initialTokenRefreshed = false;
      }
    });

    // Proactively refresh Firebase ID token every 45 minutes so long-running jobs never hit 1-hour expiry
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.firebaseAuth.currentUser) {
          this.refreshIdToken().catch(() => {});
        }
      }, 45 * 60 * 1000);
    }
  }

  /**
   * Forces a refresh of the current Firebase ID Token and updates localStorage.
   */
  public async refreshIdToken(): Promise<string | null> {
    const fbUser = this.firebaseAuth.currentUser;
    if (!fbUser) return this.getToken();
    try {
      const freshToken = await fbUser.getIdToken(true);
      localStorage.setItem(this.TOKEN_KEY, freshToken);
      const existing = this.currentUser();
      if (existing) {
        const updated = { ...existing, token: freshToken };
        localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
        this.currentUser.set(updated);
      }
      return freshToken;
    } catch (err) {
      console.warn('[AuthService] Failed to force-refresh Firebase ID token:', err);
      return this.getToken();
    }
  }

  /**
   * Extracts Firebase ID Token + Custom Claims (`role`, `admin`, `authorized`, `blocked`)
   * and synchronizes with the Orchestrator `/api/auth/session` endpoint.
   */
  private async hydrateProfileFromFirebaseUser(user: User, forceRefresh: boolean = false): Promise<UserProfile> {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    const claims = tokenResult.claims || {};

    const claimRole = (claims['role'] as UserRole) || (claims['admin'] === true ? 'admin' : 'researcher');
    const claimBlocked = claims['blocked'] === true;
    const claimAuthorized = claimBlocked ? false : (claims['authorized'] !== false);

    let profile: UserProfile = {
      username: user.displayName || user.email || 'Authorized User',
      email: user.email || `${user.uid}@reactcloud.org`,
      token: tokenResult.token,
      uid: user.uid,
      photoURL: user.photoURL || undefined,
      providerId: tokenResult.signInProvider || user.providerData?.[0]?.providerId || 'firebase',
      emailVerified: user.emailVerified,
      role: claimRole,
      isAdmin: claimRole === 'admin',
      authorized: claimAuthorized,
      blocked: claimBlocked
    };

    // Sync with Orchestrator backend `/api/auth/session` to get latest Firestore role/flags/quotas
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData?.user) {
          profile = {
            ...profile,
            role: sessionData.user.role || profile.role,
            isAdmin: Boolean(sessionData.user.isAdmin ?? profile.isAdmin),
            authorized: Boolean(sessionData.user.authorized ?? profile.authorized),
            blocked: Boolean(sessionData.user.blocked ?? profile.blocked),
            storageUsedBytes: sessionData.user.storageUsedBytes || 0,
            securityFlags: sessionData.user.securityFlags || []
          };
        }
      } else if (response.status === 403) {
        profile.blocked = true;
        profile.authorized = false;
      }
    } catch (_) {
      // Backend might be unreachable offline; rely on verified Firebase token claims
    }

    this.saveSession(profile);
    return profile;
  }

  /**
   * 1. Google Sign-In (OAuth Popup)
   */
  public async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(this.firebaseAuth, provider);
    return this.hydrateProfileFromFirebaseUser(result.user, true);
  }

  /**
   * 2. GitHub Sign-In (OAuth Popup)
   */
  public async loginWithGithub(): Promise<UserProfile> {
    const provider = new GithubAuthProvider();
    const result = await signInWithPopup(this.firebaseAuth, provider);
    return this.hydrateProfileFromFirebaseUser(result.user, true);
  }

  /**
   * 3. Microsoft Sign-In (OAuth Popup)
   */
  public async loginWithMicrosoft(): Promise<UserProfile> {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(this.firebaseAuth, provider);
    return this.hydrateProfileFromFirebaseUser(result.user, true);
  }

  /**
   * 4. Email & Password Sign-In
   */
  public async loginWithEmailPassword(email: string, password: string): Promise<UserProfile> {
    const result = await signInWithEmailAndPassword(this.firebaseAuth, email.trim(), password);
    return this.hydrateProfileFromFirebaseUser(result.user, true);
  }

  /**
   * 5. Email & Password Account Registration (Option B Auto-Authorized Account)
   */
  public async registerWithEmailPassword(displayName: string, email: string, password: string): Promise<UserProfile> {
    const result = await createUserWithEmailAndPassword(this.firebaseAuth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    try {
      await sendEmailVerification(result.user);
    } catch (_) {}
    return this.hydrateProfileFromFirebaseUser(result.user, true);
  }

  /**
   * 6. Send Password Reset Email
   */
  public async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.firebaseAuth, email.trim());
  }

  /**
   * Local Development Sandbox Login (Only enabled in local Angular dev mode on localhost)
   */
  public loginLocalDev(
    username: string = 'Local Researcher',
    email: string = 'researcher@reactcloud.org',
    role: UserRole = 'researcher'
  ): void {
    if (!isDevMode() && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      throw new Error('Local preset login is disabled in production.');
    }
    const slug = role === 'admin' ? 'admin' : email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    const token = `reactcloud-bearer-token-${slug}`;
    const targetUid = role === 'admin' ? 'UOqk0KtFtaXma5TGsi8Seh9RMbx1' : (slug.startsWith('user_') ? slug : `user_${slug}`);
    const user: UserProfile = {
      username,
      email,
      token,
      uid: targetUid,
      providerId: 'local-dev',
      emailVerified: true,
      role,
      isAdmin: role === 'admin',
      authorized: true,
      blocked: false
    };

    this.saveSession(user);
  }

  /**
   * Switch active data scope ('personal' vs 'system') for Administrators
   */
  public setDataScope(scope: 'personal' | 'system'): void {
    if (scope === 'system' && !this.isAdmin()) {
      return;
    }
    this.activeDataScope.set(scope);
    localStorage.setItem(this.SCOPE_KEY, scope);
  }

  /**
   * Refresh current user profile & flags from Orchestrator `/api/auth/me`
   */
  public async refreshSessionProfile(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const existing = this.currentUser();
        if (existing && data?.user) {
          const updated: UserProfile = {
            ...existing,
            role: data.user.role || existing.role,
            isAdmin: Boolean(data.user.isAdmin),
            authorized: Boolean(data.user.authorized),
            blocked: Boolean(data.user.blocked),
            storageUsedBytes: data.user.storageUsedBytes || 0,
            securityFlags: data.user.securityFlags || []
          };
          this.saveSession(updated);
          return updated;
        }
      } else if (response.status === 403) {
        const existing = this.currentUser();
        if (existing) {
          const blockedProfile: UserProfile = { ...existing, blocked: true, authorized: false };
          this.saveSession(blockedProfile);
          return blockedProfile;
        }
      }
    } catch (_) {}
    return this.currentUser();
  }

  public async logout(): Promise<void> {
    try {
      await firebaseSignOut(this.firebaseAuth);
    } catch (_) {}

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SCOPE_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.activeDataScope.set('personal');
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || (this.currentUser()?.token ?? null);
  }

  private saveSession(user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    if (!user.isAdmin && this.activeDataScope() === 'system') {
      this.activeDataScope.set('personal');
      localStorage.setItem(this.SCOPE_KEY, 'personal');
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): UserProfile | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserProfile;
    } catch {
      return null;
    }
  }
}
