import { Component, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

@Component({
  selector: 'app-thermodynamic-standard-entropy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="molar-container" [class.expanded]="expanded">
      <div class="summary-line">
        <mat-icon class="molar-icon" color="accent">query_stats</mat-icon>
        <span class="molar-label">{{ getLabel() }}:</span>
        <span class="molar-value">{{ getValue() }}</span>
        <span class="molar-units" *ngIf="getUnits()">{{ getUnits() }}</span>
        <span class="spacer"></span>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </div>

      <div class="details-section" *ngIf="expanded">
        <div *ngIf="loading" class="loading-template-msg">
          Loading Entropy metadata template...
        </div>

        <div *ngIf="!loading">
          <div class="inputs-grid">
            <mat-form-field appearance="outline">
              <mat-label>Value</mat-label>
              <input matInput type="text" [ngModel]="value?.['dataset:ValueAsString']" (ngModelChange)="updateValueField($event)">
              <mat-hint>Entropy value as string</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Standard Uncertainty</mat-label>
              <input matInput type="text" [ngModel]="value?.['qudt:standardUncertainty']" (ngModelChange)="updateUncertaintyField($event)">
              <mat-hint>Standard uncertainty value</mat-hint>
            </mat-form-field>
          </div>

          <div class="spec-section" *ngIf="hasSpec()">
            <h4 class="section-title">Component Specification</h4>
            <app-dynamic-primitive
              [structure]="getSpecStructure()"
              [value]="value?.['dataset:paramspecentropy'] || value?.['qb:ComponentSpecification']"
              (valueChange)="updateSpec($event)">
            </app-dynamic-primitive>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .molar-container {
      border: 1px solid #cbd5e1;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 12px 16px;
      background: #ffffff;
      transition: all 0.3s ease;
      margin-bottom: 12px;
    }
    .molar-container.expanded {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-color: #94a3b8;
    }
    .summary-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
    }
    .molar-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #10b981;
    }
    .molar-label {
      font-weight: 700;
      color: #1e293b;
    }
    .molar-value {
      font-weight: 500;
      color: #0f172a;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
    }
    .molar-units {
      color: #475569;
      font-weight: 600;
      font-size: 0.88rem;
    }
    .spacer {
      flex: 1;
    }
    .details-section {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .inputs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .spec-section {
      border-top: 1px dashed #e2e8f0;
      padding-top: 12px;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .loading-template-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding: 10px;
    }
    mat-form-field {
      width: 100%;
    }
    :host {
      display: block;
      width: 100% !important;
    }
  `]
})
export class ThermodynamicStandardEntropyComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  expanded = false;
  resolvedStructure?: OntologyStructure;
  loading = false;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }

    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:ThermodynamicStandardEntropy';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.resolvedStructure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[ThermodynamicStandardEntropyComponent] Failed to load template: ' + cls, err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.resolvedStructure = this.structure;
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getLabel(): string {
    const spec = this.value?.['qb:ComponentSpecification'];
    if (spec) {
      if (spec['skos:prefLabel']) return spec['skos:prefLabel'];
      if (spec['dataset:parameterlabel']) return spec['dataset:parameterlabel'];
    }
    if (this.resolvedStructure?.label && !this.resolvedStructure.label.startsWith('std') && !this.resolvedStructure.label.startsWith('thermo')) {
      return this.resolvedStructure.label;
    }
    return 'Standard Entropy';
  }

  getValue(): string {
    if (this.value && this.value['dataset:ValueAsString'] !== undefined) {
      return this.value['dataset:ValueAsString'];
    }
    return '0.0';
  }

  getUnits(): string {
    const spec = this.value?.['qb:ComponentSpecification'];
    const unitObj = spec?.['qudt:Unit'] || spec?.['dataset:units'];
    if (unitObj) {
      if (typeof unitObj === 'string') {
        return this.cleanUnitString(unitObj);
      }
      if (typeof unitObj === 'object') {
        const qk = unitObj['qudt:QuantityKind'] || unitObj['qudt:QuantityKindTemplate'];
        if (qk) return this.cleanUnitString(qk);
      }
    }
    return '';
  }

  private cleanUnitString(unit: string): string {
    let cleaned = unit.split(':').pop() || '';
    if (cleaned.toLowerCase() === 'caloriepermole') return 'cal/mol';
    if (cleaned.toLowerCase() === 'kilocaloriepermole') return 'kcal/mol';
    if (cleaned.toLowerCase() === 'joulepermole') return 'J/mol';
    if (cleaned.toLowerCase() === 'kilojoulepermole') return 'kJ/mol';
    return cleaned;
  }

  hasSpec(): boolean {
    return !!(this.resolvedStructure?.properties?.['dataset:paramspecentropy'] || 
              this.resolvedStructure?.properties?.['qb:ComponentSpecification'] || 
              this.value?.['dataset:paramspecentropy'] || 
              this.value?.['qb:ComponentSpecification']);
  }

  getSpecStructure(): OntologyStructure {
    if (this.resolvedStructure?.properties?.['dataset:paramspecentropy']) {
      return this.resolvedStructure.properties['dataset:paramspecentropy'];
    }
    if (this.resolvedStructure?.properties?.['qb:ComponentSpecification']) {
      return this.resolvedStructure.properties['qb:ComponentSpecification'];
    }
    return {
      identifier: 'dataset:paramspecentropy',
      classname: 'dataset:ParameterSpecificationEntropy',
      isClassification: false,
      isParagraph: false,
      isOneLine: false,
      isEmail: false,
      isURL: false,
      isBoolean: false,
      isObject: true,
      isKeywordSet: false,
      isFileSource: false
    };
  }

  updateValueField(newValue: string): void {
    if (this.value) {
      this.updateValue({
        ...this.value,
        'dataset:ValueAsString': newValue
      });
      this.cdr.detectChanges();
    }
  }

  updateUncertaintyField(newUncertainty: string): void {
    if (this.value) {
      this.updateValue({
        ...this.value,
        'qudt:standardUncertainty': newUncertainty
      });
      this.cdr.detectChanges();
    }
  }

  updateSpec(newSpec: any): void {
    if (this.value) {
      const updatedValue = { ...this.value };
      if ('dataset:paramspecentropy' in updatedValue || !('qb:ComponentSpecification' in updatedValue)) {
        updatedValue['dataset:paramspecentropy'] = newSpec;
      } else {
        updatedValue['qb:ComponentSpecification'] = newSpec;
      }
      this.updateValue(updatedValue);
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
