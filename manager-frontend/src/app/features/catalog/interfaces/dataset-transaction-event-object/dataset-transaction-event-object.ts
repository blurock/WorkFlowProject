import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { SimpleCatalogObjectComponent } from '../simple-catalog-object/simple-catalog-object';
import { ActivityInformationRecordComponent } from '../activity-information/activity-information';
import { BaseTransactionMetadataComponent } from '../transaction-metadata/transaction-metadata';

@Component({
  selector: 'app-dataset-transaction-event-object',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatButtonModule,
    MatTooltipModule,
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => SimpleCatalogObjectComponent),
    forwardRef(() => ActivityInformationRecordComponent),
    forwardRef(() => BaseTransactionMetadataComponent)
  ],
  template: `
    <div class="event-container">
      <!-- Collapsed / Single Line Preview State -->
      <div class="event-preview-row" *ngIf="!expanded">
        <div class="event-preview-text">
          <mat-icon color="primary" class="preview-avatar">receipt_long</mat-icon>
          <span class="event-badge" *ngIf="getActivityLabel()">{{ getActivityLabel() }}</span>
          <span class="event-title" *ngIf="getShortDescription()">{{ getShortDescription() }}</span>
          <span class="event-placeholder" *ngIf="!getActivityLabel() && !getShortDescription()">Empty Transaction Event</span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- Expanded State (renders the card) -->
      <mat-card class="transaction-event-card mat-elevation-z3" *ngIf="expanded">
        <mat-card-header class="event-header">
          <mat-icon mat-card-avatar color="primary" class="header-avatar">receipt_long</mat-icon>
          <mat-card-title class="header-title">
            <span>ChemConnect Transaction Event</span>
            <span class="activity-badge" *ngIf="getActivityLabel()">{{ getActivityLabel() }}</span>
          </mat-card-title>
          <div style="flex-grow: 1;"></div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button" style="margin-top: -8px;">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </mat-card-header>

        <mat-card-content class="event-content">
          <mat-divider class="event-divider"></mat-divider>

          <div class="transaction-grid">
            
            <!-- Section 1: Descriptions & Overview -->
            <mat-card class="section-card mat-elevation-z1" *ngIf="hasProperty('dataset:transactiondescriptionshort')">
              <div class="section-card-header">
                <mat-icon color="primary">description</mat-icon>
                <div class="section-title">Transaction Short Description</div>
              </div>
              <mat-card-content class="section-card-content">
                <div class="field-body">
                  <app-dynamic-primitive
                    [structure]="getPropertyStructure('dataset:transactiondescriptionshort')"
                    [value]="value?.['dataset:transactiondescriptionshort']"
                    (valueChange)="updateProperty('dataset:transactiondescriptionshort', $event)">
                  </app-dynamic-primitive>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Section 2: Catalog & Activity Information Records -->
            <mat-card class="section-card mat-elevation-z1" *ngIf="value?.['dataset:simpcatobj'] || value?.['dataset:activityinfo']">
              <div class="section-card-header">
                <mat-icon color="accent">grid_view</mat-icon>
                <div class="section-title">Catalog & Activity Information Records</div>
              </div>
              <mat-card-content class="section-card-content objects-container">
                <!-- Activity Information (dataset:activityinfo) -->
                <div class="field-row full-width" *ngIf="value?.['dataset:activityinfo']">
                  <app-activity-information
                    [structure]="getPropertyStructure('dataset:activityinfo')"
                    [value]="value?.['dataset:activityinfo']"
                    (valueChange)="updateProperty('dataset:activityinfo', $event)">
                  </app-activity-information>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Section 3: Transaction Output Object ID (dataset:transoutobjid) -->
            <mat-card class="section-card mat-elevation-z1" *ngIf="value?.['dataset:transoutobjid']">
              <div class="section-card-header">
                <mat-icon color="primary">label</mat-icon>
                <div class="section-title">Transaction Output Object ID</div>
              </div>
              <mat-card-content class="section-card-content">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:transoutobjid')"
                  [value]="value?.['dataset:transoutobjid']"
                  (valueChange)="updateProperty('dataset:transoutobjid', $event)">
                </app-dynamic-primitive>
              </mat-card-content>
            </mat-card>

            <!-- Section 4: Required Transaction Information (dataset:requiredtransactioninfo) -->
            <mat-card class="section-card mat-elevation-z1" *ngIf="value?.['dataset:requiredtransactioninfo']">
              <div class="section-card-header">
                <mat-icon color="accent">assignment_turned_in</mat-icon>
                <div class="section-title">Required Transaction Information</div>
              </div>
              <mat-card-content class="section-card-content">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:requiredtransactioninfo')"
                  [value]="value?.['dataset:requiredtransactioninfo']"
                  (valueChange)="updateProperty('dataset:requiredtransactioninfo', $event)">
                </app-dynamic-primitive>
              </mat-card-content>
            </mat-card>

            <!-- Section 5: Base Transaction Metadata (from parent SimpleCatalogObject) -->
            <mat-card class="section-card mat-elevation-z1">
              <div class="section-card-header">
                <mat-icon color="primary">info</mat-icon>
                <div class="section-title">Transaction Metadata</div>
              </div>
              <mat-card-content class="section-card-content">
                <app-transaction-metadata
                  [structure]="structure"
                  [value]="value"
                  (valueChange)="updateValue($event)">
                </app-transaction-metadata>
              </mat-card-content>
            </mat-card>

          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100% !important;
    }
    .event-container {
      width: 100%;
      box-sizing: border-box;
    }
    .event-preview-row {
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
      margin: 8px 0;
    }
    .event-preview-row:hover {
      background-color: #f1f5f9;
    }
    .event-preview-text {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .preview-avatar {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .event-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #f5f3ff;
      color: #5b21b6;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #ddd6fe;
    }
    .event-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }
    .event-placeholder {
      font-size: 0.85rem;
      color: #94a3b8;
      font-style: italic;
    }
    .transaction-event-card {
      margin: 8px 0;
      border-left: 6px solid #4f46e5;
      border-radius: 12px;
      background-color: #ffffff;
      font-family: 'Google Sans', 'Inter', sans-serif;
    }
    .event-header {
      padding: 10px 16px;
      display: flex;
      align-items: center;
    }
    .header-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f3ff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
    }
    .header-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e1b4b;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .activity-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #e0e7ff;
      color: #4338ca;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #c7d2fe;
    }
    .header-subtitle {
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 2px;
    }
    .key-code {
      font-family: 'Roboto Mono', monospace;
      font-weight: 600;
      background-color: #f3f4f6;
      color: #111827;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    .event-divider {
      margin: 0;
    }
    .event-content {
      padding: 8px 12px 12px;
    }
    .transaction-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .section-card {
      margin-bottom: 4px;
      border-radius: 8px;
      background-color: #fafafa;
      border: 1px solid #e2e8f0;
      width: 100%;
      box-sizing: border-box;
      overflow: visible;
    }
    .section-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-bottom: 1px solid #f1f5f9;
      background-color: #f8fafc;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .section-card-header mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #3730a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-card-content {
      padding: 6px 12px !important;
    }
    .grid-section {
      width: 100%;
    }
    .two-column-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 12px;
    }
    .field-row {
      display: flex;
      flex-direction: column;
      background-color: #fafafa;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      padding: 6px 10px;
    }
    .field-row.full-width {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 4px;
    }
    .field-header {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .field-body {
      font-size: 0.9rem;
      color: #111827;
    }
    .section-divider {
      margin: 4px 0;
    }
    .response-log-panel {
      border: 1px solid #e5e7eb;
      border-radius: 8px !important;
      overflow: hidden;
    }
    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #4b5563;
    }
    .panel-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .log-pre-block {
      background-color: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 6px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      margin: 8px 0 0;
      white-space: pre-wrap;
    }
    .object-section-header {
      font-size: 0.8rem;
      font-weight: 700;
      color: #4b5563;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .objects-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `]
})
export class DatasetTransactionEventObjectComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  expanded = false;

  protected override isLayoutComponent(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  hasProperty(key: string): boolean {
    return !!(this.structure?.properties?.[key] || this.value?.[key]);
  }

  getActivityLabel(): string {
    const act = this.value?.['prov:activity'];
    if (!act) return '';
    return act.split(':').pop() || act;
  }

  getShortDescription(): string {
    return this.value?.['dataset:transactiondescriptionshort']?.['dataset:shortdescription'] || '';
  }

  override getPropertyStructure(key: string): OntologyStructure {
    let struct: OntologyStructure;
    if (this.structure?.properties?.[key]) {
      struct = { ...this.structure.properties[key] };
    } else {
      const isObject = [
        'dataset:simpcatobj',
        'dataset:activityinfo',
        'dataset:transoutobjid',
        'dataset:firestorecatalog',
        'dataset:requiredtransactioninfo'
      ].includes(key);

      struct = {
        identifier: key,
        classname: isObject ? 'dataset:JsonObject' : 'dataset:OneLine',
        isObject: isObject,
        isArray: key === 'dataset:requiredtransactioninfo', // mark as array if it is
        isOneLine: !isObject,
        label: key.split(':').pop() || key
      } as OntologyStructure;
    }
    return struct;
  }

  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      this.value[key] = newValue;
      this.updateValue(this.value);
      this.cdr.detectChanges();
    }
  }

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data;
    this.cdr.detectChanges();
  }
}
