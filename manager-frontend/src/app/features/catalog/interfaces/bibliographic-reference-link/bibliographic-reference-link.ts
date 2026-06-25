import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forwardRef } from '@angular/core';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-bibliographic-reference-link',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <mat-card class="ref-card mat-elevation-z1" [class.expanded-card]="expanded">
      <mat-card-header class="ref-header">
        <mat-icon mat-card-avatar color="primary">menu_book</mat-icon>
        <mat-card-title class="ref-title">
          <span>Bibliographic Link Type:</span>
          <code class="ref-link-type">{{ linkType }}</code>
        </mat-card-title>
        <div class="spacer"></div>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse reference details' : 'Expand reference details'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content *ngIf="expanded" class="ref-body">
        <div class="ref-properties">
          <div *ngFor="let key of propertyKeys" class="ref-prop-row">
            <div class="ref-prop-label">{{ getLabel(key) }}</div>
            <div class="ref-prop-value">
              <app-dynamic-primitive 
                [structure]="getPropertyStructure(key)" 
                [value]="value ? value[key] : null"
                (valueChange)="updateProperty(key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ref-card {
      margin: 8px 0;
      border-left: 4px solid #3b82f6;
      background: #fafafa;
      transition: all 0.2s ease-in-out;
    }
    .expanded-card {
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .ref-header {
      display: flex;
      align-items: center;
    }
    .ref-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ref-link-type {
      font-family: 'Roboto Mono', monospace;
      background: #eff6ff;
      color: #2563eb;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85rem;
      border: 1px solid #bfdbfe;
    }
    .spacer {
      flex: 1;
    }
    .ref-body {
      padding: 12px 16px;
      border-top: 1px solid #f1f5f9;
    }
    .ref-properties {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ref-prop-row {
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #f1f5f9;
    }
    .ref-prop-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .ref-prop-value {
      font-size: 0.9rem;
      color: #1e293b;
    }
  `]
})
export class BibliographicReferenceLinkComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  expanded = false;

  override ngOnInit(): void {
    super.ngOnInit();
  }

  toggleExpand() {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  get linkType(): string {
    return this.value?.['dataset:bibliographiclinktype'] || 'not assigned';
  }

  get propertyKeys(): string[] {
    if (this.value) {
      return Object.keys(this.value);
    }
    return [];
  }

  getLabel(key: string): string {
    const parts = key.split(':');
    const term = parts.pop() || key;
    return term.charAt(0).toUpperCase() + term.slice(1).replace(/([A-Z])/g, ' $1');
  }

  getPropertyStructure(key: string): OntologyStructure {
    // Generate an fallback structure for nested fields in BibliographicReference
    const isArray = Array.isArray(this.value?.[key]);
    const isObject = !isArray && typeof this.value?.[key] === 'object' && this.value?.[key] !== null;

    return {
      identifier: key,
      classname: isObject ? 'dataset:Object' : 'dataset:OneLine',
      isOneLine: !isObject && !isArray,
      isObject: isObject,
      isArray: isArray,
      isClassification: false,
      isParagraph: false,
      isEmail: false,
      isURL: false,
      isBoolean: false,
      isKeywordSet: false,
      isFileSource: false
    };
  }

  updateProperty(key: string, newValue: any) {
    if (this.value) {
      this.value[key] = newValue;
      this.updateValue(this.value);
      this.cdr.detectChanges();
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
