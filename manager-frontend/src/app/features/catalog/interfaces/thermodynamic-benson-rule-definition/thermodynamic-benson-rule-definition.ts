import { Component, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { MinimumDatabaseObjectStructureComponent } from '../minimum-database-object/minimum-database-object';

@Component({
  selector: 'app-thermodynamic-benson-rule-definition',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => MinimumDatabaseObjectStructureComponent)
  ],
  template: `
    <mat-card class="benson-card mat-elevation-z3" [class.expanded-card]="expanded">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">science</mat-icon>
        <mat-card-title class="card-title">
          <span>Benson Rule Definition</span>
          <span class="generic-label-pill" *ngIf="getUniqueGenericLabel()">{{ getUniqueGenericLabel() }}</span>
          <code class="benson-ref-code" *ngIf="getBensonRef()">{{ getBensonRef() }}</code>
        </mat-card-title>
        <mat-card-subtitle *ngIf="!expanded" class="subtitle-summary">
          <span class="thermo-summary" *ngIf="getThermoSummary()">
            <mat-icon class="inline-icon">trending_up</mat-icon>
            {{ getThermoSummary() }}
          </span>
        </mat-card-subtitle>
        <div class="spacer"></div>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse to single line' : 'Expand detailed form'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content *ngIf="expanded" class="card-content-expanded">
        <mat-divider class="header-divider"></mat-divider>

        <div class="benson-stacked">
          <!-- Section 1: Benson Rule Structural Information -->
          <div class="stacked-section struct-section">
            <div class="column-header">
              <mat-icon color="primary">account_tree</mat-icon>
              <h3>Structural Definition</h3>
            </div>
            <div class="section-body" *ngIf="hasProperty('dataset:bensonrulestructure')">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:bensonrulestructure')"
                [value]="value?.['dataset:bensonrulestructure']"
                (valueChange)="updateProperty('dataset:bensonrulestructure', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <mat-divider class="section-divider"></mat-divider>

          <!-- Section 2: Benson Rule Thermodynamics -->
          <div class="stacked-section thermo-section">
            <div class="column-header">
              <mat-icon color="accent">thermostat</mat-icon>
              <h3>Standard Thermodynamics</h3>
            </div>
            <div class="section-body" *ngIf="hasProperty('dataset:jthermostandardthermo')">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:jthermostandardthermo')"
                [value]="value?.['dataset:jthermostandardthermo']"
                (valueChange)="updateProperty('dataset:jthermostandardthermo', $event)">
              </app-dynamic-primitive>
            </div>
          </div>
        </div>

        <!-- Row 2: Remaining properties (if any) and Metadata -->
        <div class="metadata-section">
          <mat-divider class="section-divider"></mat-divider>
          
          <!-- Remaining non-metadata properties -->
          <div class="remaining-props" *ngIf="remainingKeys.length > 0">
            <div class="column-header">
              <mat-icon color="primary">more_horiz</mat-icon>
              <h3>Additional Attributes</h3>
            </div>
            <div class="props-list">
              <div *ngFor="let key of remainingKeys" class="prop-row">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure(key)"
                  [value]="value ? value[key] : null"
                  (valueChange)="updateProperty(key, $event)">
                </app-dynamic-primitive>
              </div>
            </div>
          </div>

          <!-- Minimum Database Object (Firebase Metadata) -->
          <div class="mdo-wrapper" *ngIf="isFirebaseObject && mdoValue">
            <mat-divider class="section-divider"></mat-divider>
            <div class="column-header">
              <mat-icon color="primary">dns</mat-icon>
              <h3>Catalog Metadata</h3>
            </div>
            <app-minimum-database-object-structure
              [value]="mdoValue"
              (valueChange)="updateMdoProperties($event)">
            </app-minimum-database-object-structure>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .benson-card {
      margin: 16px 0;
      border-left: 5px solid #3b82f6;
      background: #ffffff;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible;
    }
    .expanded-card {
      border-color: #2563eb;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      color: #1e293b;
    }
    .benson-ref-code {
      font-family: 'Roboto Mono', monospace;
      background: #eff6ff;
      color: #2563eb;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
      border: 1px solid #bfdbfe;
    }
    .generic-label-pill {
      font-size: 0.8rem;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 500;
      border: 1px solid #cbd5e1;
    }
    .subtitle-summary {
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .thermo-summary {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #10b981;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .inline-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .spacer {
      flex: 1;
    }
    .card-content-expanded {
      padding: 0 8px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .header-divider {
      margin-bottom: 8px;
    }
    .benson-stacked {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }
    .stacked-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }
    .column-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .column-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #334155;
      margin: 0;
    }
    .section-body {
      width: 100%;
    }
    .metadata-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .section-divider {
      margin: 8px 0;
    }
    .props-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .prop-row {
      width: 100%;
    }
    :host {
      display: block;
      width: 100% !important;
    }
  `]
})
export class ThermodynamicBensonRuleDefinitionComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  expanded = false;

  isFirebaseObject = false;
  mdoValue: any = null;

  private readonly MDO_KEYS = [
    'dataset:shortdescription',
    'dataset:catobjid',
    'dataset:transactionid',
    'dataset:catalogkey',
    'dcterms:creator',
    'dcterms:created',
    'dataset:objectype',
    'dataset:readaccess',
    'dataset:accessmodify',
    'dataset:firestorecatalog',
    'transaction'
  ];

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    
    // Check if any MDO keys are present in structure
    if (this.structure?.properties) {
      this.isFirebaseObject = this.MDO_KEYS.some(key => key in this.structure.properties!);
    } else {
      this.isFirebaseObject = this.MDO_KEYS.some(key => key in this.value);
    }

    if (this.isFirebaseObject) {
      this.buildMdoValue();
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getUniqueGenericLabel(): string {
    return this.value?.['dataset:uniquegenericname'] || 
           this.value?.['dataset:dataset:uniquegenericname'] || 
           '';
  }

  getBensonRef(): string {
    return this.value?.['dataset:bensonrulestructure']?.['dataset:bensonruleref'] || 
           this.value?.['dataset:bensonrulestructure']?.['dataset:centeratom'] || 
           '';
  }

  getThermoSummary(): string {
    const thermo = this.value?.['dataset:jthermostandardthermo'];
    if (!thermo) return '';
    
    const parts: string[] = [];
    
    // 1. Enthalpy
    const enthalpy = thermo['dataset:stdenthalpy'];
    if (enthalpy && enthalpy['dataset:ValueAsString'] !== undefined) {
      const val = enthalpy['dataset:ValueAsString'];
      const unitspec = enthalpy['dataset:paramspecenthalpy']?.['dataset:molarenthalpyunits'] || enthalpy['qb:ComponentSpecification'] || enthalpy;
      const unitStr = unitspec['dataset:molarenthalpyunitspecification'] || unitspec['qudt:Unit'] || unitspec['dataset:units'] || '';
      const unit = this.cleanEnthalpyUnit(unitStr);
      parts.push(`H: ${val} ${unit}`);
    }

    // 2. Entropy
    const entropy = thermo['dataset:stdentropy'];
    if (entropy && entropy['dataset:ValueAsString'] !== undefined) {
      const val = entropy['dataset:ValueAsString'];
      const unitspec = entropy['dataset:paramspecentropy']?.['dataset:molarentropyunits'] || entropy['qb:ComponentSpecification'] || entropy;
      const unitStr = unitspec['dataset:molarentropyunitspecification'] || unitspec['qudt:Unit'] || unitspec['dataset:units'] || '';
      const unit = this.cleanEntropyUnit(unitStr);
      parts.push(`S: ${val} ${unit}`);
    }

    return parts.join(', ');
  }

  private cleanEnthalpyUnit(unitObj: any): string {
    if (!unitObj) return '';
    let unit = typeof unitObj === 'string' ? unitObj : (unitObj['qudt:QuantityKind'] || unitObj['qudt:QuantityKindTemplate'] || '');
    let cleaned = unit.split(':').pop() || '';
    const lower = cleaned.toLowerCase();
    if (lower.includes('kilocalorie') || lower.includes('kcal')) return 'kcal/mol';
    if (lower.includes('calorie') || lower.includes('cal')) return 'cal/mol';
    if (lower.includes('kilojoule') || lower.includes('kj')) return 'kJ/mol';
    if (lower.includes('joule') || lower.includes('j')) return 'J/mol';
    return cleaned;
  }

  private cleanEntropyUnit(unitObj: any): string {
    if (!unitObj) return '';
    let unit = typeof unitObj === 'string' ? unitObj : (unitObj['qudt:QuantityKind'] || unitObj['qudt:QuantityKindTemplate'] || '');
    let cleaned = unit.split(':').pop() || '';
    const lower = cleaned.toLowerCase();
    if (lower.includes('kilocalorie') || lower.includes('kcal')) return 'kcal/mol K';
    if (lower.includes('calorie') || lower.includes('cal')) return 'cal/mol K';
    if (lower.includes('kilojoule') || lower.includes('kj')) return 'kJ/mol K';
    if (lower.includes('joule') || lower.includes('j')) return 'J/mol K';
    return cleaned;
  }

  hasProperty(key: string): boolean {
    return !!(this.structure?.properties?.[key] || this.value?.[key]);
  }

  getPropertyStructure(key: string): OntologyStructure {
    if (this.structure?.properties?.[key]) {
      return this.structure.properties[key];
    }
    // Fallback templates based on key name
    if (key === 'dataset:bensonrulestructure') {
      return {
        identifier: key,
        classname: 'dataset:JThermodynamicsBensonRuleStructure',
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
    if (key === 'dataset:jthermostandardthermo') {
      return {
        identifier: key,
        classname: 'dataset:JThermodynamicStandardThermodynamics',
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
    return {
      identifier: key,
      classname: 'dataset:OneLine',
      isClassification: false,
      isParagraph: false,
      isOneLine: true,
      isEmail: false,
      isURL: false,
      isBoolean: false,
      isKeywordSet: false,
      isFileSource: false
    };
  }

  get remainingKeys(): string[] {
    const definedKeys = ['dataset:bensonrulestructure', 'dataset:jthermostandardthermo'];
    let allKeys: string[] = [];
    if (this.structure?.properties) {
      allKeys = Object.keys(this.structure.properties);
    } else if (this.value) {
      allKeys = Object.keys(this.value);
    }

    return allKeys.filter(key => 
      !definedKeys.includes(key) && 
      (!this.isFirebaseObject || !this.MDO_KEYS.includes(key)) &&
      key !== 'dcterms:identifier'
    );
  }

  buildMdoValue(): void {
    this.mdoValue = {};
    this.MDO_KEYS.forEach(key => {
      this.mdoValue[key] = this.value ? this.value[key] : null;
    });
  }

  updateMdoProperties(newMdoValue: any): void {
    if (this.value) {
      const updatedValue = { ...this.value };
      this.MDO_KEYS.forEach(key => {
        updatedValue[key] = newMdoValue[key];
      });
      this.updateValue(updatedValue);
      this.buildMdoValue();
      this.cdr.detectChanges();
    }
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

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || {};
  }
}
