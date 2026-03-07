import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';

@Component({
  selector: 'app-datastore-terms',
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
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './datastore-terms.html',
  styleUrl: './datastore-terms.css',
})
export class DatastoreTermsComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  responseMessage = '';
  sanitizedMessage: SafeHtml | null = null;
  isSuccessful = false;
  termsList: any[] = [];
  displayedColumns: string[] = ['term', 'description'];
  isLoading = false;

  termsForm = this.fb.group({
    classname: ['', Validators.required],
    datatype: ['', Validators.required],
    writeToDatastore: [false]
  });

  onSubmit() {
    if (this.termsForm.valid) {
      if (this.termsForm.value.writeToDatastore) {
        const confirmed = window.confirm('Are you sure you want to generate Dictionary terms?');
        if (!confirmed) {
          return;
        }
      }

      // Zero out previous results
      this.termsList = [];
      this.responseMessage = '';
      this.sanitizedMessage = null;
      this.isSuccessful = false;

      // Move to next check cycle to prevent NG0100 on initial loading state
      setTimeout(() => {
        this.isLoading = true;
        this.cdr.markForCheck();
      }, 0);

      const body = {
        topclassname: this.termsForm.value.classname,
        datatype: this.termsForm.value.datatype
      };

      this.http.post<any>('http://localhost:8085/api/datastore/terms', body).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.isSuccessful = response["dataset:servicesuccessful"] === "true";
            this.responseMessage = response["dataset:serviceresponsemessage"];

            if (this.responseMessage) {
              this.sanitizedMessage = this.sanitizer.bypassSecurityTrustHtml(this.responseMessage);
            }

            this.termsList = response["dataset:simpcatobj"] || [];
            this.isLoading = false;

            this.cdr.markForCheck();

            this.snackBar.open(
              this.isSuccessful ? 'Terms generated successfully' : 'Generation failed',
              'Close',
              { duration: 3000 }
            );
          }, 0);
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoading = false;
            console.error('API Error:', err);
            this.responseMessage = 'Error connecting to the server.';
            this.cdr.markForCheck();
            this.snackBar.open('API Connection Error', 'Close', { duration: 3000 });
          }, 0);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
