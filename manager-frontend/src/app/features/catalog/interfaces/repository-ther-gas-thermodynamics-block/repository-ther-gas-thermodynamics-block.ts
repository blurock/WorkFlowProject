import { Component, OnInit, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { BaseMinimumDatabaseObjectStructureComponent } from '../base-minimum-database-object-structure.component';

@Component({
  selector: 'app-repository-ther-gas-thermodynamics-block',
  standalone: true,
  imports: [CommonModule, forwardRef(() => DynamicPrimitiveComponent), BaseMinimumDatabaseObjectStructureComponent],
  template: `
    <app-base-minimum-database-object-structure
      [structure]="structure"
      [value]="value"
      [classname]="'dataset:RepositoryTherGasThermodynamicsBlock'"
      (valueChange)="updateValue($event)">
      
      <!-- Subclass-specific properties projected at the top -->
      <div class="subclass-specific-properties" *ngIf="!loading">
        <div *ngFor="let key of specificSubclassKeys" class="specific-prop-row">
          <app-dynamic-primitive
            [structure]="getPropertyStructure(key)"
            [value]="value ? value[key] : null"
            (valueChange)="updateProperty(key, $event)">
          </app-dynamic-primitive>
        </div>
      </div>
      
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
  `]
})
export class RepositoryTherGasThermodynamicsBlockComponent extends BaseSubclassComponent implements OnInit {
  override ngOnInit(): void {
    this.classname = 'dataset:RepositoryTherGasThermodynamicsBlock';
    super.ngOnInit();
  }
}
