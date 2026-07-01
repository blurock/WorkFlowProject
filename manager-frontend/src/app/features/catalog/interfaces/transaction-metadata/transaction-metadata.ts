import { Component, OnInit, inject, ChangeDetectorRef, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-transaction-metadata',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="grid-section metadata-section">
      <h3 class="section-heading">
        <mat-icon color="primary">settings</mat-icon>
        <span>Transaction Event Metadata</span>
      </h3>

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
        <div class="field-row" *ngIf="value?.['dataset:firestorecatalog']">
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
  `,
  styles: [`
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
