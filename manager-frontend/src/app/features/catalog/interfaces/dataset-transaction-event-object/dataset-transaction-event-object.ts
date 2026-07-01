import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
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
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => SimpleCatalogObjectComponent),
    forwardRef(() => ActivityInformationRecordComponent),
    forwardRef(() => BaseTransactionMetadataComponent)
  ],
  template: `
    <mat-card class="transaction-event-card mat-elevation-z3">
      <mat-card-header class="event-header">
        <mat-icon mat-card-avatar color="primary" class="header-avatar">receipt_long</mat-icon>
        <mat-card-title class="header-title">
          <span>ChemConnect Transaction Event</span>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content class="event-content">
        <mat-divider class="event-divider"></mat-divider>

        <div class="transaction-grid">
          
          <!-- Section 1: Descriptions & Overview -->
          <div class="grid-section" *ngIf="hasProperty('dataset:transactiondescriptionshort')">
            <h3 class="section-heading">
              <mat-icon color="primary">description</mat-icon>
              <span>Descriptions & Overview</span>
            </h3>

            <!-- Transaction Description Short (dataset:transactiondescriptionshort) -->
            <div class="field-row full-width">
              <div class="field-header">Transaction Description Short</div>
              <div class="field-body">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:transactiondescriptionshort')"
                  [value]="value?.['dataset:transactiondescriptionshort']"
                  (valueChange)="updateProperty('dataset:transactiondescriptionshort', $event)">
                </app-dynamic-primitive>
              </div>
            </div>
          </div>

          <mat-divider class="section-divider" *ngIf="hasProperty('dataset:transactiondescriptionshort')"></mat-divider>

          <!-- Section 4: Associated Objects -->
          <div class="grid-section objects-container">
            <h3 class="section-heading">
              <mat-icon color="accent">grid_view</mat-icon>
              <span>Catalog & Activity Information Records</span>
            </h3>

            <!-- Simple Catalog Object (dataset:simpcatobj) -->
            <div class="field-row full-width" *ngIf="value?.['dataset:simpcatobj']">
              <div class="object-section-header">Target Simple Catalog Object</div>
              <app-simple-catalog-object
                [structure]="getPropertyStructure('dataset:simpcatobj')"
                [value]="value?.['dataset:simpcatobj']"
                (valueChange)="updateProperty('dataset:simpcatobj', $event)">
              </app-simple-catalog-object>
            </div>

            <!-- Activity Information (dataset:activityinfo) -->
            <div class="field-row full-width" *ngIf="value?.['dataset:activityinfo']">
              <div class="object-section-header">Linked Activity Information Record</div>
              <app-activity-information
                [structure]="getPropertyStructure('dataset:activityinfo')"
                [value]="value?.['dataset:activityinfo']"
                (valueChange)="updateProperty('dataset:activityinfo', $event)">
              </app-activity-information>
            </div>

            <!-- Transaction Output Object ID (dataset:transoutobjid) -->
            <div class="field-row full-width" *ngIf="value?.['dataset:transoutobjid']">
              <div class="object-section-header">Transaction Output Object ID</div>
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:transoutobjid')"
                [value]="value?.['dataset:transoutobjid']"
                (valueChange)="updateProperty('dataset:transoutobjid', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Section 5: Base Transaction Metadata (from parent SimpleCatalogObject) -->
          <mat-divider class="section-divider"></mat-divider>
          <app-transaction-metadata
            [structure]="structure"
            [value]="value"
            (valueChange)="updateValue($event)">
          </app-transaction-metadata>

        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .transaction-event-card {
      margin: 16px 0;
      border-left: 6px solid #4f46e5;
      border-radius: 12px;
      background-color: #ffffff;
      font-family: 'Google Sans', 'Inter', sans-serif;
    }
    .event-header {
      padding: 16px 20px;
    }
    .header-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f3ff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
    }
    .header-title {
      font-size: 1.25rem;
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
      font-size: 0.9rem;
      color: #6b7280;
      margin-top: 4px;
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
      padding: 16px 20px 24px;
    }
    .transaction-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .section-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 700;
      color: #3730a3;
      margin: 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .grid-section {
      width: 100%;
    }
    .two-column-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .field-row {
      display: flex;
      flex-direction: column;
      background-color: #fafafa;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .field-row.full-width {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 8px;
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
    .section-divider {
      margin: 8px 0;
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
      font-size: 0.85rem;
      font-weight: 700;
      color: #4b5563;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .objects-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class DatasetTransactionEventObjectComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  protected override isLayoutComponent(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  hasProperty(key: string): boolean {
    return !!(this.structure?.properties?.[key] || this.value?.[key]);
  }

  getLabelForActivityType(): string {
    const act = this.value?.['prov:activity'];
    if (!act) return '';
    return act.split(':').pop() || act;
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
        'dataset:firestorecatalog'
      ].includes(key);

      struct = {
        identifier: key,
        classname: isObject ? 'dataset:JsonObject' : 'dataset:OneLine',
        isObject: isObject,
        isArray: false,
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
