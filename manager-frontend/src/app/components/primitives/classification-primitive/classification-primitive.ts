import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent } from '../base-primitive';

@Component({
  selector: 'app-classification-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  template: `
    <mat-form-field appearance="outline" style="width: 100%; display: block;" floatLabel="always">
      <mat-label>{{ structure.label || structure.classname }}</mat-label>
      <mat-select [(ngModel)]="value" (selectionChange)="onSelectionChange($event.value)">
        <mat-option *ngFor="let option of options" [value]="option.id">
          {{ option.label }}
        </mat-option>
      </mat-select>
      <mat-icon matSuffix *ngIf="structure.comment" [matTooltip]="structure.comment" class="info-icon">info</mat-icon>
    </mat-form-field>
  `,
  styles: [`
    .primitive-field {
      width: 100%;
      margin-bottom: 8px;
    }
    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.38);
      cursor: help;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ClassificationPrimitiveComponent extends BasePrimitiveComponent {
  options: { id: string, label: string }[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    console.log(`Classification [${this.structure?.identifier}]: choices available:`, !!this.structure.choices);
    this.extractOptions();
  }

  private extractOptions() {
    console.log(`ClassificationPrimitive: extractOptions for ${this.structure?.identifier}`, this.structure);
    if (this.structure.choices && typeof this.structure.choices === 'object') {
      const allOptions: { id: string, label: string }[] = [];
      const tree = this.structure.choices;

      const extractRecursive = (node: any, depth: number) => {
        const classname = node['dataset:catalogtype'];
        const label = node['rdfs:label'] || classname;

        if (classname && classname !== 'dataset:NoChoices') {
          // Add indentation based on depth using non-breaking spaces
          const indent = '\u00A0\u00A0'.repeat(depth);
          allOptions.push({ id: classname, label: indent + label });
        }

        const children = node['dataset:classificationtree'];
        if (Array.isArray(children)) {
          children.forEach(child => extractRecursive(child, depth + 1));
        }
      };

      // Check if it's the tree structure from DatabaseOntologyClassification
      if (tree['dataset:classificationtree'] !== undefined) {
        if (Array.isArray(tree['dataset:classificationtree'])) {
          tree['dataset:classificationtree'].forEach((child: any) => extractRecursive(child, 0));
        } else if (tree['dataset:catalogtype']) {
          extractRecursive(tree, 0);
        }
      } else {
        // Fallback to key-value or other structures
        Object.keys(tree).forEach(key => {
          const choice = tree[key];
          let label = key;
          if (typeof choice === 'string') {
            label = choice;
          } else if (choice && typeof choice === 'object') {
            label = choice['rdfs:label'] || choice['label'] || key;
          }
          allOptions.push({ id: key, label: label });
        });
      }

      this.options = allOptions;
      console.log(`Classification [${this.structure?.identifier}]: Extracted ${this.options.length} options with hierarchy`, this.options);
    } else {
      console.warn(`Classification [${this.structure?.identifier}]: No choices found or choices not an object`, this.structure.choices);
    }
  }

  onSelectionChange(newValue: string) {
    this.updateValue(newValue);
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
  }
}
