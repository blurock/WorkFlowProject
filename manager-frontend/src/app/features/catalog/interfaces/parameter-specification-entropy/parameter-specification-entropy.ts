import { Component, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

@Component({
  selector: 'app-parameter-specification-entropy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="spec-container" [class.expanded]="expanded">
      <div class="summary-line">
        <mat-icon class="spec-icon" color="primary">settings_suggest</mat-icon>
        <span class="spec-label">{{ getLabel() }}</span>
        <span class="spec-units" *ngIf="getUnits()">({{ getUnits() }})</span>
        <span class="spacer"></span>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </div>

      <div class="details-section" *ngIf="expanded">
        <div *ngIf="loading" class="loading-template-msg">
          Loading Entropy specification template...
        </div>

        <div *ngIf="!loading">
          <div class="props-list" *ngIf="propertyKeys.length > 0">
            <div *ngFor="let key of propertyKeys" class="prop-row">
              <app-dynamic-primitive
                [structure]="getPropertyStructure(key)"
                [value]="value ? value[key] : null"
                (valueChange)="updateProperty(key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>
          <div *ngIf="propertyKeys.length === 0" class="no-props-msg">
            No detailed properties available for this Entropy specification.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spec-container {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 16px;
      background: #f8fafc;
      transition: all 0.3s ease;
      margin-bottom: 8px;
    }
    .spec-container.expanded {
      background: #ffffff;
      border-color: #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .summary-line {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
    }
    .spec-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #3b82f6;
    }
    .spec-label {
      font-weight: 600;
      color: #334155;
    }
    .spec-units {
      color: #64748b;
      font-weight: 500;
    }
    .spacer {
      flex: 1;
    }
    .details-section {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed #e2e8f0;
    }
    .props-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .prop-row {
      width: 100%;
    }
    .no-props-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      text-align: center;
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
  `]
})
export class ParameterSpecificationEntropyComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  expanded = false;
  resolvedStructure?: OntologyStructure;
  loading = false;

  override get value(): any {
    return this._value;
  }

  override set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.mapGenericToSpecific();
      this.cdr.detectChanges();
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    this.mapGenericToSpecific();

    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:ParameterSpecificationEntropy';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.resolvedStructure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[ParameterSpecificationEntropyComponent] Failed to load template for class: ' + cls, err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.resolvedStructure = this.structure;
    }
  }

  private translateQudtUnit(unit: string): string {
    if (!unit) return unit;
    const clean = unit.split(':').pop() || '';
    const lower = clean.toLowerCase();
    if (lower === 'caloriepermole' || lower === 'caloriespermole' || lower === 'unitscaloriespermole') {
      return 'dataset:UnitsCaloriesPerMole';
    }
    if (lower === 'kilocaloriepermole' || lower === 'kilocaloriespermole' || lower === 'unitskilocaloriespermole') {
      return 'dataset:UnitsKiloCaloriesPerMole';
    }
    if (lower === 'joulepermole' || lower === 'joulespermole' || lower === 'unitsjoulespermole') {
      return 'dataset:UnitsJoulesPerMole';
    }
    if (lower === 'kilojoulepermole' || lower === 'kilojoulespermole' || lower === 'unitskilojoulespermole') {
      return 'dataset:UnitsKiloJoulesPerMole';
    }
    if (lower === 'kelvin' || lower === 'unitskelvin') {
      return 'dataset:UnitsKelvin';
    }
    return unit;
  }

  private translateDatasetToQudtUnit(unit: string): string {
    if (!unit) return unit;
    const clean = unit.split(':').pop() || '';
    if (clean === 'UnitsCaloriesPerMole') return 'qudt:caloriePerMole';
    if (clean === 'UnitsKiloCaloriesPerMole') return 'qudt:kilocaloriePerMole';
    if (clean === 'UnitsJoulesPerMole') return 'qudt:joulePerMole';
    if (clean === 'UnitsKiloJoulesPerMole') return 'qudt:kilojoulePerMole';
    if (clean === 'UnitsKelvin') return 'qudt:Kelvin';
    return unit;
  }

  mapGenericToSpecific(): void {
    if (!this.value || typeof this.value !== 'object') return;
    
    // 1. Label Mapping
    if (!this.value['dataset:parameterlabelentropy']) {
      const labelVal = this.value['skos:prefLabel'] || this.value['dataset:parameterlabel'];
      if (labelVal) {
        this.value['dataset:parameterlabelentropy'] = labelVal;
      }
    }

    // 2. Units Mapping
    if (!this.value['dataset:molarentropyunits']) {
      const srcUnit = this.value['qudt:Unit'] || this.value['dataset:units'];
      if (srcUnit) {
        let unitspec = typeof srcUnit === 'string' ? srcUnit : (srcUnit['qudt:QuantityKind'] || srcUnit['dataset:unitspecification']);
        const unitclass = typeof srcUnit === 'string' ? 'dataset:UnitClassMolarEntropy' : (srcUnit['qudt:SystemOfQuantities'] || 'dataset:UnitClassMolarEntropy');
        unitspec = this.translateQudtUnit(unitspec);
        this.value['dataset:molarentropyunits'] = {
          'dataset:molarentropyunitclass': unitclass,
          'dataset:molarentropyunitspecification': unitspec
        };
      }
    } else {
      const specObj = this.value['dataset:molarentropyunits'];
      if (specObj && specObj['dataset:molarentropyunitspecification']) {
        specObj['dataset:molarentropyunitspecification'] = this.translateQudtUnit(specObj['dataset:molarentropyunitspecification']);
      }
    }

    // 3. Purpose/Concept Mapping
    if (!this.value['dataset:purposeconceptentropy']) {
      this.value['dataset:purposeconceptentropy'] = {
        'dataset:purposeparameterentropy': 'dataset:ThermodynamicParameterCalculationElement',
        'dataset:conceptparameterentropy': 'dataset:ParameterConceptDataset'
      };
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getLabel(): string {
    if (this.value) {
      if (this.value['dataset:parameterlabelentropy']) return this.value['dataset:parameterlabelentropy'];
      if (this.value['skos:prefLabel']) return this.value['skos:prefLabel'];
      if (this.value['dataset:parameterlabel']) return this.value['dataset:parameterlabel'];
    }
    if (this.resolvedStructure?.label && !this.resolvedStructure.label.startsWith('paramspec') && !this.resolvedStructure.label.startsWith('thermo')) {
      return this.resolvedStructure.label;
    }
    return 'Entropy Specification';
  }

  getUnits(): string {
    const unitspec = this.value?.['dataset:molarentropyunits'] || this.value;
    const unitObj = unitspec?.['dataset:molarentropyunitspecification'] || unitspec?.['qudt:Unit'] || unitspec?.['dataset:units'];
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
    if (cleaned.toLowerCase() === 'caloriepermole' || cleaned.toLowerCase() === 'caloriespermole') return 'cal/mol';
    if (cleaned.toLowerCase() === 'kilocaloriepermole' || cleaned.toLowerCase() === 'kilocaloriespermole') return 'kcal/mol';
    if (cleaned.toLowerCase() === 'joulepermole' || cleaned.toLowerCase() === 'joulespermole') return 'J/mol';
    if (cleaned.toLowerCase() === 'kilojoulepermole' || cleaned.toLowerCase() === 'kilojoulespermole') return 'kJ/mol';
    return cleaned;
  }

  get propertyKeys(): string[] {
    if (this.resolvedStructure?.properties && Object.keys(this.resolvedStructure.properties).length > 0) {
      return Object.keys(this.resolvedStructure.properties);
    }
    if (this.value) {
      return Object.keys(this.value).filter(k => k !== 'dcterms:identifier');
    }
    return [];
  }

  getPropertyStructure(key: string): OntologyStructure {
    if (this.resolvedStructure?.properties?.[key]) {
      return this.resolvedStructure.properties[key];
    }
    const val = this.value ? this.value[key] : null;
    const isValObject = val !== null && typeof val === 'object' && !Array.isArray(val);
    const isValArray = Array.isArray(val);
    return {
      identifier: key,
      classname: isValObject ? 'dataset:JsonObject' : (isValArray ? 'dataset:JsonArray' : 'dataset:OneLine'),
      isClassification: false,
      isParagraph: false,
      isOneLine: !isValObject && !isValArray,
      isEmail: false,
      isURL: false,
      isBoolean: typeof val === 'boolean',
      isKeywordSet: false,
      isFileSource: false,
      isObject: isValObject,
      isArray: isValArray,
      label: key.split(':').pop() || key
    };
  }

  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      const updatedValue = {
        ...this.value,
        [key]: newValue
      };
      
      // Sync specific keys back to generic keys
      if (key === 'dataset:parameterlabelentropy') {
        updatedValue['skos:prefLabel'] = newValue;
      } else if (key === 'dataset:molarentropyunits') {
        const unitspec = newValue?.['dataset:molarentropyunitspecification'];
        const unitclass = newValue?.['dataset:molarentropyunitclass'];
        const qudtUnitSpec = this.translateDatasetToQudtUnit(unitspec);
        updatedValue['qudt:Unit'] = {
          'qudt:QuantityKind': qudtUnitSpec,
          'qudt:SystemOfQuantities': unitclass
        };
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
