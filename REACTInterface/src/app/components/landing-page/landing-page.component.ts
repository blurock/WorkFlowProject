import { Component, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  public authMode: 'signin' | 'register' | 'reset' = 'signin';
  public emailInput: string = '';
  public passwordInput: string = '';
  public displayNameInput: string = '';

  public activeProviderLoading: 'google' | 'github' | 'microsoft' | 'email' | null = null;
  public authError: string | null = null;
  public authSuccessMsg: string | null = null;

  // Only allow local sandbox presets when running in local dev mode on localhost
  public readonly showLocalDevSandbox: boolean = isDevMode() &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  public setAuthMode(mode: 'signin' | 'register' | 'reset'): void {
    this.authMode = mode;
    this.authError = null;
    this.authSuccessMsg = null;
  }

  public async onGoogleLogin(): Promise<void> {
    await this.runProviderLogin('google', () => this.authService.loginWithGoogle());
  }

  public async onGithubLogin(): Promise<void> {
    await this.runProviderLogin('github', () => this.authService.loginWithGithub());
  }

  public async onMicrosoftLogin(): Promise<void> {
    await this.runProviderLogin('microsoft', () => this.authService.loginWithMicrosoft());
  }

  public async onEmailSubmit(): Promise<void> {
    this.authError = null;
    this.authSuccessMsg = null;

    if (!this.emailInput.trim()) {
      this.authError = 'Please enter your email address.';
      return;
    }

    if (this.authMode === 'reset') {
      this.activeProviderLoading = 'email';
      try {
        await this.authService.resetPassword(this.emailInput);
        this.authSuccessMsg = `Password reset instructions sent to ${this.emailInput.trim()}.`;
      } catch (err: any) {
        this.authError = this.formatFirebaseError(err);
      } finally {
        this.activeProviderLoading = null;
      }
      return;
    }

    if (!this.passwordInput || this.passwordInput.length < 6) {
      this.authError = 'Password must be at least 6 characters.';
      return;
    }

    if (this.authMode === 'register') {
      await this.runProviderLogin('email', () =>
        this.authService.registerWithEmailPassword(this.displayNameInput, this.emailInput, this.passwordInput)
      );
    } else {
      await this.runProviderLogin('email', () =>
        this.authService.loginWithEmailPassword(this.emailInput, this.passwordInput)
      );
    }
  }

  private async runProviderLogin(
    provider: 'google' | 'github' | 'microsoft' | 'email',
    action: () => Promise<any>
  ): Promise<void> {
    this.activeProviderLoading = provider;
    this.authError = null;
    this.authSuccessMsg = null;
    try {
      const profile = await action();
      if (profile.blocked || profile.authorized === false) {
        this.authError = 'Your account has been restricted by an administrator.';
        return;
      }
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error(`[LandingPage] ${provider} authentication error:`, err);
      this.authError = this.formatFirebaseError(err);
    } finally {
      this.activeProviderLoading = null;
    }
  }

  public onLocalDevLogin(username: string, email: string, role: UserRole = 'researcher'): void {
    try {
      this.authService.loginLocalDev(username, email, role);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.authError = err.message;
    }
  }

  public goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private formatFirebaseError(err: any): string {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in popup was closed before completing authentication.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in provider is not yet enabled in the Firebase Console for this project.';
    }
    return err?.message || 'Authentication failed. Please try again.';
  }
}
