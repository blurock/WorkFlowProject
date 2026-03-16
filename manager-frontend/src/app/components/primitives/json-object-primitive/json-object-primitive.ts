import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { OntologyStructure, BasePrimitiveComponent } from '../base-primitive';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';

interface PropertyItem {
  key: string;
  structure: OntologyStructure;
}

@Component({
  selector: 'app-json-object-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <mat-card class="object-card mat-elevation-z2">
      <mat-card-header *ngIf="structure.label">
        <mat-icon mat-card-avatar color="primary" *ngIf="!structure.isArray">account_tree</mat-icon>
        <mat-icon mat-card-avatar color="accent" *ngIf="structure.isArray">layers</mat-icon>
        <mat-card-title>{{ structure.label }}</mat-card-title>
        <mat-card-subtitle *ngIf="structure.comment">{{ structure.comment }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="properties-container">
          
          <!-- Category 1: Grid Primitives (Classification, Logic, Keywords) -->
          <div *ngIf="gridProps.length > 0" class="props-grid">
            <div *ngFor="let prop of gridProps; trackBy: trackByKey" class="property-cell">
              <app-dynamic-primitive 
                [structure]="prop.structure" 
                [value]="value[prop.key]"
                (valueChange)="updateProperty(prop.key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Category 2: Identification & Titles (Full Width) -->
          <div *ngIf="wideProps.length > 0" class="props-wide">
            <div *ngFor="let prop of wideProps; trackBy: trackByKey" class="property-row">
              <app-dynamic-primitive 
                [structure]="prop.structure" 
                [value]="value[prop.key]"
                (valueChange)="updateProperty(prop.key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Category 3: Content/Descriptions (Full Width) -->
          <div *ngIf="contentProps.length > 0" class="props-content">
            <div *ngFor="let prop of contentProps; trackBy: trackByKey" class="property-row">
              <app-dynamic-primitive 
                [structure]="prop.structure" 
                [value]="value[prop.key]"
                (valueChange)="updateProperty(prop.key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>

          <!-- Category 4: Recursive Elements (Arrays/Objects) (Full Width) -->
          <div *ngIf="recursiveProps.length > 0" class="props-recursive">
            <div *ngFor="let prop of recursiveProps; trackBy: trackByKey" class="property-row">
              <app-dynamic-primitive 
                [structure]="prop.structure" 
                [value]="value[prop.key]"
                (valueChange)="updateProperty(prop.key, $event)">
              </app-dynamic-primitive>
            </div>
          </div>

        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .object-card {
      margin: 12px 0;
      border-left: 4px solid #1a73e8;
      background: white;
      overflow: visible;
    }
    .properties-container {
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .props-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      width: 100%;
    }
    .property-cell {
      min-width: 0;
    }
    .property-row {
      margin-bottom: 8px;
      width: 100%;
    }
    .props-grid, .props-wide, .props-content, .props-recursive {
      width: 100%;
    }
    .props-recursive {
      border-top: 1px solid #eee;
      padding-top: 16px;
    }
    mat-card-header {
      margin-bottom: 12px;
    }
  `]
})
export class JsonObjectPrimitiveComponent extends BasePrimitiveComponent implements OnInit {
  
  gridProps: PropertyItem[] = [];
  wideProps: PropertyItem[] = [];
  contentProps: PropertyItem[] = [];
  recursiveProps: PropertyItem[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    
    if (!this._value || typeof this._value !== 'object') {
      this._value = {}; 
    }
    
    if (this.structure.properties) {
      const allProps: PropertyItem[] = Object.keys(this.structure.properties).map(key => ({
        key,
        structure: this.structure.properties![key]
      }));

      // Categorize according to user requirements
      allProps.forEach(prop => {
        const s = prop.structure;
        
        if (s.isArray || s.isObject) {
          // Arrays and Objects go last
          this.recursiveProps.push(prop);
        } else if (s.isParagraph) {
          // Paragraphs/Context go after wide title fields
          this.contentProps.push(prop);
        } else if (s.isFileSource || s.isOneLine) {
          // FileSource and OneLine occupy full width in the middle
          this.wideProps.push(prop);
        } else {
          // Keywords, Classification, Email, URL, Boolean go first in a grid
          this.gridProps.push(prop);
        }
      });
    }
  }

  updateProperty(key: string, newValue: any) {
    this.updateValue({
      ...this.value,
      [key]: newValue
    });
  }

  trackByKey(index: number, item: any) {
    return item.key;
  }

  override getData() {
    return this.value;
  }

  override setData(data: any) {
    this.value = data || {};
  }
}
