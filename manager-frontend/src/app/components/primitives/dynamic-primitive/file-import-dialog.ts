import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-file-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Import from Local File</h2>
    <mat-dialog-content>
      <p>Select a JSON file from your computer to load the data.</p>
      
      <div class="upload-container">
        <input type="file" #fileInput (change)="onFileSelected($event)" accept=".json" style="display: none">
        <button mat-stroked-button color="primary" (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon>
          Choose JSON File
        </button>
        <div *ngIf="selectedFileName" class="selected-file">
          Selected: <strong>{{ selectedFileName }}</strong>
        </div>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!fileData" [mat-dialog-close]="fileData">Import</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .upload-container {
      padding: 24px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      text-align: center;
      margin: 16px 0;
    }
    .selected-file {
      margin-top: 12px;
      font-size: 0.9em;
      color: #1a73e8;
    }
    .error-message {
      color: #d32f2f;
      margin-top: 8px;
      font-size: 0.9em;
    }
  `]
})
export class FileImportDialogComponent {
  selectedFileName: string | null = null;
  fileData: any = null;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<FileImportDialogComponent>,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.errorMessage = null;
      this.fileData = null;
      this.cdr.detectChanges();
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          this.fileData = JSON.parse(e.target.result);
          this.errorMessage = null;
        } catch (err) {
          this.errorMessage = "Failed to parse JSON file.";
          this.fileData = null;
        }
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        this.errorMessage = "Failed to read file.";
        this.fileData = null;
        this.cdr.detectChanges();
      };
      reader.readAsText(file);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
