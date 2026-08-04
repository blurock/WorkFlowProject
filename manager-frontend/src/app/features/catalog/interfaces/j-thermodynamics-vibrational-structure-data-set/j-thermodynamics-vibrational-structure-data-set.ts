import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { ThermodynamicDefinitionRootComponent } from '../thermodynamic-benson-rule-definition-data-set/thermodynamic-definition-root';

@Component({
  selector: 'app-j-thermodynamics-vibrational-structure-data-set',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => ThermodynamicDefinitionRootComponent)
  ],
  template: `
    <div class="metadata-container">
   
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">inventory_2</mat-icon>
          <span class="one-line-summary-badge badge-indigo">Vibrational Structure Dataset</span>
          <span class="one-line-summary-title" *ngIf="shortDescription && shortDescription !== 'not assigned'">
            {{ shortDescription }}
          </span>
          <span class="one-line-summary-placeholder" *ngIf="!shortDescription || shortDescription === 'not assigned'">
            No Description
          </span>
        </div>
        <button mat-icon-button (click)="toggleExpand($event)" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">inventory_2</mat-icon>
            <span>Vibrational Structure Dataset Details</span>
            <span class="one-line-summary-badge badge-indigo" style="margin-left: 8px;">{{ shortDescription }}</span>
          </div>
          <button mat-icon-button (click)="toggleExpand($event)" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div class="grid-section metadata-section">
          <div class="subclass-specific-properties" *ngIf="!loading">
            <!-- Row 1: dataset:uniquegenericname on one line -->
            <div class="properties-row-1col no-padding-row">
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:uniquegenericname')"
                  [value]="value ? value['dataset:uniquegenericname'] : null"
                  (valueChange)="updateProperty('dataset:uniquegenericname', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- Row 2: dataset:vibrationmodelabel and dataset:vibrationsymmetry (vibrationmodelabel 3/4 of the line) -->
            <div class="properties-row-3-1 no-padding-row">
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:vibrationmodelabel')"
                  [value]="value ? value['dataset:vibrationmodelabel'] : null"
                  (valueChange)="updateProperty('dataset:vibrationmodelabel', $event)">
                </app-dynamic-primitive>
              </div>
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:vibrationsymmetry')"
                  [value]="value ? value['dataset:vibrationsymmetry'] : null"
                  (valueChange)="updateProperty('dataset:vibrationsymmetry', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- Row 3: dataset:vibrationalfrequency -->
            <div class="properties-row-1col no-padding-row">
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:vibrationalfrequency')"
                  [value]="value ? value['dataset:vibrationalfrequency'] : null"
                  (valueChange)="updateProperty('dataset:vibrationalfrequency', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- Row 4: dataset:2dspeciesstructure -->
            <div class="properties-row-1col no-padding-row">
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:2dspeciesstructure')"
                  [value]="value ? value['dataset:2dspeciesstructure'] : null"
                  (valueChange)="updateProperty('dataset:2dspeciesstructure', $event)">
                </app-dynamic-primitive>
              </div>
            </div>

            <!-- Row 5: dataset:datasetobjecttype -->
            <div class="properties-row-1col no-padding-row">
              <div class="prop-cell">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure('dataset:datasetobjecttype')"
                  [value]="value ? value['dataset:datasetobjecttype'] : null"
                  (valueChange)="updateProperty('dataset:datasetobjecttype', $event)">
                </app-dynamic-primitive>
              </div>
            </div>
          </div>

          <app-thermodynamic-definition-root
            [structure]="structure"
            [value]="value"
            [classname]="'dataset:JThermodynamicsVibrationalStructureDataSet'"
            [titleLabel]="'Vibrational Structure Dataset: '"
            (valueChange)="updateValue($event)">
          </app-thermodynamic-definition-root>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subclass-specific-properties {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }
    .properties-row-3-1 {
      display: grid;
      grid-template-columns: 3fr 1fr;
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
    :host {
      display: block;
      width: 100% !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class JThermodynamicsVibrationalStructureDataSetComponent extends BaseSubclassComponent implements OnInit {
  expanded = false;

  override ngOnInit(): void {
    this.classname = 'dataset:JThermodynamicsVibrationalStructureDataSet';
    super.ngOnInit();
  }

  toggleExpand(event: Event): void {
    event.stopPropagation();
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  get shortDescription(): string {
    return this.value?.['dataset:shortdescription'] || 'not assigned';
  }
}
