import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-json-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>JSON Visualization</h2>
    <mat-dialog-content>
      <div class="json-container">
        <pre>{{ jsonString }}</pre>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
      <button mat-raised-button color="primary" (click)="onDownload()">
        <mat-icon>download</mat-icon>
        Export to File
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .json-container {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      max-height: 500px;
      overflow-y: auto;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.9em;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `]
})
export class JsonExportDialogComponent {
  jsonString: string;

  constructor(
    public dialogRef: MatDialogRef<JsonExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.jsonString = JSON.stringify(data, null, 2);
  }

  onDownload(): void {
    const blob = new Blob([this.jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data_export.json';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
