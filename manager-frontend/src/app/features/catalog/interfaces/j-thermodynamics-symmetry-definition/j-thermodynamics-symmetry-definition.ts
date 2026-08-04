import { Component, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

@Component({
  selector: 'app-j-thermodynamics-symmetry-definition',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="metadata-container">
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">hub</mat-icon>
          <span class="one-line-summary-badge badge-blue">Symmetry Definition</span>
          <span class="one-line-summary-title">
            {{ value?.['dataset:symmetrydefinitionlabel'] || 'No Label' }} [Factor: {{ value?.['dataset:structuresymmetryfactor'] ?? 'N/A' }}]
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
            <mat-icon color="primary">hub</mat-icon>
            <span>Symmetry Definition Details</span>
            <span class="one-line-summary-badge badge-blue" style="margin-left: 8px;">
              {{ value?.['dataset:symmetrydefinitionlabel'] || 'No Label' }}
            </span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div class="grid-section metadata-section">
          <div *ngIf="loading" class="loading-template-msg">
            Loading metadata template...
          </div>

          <div *ngIf="!loading">
            <!-- Render specific parameters -->
            <div class="properties-grid">
              <div class="prop-cell-2col">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:symmetrydefinitionlabel')"
                  [value]="value ? value['dataset:symmetrydefinitionlabel'] : null"
                  (valueChange)="updateProperty('dataset:symmetrydefinitionlabel', $event)">
                </app-dynamic-primitive>
              </div>
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:structuresymmetryfactor')"
                  [value]="value ? value['dataset:structuresymmetryfactor'] : null"
                  (valueChange)="updateProperty('dataset:structuresymmetryfactor', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <div class="properties-row-1col" style="margin-top: 8px;">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:structuresymmetrytype')"
                [value]="value ? value['dataset:structuresymmetrytype'] : null"
                (valueChange)="updateProperty('dataset:structuresymmetrytype', $event)">
              </app-dynamic-primitive>
            </div>
            <!-- Node Group Definition Matrix -->
            <div class="matrix-section" style="margin-top: 16px;">
              <h4 class="section-title">Node Group Definitions</h4>
              <div class="table-wrapper">
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th>Node Label</th>
                      <th>Group Label</th>
                      <th>Definition Type</th>
                      <th class="actions-col">
                        <button mat-icon-button color="primary" (click)="addNodeGroup()" type="button" matTooltip="Add Node Group Definition">
                          <mat-icon>add</mat-icon>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let node of nodeGroupDefinitions; let i = index" class="matrix-row">
                      <td>
                        <input 
                          type="text" 
                          class="cell-input" 
                          [(ngModel)]="node['dataset:symnodelabel']" 
                          (ngModelChange)="onMatrixChange()"
                          placeholder="e.g., 0"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          class="cell-input" 
                          [(ngModel)]="node['dataset:symgrouplabel']" 
                          (ngModelChange)="onMatrixChange()"
                          placeholder="e.g., a1"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          class="cell-input" 
                          [(ngModel)]="node['dataset:symdefinitiontype']" 
                          (ngModelChange)="onMatrixChange()"
                          placeholder="e.g., dataset:SymmetryNodeType3"
                        />
                      </td>
                      <td class="actions-col">
                        <button mat-icon-button color="warn" (click)="deleteNodeGroup(i)" type="button" matTooltip="Remove node group definition">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="nodeGroupDefinitions.length === 0">
                      <td colspan="4" class="empty-matrix-msg">
                        No node groups defined. Click the "+" button in the table header to start.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .properties-grid {
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 12px;
      width: 100%;
    }
    .prop-cell-2col {
      min-width: 0;
    }
    .prop-cell {
      min-width: 0;
    }
    .properties-row-1col {
      width: 100%;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .matrix-table th {
      padding: 10px 14px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #e2e8f0;
    }
    .matrix-table td {
      padding: 8px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .matrix-row:hover {
      background-color: #f8fafc;
    }
    .cell-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #1e293b;
      background-color: #fff;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .cell-input:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .actions-col {
      width: 50px;
      text-align: center;
      padding: 4px !important;
    }
    .empty-matrix-msg {
      text-align: center;
      color: #64748b;
      font-style: italic;
      font-size: 0.85rem;
      padding: 24px !important;
    }
    .loading-template-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding: 10px;
    }
    :host {
      display: block;
      width: 100% !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class JThermodynamicsSymmetryDefinitionComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  expanded = false;
  loading = false;
  nodeGroupDefinitions: any[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    this.extractNodeGroups();

    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:JThermodynamicsSymmetryDefinition';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[JThermodynamicsSymmetryDefinitionComponent] Failed to load template for class: ' + cls, err);
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
      this.extractNodeGroups();
    }
  }

  private extractNodeGroups(): void {
    const val = this.value?.['dataset:nodegroupdefinition'];
    if (Array.isArray(val)) {
      this.nodeGroupDefinitions = val;
    } else if (val && typeof val === 'object') {
      this.nodeGroupDefinitions = [val];
      this.value['dataset:nodegroupdefinition'] = this.nodeGroupDefinitions;
    } else {
      this.nodeGroupDefinitions = [];
      if (this.value) {
        this.value['dataset:nodegroupdefinition'] = this.nodeGroupDefinitions;
      }
    }
    this.cdr.detectChanges();
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      this.updateValue({
        ...this.value,
        [key]: newValue
      });
      this.cdr.detectChanges();
    }
  }

  addNodeGroup(): void {
    this.nodeGroupDefinitions.push({
      'dataset:symnodelabel': 0,
      'dataset:symgrouplabel': '',
      'dataset:symdefinitiontype': 'dataset:SymmetryNodeType3',
      '<http://purl.org/dc/elements/1.1/identifier>': 'dataset:nodegroupdefinition'
    });
    this.onMatrixChange();
  }

  deleteNodeGroup(index: number): void {
    this.nodeGroupDefinitions.splice(index, 1);
    this.onMatrixChange();
  }

  onMatrixChange(): void {
    if (this.value) {
      this.updateValue({
        ...this.value,
        'dataset:nodegroupdefinition': this.nodeGroupDefinitions
      });
    }
    this.cdr.detectChanges();
  }

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data || {};
  }
}
