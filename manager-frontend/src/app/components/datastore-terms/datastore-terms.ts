import { Component, inject, SecurityContext, ChangeDetectorRef } from '@angular/core';
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
    MatTableModule
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

  termsForm = this.fb.group({
    classname: ['', Validators.required],
    datatype: ['', Validators.required]
  });

  onSubmit() {
    if (this.termsForm.valid) {
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
              // If it's a full HTML document, the browser will ignore the outer tags in innerHTML
              this.sanitizedMessage = this.sanitizer.bypassSecurityTrustHtml(this.responseMessage);
            }

            this.termsList = response["dataset:simpcatobj"] || [];

            this.cdr.detectChanges();

            this.snackBar.open(
              this.isSuccessful ? 'Terms generated successfully' : 'Generation failed',
              'Close',
              { duration: 3000 }
            );
          });
        },
        error: (err) => {
          console.error('API Error:', err);
          this.responseMessage = 'Error connecting to the server.';
          this.snackBar.open('API Connection Error', 'Close', { duration: 3000 });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
