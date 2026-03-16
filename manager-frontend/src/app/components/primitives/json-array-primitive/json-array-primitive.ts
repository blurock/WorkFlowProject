import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { OntologyStructure, BasePrimitiveComponent } from '../base-primitive';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';

@Component({
  selector: 'app-json-array-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDividerModule,
    MatCardModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="array-container">
      <div class="array-header">
        <span class="array-label">{{ structure.label || structure.classname }}</span>
        <span *ngIf="value.length === 0" class="empty-hint">No items added. Click + to add.</span>
        <button mat-icon-button color="primary" (click)="addItem()" matTooltip="Add Item">
          <mat-icon>add_circle</mat-icon>
        </button>
      </div>
      
      <div *ngFor="let item of value; let i = index; trackBy: trackByIndex" class="array-item">
        <div class="item-content">
          <app-dynamic-primitive 
            [structure]="elementStructure" 
            [value]="value[i]"
            (valueChange)="updateItem(i, $event)">
          </app-dynamic-primitive>
        </div>
        <div class="item-actions">
           <button mat-icon-button color="warn" (click)="removeItem(i)" matTooltip="Remove Item">
             <mat-icon>remove_circle_outline</mat-icon>
           </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .array-container {
      margin: 12px 0;
      padding: 12px;
      border: 1px dashed #ccc;
      border-radius: 8px;
    }
    .array-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .array-label {
      font-weight: 500;
      color: #555;
    }
    .empty-hint {
      color: #888;
      font-style: italic;
      font-size: 0.85rem;
      margin: 0 12px;
      flex: 1;
      text-align: right;
    }
    .array-item {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      padding: 8px;
      background: #fafafa;
      border-radius: 4px;
    }
    .item-content {
      flex: 1;
    }
    .item-actions {
      display: flex;
      align-items: flex-start;
      padding-top: 8px;
    }
  `]
})
export class JsonArrayPrimitiveComponent extends BasePrimitiveComponent implements OnInit {
  
  elementStructure!: OntologyStructure;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!Array.isArray(this.value)) {
      this.value = [];
    }
    
    // The element structure is the structure itself but without isArray=true
    // (Essentially it describes the structure of each item in the array)
    this.elementStructure = {
      ...this.structure,
      isArray: false
    };
  }

  addItem() {
    // Determine the default value for a new item
    let defaultValue: any = '';
    if (this.elementStructure.isObject) {
      defaultValue = {};
    } else if (this.elementStructure.isBoolean) {
      defaultValue = false;
    } else if (this.elementStructure.isKeywordSet) {
      defaultValue = [];
    }
    
    this.updateValue([...this.value, defaultValue]);
  }

  updateItem(index: number, newValue: any) {
    const newVal = [...this.value];
    newVal[index] = newValue;
    this.updateValue(newVal);
  }

  removeItem(index: number) {
    const newVal = [...this.value];
    newVal.splice(index, 1);
    this.updateValue(newVal);
  }

  trackByIndex(index: number) {
    return index;
  }

  override getData() {
    return this.value;
  }

  override setData(data: any) {
    this.value = Array.isArray(data) ? data : [];
  }
}
