import { Injectable, signal, inject } from '@angular/core';
import {
    Auth,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signOut,
    user,
    User
} from '@angular/fire/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  private _uid = signal<string>('Guest');
  readonly uid = this._uid.asReadonly();

  constructor() {
    // Watch for user changes and update the UID signal
    user(this.auth).pipe(takeUntilDestroyed()).subscribe(u => {
      this._uid.set(u?.uid || 'Guest');
    });
  }

  // Login with Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error logging in with Google', error);
      throw error;
    }
  }

  // Login with GitHub
  async loginWithGitHub() {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error logging in with GitHub', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error logging out', error);
    }
  }
}
