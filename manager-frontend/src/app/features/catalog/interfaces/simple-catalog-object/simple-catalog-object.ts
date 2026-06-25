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
          <div *ngFor="let field of fields" class="sco-property-row" [class.full-width-prop]="field.fullWidth">
            <div class="sco-prop-label">{{ field.label }}</div>
            <div class="sco-prop-value">
              <ng-container *ngIf="value?.[field.key]; else emptyVal">
                <app-dynamic-primitive 
                  [structure]="field.structure" 
                  [value]="value[field.key]"
                  (valueChange)="updateValueField(field.key, $event)">
                </app-dynamic-primitive>
              </ng-container>
              <ng-template #emptyVal><span class="sco-empty">not assigned</span></ng-template>
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

  readonly fields = [
    {
      key: 'dataset:catalogkey',
      label: 'Catalog Key',
      fullWidth: true,
      structure: {
        identifier: 'dataset:catalogkey',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'dcterms:creator',
      label: 'Owner / Creator',
      fullWidth: false,
      structure: {
        identifier: 'dcterms:creator',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'dcterms:created',
      label: 'Date Created',
      fullWidth: false,
      structure: {
        identifier: 'dcterms:created',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'dataset:objectype',
      label: 'Database Object Type',
      fullWidth: true,
      structure: {
        identifier: 'dataset:objectype',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'dataset:readaccess',
      label: 'Read Access',
      fullWidth: false,
      structure: {
        identifier: 'dataset:readaccess',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'dataset:accessmodify',
      label: 'Modify Access',
      fullWidth: false,
      structure: {
        identifier: 'dataset:accessmodify',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'transaction',
      label: 'Transaction ID',
      fullWidth: true,
      structure: {
        identifier: 'transaction',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    },
    {
      key: 'skos:inScheme',
      label: 'Data Catalog',
      fullWidth: true,
      structure: {
        identifier: 'skos:inScheme',
        classname: 'dataset:OneLine',
        isOneLine: true,
        isObject: false,
        isArray: false,
        isClassification: false,
        isParagraph: false,
        isEmail: false,
        isURL: false,
        isBoolean: false,
        isKeywordSet: false,
        isFileSource: false
      } as OntologyStructure
    }
  ];

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
