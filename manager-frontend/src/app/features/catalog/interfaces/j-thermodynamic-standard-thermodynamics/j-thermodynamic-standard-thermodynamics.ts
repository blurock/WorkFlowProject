import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <mat-card class="thermo-card mat-elevation-z2" [class.expanded-card]="expanded">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">thermostat</mat-icon>
        <mat-card-title>{{ getLabel() }}</mat-card-title>
        <mat-card-subtitle *ngIf="!expanded" class="subtitle-summary">
          <span class="thermo-summary" *ngIf="getThermoSummary()">
            <mat-icon class="inline-icon">trending_up</mat-icon>
            {{ getThermoSummary() }}
          </span>
        </mat-card-subtitle>
        <div class="spacer"></div>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content *ngIf="expanded" class="card-content-expanded">
        <div *ngIf="loading" class="loading-msg">
          Loading structure metadata...
        </div>

        <div class="thermo-properties" *ngIf="!loading && resolvedStructure">
          
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
          <div class="matrix-section">
            <div class="matrix-header">
              <mat-icon color="accent">show_chart</mat-icon>
              <h3>Heat Capacity Cp At Temperature Matrix</h3>
            </div>

            <div class="table-container" *ngIf="cpList && cpList.length > 0">
              <table mat-table [dataSource]="cpList" class="mat-elevation-z1 matrix-table">
                
                <!-- ThermodynamicTemperature Column -->
                <ng-container matColumnDef="thermodynamicTemperature">
                  <th mat-header-cell *matHeaderCellDef class="table-header">ThermodynamicTemperature</th>
                  <td mat-cell *matCellDef="let element; let i = index" class="table-cell">
                    <input type="text" class="cell-input" [(ngModel)]="element['dataset:thermotemperature']" (ngModelChange)="onCpValuesChange()">
                  </td>
                </ng-container>

                <!-- ThermodynamicHeatCapacityValue Column -->
                <ng-container matColumnDef="thermodynamicHeatCapacityValue">
                  <th mat-header-cell *matHeaderCellDef class="table-header">ThermodynamicHeatCapacityValue</th>
                  <td mat-cell *matCellDef="let element; let i = index" class="table-cell">
                    <input type="text" class="cell-input" [(ngModel)]="element['dataset:heatcapacityvalue']" (ngModelChange)="onCpValuesChange()">
                  </td>
                </ng-container>

                <!-- ValueUncertainty Column -->
                <ng-container matColumnDef="valueUncertainty">
                  <th mat-header-cell *matHeaderCellDef class="table-header">ValueUncertainty</th>
                  <td mat-cell *matCellDef="let element; let i = index" class="table-cell">
                    <input type="text" class="cell-input" [(ngModel)]="element['qudt:standardUncertainty']" (ngModelChange)="onCpValuesChange()">
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="table-header actions-header"></th>
                  <td mat-cell *matCellDef="let element; let i = index" class="table-cell actions-cell">
                    <button mat-icon-button color="warn" (click)="deleteRow(i)" matTooltip="Delete Row" type="button">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>

            <div *ngIf="!cpList || cpList.length === 0" class="no-rows-msg">
              No heat capacity values set. Click below to add one.
            </div>

            <div class="add-row-action">
              <button mat-stroked-button color="primary" (click)="addRow()" type="button">
                <mat-icon>add</mat-icon>
                <span>Add Temperature Point</span>
              </button>
            </div>
          </div>

        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .thermo-card {
      margin: 16px 0;
      border-left: 4px solid #10b981;
      background: white;
      overflow: visible;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .expanded-card {
      border-color: #059669;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .spacer {
      flex: 1;
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
    .card-content-expanded {
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .loading-msg {
      font-size: 0.9rem;
      color: #64748b;
      padding: 16px;
      text-align: center;
    }
    .thermo-properties {
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .std-props-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      margin-bottom: 24px;
    }
    .std-prop-row {
      width: 100%;
    }
    .matrix-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 8px;
    }
    .matrix-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .matrix-header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .table-container {
      width: 100%;
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 6px;
      overflow: hidden;
    }
    .table-header {
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #475569;
      background-color: #f1f5f9;
      letter-spacing: 0.05em;
      padding: 12px 16px;
    }
    .table-cell {
      font-size: 0.9rem;
      color: #334155;
      padding: 8px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .cell-input {
      width: 100%;
      border: 1px solid transparent;
      background: transparent;
      padding: 6px 8px;
      font-family: inherit;
      font-size: 0.85rem;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .cell-input:hover {
      border-color: #cbd5e1;
      background-color: #f8fafc;
    }
    .cell-input:focus {
      border-color: #10b981;
      background-color: #ffffff;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
      outline: none;
    }
    .actions-header, .actions-cell {
      width: 60px;
      text-align: center;
      padding: 8px;
    }
    .no-rows-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      padding: 16px 0;
      text-align: center;
    }
    .add-row-action {
      display: flex;
      justify-content: flex-start;
      margin-top: 8px;
    }
  `]
})
export class JThermodynamicStandardThermodynamicsComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  resolvedStructure?: OntologyStructure;
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
          this.resolvedStructure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ontologyService.getUITemplate('dataset:JThermodynamicStandardThermodynamics').subscribe({
            next: (res2) => {
              this.resolvedStructure = res2['dataobject'];
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
      this.resolvedStructure = this.structure;
    }

    this.extractCpList();
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

  get propertyKeys(): string[] {
    if (this.resolvedStructure?.properties) {
      return Object.keys(this.resolvedStructure.properties).filter(
        key => key !== 'dataset:cpattemp'
      );
    }
    return [];
  }

  getPropertyStructure(key: string): OntologyStructure {
    return this.resolvedStructure!.properties![key];
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
    if (this.resolvedStructure?.label && !this.resolvedStructure.label.startsWith('jthermostandard') && !this.resolvedStructure.label.startsWith('param')) {
      return this.resolvedStructure.label;
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
