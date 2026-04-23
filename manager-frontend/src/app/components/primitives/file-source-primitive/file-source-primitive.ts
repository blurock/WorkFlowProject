import { Component, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Auth } from '@angular/fire/auth';
import { BasePrimitiveComponent } from '../base-primitive';
import { TextSourceDialogComponent } from './text-source-dialog';
import { environment } from '../../../../environments/environment';
import { Ontologyconstants } from '../../constants/ontologyconstants';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-file-source-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule, 
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="file-source-container">
      <mat-form-field appearance="outline" style="width: 100%; display: block;" floatLabel="always" class="id-field" [class.filled-field]="isFilled">
        <mat-label>{{ structure.label || structure.classname }}</mat-label>
        <input matInput [ngModel]="value" (ngModelChange)="updateValue($event)" 
               [placeholder]="sourceType === 'Local' ? 'Example: /absolute/path/to/file.txt' : (structure.comment || 'File identifier/path')">
        <mat-icon matSuffix *ngIf="isFilled" class="filled-icon" matTooltip="Field is filled">check_circle</mat-icon>
        <mat-icon matSuffix *ngIf="structure.comment && !isFilled" [matTooltip]="structure.comment" class="info-icon">info</mat-icon>
        <mat-hint align="end">Source Type: {{ sourceType }}</mat-hint>
      </mat-form-field>

      <div class="button-group">
        <button mat-icon-button [matMenuTriggerFor]="sourceMenu" matTooltip="Select Source">
          <mat-icon>folder</mat-icon>
        </button>
        <button mat-icon-button (click)="onUpload()" [disabled]="!value" matTooltip="Upload to Storage">
          <mat-icon [class.uploading]="isUploading">cloud_upload</mat-icon>
        </button>
        <button mat-icon-button (click)="onView()" [disabled]="!value" matTooltip="View Content">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <mat-menu #sourceMenu="matMenu">
        <button mat-menu-item (click)="selectLocalFile()">
          <mat-icon>computer</mat-icon>
          <span>Local File System</span>
        </button>
        <button mat-menu-item (click)="selectResource()">
          <mat-icon>public</mat-icon>
          <span>Resource (URL/Cloud)</span>
        </button>
        <button mat-menu-item (click)="openTextWindow()">
          <mat-icon>article</mat-icon>
          <span>Text Window</span>
        </button>
      </mat-menu>

      <!-- Hidden file input for local files -->
      <input type="file" #fileInput style="display: none" (change)="onFileSelected($event)">
    </div>
  `,
  styles: [`
    .file-source-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .id-field {
      flex: 1;
    }
    .button-group {
      display: flex;
      padding-top: 4px;
    }
    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.38);
      cursor: help;
    }
    .filled-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
      margin-right: 4px;
    }
    .filled-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(76, 175, 80, 0.04);
    }
    button {
      color: var(--primary-color, #3f51b5);
    }
    .uploading {
      animation: pulse 1.5s infinite;
      color: #ff9800;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class FileSourceIdentifierPrimitiveComponent extends BasePrimitiveComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private fireAuth = inject(Auth);
  public ontology = new Ontologyconstants();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  sourceType: 'Local' | 'Resource' | 'Text' | 'None' = 'None';
  textValue: string = '';
  textFilename: string = '';
  selectedFile: File | null = null;
  isUploading: boolean = false;
  
  get uid(): string {
    return this.auth.uid();
  }

  selectLocalFile() {
    this.sourceType = 'Local';
    this.fileInput.nativeElement.click();
    this.cdr.markForCheck();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] as File;
    if (file) {
      this.selectedFile = file;
      console.log('File selected:', file.name);
      
      this.updateValue(file.name); 
      this.sourceType = 'Local';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.textValue = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsText(file);
      
      this.snackBar.open(`File '${file.name}' selected. Please ensure the input contains the FULL absolute path for the backend.`, 'Got it', { duration: 5000 });
      this.cdr.detectChanges();
    }
  }

  selectResource() {
    this.sourceType = 'Resource';
    this.snackBar.open('Enter the resource URL in the input field.', 'OK', { duration: 3000 });
    this.cdr.markForCheck();
  }

  openTextWindow() {
    const dialogRef = this.dialog.open(TextSourceDialogComponent, {
      width: '800px',
      data: { text: this.textValue, filename: this.textFilename || this.value }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        setTimeout(() => {
          this.sourceType = 'Text';
          this.textValue = result.text;
          this.textFilename = result.filename;
          if (this.textFilename) {
             this.value = this.textFilename;
          } else if (!this.value) {
             this.value = 'Custom Text Source';
          }
          this.cdr.detectChanges();
          this.snackBar.open('Text source content updated.', 'OK', { duration: 3000 });
        });
      }
    });
  }

  onUpload() {
    console.log('onUpload triggered. Source type:', this.sourceType);
    if (this.isUploading) return;
    
    const currentUser = this.fireAuth.currentUser;
    if (!currentUser) {
        console.warn('No user logged in - upload might fail or be restricted.');
    }

    this.isUploading = true;
    this.cdr.detectChanges();

    const baseUrl = environment.apiBaseUrl + '/api/storage';
    
    // Get token or empty string if not logged in
    const tokenPromise = currentUser ? currentUser.getIdToken() : Promise.resolve('');

    tokenPromise.then((token: string) => {
        console.log('Auth token retrieved. Starting upload...');
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        let uploadObservable;
        const currentUid = this.auth.uid();
        
        if (this.sourceType === 'Local' && this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            formData.append('uid', currentUid);
            console.log(`Uploading file ${this.selectedFile.name} to ${baseUrl}/upload-file...`);
            uploadObservable = this.http.post<any>(`${baseUrl}/upload-file`, formData, { headers });
        } else if (this.sourceType === 'Text') {
            const payload = {
                uid: currentUid,
                filename: this.textFilename || this.value || 'text_source.txt',
                content: this.textValue
            };
            console.log(`Uploading text to ${baseUrl}/upload-text...`);
            uploadObservable = this.http.post<any>(`${baseUrl}/upload-text`, payload, { headers });
        } else if (this.sourceType === 'Resource') {
            const payload = {
                uid: currentUid,
                url: this.value
            };
            console.log(`Uploading URL to ${baseUrl}/upload-url...`);
            uploadObservable = this.http.post<any>(`${baseUrl}/upload-url`, payload, { headers });
        }

        if (uploadObservable) {
            uploadObservable.subscribe({
                next: (res: any) => {
                    this.isUploading = false;
                    console.log('Upload success response:', res);
                    this.snackBar.open('Upload successful!', 'OK', { duration: 3000 });
                    
                    const catObj = res[this.ontology.catalogobject];
                    const result = Array.isArray(catObj) ? catObj[0] : (catObj || res);
                    const cloudPath = result.path || result['dataset:path'];
                    
                    if (cloudPath) {
                        console.log('Setting new value from cloud path:', cloudPath);
                        this.updateValue(cloudPath);
                        this.sourceType = 'Resource';
                    }
                    this.cdr.detectChanges();
                },
                error: (err: any) => {
                    this.isUploading = false;
                    console.error('Upload error details:', err);
                    this.snackBar.open(`Upload failed: ${err.message || 'Server error'}`, 'OK', { duration: 5000 });
                    this.cdr.detectChanges();
                }
            });
        } else {
            console.warn('No valid content/source for upload');
            this.isUploading = false;
            this.snackBar.open('No content to upload.', 'OK', { duration: 3000 });
            this.cdr.detectChanges();
        }
    }).catch((err: any) => {
        this.isUploading = false;
        console.error('Error in upload prep:', err);
        this.snackBar.open('Upload preparation failed.', 'OK', { duration: 5000 });
        this.cdr.detectChanges();
    });
  }

  onView() {
    const valStr = this.value ? this.value.toString() : '';
    
    if (this.sourceType === 'Text' || (this.sourceType === 'Local' && this.textValue)) {
      this.openTextWindow();
    } else if (this.sourceType === 'Local' && this.selectedFile) {
      const url = URL.createObjectURL(this.selectedFile);
      window.open(url, '_blank');
    } else if (valStr.startsWith('http')) {
      window.open(valStr, '_blank');
    } else {
      this.snackBar.open(`Viewing source: ${valStr} (No preview available)`, 'OK', { duration: 3000 });
    }
  }

  getData(): any {
    return {
      identifier: this.value,
      sourceType: this.sourceType,
      content: this.textValue,
      filename: this.textFilename
    };
  }

  setData(data: any): void {
    if (data && typeof data === 'object') {
      this.value = data.identifier || '';
      this.sourceType = data.sourceType || 'None';
      this.textValue = data.content || '';
      this.textFilename = data.filename || '';
    } else {
      this.value = data || '';
    }
    this.cdr.markForCheck();
  }
}
