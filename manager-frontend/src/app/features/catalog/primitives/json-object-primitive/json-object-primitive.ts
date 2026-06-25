import { Component, Input, OnInit, forwardRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { OntologyStructure, BasePrimitiveComponent } from '../base-primitive';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';
import { MinimumDatabaseObjectStructureComponent } from '../../interfaces/minimum-database-object/minimum-database-object';

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
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => MinimumDatabaseObjectStructureComponent)
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

          <!-- Category 5: Minimum Database Object Structure (at the end of Firebase objects) -->
          <div *ngIf="isFirebaseObject && mdoValue" class="props-mdo">
            <app-minimum-database-object-structure
              [value]="mdoValue"
              (valueChange)="updateMdoProperties($event)">
            </app-minimum-database-object-structure>
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
    .props-grid, .props-wide, .props-content, .props-recursive, .props-mdo {
      width: 100%;
    }
    .props-recursive {
      border-top: 1px solid #eee;
      padding-top: 16px;
    }
    .props-mdo {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 8px;
    }
    mat-card-header {
      margin-bottom: 12px;
    }
  `]
})
export class JsonObjectPrimitiveComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  gridProps: PropertyItem[] = [];
  wideProps: PropertyItem[] = [];
  contentProps: PropertyItem[] = [];
  recursiveProps: PropertyItem[] = [];

  isFirebaseObject = false;
  mdoValue: any = null;
  private propsInitialized = false;

  private readonly MDO_KEYS = [
    'dataset:shortdescription',
    'dataset:catobjid',
    'dataset:transactionid',
    'dataset:catalogkey',
    'dcterms:creator',
    'dcterms:created',
    'dataset:objectype',
    'dataset:readaccess',
    'dataset:accessmodify',
    'dataset:firestorecatalog'
  ];

  override get value(): any {
    return this._value;
  }
  
  override set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      if (this.isFirebaseObject) {
        this.buildMdoValue();
      }
      const hasStructureProperties = this.structure?.properties && Object.keys(this.structure.properties).length > 0;
      if (!hasStructureProperties || !this.propsInitialized) {
        this.buildProperties();
      }
      this.cdr.detectChanges();
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    
    if (!this._value || typeof this._value !== 'object') {
      this._value = {}; 
    }
    this.buildProperties();
  }

  buildProperties(): void {
    this.gridProps = [];
    this.wideProps = [];
    this.contentProps = [];
    this.recursiveProps = [];

    let properties = this.structure?.properties;
    const hasStructureProperties = properties && Object.keys(properties).length > 0;

    if (!hasStructureProperties) {
      properties = {};
      if (this._value && typeof this._value === 'object') {
        const valKeys = Object.keys(this._value).filter(k => k !== 'dcterms:identifier');
        for (const key of valKeys) {
          const val = this._value[key];
          const isValObject = val !== null && typeof val === 'object' && !Array.isArray(val);
          const isValArray = Array.isArray(val);
          properties[key] = {
            identifier: key,
            classname: isValObject ? 'dataset:JsonObject' : (isValArray ? 'dataset:JsonArray' : 'dataset:OneLine'),
            isClassification: false,
            isParagraph: false,
            isOneLine: !isValObject && !isValArray,
            isEmail: false,
            isURL: false,
            isBoolean: typeof val === 'boolean',
            isKeywordSet: false,
            isFileSource: false,
            isObject: isValObject,
            isArray: isValArray,
            label: key.split(':').pop() || key
          };
        }
      }
    }

    if (properties) {
      this.isFirebaseObject = this.MDO_KEYS.some(key => key in properties!);

      const allProps: PropertyItem[] = Object.keys(properties).map(key => ({
        key,
        structure: properties![key]
      }));

      allProps.forEach(prop => {
        const s = prop.structure;
        
        if (this.isFirebaseObject && this.MDO_KEYS.includes(prop.key)) {
          return;
        }

        if (s.isArray || s.isObject) {
          this.recursiveProps.push(prop);
        } else if (s.isParagraph) {
          this.contentProps.push(prop);
        } else if (s.isFileSource || s.isOneLine) {
          this.wideProps.push(prop);
        } else {
          this.gridProps.push(prop);
        }
      });

      if (this.isFirebaseObject) {
        this.buildMdoValue();
      }
      this.propsInitialized = true;
    }
  }

  buildMdoValue() {
    this.mdoValue = {};
    this.MDO_KEYS.forEach(key => {
      this.mdoValue[key] = this.value ? this.value[key] : null;
    });
  }

  updateMdoProperties(newMdoValue: any) {
    if (this.value) {
      const updatedValue = { ...this.value };
      this.MDO_KEYS.forEach(key => {
        updatedValue[key] = newMdoValue[key];
      });
      this.updateValue(updatedValue);
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
