import { Component, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

@Component({
  selector: 'app-j-thermodynamics-benson-rule-structure',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
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
          <mat-icon color="primary">account_tree</mat-icon>
          <span class="one-line-summary-badge badge-gray">Benson Rule Structure</span>
          <span class="one-line-summary-title" *ngIf="getReference()">{{ getReference() }}</span>
          <span class="one-line-summary-placeholder" *ngIf="!getReference()">No Reference Info</span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">account_tree</mat-icon>
            <span>Benson Rule Structure Details</span>
            <span class="struct-ref-pill" *ngIf="getReference()">{{ getReference() }}</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div class="grid-section metadata-section" *ngIf="loading">
          <div class="loading-template-msg">Loading Benson Rule Structure template...</div>
        </div>

        <div class="grid-section metadata-section" *ngIf="!loading">
          <!-- 1. Benson Rule Ref and Center Atom in a Flex Row -->
          <div class="row-flex">
            <div class="flex-col" *ngIf="hasProperty('dataset:bensonruleref')">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:bensonruleref')"
                [value]="value ? value['dataset:bensonruleref'] : null"
                (valueChange)="updateProperty('dataset:bensonruleref', $event)">
              </app-dynamic-primitive>
            </div>
            <div class="flex-col" *ngIf="hasProperty('dataset:centeratom')">
              <app-dynamic-primitive
                [structure]="getPropertyStructure('dataset:centeratom')"
                [value]="value ? value['dataset:centeratom'] : null"
                (valueChange)="updateProperty('dataset:centeratom', $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- 2. Connect Mult Matrix row underneath -->
          <div class="matrix-row-container" *ngIf="hasProperty('dataset:connectmult')">
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:connectmult')"
              [value]="value ? value['dataset:connectmult'] : null"
              (valueChange)="updateProperty('dataset:connectmult', $event)">
            </app-dynamic-primitive>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1;
    }
    .struct-ref-pill {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.8rem;
      background: #eff6ff;
      color: #2563eb;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      font-weight: 500;
      margin-left: 12px;
    }
    .row-flex {
      display: flex;
      flex-direction: row;
      gap: 16px;
      width: 100%;
      box-sizing: border-box;
      align-items: flex-start;
    }
    @media (max-width: 600px) {
      .row-flex {
        flex-direction: column;
        gap: 8px;
      }
    }
    .flex-col {
      flex: 1;
      min-width: 0;
      width: 100%;
    }
    .matrix-row-container {
      width: 100%;
      margin-top: 8px;
    }
    .loading-template-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding: 10px;
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
export class JThermodynamicsBensonRuleStructureComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  expanded = false;

  loading = false;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }

    const hasProperties = this.structure && this.structure.properties && Object.keys(this.structure.properties).length > 0;
    if (!hasProperties) {
      const cls = this.classname || this.structure?.classname || 'dataset:JThermodynamicsBensonRuleStructure';
      this.loading = true;
      this.ontologyService.getUITemplate(cls).subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[JThermodynamicsBensonRuleStructureComponent] Failed to load template for class: ' + cls, err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.structure = this.structure;
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  getLabel(): string {
    if (this.structure?.label && !this.structure.label.startsWith('benson') && !this.structure.label.startsWith('param')) {
      return this.structure.label;
    }
    return 'Benson Rule Structure';
  }

  getReference(): string {
    if (this.value) {
      return this.value['dataset:bensonruleref'] || this.value['dataset:centeratom'] || '';
    }
    return '';
  }

  hasProperty(key: string): boolean {
    return !!(this.structure?.properties?.[key] || (this.value && this.value[key] !== undefined));
  }



  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      const updatedValue = {
        ...this.value,
        [key]: newValue
      };

      this.updateValue(updatedValue);
      this.cdr.detectChanges();
    }
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || {};
  }
}
