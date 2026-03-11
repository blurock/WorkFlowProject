import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-extract-description',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './extract-description.html',
  styleUrl: './extract-description.css'
})
export class ExtractDescriptionComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  extractionResult: any = null;

  extractForm = this.fb.group({
    prompt: ['', Validators.required],
    datatype: ['catalogobjects', Validators.required]
  });

  onSubmit() {
    if (this.extractForm.valid) {
      this.isLoading = true;
      this.extractionResult = null;
      this.cdr.markForCheck();

      const body = {
        prompt: this.extractForm.value.prompt,
        datatype: this.extractForm.value.datatype
      };

      this.http.post<any>(`${environment.apiBaseUrl}/api/datastore/extract-description`, body).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response["dataset:servicesuccessful"] === "true") {
            this.extractionResult = response["dataset:simpcatobj"];
            this.snackBar.open('Extraction successful', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open('Extraction failed: ' + response["dataset:serviceresponsemessage"], 'Close', { duration: 5000 });
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('API Error:', err);
          this.snackBar.open('API Connection Error', 'Close', { duration: 3000 });
          this.cdr.markForCheck();
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
