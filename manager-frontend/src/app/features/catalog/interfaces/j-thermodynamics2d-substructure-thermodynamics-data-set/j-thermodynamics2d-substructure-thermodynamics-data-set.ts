import { Component, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { BaseSubclassComponent } from '../base-subclass.component';
import { BaseMinimumDatabaseObjectStructureComponent } from '../base-minimum-database-object-structure.component';

@Component({
  selector: 'app-j-thermodynamics2d-substructure-thermodynamics-data-set',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    forwardRef(() => DynamicPrimitiveComponent),
    BaseMinimumDatabaseObjectStructureComponent
  ],
  template: `
    <mat-card class="dataset-card mat-elevation-z2" [class.expanded-card]="expanded">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">inventory_2</mat-icon>
        <mat-card-title>
          <span class="dataset-label">Substructure Thermodynamics Dataset: </span>
          <span class="dataset-short-desc">{{ shortDescription }}</span>
        </mat-card-title>
        <div class="spacer"></div>
        <button mat-icon-button (click)="toggleExpand($event)" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content *ngIf="expanded" class="card-content-expanded">
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
          [classname]="'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet'"
          (valueChange)="updateValue($event)">
        </app-base-minimum-database-object-structure>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .dataset-card {
      margin: 16px 0;
      border-left: 4px solid #3b82f6;
      background: white;
      overflow: visible;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .expanded-card {
      border-color: #2563eb;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .spacer {
      flex: 1;
    }
    .dataset-label {
      font-weight: 700;
      color: #475569;
    }
    .dataset-short-desc {
      font-weight: 500;
      color: #0f172a;
    }
    .card-content-expanded {
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
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
export class JThermodynamics2DSubstructureThermodynamicsDataSetComponent extends BaseSubclassComponent implements OnInit {
  expanded = false;

  override ngOnInit(): void {
    this.classname = 'dataset:JThermodynamics2DSubstructureThermodynamicsDataSet';
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
