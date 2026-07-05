import { Component, OnInit, OnChanges, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-activity-information',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="activity-container">
      <div *ngIf="loadingSubclass" class="loading-state">
        <mat-spinner diameter="30"></mat-spinner>
        <span class="loading-text">Loading activity template...</span>
      </div>
      
      <div *ngIf="!loadingSubclass && !subclassStructure" class="no-type-state">
        <mat-icon color="warn">warning</mat-icon>
        <span>No Database Object Type assigned to this activity record.</span>
      </div>

      <div *ngIf="!loadingSubclass && subclassStructure" class="activity-content">
        <!-- Collapsed / Single Line Preview State -->
        <div class="one-line-summary-row" *ngIf="!expanded">
          <div class="one-line-summary-text">
            <span class="one-line-summary-badge badge-green" *ngIf="activityTitle">{{ activityTitle }}</span>
            <span class="one-line-summary-title" *ngIf="getDescriptionTitle()">{{ getDescriptionTitle() }}</span>
            <span class="one-line-summary-placeholder" *ngIf="!getDescriptionTitle()">Empty Activity Record</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>

        <!-- Expanded State -->
        <div class="one-line-summary-card" *ngIf="expanded">
          <div class="one-line-summary-card-header">
            <div class="one-line-summary-card-title">
              <mat-icon color="primary">run_circle</mat-icon>
              <span>{{ activityTitle }} Details</span>
            </div>
            <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
              <mat-icon>visibility_off</mat-icon>
            </button>
          </div>
          
          <mat-divider style="margin-bottom: 16px;"></mat-divider>
          
          <div class="activity-body">
            <app-dynamic-primitive
              [structure]="subclassStructure"
              [value]="value"
              (valueChange)="updateValue($event)">
            </app-dynamic-primitive>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100% !important;
    }
    .activity-container {
      width: 100%;
      box-sizing: border-box;
      font-family: 'Google Sans', 'Inter', sans-serif;
    }
    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      color: #64748b;
    }
    .loading-text {
      font-size: 0.9rem;
    }
    .no-type-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: #b91c1c;
      font-size: 0.9rem;
    }
    .activity-body {
      width: 100%;
    }
  `]
})
export class ActivityInformationRecordComponent extends BasePrimitiveComponent implements OnInit, OnChanges {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  subclassStructure: OntologyStructure | null = null;
  loadingSubclass = false;
  currentSubclassType = '';
  expanded = false;

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getDescriptionTitle(): string {
    return this.value?.['dcterms:title'] || '';
  }

  protected override isLayoutComponent(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadSubclassTemplate();
  }

  ngOnChanges(): void {
    this.loadSubclassTemplate();
  }

  get activityTitle(): string {
    if (this.subclassStructure?.label) {
      return this.subclassStructure.label;
    }
    if (this.currentSubclassType) {
      return this.currentSubclassType.split(':').pop() || this.currentSubclassType;
    }
    return "Activity Information";
  }

  loadSubclassTemplate() {
    const objectType = this.value?.['dataset:objectype'];
    if (!objectType) {
      this.subclassStructure = null;
      this.currentSubclassType = '';
      this.cdr.detectChanges();
      return;
    }

    if (objectType === this.currentSubclassType) {
      return; // Already loaded/loading this type
    }

    this.currentSubclassType = objectType;
    this.loadingSubclass = true;
    this.cdr.detectChanges();

    this.ontologyService.getUITemplate(objectType).subscribe({
      next: (res) => {
        this.subclassStructure = res['dataobject'];
        this.loadingSubclass = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`[ActivityInformationRecordComponent] Failed loading template for ${objectType}`, err);
        this.loadingSubclass = false;
        this.subclassStructure = null;
        this.cdr.detectChanges();
      }
    });
  }

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data;
    this.loadSubclassTemplate();
    this.cdr.detectChanges();
  }
}
