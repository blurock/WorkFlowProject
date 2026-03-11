import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-term-extraction',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatProgressBarModule,
        MatTooltipModule,
    ],
    templateUrl: './term-extraction.html',
    styleUrl: './term-extraction.css',
})
export class TermExtractionComponent {
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    isLoading = false;
    results: any[] = [];
    matchedTerms: any[] = [];
    candidateTerms: any[] = [];
    displayedColumns = ['score', 'term', 'value', 'description', 'document'];
    statusMessage = '';
    errorMessage = '';
    expandedRow: any = null;

    extractionForm = this.fb.group({
        prompt: ['', Validators.required],
        termSet: ['', Validators.required],
        maxResults: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
    });

    onExtract() {
        if (!this.extractionForm.valid) return;

        this.isLoading = true;
        this.results = [];
        this.errorMessage = '';
        this.statusMessage = '';
        this.cdr.markForCheck();

        const body = {
            prompt: this.extractionForm.value.prompt,
            termSet: this.extractionForm.value.termSet,
            maxResults: this.extractionForm.value.maxResults,
        };

        this.http.post<any>(`${environment.apiBaseUrl}/api/termextraction/extract`, body).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response['dataset:servicesuccessful'] === 'true') {
                    const raw = response['dataset:simpcatobj'];
                    this.results = Array.isArray(raw) ? raw : (raw ? [raw] : []);
                    this.matchedTerms = this.results.filter(t => t.value && t.value.trim() !== '');
                    this.candidateTerms = this.results.filter(t => !t.value || t.value.trim() === '');
                    this.statusMessage = response['dataset:serviceresponsemessage'] || '';
                } else {
                    this.errorMessage = response['dataset:serviceresponsemessage'] || 'Extraction failed.';
                }
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.isLoading = false;
                console.error('TermExtraction Error:', err);
                this.errorMessage = 'Connection error – check the backend.';
                this.cdr.markForCheck();
            }
        });
    }

    clearResults() {
        this.results = [];
        this.matchedTerms = [];
        this.candidateTerms = [];
        this.statusMessage = '';
        this.errorMessage = '';
        this.expandedRow = null;
    }

    toggleDocument(row: any) {
        if (this.expandedRow === row) {
            this.expandedRow = null;
            row._expanded = false;
        } else {
            if (this.expandedRow) this.expandedRow._expanded = false;
            this.expandedRow = row;
            row._expanded = true;
        }
    }

    goBack() {
        this.router.navigate(['/home']);
    }
}
