import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  username: string;
  email: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'reactcloud_auth_token';
  private readonly USER_KEY = 'reactcloud_user';

  // Signals for reactive UI state
  public currentUser = signal<UserProfile | null>(this.getStoredUser());
  public isAuthenticated = signal<boolean>(!!this.getStoredToken());

  constructor() {}

  public login(username: string = 'REACT User', email: string = 'user@reactcloud.org'): void {
    const token = 'reactcloud-bearer-token-auth-valid-session';
    const user: UserProfile = { username, email, token };

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || (this.currentUser()?.token ?? null);
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
