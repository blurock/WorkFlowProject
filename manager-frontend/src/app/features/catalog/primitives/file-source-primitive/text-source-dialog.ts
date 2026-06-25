import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-text-source-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Text Source</h2>
    <mat-dialog-content>
      <p>Enter a filename and paste the content of your source below.</p>
      
      <mat-form-field appearance="outline" style="width: 100%">
        <mat-label>Filename</mat-label>
        <input matInput [(ngModel)]="data.filename" placeholder="e.g. data.txt">
      </mat-form-field>

      <mat-form-field appearance="outline" style="width: 100%">
        <mat-label>Source Content</mat-label>
        <textarea matInput [(ngModel)]="data.text" rows="15" placeholder="Paste text here..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data">Save Content</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
    }
  `]
})
export class TextSourceDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TextSourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { text: string, filename?: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }
}
