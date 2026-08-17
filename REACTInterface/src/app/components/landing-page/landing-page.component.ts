import { Component } from '@angular/core';
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

import { AuthService } from '../../services/auth.service';

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
  public customUsername: string = '';
  public customEmail: string = '';
  public isGoogleLoading: boolean = false;
  public authError: string | null = null;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  public async onGoogleLogin(): Promise<void> {
    this.isGoogleLoading = true;
    this.authError = null;
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      this.authError = err.message || 'Google Sign-In failed. Please try again.';
    } finally {
      this.isGoogleLoading = false;
    }
  }

  public onLogin(username: string = 'REACT User', email: string = 'user_default_local@reactcloud.org'): void {
    const slug = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    const token = `reactcloud-bearer-token-${slug}`;
    this.authService.login(username, email, token);
    this.router.navigate(['/dashboard']);
  }

  public onCustomLogin(): void {
    const name = this.customUsername.trim() || 'Custom User';
    const email = this.customEmail.trim() || 'custom_user@reactcloud.org';
    const slug = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    const token = `reactcloud-bearer-token-${slug}`;
    this.authService.login(name, email, token);
    this.router.navigate(['/dashboard']);
  }

  public goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
