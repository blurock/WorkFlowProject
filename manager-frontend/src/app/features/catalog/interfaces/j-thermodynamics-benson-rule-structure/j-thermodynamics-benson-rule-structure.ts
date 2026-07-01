import { Component, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <mat-card class="structure-card mat-elevation-z2" [class.expanded-card]="expanded">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">account_tree</mat-icon>
        <mat-card-title>
          <span>{{ getLabel() }}</span>
          <span class="struct-ref-pill" *ngIf="getReference()">{{ getReference() }}</span>
        </mat-card-title>
        <div class="spacer"></div>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse details' : 'Expand details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content *ngIf="expanded" class="card-content-expanded">
        <div *ngIf="loading" class="loading-template-msg">
          Loading Benson Rule Structure template...
        </div>

        <div *ngIf="!loading">
          <div class="props-list" *ngIf="propertyKeys.length > 0">
            <div *ngFor="let key of propertyKeys" class="prop-row">
              <app-dynamic-primitive
                [structure]="getPropertyStructure(key)"
                [value]="value ? value[key] : null"
                (valueChange)="updateProperty(key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>
          <div *ngIf="propertyKeys.length === 0" class="no-props-msg">
            No detailed properties available for this Benson Rule Structure.
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .structure-card {
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
    .card-content-expanded {
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .props-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .prop-row {
      width: 100%;
    }
    .no-props-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      text-align: center;
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
