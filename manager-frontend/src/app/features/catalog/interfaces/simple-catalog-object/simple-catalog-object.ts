import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { MatIconModule } from '@angular/material/icon';
import { forwardRef } from '@angular/core';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-simple-catalog-object',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="sco-container">
      <div class="sco-header-row" (click)="toggleExpand($event)">
        <button class="expand-btn-icon" type="button" aria-label="Toggle catalog object details">
          <mat-icon>{{ isExpanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <div class="sco-summary-text">
          <span class="sco-label">Simple Catalog Key: </span>
          <code class="sco-key-code">{{ catalogKey }}</code>
        </div>
      </div>

      <div class="sco-body" *ngIf="isExpanded">
        <div class="sco-properties readonly-fields">
          
          <!-- 1. Catalog Object Key (dataset:catalogkey) -->
          <div class="sco-property-row full-width-prop">
            <div class="sco-prop-label">Catalog Object Key</div>
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
            <div class="sco-prop-label">Database Object Type</div>
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
            <div class="sco-prop-label">Owner</div>
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
            <div class="sco-prop-label">Date Created</div>
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
            <div class="sco-prop-label">Read Access</div>
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
            <div class="sco-prop-label">Can Modify/Delete Object</div>
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
            <div class="sco-prop-label">Transaction ID</div>
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
    .sco-container {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background-color: #f8fafc;
      margin: 16px 0;
      overflow: hidden;
      font-family: 'Google Sans', 'Inter', sans-serif;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .sco-header-row {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      background-color: #f1f5f9;
      user-select: none;
      transition: background-color 0.2s;
    }
    .sco-header-row:hover {
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
    .sco-summary-text {
      font-size: 0.95rem;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sco-label {
      font-weight: 600;
      color: #475569;
    }
    .sco-key-code {
      font-family: 'Roboto Mono', monospace;
      background: #eff6ff;
      color: #2563eb;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85rem;
      border: 1px solid #bfdbfe;
    }
    .sco-body {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
      background-color: white;
    }
    .sco-properties {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .sco-property-row {
      display: flex;
      flex-direction: column;
      padding: 8px;
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
      margin-bottom: 4px;
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
  `]
})
export class SimpleCatalogObjectComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  isExpanded = false;

  protected override isLayoutComponent(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  toggleExpand(event: Event) {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
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
