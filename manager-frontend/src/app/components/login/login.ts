import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  login() {
    if (this.loginForm.valid) {
      console.log('Logging in...', this.loginForm.value);
      // Traditional email login logic could go here if needed
      this.router.navigate(['/home']);
    }
  }

  async loginWithGoogle() {
    console.log('Logging in with Google...');
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Google login failed', error);
    }
  }

  async loginWithGithub() {
    console.log('Logging in with GitHub...');
    try {
      await this.authService.loginWithGitHub();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('GitHub login failed', error);
    }
  }
}
