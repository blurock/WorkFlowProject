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
  selector: 'app-parameter-specification',
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
      <!-- Read-only Summary First Line -->
      <div class="summary-line">
        <mat-icon class="spec-icon" color="primary">settings_suggest</mat-icon>
        <span class="spec-label">{{ getLabel() }}</span>
        <span class="spec-units" *ngIf="getUnits()">({{ getUnits() }})</span>
        <span class="spacer"></span>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </div>

      <!-- Expanded Detailed View -->
      <div class="details-section" *ngIf="expanded">
        <div *ngIf="loading" class="loading-template-msg">
          Loading specification template...
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
            No detailed properties available for this specification.
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
export class ParameterSpecificationComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  expanded = false;
  loading = false;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }

    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:ParameterSpecification';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[ParameterSpecificationComponent] Failed to load template for class: ' + cls, err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.structure = this.structure;
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getLabel(): string {
    if (this.value) {
      if (this.value['skos:prefLabel']) return this.value['skos:prefLabel'];
      if (this.value['dataset:parameterlabel']) return this.value['dataset:parameterlabel'];
    }
    if (this.structure) {
      if (this.structure.label && !this.structure.label.startsWith('paramspec') && !this.structure.label.startsWith('thermo')) {
        return this.structure.label;
      }
      if (this.structure.classname) {
        const cls = this.structure.classname;
        if (cls === 'dataset:paramspecenthalpy' || cls === 'dataset:ParameterSpecificationEnthalpy') return 'Enthalpy Specification';
        if (cls === 'dataset:paramspecentropy' || cls === 'dataset:ParameterSpecificationEntropy') return 'Entropy Specification';
        if (cls === 'dataset:paramspecheatcapacity' || cls === 'dataset:ParameterSpecificationHeatCapacity') return 'Heat Capacity Specification';
        if (cls === 'dataset:hdisassociationparameter' || cls === 'dataset:ParameterSpecificationHDisassociationEnergy') return 'Disassociation Energy Specification';
        if (cls === 'dataset:paramspecfrequency' || cls === 'dataset:ParameterSpecificationStructureVibrationFrequency') return 'Vibration Frequency Specification';
        if (cls === 'dataset:thermotemperature' || cls === 'dataset:ParameterSpecificationTemperature') return 'Temperature Specification';

        // Clean classname fallback, e.g. dataset:ParameterSpecificationEnthalpy -> Enthalpy Specification
        const name = this.structure.classname.split(':').pop() || '';
        return name.replace(/ParameterSpecification/, '').replace(/([A-Z])/g, ' $1').trim() + ' Spec';
      }
    }
    return 'Parameter Specification';
  }

  getUnits(): string {
    const unitObj = this.value?.['qudt:Unit'] || this.value?.['dataset:units'];
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
    // Strip prefixes like qudt: or dataset:
    let cleaned = unit.split(':').pop() || '';
    // Simplify common units
    if (cleaned.toLowerCase() === 'caloriepermole') return 'cal/mol';
    if (cleaned.toLowerCase() === 'kilocaloriepermole') return 'kcal/mol';
    if (cleaned.toLowerCase() === 'joulepermole') return 'J/mol';
    if (cleaned.toLowerCase() === 'kilojoulepermole') return 'kJ/mol';
    return cleaned;
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
