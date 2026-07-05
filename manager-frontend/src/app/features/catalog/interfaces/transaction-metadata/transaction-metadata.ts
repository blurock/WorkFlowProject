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
      <!-- Collapsed / Single Line Preview State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">settings</mat-icon>
          <span class="one-line-summary-badge badge-blue">Transaction Metadata</span>
          <span class="one-line-summary-title" *ngIf="value?.['dcterms:creator']">Owner: {{ value?.['dcterms:creator'] }}</span>
          <span class="one-line-summary-title" *ngIf="!value?.['dcterms:creator']">No Creator Info</span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">settings</mat-icon>
            <span>Transaction Metadata Details</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>
        
        <mat-divider style="margin-bottom: 12px;"></mat-divider>
        
        <div class="grid-section metadata-section">
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
    .field-row.full-width-prop {
      grid-column: 1 / -1;
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
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
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

