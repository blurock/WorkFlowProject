import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { SalonDataService } from '../../services/salon-data.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './profile-editor.html',
  styleUrl: './profile-editor.scss'
})
export class ProfileEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salonService = inject(SalonDataService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  preferences: string[] = ['Lavender Scent', 'Deep Tissue'];
  userId = 'default_user'; // For now, manually set until Auth is added

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required]
  });

  ngOnInit() {
    this.salonService.getCustomerProfile(this.userId).subscribe(profile => {
      if (profile) {
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          phone: profile.phone
        });
        this.preferences = profile.preferences || [];
      }
    });
  }

  addPreference(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.preferences.push(value);
    }
    event.chipInput!.clear();
  }

  removePreference(pref: string): void {
    const index = this.preferences.indexOf(pref);
    if (index >= 0) {
      this.preferences.splice(index, 1);
    }
  }

  async onSave() {
    if (this.profileForm.valid) {
      const data = {
        ...this.profileForm.value,
        preferences: this.preferences
      };

      try {
        await this.salonService.updateCustomerProfile(this.userId, data);
        this.snackBar.open('Profile updated in Firestore successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/profile']);
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        this.snackBar.open('Failed to save to Firestore. Check console.', 'Close', { duration: 5000 });
      }
    }
  }
}
