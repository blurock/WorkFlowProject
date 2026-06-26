import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { BaseMinimumDatabaseObjectStructureComponent } from '../base-minimum-database-object-structure.component';

@Component({
  selector: 'app-thermodynamic-benson-rule-definition-data-set',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    forwardRef(() => DynamicPrimitiveComponent),
    BaseMinimumDatabaseObjectStructureComponent
  ],
  template: `
    <div class="dataset-container" [class.expanded]="expanded">
      <div class="dataset-header-row" (click)="toggleExpand($event)">
        <button class="expand-btn-icon" (click)="toggleExpand($event)" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <div class="dataset-summary-text">
          <span class="dataset-label">Benson Rules Dataset:</span>
          <span class="dataset-short-desc">{{ shortDescription }}</span>
        </div>
      </div>

      <div class="dataset-body" *ngIf="expanded">
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
          [classname]="'dataset:ThermodynamicBensonRuleDefinitionDataSet'"
          (valueChange)="updateValue($event)">
        </app-base-minimum-database-object-structure>
      </div>
    </div>
  `,
  styles: [`
    .dataset-container {
      border: 1px solid #cbd5e1;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      background-color: #f8fafc;
      margin: 16px 0;
      overflow: hidden;
      font-family: 'Google Sans', 'Inter', sans-serif;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    .dataset-container.expanded {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-color: #94a3b8;
    }
    .dataset-header-row {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      background-color: #f1f5f9;
      user-select: none;
      transition: background-color 0.2s;
    }
    .dataset-header-row:hover {
      background-color: #e2e8f0;
    }
    .expand-btn-icon {
      background: transparent;
      border: none;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
      margin-right: 12px;
      cursor: pointer;
      outline: none;
    }
    .expand-btn-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .dataset-summary-text {
      font-size: 0.95rem;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dataset-label {
      font-weight: 700;
      color: #475569;
    }
    .dataset-short-desc {
      font-weight: 500;
      color: #0f172a;
    }
    .dataset-body {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
      background-color: white;
    }
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
export class ThermodynamicBensonRuleDefinitionDataSetComponent extends BaseSubclassComponent implements OnInit {
  expanded = false;

  override ngOnInit(): void {
    this.classname = 'dataset:ThermodynamicBensonRuleDefinitionDataSet';
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
