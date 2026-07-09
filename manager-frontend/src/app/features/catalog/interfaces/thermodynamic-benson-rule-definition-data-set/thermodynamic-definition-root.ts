import { Component, OnInit, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { BaseMinimumDatabaseObjectStructureComponent } from '../base-minimum-database-object-structure.component';

@Component({
  selector: 'app-thermodynamic-definition-root',
  standalone: true,
  imports: [
    CommonModule,
    forwardRef(() => DynamicPrimitiveComponent),
    BaseMinimumDatabaseObjectStructureComponent
  ],
  template: `
    <div class="subclass-specific-properties" *ngIf="!loading">
      <div *ngFor="let key of specificSubclassKeys" class="specific-prop-row">
        <app-dynamic-primitive
          [structure]="getPropertyStructure(key)"
          [value]="value ? value[key] : null"
          (valueChange)="updateProperty(key, $event)">
        </app-dynamic-primitive>
      </div>
    </div>

    <app-base-minimum-database-object-structure
      [structure]="structure"
      [value]="value"
      [classname]="classname"
      (valueChange)="updateValue($event)">
    </app-base-minimum-database-object-structure>
  `,
  styles: [`
    .subclass-specific-properties {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .specific-prop-row {
      width: 100%;
    }
    :host {
      display: block;
      width: 100% !important;
    }
  `]
})
export class ThermodynamicDefinitionRootComponent extends BaseSubclassComponent implements OnInit {
  @Input() titleLabel: string = '';

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override resolveSpecificKeys(): void {
    super.resolveSpecificKeys();
    this.specificSubclassKeys = this.specificSubclassKeys.filter(
      key => key !== 'dataset:datasetobjecttype' && 
             key !== 'dataset:uniquegenericname' && 
             key !== 'dataset:bensonrulestructure' &&
             key !== 'dataset:substructurecorrectiontype' &&
             key !== 'dataset:2dspeciesstructure' &&
             key !== 'dataset:disassociationenergyparameter' &&
             key !== 'dataset:twodmollabel' &&
             key !== 'dataset:structuredef' &&
             key !== 'dataset:speciespectype' &&
             key !== 'dataset:jthermometaatominfo'
    );
  }
}
