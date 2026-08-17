import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';

export interface UserProfile {
  username: string;
  email: string;
  token: string;
  uid?: string;
  photoURL?: string;
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

  private firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  private firebaseAuth = getAuth(this.firebaseApp);

  // Signals for reactive UI state
  public currentUser = signal<UserProfile | null>(this.getStoredUser());
  public isAuthenticated = signal<boolean>(!!this.getStoredToken());

  constructor() {}

  /**
   * Authenticate with Google Sign-In (Firebase Popup)
   * Uses real Google UID and fetches signed Firebase ID Token
   */
  public async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const user: User = result.user;
      const idToken = await user.getIdToken(/* forceRefresh */ true);

      const profile: UserProfile = {
        username: user.displayName || user.email || 'Google User',
        email: user.email || 'user@reactcloud.org',
        token: idToken,
        uid: user.uid,
        photoURL: user.photoURL || undefined
      };

      this.saveSession(profile);
      console.log('[AuthService] Logged in with Google. Google UID:', user.uid);
      return profile;
    } catch (err: any) {
      console.error('[AuthService] Google Sign-In error:', err);
      throw err;
    }
  }

  /**
   * Perform user authentication login session (Local / Dev fallback)
   */
  public login(
    username: string = 'REACT User',
    email: string = 'user_default_local@reactcloud.org',
    customToken?: string
  ): void {
    const slug = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    const token = customToken || `reactcloud-bearer-token-${slug}`;
    const user: UserProfile = {
      username,
      email,
      token,
      uid: slug.startsWith('user_') ? slug : `user_${slug}`
    };

    this.saveSession(user);
  }

  public async logout(): Promise<void> {
    try {
      await firebaseSignOut(this.firebaseAuth);
    } catch (e) {
      // Ignore if local dev session
    }

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || (this.currentUser()?.token ?? null);
  }

  private saveSession(user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
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
