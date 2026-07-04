import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-required-transaction-information',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="rti-container">
      <div *ngIf="loading" class="rti-loading">
        Loading required transaction metadata...
      </div>

      <div *ngIf="!loading && structure" class="rti-content">
        <!-- Collapsed / Single Line Preview State -->
        <div class="rti-preview-row" *ngIf="!expanded">
          <div class="rti-preview-text">
            <span class="rti-badge" *ngIf="getTypeLabel()">{{ getTypeLabel() }}</span>
            <span class="rti-title" *ngIf="getTitle()">{{ getTitle() }}</span>
            <span class="rti-placeholder" *ngIf="!getTypeLabel() && !getTitle()">Empty Required Transaction Information</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>

        <!-- Expanded State -->
        <div class="rti-expanded-card" *ngIf="expanded">
          <div class="rti-expanded-header">
            <div class="rti-expanded-title">
              <mat-icon color="primary">settings</mat-icon>
              <span>Required Transaction Details</span>
            </div>
            <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
              <mat-icon>visibility_off</mat-icon>
            </button>
          </div>
          
          <mat-divider class="rti-divider"></mat-divider>
          
          <div class="rti-grid">
            <!-- 1. Required Transaction Type -->
            <div class="field-row" *ngIf="hasProperty('dataset:requiredtransactiontype')">
              <div class="field-header">{{ getPropertyStructure('dataset:requiredtransactiontype').label || 'Required Transaction Type' }}</div>
              <div class="field-body">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:requiredtransactiontype')"
                  [value]="value?.['dataset:requiredtransactiontype']"
                  (valueChange)="updateProperty('dataset:requiredtransactiontype', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- 2. Description Title Required Transaction -->
            <div class="field-row" *ngIf="hasProperty('dataset:descrtitlerequiredtransaction')">
              <div class="field-header">{{ getPropertyStructure('dataset:descrtitlerequiredtransaction').label || 'Description Title' }}</div>
              <div class="field-body">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:descrtitlerequiredtransaction')"
                  [value]="value?.['dataset:descrtitlerequiredtransaction']"
                  (valueChange)="updateProperty('dataset:descrtitlerequiredtransaction', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- 3. Required Transaction ID -->
            <div class="field-row" *ngIf="hasProperty('dataset:requiredtransactionid')">
              <div class="field-header">{{ getPropertyStructure('dataset:requiredtransactionid').label || 'Required Transaction ID' }}</div>
              <div class="field-body">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:requiredtransactionid')"
                  [value]="value?.['dataset:requiredtransactionid']"
                  (valueChange)="updateProperty('dataset:requiredtransactionid', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- 4. Required Transaction Key -->
            <div class="field-row" *ngIf="hasProperty('dataset:requiredtransactionkey')">
              <div class="field-header">{{ getPropertyStructure('dataset:requiredtransactionkey').label || 'Required Transaction Key' }}</div>
              <div class="field-body">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:requiredtransactionkey')"
                  [value]="value?.['dataset:requiredtransactionkey']"
                  (valueChange)="updateProperty('dataset:requiredtransactionkey', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- 5. Required Transition Firestore ID -->
            <div class="field-row full-width-field" *ngIf="hasProperty('dataset:requiredtransitionfirestoreid')">
              <div class="field-header">{{ getPropertyStructure('dataset:requiredtransitionfirestoreid').label || 'Firestore ID' }}</div>
              <div class="field-body">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:requiredtransitionfirestoreid')"
                  [value]="value?.['dataset:requiredtransitionfirestoreid']"
                  (valueChange)="updateProperty('dataset:requiredtransitionfirestoreid', $event)">
                </app-dynamic-primitive>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100% !important;
    }
    .rti-container {
      width: 100%;
      box-sizing: border-box;
    }
    .rti-loading {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      padding: 8px;
      text-align: center;
    }
    .rti-preview-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #fafafa;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
      transition: background-color 0.2s ease;
    }
    .rti-preview-row:hover {
      background-color: #f1f5f9;
    }
    .rti-preview-text {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .rti-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #e0e7ff;
      color: #4338ca;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #c7d2fe;
    }
    .rti-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }
    .rti-placeholder {
      font-size: 0.85rem;
      color: #94a3b8;
      font-style: italic;
    }
    .rti-expanded-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background-color: #ffffff;
      padding: 16px 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
      width: 100%;
      box-sizing: border-box;
    }
    .rti-expanded-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .rti-expanded-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #3730a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .rti-divider {
      margin-bottom: 16px;
    }
    .rti-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      width: 100%;
    }
    .field-row {
      display: flex;
      flex-direction: column;
      background-color: #fafafa;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .field-row.full-width-field {
      grid-column: 1 / -1;
    }
    .field-header {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .field-body {
      font-size: 0.9rem;
      color: #111827;
    }
  `]
})
export class RequiredTransactionInformationComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  loading = false;
  expanded = false;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:RequiredTransactionInformation';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[RequiredTransactionInformationComponent] Failed to load template for class: ' + cls, err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  hasProperty(key: string): boolean {
    return !!(this.structure?.properties && this.structure.properties[key]);
  }

  override getPropertyStructure(key: string): OntologyStructure {
    if (this.structure?.properties?.[key]) {
      return this.structure.properties[key];
    }
    return {
      identifier: key,
      classname: 'dataset:OneLine',
      isOneLine: true,
      isObject: false,
      isArray: false
    } as OntologyStructure;
  }

  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      this.value[key] = newValue;
      this.updateValue({ ...this.value });
      this.cdr.detectChanges();
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getTypeLabel(): string {
    const typeValue = this.value?.['dataset:requiredtransactiontype'];
    if (!typeValue) return '';
    return typeValue.split(':').pop() || typeValue;
  }

  getTitle(): string {
    return this.value?.['dataset:descrtitlerequiredtransaction'] || '';
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || {};
  }
}
