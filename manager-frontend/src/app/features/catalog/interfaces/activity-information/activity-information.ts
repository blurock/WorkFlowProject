import { Component, OnInit, OnChanges, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-activity-information',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
      
        <div class="activity-header">
          <mat-icon color="primary">run_circle</mat-icon>
          <span class="activity-type-label">{{ activityTitle }}</span>
        </div>
        
        <div class="activity-body">
        
          <app-dynamic-primitive
            [structure]="subclassStructure"
            [value]="value"
            (valueChange)="updateValue($event)">
          </app-dynamic-primitive>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activity-container {
      width: 100%;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      background: #f8fafc;
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
    .activity-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .activity-type-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: #334155;
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
