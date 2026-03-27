import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OntologyStructure } from '../base-primitive';
import { DynamicPrimitiveComponent } from './dynamic-primitive';
import { FileImportDialogComponent } from './file-import-dialog';
import { JsonExportDialogComponent } from './json-export-dialog';

@Component({
  selector: 'app-primitive-file-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    DynamicPrimitiveComponent
  ],
  template: `
    <div class="wrapper-container">
      <div class="actions-header">
        <div class="title-section">
          <span class="label" *ngIf="structure">{{ structure.label }}</span>
        </div>
        <div class="button-group">
          <button mat-icon-button color="primary" (click)="importFromFile()" matTooltip="Import from local file">
            <mat-icon>file_upload</mat-icon>
          </button>
          <button mat-icon-button color="accent" (click)="visualizeJson()" matTooltip="Visualize and export JSON">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="component-body">
        <app-dynamic-primitive 
          [structure]="structure" 
          [value]="value" 
          (valueChange)="onValueChange($event)">
        </app-dynamic-primitive>
      </div>
    </div>
  `,
  styles: [`
    .wrapper-container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 24px;
      background: #fafafa;
      width: 100%;
    }
    .actions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #eee;
      background: #fff;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .title-section {
      font-weight: 500;
      color: #555;
    }
    .button-group {
      display: flex;
      gap: 4px;
    }
    .component-body {
      padding: 16px;
    }
    .label {
      font-size: 1.1em;
      color: #1a73e8;
    }
  `]
})
export class PrimitiveFileWrapperComponent implements OnInit {
  @Input() structure!: OntologyStructure;
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  onValueChange(newValue: any) {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  importFromFile() {
    const dialogRef = this.dialog.open(FileImportDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.value = result;
        this.valueChange.emit(this.value);
      }
    });
  }

  visualizeJson() {
    this.dialog.open(JsonExportDialogComponent, {
      width: '600px',
      data: this.value
    });
  }
}
