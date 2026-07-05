import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-transaction-description-short',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="tds-container">
      <div *ngIf="loading" class="tds-loading">
        Loading description metadata...
      </div>

      <div *ngIf="!loading && structure" class="tds-properties">
        <!-- 1. Short Description -->
        <div *ngIf="hasProperty('dataset:shortdescription')" class="tds-property-row full-width-prop">
          <div class="tds-prop-value">
            <app-dynamic-primitive [structure]="getPropertyStructure('dataset:shortdescription')"
              [value]="value ? value['dataset:shortdescription'] : null"
              (valueChange)="updateProperty('dataset:shortdescription', $event)">
            </app-dynamic-primitive>
          </div>
        </div>

        <!-- 2. Transaction Type -->
        <div *ngIf="hasProperty('prov:activity')" class="tds-property-row full-width-prop">
         
          <div class="tds-prop-value">
            <app-dynamic-primitive [structure]="getPropertyStructure('prov:activity')"
              [value]="value ? value['prov:activity'] : null"
              (valueChange)="updateProperty('prov:activity', $event)">
            </app-dynamic-primitive>
          </div>
        </div>

        <!-- 3. Transaction Key -->
        <div *ngIf="hasProperty('dataset:transactionkey')" class="tds-property-row full-width-prop">
          
          <div class="tds-prop-value">
            <app-dynamic-primitive [structure]="getPropertyStructure('dataset:transactionkey')"
              [value]="value ? value['dataset:transactionkey'] : null"
              (valueChange)="updateProperty('dataset:transactionkey', $event)">
            </app-dynamic-primitive>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tds-container {
      width: 100%;
    }
    .tds-loading {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      padding: 8px;
      text-align: center;
    }
    .tds-properties {
      display: flex;
      flex-direction: column;
      gap: 0px;
      width: 100%;
    }
    .tds-property-row {
      display: flex;
      flex-direction: column;
      padding: 0px;
      margin-bottom: 4px;
      border-radius: 0px;
      background-color: transparent;
      border: none;
    }
    .tds-property-row.full-width-prop {
      width: 100%;
    }
    .tds-prop-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .tds-prop-value {
      font-size: 0.9rem;
      color: #1e293b;
    }
    :host {
      display: block;
      width: 100%;
    }
    ::ng-deep .tds-properties .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .tds-properties .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class TransactionDescriptionShortComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  loading = false;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:TransactionDescriptionShort';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[TransactionDescriptionShortComponent] Failed to load template for class: ' + cls, err);
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

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || {};
  }
}
