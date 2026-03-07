import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

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

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  login() {
    if (this.loginForm.valid) {
      console.log('Logging in...', this.loginForm.value);
      this.router.navigate(['/home']);
    }
  }

  loginWithGoogle() {
    console.log('Logging in with Google...');
    // Real implementation will follow after adding Firebase
    this.router.navigate(['/home']);
  }

  loginWithGithub() {
    console.log('Logging in with Github...');
    // Real implementation will follow after adding Firebase
    this.router.navigate(['/home']);
  }
}
