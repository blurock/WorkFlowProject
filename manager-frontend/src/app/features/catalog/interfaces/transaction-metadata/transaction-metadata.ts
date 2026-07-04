import { Component, OnInit, inject, ChangeDetectorRef, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-transaction-metadata',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="metadata-container">
      <div class="summary-line">
        <div class="summary-info">
          <mat-icon color="primary">settings</mat-icon>
          <span class="summary-label">Transaction Event Metadata</span>
          <span class="summary-owner" *ngIf="value?.['dcterms:creator']"> (Owner: {{ value?.['dcterms:creator'] }})</span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </div>

      <div class="grid-section metadata-section" *ngIf="expanded">
        <div class="two-column-layout">
          <!-- Catalog Object Key -->
          <div class="field-row">
            <div class="field-header">Event Catalog Key</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:catalogkey')"
                [value]="value?.['dataset:catalogkey']"
                (valueChange)="updateProperty('dataset:catalogkey', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Database Object Type -->
          <div class="field-row">
            <div class="field-header">Event Object Type</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:objectype')"
                [value]="value?.['dataset:objectype']"
                (valueChange)="updateProperty('dataset:objectype', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Owner -->
          <div class="field-row">
            <div class="field-header">Event Creator</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dcterms:creator')"
                [value]="value?.['dcterms:creator']"
                (valueChange)="updateProperty('dcterms:creator', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Date Created -->
          <div class="field-row">
            <div class="field-header">Event Date Created</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dcterms:created')"
                [value]="value?.['dcterms:created']"
                (valueChange)="updateProperty('dcterms:created', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Read Access -->
          <div class="field-row">
            <div class="field-header">Read Access</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:readaccess')"
                [value]="value?.['dataset:readaccess']"
                (valueChange)="updateProperty('dataset:readaccess', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Modify Access -->
          <div class="field-row">
            <div class="field-header">Modify Access</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:accessmodify')"
                [value]="value?.['dataset:accessmodify']"
                (valueChange)="updateProperty('dataset:accessmodify', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Transaction ID -->
          <div class="field-row">
            <div class="field-header">Event Transaction ID</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:transactionid')"
                [value]="value?.['dataset:transactionid']"
                (valueChange)="updateProperty('dataset:transactionid', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Firestore Catalog ID -->
          <div class="field-row full-width-prop" *ngIf="value?.['dataset:firestorecatalog']">
            <div class="field-header">Event Catalog ID</div>
            <div class="field-body">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:firestorecatalog')"
                [value]="value?.['dataset:firestorecatalog']"
                (valueChange)="updateProperty('dataset:firestorecatalog', $event)">
              </app-dynamic-primitive>
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
    .metadata-container {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 16px;
      background: #f8fafc;
      transition: all 0.3s ease;
      margin-bottom: 8px;
      width: 100%;
      box-sizing: border-box;
    }
    .summary-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .summary-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .summary-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: #3730a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-owner {
      font-size: 0.875rem;
      color: #4b5563;
      font-weight: 500;
    }
    .grid-section {
      width: 100%;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed #e2e8f0;
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
    .field-row.full-width-prop {
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
export class BaseTransactionMetadataComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  expanded = false;

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  protected override isLayoutComponent(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override getPropertyStructure(key: string): OntologyStructure {
    if (this.structure?.properties?.[key]) {
      return this.structure.properties[key];
    }
    const isObject = key === 'dataset:firestorecatalog';
    return {
      identifier: key,
      classname: isObject ? 'dataset:FirestoreCatalogID' : 'dataset:OneLine',
      isObject: isObject,
      isArray: false,
      isOneLine: !isObject,
      label: key.split(':').pop() || key
    } as OntologyStructure;
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

