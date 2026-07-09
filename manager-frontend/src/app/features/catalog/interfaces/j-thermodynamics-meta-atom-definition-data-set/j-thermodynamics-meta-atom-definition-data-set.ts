import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { ThermodynamicDefinitionRootComponent } from '../thermodynamic-benson-rule-definition-data-set/thermodynamic-definition-root';

@Component({
  selector: 'app-j-thermodynamics-meta-atom-definition-data-set',
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicPrimitiveComponent), forwardRef(() => ThermodynamicDefinitionRootComponent)],
  template: `
    <div class="subclass-specific-properties metadata-section" *ngIf="!loading">
      <!-- 1. dataset:twodmollabel on one line -->
      <div class="properties-row-1col no-padding-row">
        <div class="prop-cell">
          <app-dynamic-primitive
            [structure]="getPropertyStructure('dataset:twodmollabel')"
            [value]="value ? value['dataset:twodmollabel'] : null"
            (valueChange)="updateProperty('dataset:twodmollabel', $event)">
          </app-dynamic-primitive>
        </div>
      </div>

      <!-- 2. dataset:structuredef and dataset:speciespectype on one line -->
      <div class="properties-row-2col no-padding-row">
        <div class="prop-cell">
          <app-dynamic-primitive
            [structure]="getPropertyStructure('dataset:structuredef')"
            [value]="value ? value['dataset:structuredef'] : null"
            (valueChange)="updateProperty('dataset:structuredef', $event)">
          </app-dynamic-primitive>
        </div>
        <div class="prop-cell">
          <app-dynamic-primitive
            [structure]="getPropertyStructure('dataset:speciespectype')"
            [value]="value ? value['dataset:speciespectype'] : null"
            (valueChange)="updateProperty('dataset:speciespectype', $event)">
          </app-dynamic-primitive>
        </div>
      </div>

      <!-- 3. dataset:jthermometaatominfo -->
      <div class="properties-row-1col no-padding-row">
        <div class="prop-cell">
          <app-dynamic-primitive
            [structure]="getPropertyStructure('dataset:jthermometaatominfo')"
            [value]="value ? value['dataset:jthermometaatominfo'] : null"
            (valueChange)="updateProperty('dataset:jthermometaatominfo', $event)">
          </app-dynamic-primitive>
        </div>
      </div>
    </div>
      
    <app-thermodynamic-definition-root
      [structure]="structure"
      [value]="value"
      [classname]="'dataset:JThermodynamicsMetaAtomDefinitionDataSet'"
      [titleLabel]="'Meta Atom Definition Dataset: '"
      (valueChange)="updateValue($event)">
    </app-thermodynamic-definition-root>
  `,
  styles: [`
    .subclass-specific-properties {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    }
    .properties-row-2col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 8px;
      width: 100%;
    }
    .properties-row-1col {
      width: 100%;
    }
    .prop-cell {
      width: 100%;
      min-width: 0;
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
export class JThermodynamicsMetaAtomDefinitionDataSetComponent extends BaseSubclassComponent implements OnInit {
  override ngOnInit(): void {
    this.classname = 'dataset:JThermodynamicsMetaAtomDefinitionDataSet';
    super.ngOnInit();
  }
}
