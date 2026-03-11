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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

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
    MatCheckboxModule,
    MatProgressBarModule,
    MatSelectModule
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
  isSearchLoading = false;
  testSearchResult: string | null = null;
  testSearchTopResult: any = null;
  testSearchChoices: any[] = [];

  termsForm = this.fb.group({
    classname: ['', Validators.required],
    datatype: ['', Validators.required],
    source: ['terms', Validators.required],
    writeToDatastore: [false],
    clearFirestore: [false]
  });

  testSearchForm = this.fb.group({
    query: ['', Validators.required],
    datatype: ['', Validators.required]
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
        datatype: this.termsForm.value.datatype,
        source: this.termsForm.value.source,
        writetodatastore: this.termsForm.value.writeToDatastore,
        clearfirestore: this.termsForm.value.clearFirestore
      };

      this.http.post<any>(`${environment.apiBaseUrl}/api/datastore/terms`, body).subscribe({
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

  onTestSearch() {
    if (this.testSearchForm.valid) {
      this.isSearchLoading = true;
      this.testSearchResult = null;
      this.testSearchTopResult = null;
      this.testSearchChoices = [];
      this.cdr.markForCheck();

      const body = {
        query: this.testSearchForm.value.query,
        datatype: this.testSearchForm.value.datatype
      };

      this.http.post<any>(`${environment.apiBaseUrl}/api/datastore/test-search`, body).subscribe({
        next: (response) => {
          this.isSearchLoading = false;
          if (response["dataset:servicesuccessful"] === "true") {
            const simpcatobj = response["dataset:simpcatobj"];
            this.testSearchResult = simpcatobj ? simpcatobj.searchResult : "No result returned in object.";
            this.testSearchTopResult = (simpcatobj && simpcatobj.topResult) ? simpcatobj.topResult : null;
            this.testSearchChoices = (simpcatobj && simpcatobj.choices) ? simpcatobj.choices : [];
          } else {
            this.testSearchResult = "Error: " + response["dataset:serviceresponsemessage"];
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSearchLoading = false;
          console.error('Search API Error:', err);
          this.testSearchResult = "Connection error to search endpoint.";
          this.cdr.markForCheck();
        }
      });
    }
  }

  onListTerms() {
    const datatype = this.testSearchForm.value.datatype;
    if (datatype) {
      this.isSearchLoading = true;
      this.termsList = []; // Clear current list
      this.cdr.markForCheck();

      const body = { datatype };

      this.http.post<any>(`${environment.apiBaseUrl}/api/datastore/list-terms`, body).subscribe({
        next: (response) => {
          this.isSearchLoading = false;
          if (response["dataset:servicesuccessful"] === "true") {
            this.termsList = response["dataset:simpcatobj"] || [];
            this.snackBar.open(`Fetched ${this.termsList.length} terms for ${datatype}`, 'Close', { duration: 3000 });
          } else {
            this.snackBar.open('Error: ' + response["dataset:serviceresponsemessage"], 'Close', { duration: 3000 });
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSearchLoading = false;
          console.error('List Terms API Error:', err);
          this.snackBar.open('Connection error to list endpoint.', 'Close', { duration: 3000 });
          this.cdr.markForCheck();
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  showTermDetails(element: any) {
    const id = element.id || 'N/A';
    const dataType = element.metadata?.datatype;
    const dataTypeStr = Array.isArray(dataType) ? dataType.join(', ') : (dataType || 'N/A');

    this.snackBar.open(`ID: ${id} | Datatype: ${dataTypeStr}`, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['metadata-snackbar']
    });
  }
}
