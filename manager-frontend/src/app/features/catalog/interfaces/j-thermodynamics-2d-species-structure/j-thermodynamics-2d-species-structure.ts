import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BasePrimitiveComponent } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

@Component({
  selector: 'app-j-thermodynamics-2d-species-structure',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="metadata-container">
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">blur_on</mat-icon>
          <span class="one-line-summary-badge badge-gray">2D Structure</span>
          <span class="one-line-summary-title" *ngIf="structureName && structureName !== 'not assigned'">
            {{ structureName }}
            <span class="formula-span" *ngIf="isomerName && isomerName !== 'not assigned'">
              ({{ isomerName }})
            </span>
          </span>
          <span class="one-line-summary-placeholder" *ngIf="!structureName || structureName === 'not assigned'">
            No Structure Name
            <span class="formula-span" *ngIf="isomerName && isomerName !== 'not assigned'">
              ({{ isomerName }})
            </span>
          </span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">blur_on</mat-icon>
            <span>2D Species Structure Details</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>
        
        <mat-divider style="margin-bottom: 12px;"></mat-divider>
        
        <div class="grid-section metadata-section" *ngIf="loading">
          <div class="loading-msg">Loading UI template...</div>
        </div>

        <div class="grid-section metadata-section" *ngIf="!loading">
          <!-- Structure identification fields -->
          <div class="fields-grid-2col">
            <div class="form-field-container">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Structure Name</mat-label>
                <input matInput [(ngModel)]="structureName" (ngModelChange)="onFieldsChange()" placeholder="e.g. Ethanol" />
              </mat-form-field>
            </div>
            <div class="form-field-container">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Isomer Name (Formula)</mat-label>
                <input matInput [(ngModel)]="isomerName" (ngModelChange)="onFieldsChange()" placeholder="e.g. C2H6O" />
              </mat-form-field>
            </div>
          </div>

          <!-- CML String text area -->
          <div class="form-field-container cml-textarea-container" style="margin-top: 12px;">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Structure as CML (String)</mat-label>
              <textarea matInput [(ngModel)]="structureCML" (ngModelChange)="onFieldsChange()" rows="6" placeholder="<molecule>...</molecule>"></textarea>
            </mat-form-field>
          </div>

          <!-- Atom Count Set Section (Nested Card) -->
          <mat-card class="summary-section-card mat-elevation-z1" style="margin-top: 16px; overflow: visible;">
            <mat-card-header class="summary-section-card-header">
              <mat-icon color="accent" style="margin-right: 8px;">analytics</mat-icon>
              <mat-card-title class="summary-section-card-title">Atom Count Set</mat-card-title>
            </mat-card-header>
            <mat-card-content class="summary-section-card-content" style="padding-top: 12px;">
              <!-- 3-column Counts Grid -->
              <div class="fields-grid-3col">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Carbon Count</mat-label>
                  <input matInput [(ngModel)]="carbonCount" (ngModelChange)="onFieldsChange()" placeholder="0" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Hydrogen Count</mat-label>
                  <input matInput [(ngModel)]="hydrogenCount" (ngModelChange)="onFieldsChange()" placeholder="0" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Oxygen Count</mat-label>
                  <input matInput [(ngModel)]="oxygenCount" (ngModelChange)="onFieldsChange()" placeholder="0" />
                </mat-form-field>
              </div>

              <!-- Other Atoms counts array -->
              <div class="atom-table-container" style="margin-top: 16px;">
                <div class="table-wrapper">
                  <table class="atom-matrix-table">
                    <thead>
                      <tr>
                        <th>Atom Type / Label</th>
                        <th>Count</th>
                        <th class="actions-col">
                          <button mat-icon-button color="primary" (click)="addAtomCountRow()" type="button" matTooltip="Add Atom Count" style="width: 32px; height: 32px; line-height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                            <mat-icon style="font-size: 20px; width: 20px; height: 20px; margin: 0;">add</mat-icon>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let atom of atomCounts; let i = index">
                        <td>
                          <input type="text" class="cell-input" [(ngModel)]="atom['dataset:twodmollabel']" (ngModelChange)="onFieldsChange()" placeholder="e.g. N, S, P" />
                        </td>
                        <td>
                          <input type="text" class="cell-input" [(ngModel)]="atom['dataset:atomtypecnt']" (ngModelChange)="onFieldsChange()" placeholder="e.g. 1, 2" />
                        </td>
                        <td class="actions-col">
                          <button mat-icon-button color="warn" (click)="deleteAtomCountRow(i)" type="button" matTooltip="Remove this atom count" style="width: 32px; height: 32px; line-height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin: 0;">delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                      <tr *ngIf="atomCounts.length === 0">
                        <td colspan="3" class="empty-table-msg">
                          No additional atom counts defined.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100% !important;
    }
    .metadata-container {
      width: 100%;
      box-sizing: border-box;
    }
    .fields-grid-2col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      width: 100%;
    }
    .fields-grid-3col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      width: 100%;
    }
    .full-width {
      width: 100%;
    }
    .formula-span {
      font-family: 'Roboto Mono', monospace;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #475569;
      margin-left: 6px;
      font-weight: normal;
    }
    .table-wrapper {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      overflow: hidden;
    }
    .atom-matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .atom-matrix-table th {
      padding: 8px 12px;
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #e2e8f0;
    }
    .atom-matrix-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .cell-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #1e293b;
      box-sizing: border-box;
    }
    .cell-input:focus {
      border-color: #3b82f6;
      outline: none;
    }
    .actions-col {
      width: 40px;
      text-align: center;
      padding: 2px !important;
    }
    .empty-table-msg {
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      font-size: 0.8rem;
      padding: 16px !important;
    }
    .loading-msg {
      padding: 20px;
      color: #64748b;
      text-align: center;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class JThermodynamics2DSpeciesStructureComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  expanded = false;
  loading = false;

  structureName = '';
  isomerName = '';
  structureCML = '';
  carbonCount = '';
  hydrogenCount = '';
  oxygenCount = '';
  atomCounts: any[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    this.extractFields();

    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:JThermodynamics2DSpeciesStructure';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[JThermodynamics2DSpeciesStructureComponent] Failed to load template for class: ' + cls, err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  override get value(): any {
    return this._value;
  }

  override set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.extractFields();
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  private extractFields(): void {
    const val = this.value || {};
    this.structureName = val['dataset:structurename'] || '';
    this.isomerName = val['dataset:isomername'] || '';
    this.structureCML = val['dataset:structureascmlstring'] || '';
    
    const countSet = val['dataset:atomcountset'] || {};
    this.carbonCount = countSet['dataset:carboncount'] || '';
    this.hydrogenCount = countSet['dataset:hydrogencount'] || '';
    this.oxygenCount = countSet['dataset:oxygencount'] || '';
    
    const countArr = countSet['dataset:atomcount'];
    if (Array.isArray(countArr)) {
      this.atomCounts = countArr.map(item => ({ ...item }));
    } else if (countArr && typeof countArr === 'object') {
      this.atomCounts = [{ ...countArr }];
    } else {
      this.atomCounts = [];
    }
  }

  onFieldsChange(): void {
    if (!this.value) {
      this.value = {};
    }
    
    this.value['dataset:structurename'] = this.structureName || 'not assigned';
    this.value['dataset:isomername'] = this.isomerName || 'not assigned';
    this.value['dataset:structureascmlstring'] = this.structureCML || 'not assigned';
    
    if (!this.value['dataset:atomcountset'] || typeof this.value['dataset:atomcountset'] !== 'object') {
      this.value['dataset:atomcountset'] = {};
    }
    
    const countSet = this.value['dataset:atomcountset'];
    countSet['dataset:carboncount'] = this.carbonCount || 'not assigned';
    countSet['dataset:hydrogencount'] = this.hydrogenCount || 'not assigned';
    countSet['dataset:oxygencount'] = this.oxygenCount || 'not assigned';
    countSet['dataset:atomcount'] = this.atomCounts;
    
    this.updateValue(this.value);
    this.cdr.detectChanges();
  }

  addAtomCountRow(): void {
    this.atomCounts.push({
      'dataset:twodmollabel': '',
      'dataset:atomtypecnt': '1',
      '<http://purl.org/dc/elements/1.1/identifier>': 'dataset:atomcount'
    });
    this.onFieldsChange();
  }

  deleteAtomCountRow(index: number): void {
    this.atomCounts.splice(index, 1);
    this.onFieldsChange();
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || {};
  }
}
