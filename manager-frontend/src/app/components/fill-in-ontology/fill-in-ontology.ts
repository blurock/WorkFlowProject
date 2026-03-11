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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
    selector: 'app-fill-in-ontology',
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
        MatSnackBarModule,
        MatListModule,
        MatDividerModule,
        MatChipsModule
    ],
    templateUrl: './fill-in-ontology.html',
    styleUrl: './fill-in-ontology.css',
})
export class FillInOntologyComponent {
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private snackBar = inject(MatSnackBar);

    isLoading = false;
    assignedProperties: { key: string, value: string }[] = [];
    unassignedProperties: string[] = [];
    errorMessage = '';

    fillInForm = this.fb.group({
        prompt: ['', Validators.required],
        classname: ['dataset:ActivityRepositoryInitialReadLocalFile', Validators.required],
        datatype: ['thermodynamics', Validators.required],
    });

    onFillIn() {
        if (!this.fillInForm.valid) return;

        this.isLoading = true;
        this.assignedProperties = [];
        this.unassignedProperties = [];
        this.errorMessage = '';
        this.cdr.markForCheck();

        const body = {
            prompt: this.fillInForm.value.prompt,
            classname: this.fillInForm.value.classname,
            datatype: this.fillInForm.value.datatype,
        };

        this.http.post<any>(`${environment.apiBaseUrl}/api/datastore/fill-in-object`, body).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response['dataset:servicesuccessful'] === 'true') {
                    const raw = response['dataset:simpcatobj'];

                    // Map assigned properties
                    if (raw.assignedProperties) {
                        this.assignedProperties = Object.keys(raw.assignedProperties).map(key => ({
                            key: key,
                            value: raw.assignedProperties[key]
                        }));
                    }

                    // Map unassigned properties
                    if (raw.unassignedProperties) {
                        this.unassignedProperties = raw.unassignedProperties;
                    }

                    this.snackBar.open('Extraction successful!', 'Close', { duration: 3000 });
                } else {
                    this.errorMessage = response['dataset:serviceresponsemessage'] || 'Extraction failed.';
                    this.snackBar.open('Error: ' + this.errorMessage, 'Close', { duration: 5000 });
                }
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.isLoading = false;
                console.error('FillIn Error:', err);
                this.errorMessage = 'Connection error – check the backend.';
                this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
                this.cdr.markForCheck();
            }
        });
    }

    clearAll() {
        this.assignedProperties = [];
        this.unassignedProperties = [];
        this.errorMessage = '';
        this.fillInForm.reset({
            classname: 'dataset:ActivityRepositoryInitialReadLocalFile',
            datatype: 'thermodynamics',
            prompt: ''
        });
    }

    goBack() {
        this.router.navigate(['/home']);
    }
}
