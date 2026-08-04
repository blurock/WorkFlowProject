import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { BaseMinimumDatabaseObjectStructureComponent } from '../base-minimum-database-object-structure.component';

@Component({
  selector: 'app-j-thermodynamics-symmetry-structure-definition-data-set',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => BaseMinimumDatabaseObjectStructureComponent)
  ],
  template: `
    <div class="metadata-container">
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">inventory_2</mat-icon>
          <span class="one-line-summary-badge badge-indigo">Symmetry Structure Definition Dataset</span>
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
            <span>Symmetry Structure Definition Dataset Details</span>
            <span class="one-line-summary-badge badge-indigo" style="margin-left: 8px;">{{ shortDescription }}</span>
          </div>
          <button mat-icon-button (click)="toggleExpand($event)" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div class="grid-section metadata-section">
          <!-- Subclass-specific properties projected at the top -->
          <div class="subclass-specific-properties" *ngIf="!loading">
            <!-- 1. dataset:uniquegenericname on one line -->
            <div class="no-padding-row">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:uniquegenericname')"
                [value]="value ? value['dataset:uniquegenericname'] : null"
                (valueChange)="updateProperty('dataset:uniquegenericname', $event)">
              </app-dynamic-primitive>
            </div>
            <!-- 2. dataset:symmetrydefinition -->
            <div class="no-padding-row">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:symmetrydefinition')"
                [value]="value ? value['dataset:symmetrydefinition'] : null"
                (valueChange)="updateProperty('dataset:symmetrydefinition', $event)">
              </app-dynamic-primitive>
            </div>
            <!-- 3. dataset:2dspeciesstructure -->
            <div class="no-padding-row">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:2dspeciesstructure')"
                [value]="value ? value['dataset:2dspeciesstructure'] : null"
                (valueChange)="updateProperty('dataset:2dspeciesstructure', $event)">
              </app-dynamic-primitive>
            </div>
            <!-- 4. dataset:datasetobjecttype -->
            <div class="no-padding-row">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:datasetobjecttype')"
                [value]="value ? value['dataset:datasetobjecttype'] : null"
                (valueChange)="updateProperty('dataset:datasetobjecttype', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <app-base-minimum-database-object-structure
            [structure]="structure"
            [value]="value"
            [classname]="'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet'"
            (valueChange)="updateValue($event)">
          </app-base-minimum-database-object-structure>
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
export class JThermodynamicsSymmetryStructureDefinitionDataSetComponent extends BaseSubclassComponent implements OnInit {
  expanded = false;

  override ngOnInit(): void {
    this.classname = 'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet';
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

