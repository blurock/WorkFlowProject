import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { ThermodynamicDefinitionRootComponent } from '../thermodynamic-benson-rule-definition-data-set/thermodynamic-definition-root';

@Component({
  selector: 'app-j-thermodynamics-disassociation-energy-of-structure-data-set',
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicPrimitiveComponent), forwardRef(() => ThermodynamicDefinitionRootComponent)],
  template: `
    <div class="subclass-specific-properties metadata-section" *ngIf="!loading">
      <div class="no-padding-row">
        <app-dynamic-primitive
          [structure]="getPropertyStructure('dataset:disassociationenergyparameter')"
          [value]="value ? value['dataset:disassociationenergyparameter'] : null"
          (valueChange)="updateProperty('dataset:disassociationenergyparameter', $event)">
        </app-dynamic-primitive>
      </div>
      <div class="no-padding-row">
        <app-dynamic-primitive
          [structure]="getPropertyStructure('dataset:2dspeciesstructure')"
          [value]="value ? value['dataset:2dspeciesstructure'] : null"
          (valueChange)="updateProperty('dataset:2dspeciesstructure', $event)">
        </app-dynamic-primitive>
      </div>
    </div>

    <app-thermodynamic-definition-root
      [structure]="structure"
      [value]="value"
      [classname]="'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet'"
      [titleLabel]="'Disassociation Energy Dataset: '"
      (valueChange)="updateValue($event)">
    </app-thermodynamic-definition-root>
  `,
  styles: [`
    .subclass-specific-properties {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .no-padding-row {
      width: 100%;
      padding: 0 !important;
      margin: 0 !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class JThermodynamicsDisassociationEnergyOfStructureDataSetComponent extends BaseSubclassComponent implements OnInit {
  override ngOnInit(): void {
    this.classname = 'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet';
    super.ngOnInit();
  }
}
