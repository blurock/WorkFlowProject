import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BaseSubclassComponent } from '../base-subclass.component';
import { ThermodynamicDefinitionRootComponent } from './thermodynamic-definition-root';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-thermodynamic-benson-rule-definition-data-set',
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
          <span class="one-line-summary-badge badge-indigo">Benson Rules Dataset</span>
          <span class="one-line-summary-title" *ngIf="shortDescription && shortDescription !== 'not assigned'">
            {{ shortDescription }}
          </span>
          <span class="one-line-summary-placeholder" *ngIf="!shortDescription || shortDescription === 'not assigned'">
            No Description
          </span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">inventory_2</mat-icon>
            <span>Benson Rules Dataset Details</span>
            <span class="one-line-summary-badge badge-indigo" style="margin-left: 8px;">{{ shortDescription }}</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div class="grid-section metadata-section">
          <div class="no-padding-row">
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:datasetobjecttype')"
              [value]="value ? value['dataset:datasetobjecttype'] : null"
              (valueChange)="updateProperty('dataset:datasetobjecttype', $event)">
            </app-dynamic-primitive>
          </div>
          <div class="no-padding-row">
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:uniquegenericname')"
              [value]="value ? value['dataset:uniquegenericname'] : null"
              (valueChange)="updateProperty('dataset:uniquegenericname', $event)">
            </app-dynamic-primitive>
          </div>
          <div class="no-padding-row">
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:bensonrulestructure')"
              [value]="value ? value['dataset:bensonrulestructure'] : null"
              (valueChange)="updateProperty('dataset:bensonrulestructure', $event)">
            </app-dynamic-primitive>
          </div>

          <app-thermodynamic-definition-root
            [structure]="structure"
            [value]="value"
            [classname]="'dataset:ThermodynamicBensonRuleDefinitionDataSet'"
            [titleLabel]="'Benson Rules Dataset: '"
            (valueChange)="updateValue($event)">
          </app-thermodynamic-definition-root>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100% !important;
    }
    .no-padding-row {
      width: 100%;
      padding: 0 !important;
      margin: 4 !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class ThermodynamicBensonRuleDefinitionDataSetComponent extends BaseSubclassComponent implements OnInit {
  expanded = false;

  override ngOnInit(): void {
    this.classname = 'dataset:ThermodynamicBensonRuleDefinitionDataSet';
    super.ngOnInit();
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  get shortDescription(): string {
    return this.value?.['dataset:shortdescription'] || 'not assigned';
  }
}
