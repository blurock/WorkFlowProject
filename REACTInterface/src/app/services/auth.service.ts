import { Injectable, signal, computed, isDevMode, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  private router = inject(Router);

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

  // Session Expiration & Timeout Signals
  public tokenExpiryMs = signal<number | null>(this.parseJwtExpiry(this.getStoredToken()));
  public nowMs = signal<number>(Date.now());
  public showTimeoutDialog = signal<boolean>(false);
  public timeoutDialogType = signal<'warning' | 'expired'>('warning');
  public timeoutDialogMessage = signal<string>('');
  public isExtendingSession = signal<boolean>(false);
  private dismissedWarningForExpiry = signal<number | null>(null);

  public secondsRemaining = computed<number | null>(() => {
    const expiry = this.tokenExpiryMs();
    if (expiry === null) return null;
    const diffMs = expiry - this.nowMs();
    return Math.max(0, Math.floor(diffMs / 1000));
  });

  public isSessionExpiringSoon = computed<boolean>(() => {
    if (!this.isAuthenticated()) return false;
    const remaining = this.secondsRemaining();
    if (remaining === null) return false;
    return remaining <= 300 && remaining > 0; // 5 minutes or less
  });

  public isSessionExpired = computed<boolean>(() => {
    if (!this.isAuthenticated()) return false;
    const remaining = this.secondsRemaining();
    if (remaining === null) return false;
    return remaining === 0;
  });

  public formattedTimeRemaining = computed<string>(() => {
    const remaining = this.secondsRemaining();
    if (remaining === null) {
      return 'Active';
    }
    if (remaining <= 0) {
      return 'Expired';
    }
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
    }
    return `${seconds}s`;
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
        const currentToken = this.getToken();
        if (currentToken && currentToken.includes('.')) {
          // Stored token was a Firebase JWT, but user signed out: clear session
          this.tokenExpiryMs.set(null);
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          localStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem(this.USER_KEY);
        }
      }
    });

    // 1-second interval to track token expiration, trigger proactive refresh, and warn user
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.nowMs.set(Date.now());
        if (!this.isAuthenticated()) return;

        const remaining = this.secondsRemaining();
        if (remaining === null) return;

        // Proactively refresh ID token in background when between 5 and 10 minutes left
        if (remaining <= 600 && remaining > 300 && !this.isExtendingSession()) {
          this.refreshIdToken().catch(() => {});
        }

        // Show warning modal when 5 minutes or less remain
        if (remaining <= 300 && remaining > 0) {
          const currentExpiry = this.tokenExpiryMs();
          if (!this.showTimeoutDialog() && this.dismissedWarningForExpiry() !== currentExpiry) {
            this.timeoutDialogType.set('warning');
            this.timeoutDialogMessage.set(
              'Your authentication credentials will expire in less than 5 minutes. Would you like to extend your session?'
            );
            this.showTimeoutDialog.set(true);
          }
        }

        // Show expired modal when 0 seconds remain
        if (remaining === 0) {
          if (!this.showTimeoutDialog() || this.timeoutDialogType() !== 'expired') {
            this.timeoutDialogType.set('expired');
            this.timeoutDialogMessage.set(
              'Your authentication session has expired. Please sign in again to continue accessing REACTCLOUD.'
            );
            this.showTimeoutDialog.set(true);
          }
        }
      }, 1000);
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
      this.tokenExpiryMs.set(this.parseJwtExpiry(freshToken));
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

    this.tokenExpiryMs.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.showTimeoutDialog.set(false);
    this.activeDataScope.set('personal');
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || (this.currentUser()?.token ?? null);
  }

  /**
   * Proactively extends the authentication session by forcing an ID token refresh.
   */
  public async extendSession(): Promise<boolean> {
    this.isExtendingSession.set(true);
    try {
      const fresh = await this.refreshIdToken();
      this.isExtendingSession.set(false);
      if (fresh) {
        const newExpiry = this.parseJwtExpiry(fresh);
        this.tokenExpiryMs.set(newExpiry);
        this.showTimeoutDialog.set(false);
        return true;
      } else {
        this.triggerSessionExpired('Unable to refresh session. Please sign in again.');
        return false;
      }
    } catch (err) {
      this.isExtendingSession.set(false);
      this.triggerSessionExpired('Unable to refresh session. Please sign in again.');
      return false;
    }
  }

  /**
   * Triggers the session expired dialog with a clear notification message.
   */
  public triggerSessionExpired(message?: string): void {
    this.timeoutDialogType.set('expired');
    this.timeoutDialogMessage.set(
      message || 'Your authentication session has expired. Please sign in again to continue accessing REACTCLOUD.'
    );
    this.showTimeoutDialog.set(true);
  }

  /**
   * Closes the warning dialog without extending (user can extend manually later).
   */
  public dismissTimeoutDialog(): void {
    this.dismissedWarningForExpiry.set(this.tokenExpiryMs());
    this.showTimeoutDialog.set(false);
  }

  /**
   * Manually opens the session management dialog from the top toolbar chip.
   */
  public openSessionDialog(): void {
    if (this.isSessionExpired()) {
      this.timeoutDialogType.set('expired');
      this.timeoutDialogMessage.set(
        'Your authentication session has expired. Please sign in again to continue accessing REACTCLOUD.'
      );
    } else {
      this.timeoutDialogType.set('warning');
      this.timeoutDialogMessage.set(
        `Your current authentication session expires in ${this.formattedTimeRemaining()}. You can extend it now to keep working uninterrupted.`
      );
    }
    this.showTimeoutDialog.set(true);
  }

  /**
   * Prompts re-authentication by clearing credentials and redirecting to the landing page.
   */
  public promptReauth(): void {
    this.logout();
    this.showTimeoutDialog.set(false);
    try {
      this.router.navigate(['/landing']);
    } catch (_) {
      if (typeof window !== 'undefined') {
        window.location.href = '/landing';
      }
    }
  }

  /**
   * Extracts the expiration timestamp in ms from a JWT ID token.
   */
  public parseJwtExpiry(token: string | null): number | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      if (parsed && typeof parsed.exp === 'number') {
        return parsed.exp * 1000;
      }
      return null;
    } catch {
      return null;
    }
  }

  private saveSession(user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.tokenExpiryMs.set(this.parseJwtExpiry(user.token));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.showTimeoutDialog.set(false);
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
