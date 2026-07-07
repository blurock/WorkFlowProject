import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-j-thermodynamic-standard-thermodynamics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="metadata-container">
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">thermostat</mat-icon>
          <span class="one-line-summary-badge badge-gray">Standard Thermodynamics</span>
          <span class="one-line-summary-title" *ngIf="getThermoSummary()">{{ getThermoSummary() }}</span>
          <span class="one-line-summary-placeholder" *ngIf="!getThermoSummary()">No Thermodynamics Values</span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">thermostat</mat-icon>
            <span>Standard Thermodynamics Details</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>
        
        <mat-divider style="margin-bottom: 12px;"></mat-divider>
        
        <div class="grid-section metadata-section">
          <div *ngIf="loading" class="loading-msg">
            Loading structure metadata...
          </div>

          <div class="thermo-properties" *ngIf="!loading && structure">
            
            <!-- Standard Properties (Enthalpy, Entropy, Specs) rendered full width -->
            <div class="std-props-list" *ngIf="propertyKeys.length > 0">
              <div *ngFor="let key of propertyKeys" class="std-prop-row">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure(key)" 
                  [value]="value ? value[key] : null"
                  (valueChange)="updateProperty(key, $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- CpAtTemperature Matrix Table Section -->
            <mat-card class="summary-section-card mat-elevation-z1" style="overflow: visible;">
              <mat-card-header class="summary-section-card-header" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <mat-icon color="accent">show_chart</mat-icon>
                  <mat-card-title class="summary-section-card-title">Heat Capacity Cp At Temperature Matrix</mat-card-title>
                </div>
              </mat-card-header>
              <mat-card-content class="summary-section-card-content" style="padding-top: 12px;">
                <div class="table-container" *ngIf="cpList && cpList.length > 0">
                  <table mat-table [dataSource]="cpList" class="mat-elevation-z1 matrix-table">
                    
                    <!-- ThermodynamicTemperature Column -->
                    <ng-container matColumnDef="thermodynamicTemperature">
                      <th mat-header-cell *matHeaderCellDef class="table-header">Temperature</th>
                      <td mat-cell *matCellDef="let element; let i = index" class="table-cell">
                        <input type="text" class="cell-input" [(ngModel)]="element['dataset:thermotemperature']" (ngModelChange)="onCpValuesChange()">
                      </td>
                    </ng-container>

                    <!-- ThermodynamicHeatCapacityValue Column -->
                    <ng-container matColumnDef="thermodynamicHeatCapacityValue">
                      <th mat-header-cell *matHeaderCellDef class="table-header">Heat Capacity</th>
                      <td mat-cell *matCellDef="let element; let i = index" class="table-cell">
                        <input type="text" class="cell-input" [(ngModel)]="element['dataset:heatcapacityvalue']" (ngModelChange)="onCpValuesChange()">
                      </td>
                    </ng-container>

                    <!-- ValueUncertainty Column -->
                    <ng-container matColumnDef="valueUncertainty">
                      <th mat-header-cell *matHeaderCellDef class="table-header">Uncertainty</th>
                      <td mat-cell *matCellDef="let element; let i = index" class="table-cell">
                        <input type="text" class="cell-input" [(ngModel)]="element['qudt:standardUncertainty']" (ngModelChange)="onCpValuesChange()">
                      </td>
                    </ng-container>

                    <!-- Actions Column with Add Button in Header (matching structural atom count style) -->
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef class="table-header actions-header">
                        <button mat-icon-button color="primary" (click)="addRow()" type="button" matTooltip="Add Temperature Point" style="width: 32px; height: 32px; line-height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                          <mat-icon style="font-size: 20px; width: 20px; height: 20px; margin: 0;">add</mat-icon>
                        </button>
                      </th>
                      <td mat-cell *matCellDef="let element; let i = index" class="table-cell actions-cell">
                        <button mat-icon-button color="warn" (click)="deleteRow(i)" matTooltip="Delete Row" type="button" style="width: 32px; height: 32px; line-height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin: 0;">delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>

                <div *ngIf="!cpList || cpList.length === 0" class="no-rows-msg" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <span>No heat capacity values set.</span>
                  <button mat-stroked-button color="primary" (click)="addRow()" type="button">
                    <mat-icon>add</mat-icon>
                    <span>Add Cp Point</span>
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
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
    .thermo-properties {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }
    .std-props-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }
    .std-prop-row {
      width: 100%;
    }
    .table-container {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
    }
    .table-header {
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #475569;
      background-color: #f8fafc;
      letter-spacing: 0.05em;
      padding: 10px 14px;
    }
    .table-cell {
      font-size: 0.9rem;
      color: #334155;
      padding: 6px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .cell-input {
      width: 100%;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 0.85rem;
      border-radius: 4px;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .cell-input:focus {
      border-color: #3b82f6;
      outline: none;
    }
    .actions-header, .actions-cell {
      width: 50px;
      text-align: center;
      padding: 4px !important;
    }
    .no-rows-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      padding: 16px 0;
      text-align: center;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class JThermodynamicStandardThermodynamicsComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);


  loading = false;

  displayedColumns: string[] = ['thermodynamicTemperature', 'thermodynamicHeatCapacityValue', 'valueUncertainty', 'actions'];
  cpList: any[] = [];
  expanded = false;

  override ngOnInit(): void {
    super.ngOnInit();

    // Attempt loading metadata templates
    if (!this.structure || !this.structure.properties) {
      this.loading = true;
      this.ontologyService.getUITemplate('dataset:jthermostandardthermo').subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ontologyService.getUITemplate('dataset:JThermodynamicStandardThermodynamics').subscribe({
            next: (res2) => {
              this.structure = res2['dataobject'];
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: (err2) => {
              console.error('[JThermodynamicStandardThermodynamicsComponent] Failed loading ontology template', err2);
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        }
      });
    } else {
      this.structure = this.structure;
    }

    this.extractCpList();
  }

  override get propertyKeys(): string[] {
    var keys: string[] = [];
    if (this.value) {
      keys = Object.keys(this.value);
      keys = keys.filter(k => k !== 'dataset:cpattemp');
    }
    return keys;
  }

  override set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.extractCpList();
    }
  }

  override get value() {
    return this._value;
  }

  updateProperty(key: string, newValue: any) {
    if (this.value) {
      this.updateValue({
        ...this.value,
        [key]: newValue
      });
    }
  }

  private extractCpList() {
    const rawList = this.value?.['dataset:cpattemp'];
    if (Array.isArray(rawList)) {
      this.cpList = [...rawList];
    } else {
      this.cpList = [];
    }
    this.cdr.detectChanges();
  }

  addRow() {
    if (!this.value) {
      this.value = {};
    }
    if (!Array.isArray(this.cpList)) {
      this.cpList = [];
    }
    this.cpList.push({
      'dataset:thermotemperature': '0.0',
      'dataset:heatcapacityvalue': '0.0',
      'qudt:standardUncertainty': '0.0',
      '<http://purl.org/dc/elements/1.1/identifier>': 'dataset:cpattemp'
    });
    this.onCpValuesChange();
  }

  deleteRow(index: number) {
    if (Array.isArray(this.cpList)) {
      this.cpList.splice(index, 1);
      this.onCpValuesChange();
    }
  }

  onCpValuesChange() {
    if (this.value) {
      this.value['dataset:cpattemp'] = [...this.cpList];
      this.updateValue(this.value);
    }
    this.cdr.detectChanges();
  }

  toggleExpand() {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getLabel(): string {
    if (this.structure?.label && !this.structure.label.startsWith('jthermostandard') && !this.structure.label.startsWith('param')) {
      return this.structure.label;
    }
    return 'Standard Thermodynamics';
  }

  getThermoSummary(): string {
    if (!this.value) return '';
    const parts: string[] = [];

    // 1. Enthalpy
    const enthalpy = this.value['dataset:stdenthalpy'];
    if (enthalpy && enthalpy['dataset:ValueAsString'] !== undefined) {
      const val = enthalpy['dataset:ValueAsString'];
      const unitspec = enthalpy['dataset:paramspecenthalpy']?.['dataset:molarenthalpyunits'] || enthalpy['qb:ComponentSpecification'] || enthalpy;
      const unitStr = unitspec['dataset:molarenthalpyunitspecification'] || unitspec['qudt:Unit'] || unitspec['dataset:units'] || '';
      const unit = this.cleanEnthalpyUnit(unitStr);
      parts.push(`H: ${val} ${unit}`);
    }

    // 2. Entropy
    const entropy = this.value['dataset:stdentropy'];
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

  getData() {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
  }
}
