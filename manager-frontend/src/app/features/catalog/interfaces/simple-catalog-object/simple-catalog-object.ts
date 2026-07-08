import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { forwardRef } from '@angular/core';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-simple-catalog-object',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="metadata-container">
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">key</mat-icon>
          <span class="one-line-summary-badge badge-blue">Catalog Metadata</span>
          <span class="one-line-summary-title">Simple Catalog Key:</span>
          <span class="one-line-summary-title" *ngIf="catalogKey && catalogKey !== 'not assigned'"> - {{ catalogKey }}</span>
          <span class="one-line-summary-placeholder" *ngIf="!catalogKey || catalogKey === 'not assigned'"> - not assigned</span>
        </div>
        <button mat-icon-button (click)="toggleExpand($event)" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">key</mat-icon>
            <span>Simple Catalog Object Details</span>
          </div>
          <button mat-icon-button (click)="toggleExpand($event)" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div class="sco-properties readonly-fields metadata-section">
          
          <!-- 1. Catalog Object Key (dataset:catalogkey) -->
          <div class="sco-property-row full-width-prop">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dataset:catalogkey']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dataset:catalogkey')" 
                  [value]="value?.['dataset:catalogkey']"
                  (valueChange)="updateValueField('dataset:catalogkey', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 2. Database Object Type (dataset:objectype) -->
          <div class="sco-property-row full-width-prop">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dataset:objectype']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dataset:objectype')" 
                  [value]="value?.['dataset:objectype']"
                  (valueChange)="updateValueField('dataset:objectype', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 3. Owner (dcterms:creator) -->
          <div class="sco-property-row">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dcterms:creator']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dcterms:creator')" 
                  [value]="value?.['dcterms:creator']"
                  (valueChange)="updateValueField('dcterms:creator', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 4. Date Created (dcterms:created) -->
          <div class="sco-property-row">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dcterms:created']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dcterms:created')" 
                  [value]="value?.['dcterms:created']"
                  (valueChange)="updateValueField('dcterms:created', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 5. Read Access (dataset:readaccess) -->
          <div class="sco-property-row">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dataset:readaccess']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dataset:readaccess')" 
                  [value]="value?.['dataset:readaccess']"
                  (valueChange)="updateValueField('dataset:readaccess', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 6. Can Modify/Delete Object (dataset:accessmodify) -->
          <div class="sco-property-row">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dataset:accessmodify']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dataset:accessmodify')" 
                  [value]="value?.['dataset:accessmodify']"
                  (valueChange)="updateValueField('dataset:accessmodify', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 7. Transaction ID (dataset:transactionid) -->
          <div class="sco-property-row full-width-prop">
            
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.['dataset:transactionid']; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="getPropertyStructure('dataset:transactionid')" 
                  [value]="value?.['dataset:transactionid']"
                  (valueChange)="updateValueField('dataset:transactionid', $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
            </div>
          </div>

          <!-- 8. Firestore Catalog ID (dataset:firestorecatalog) -->
          <div class="sco-property-row full-width-prop" *ngIf="value?.['dataset:firestorecatalog']">
            <div class="sco-prop-label">Firestore Catalog ID</div>
            <div class="sco-prop-value">
              <app-dynamic-primitive 
                [structure]="getPropertyStructure('dataset:firestorecatalog')" 
                [value]="value?.['dataset:firestorecatalog']"
                (valueChange)="updateValueField('dataset:firestorecatalog', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .sco-properties {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .sco-property-row {
      display: flex;
      flex-direction: column;
      
      border-radius: 6px;
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
    }
    .sco-prop-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
      
    }
    .sco-prop-value {
      font-size: 0.9rem;
      color: #1e293b;
    }
    .sco-empty {
      color: #94a3b8;
      font-style: italic;
    }
    .readonly-fields {
      pointer-events: none;
      opacity: 0.9;
    }
    .sco-property-row.full-width-prop {
      grid-column: 1 / -1;
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
export class SimpleCatalogObjectComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  expanded = false;

  protected override isLayoutComponent(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  toggleExpand(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  get catalogKey(): string {
    return this.value?.['dataset:catalogkey'] || 'not assigned';
  }

  override getPropertyStructure(key: string): OntologyStructure {
    if (this.structure?.properties?.[key]) {
      return this.structure.properties[key];
    }
    const isObject = key === 'dataset:firestorecatalog';
    return {
      identifier: key,
      classname: isObject ? 'dataset:FirestoreCatalogID' : 'dataset:OneLine',
      isObject,
      isArray: false,
      isOneLine: !isObject,
      label: key.split(':').pop() || key
    } as OntologyStructure;
  }

  updateValueField(key: string, newVal: any) {
    if (this.value) {
      this.value[key] = newVal;
      this.updateValue(this.value);
    }
  }

  override getData() {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data;
    this.cdr.detectChanges();
  }
}
