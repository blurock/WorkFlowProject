import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent, OntologyStructure } from '../base-primitive';

export interface MenuNode {
  id: string;
  label: string;
  children: MenuNode[];
}

@Component({
  selector: 'app-classification-menu-node',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    forwardRef(() => ClassificationMenuNodeComponent)
  ],
  template: `
    <mat-menu #subMenu="matMenu">
      <button mat-menu-item *ngIf="isSelectableParent" (click)="selectItem(node.id)" style="font-weight: 500; font-style: italic;">
        Select: {{ node.label }}
      </button>
      
      <ng-container *ngFor="let child of node.children">
        <ng-container *ngIf="child.children.length > 0; else leaf">
          <button mat-menu-item [matMenuTriggerFor]="sub.subMenu">
            {{ child.label }}
          </button>
          <app-classification-menu-node 
            #sub 
            [node]="child" 
            (itemSelected)="selectItem($event)">
          </app-classification-menu-node>
        </ng-container>
        
        <ng-template #leaf>
          <button mat-menu-item (click)="selectItem(child.id)">
            {{ child.label }}
          </button>
        </ng-template>
      </ng-container>
    </mat-menu>
  `
})
export class ClassificationMenuNodeComponent {
  @Input() node!: MenuNode;
  @Output() itemSelected = new EventEmitter<string>();

  @ViewChild('subMenu', { static: true }) subMenu!: MatMenu;

  get isSelectableParent(): boolean {
    return this.node && this.node.id !== 'dataset:NoChoices' && !this.node.id.startsWith('Unassigned classification');
  }

  selectItem(id: string) {
    this.itemSelected.emit(id);
  }
}

@Component({
  selector: 'app-classification-primitive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    ClassificationMenuNodeComponent
  ],
  template: `
    <mat-form-field appearance="outline" style="width: 100%; display: block;" floatLabel="always" [class.filled-field]="isFilled">
      <mat-label>{{ structure.label || structure.classname }}</mat-label>
      <input matInput 
             [value]="selectedLabel" 
             readonly 
             [disabled]="menuNodes.length === 0" 
             [placeholder]="menuNodes.length === 0 ? 'Loading options...' : 'Select option'"
             [matMenuTriggerFor]="menu"
             style="cursor: pointer;"
             type="text">
      
      <mat-icon matSuffix style="color: rgba(0, 0, 0, 0.54); cursor: pointer;" [matMenuTriggerFor]="menu">arrow_drop_down</mat-icon>
      
      <mat-menu #menu="matMenu" class="classification-menu">
        <ng-container *ngFor="let node of menuNodes">
          <ng-container *ngIf="node.children.length > 0; else leaf">
            <button mat-menu-item [matMenuTriggerFor]="sub.subMenu">
              {{ node.label }}
            </button>
            <app-classification-menu-node 
              #sub 
              [node]="node" 
              (itemSelected)="onSelectionChange($event)">
            </app-classification-menu-node>
          </ng-container>
          
          <ng-template #leaf>
            <button mat-menu-item (click)="onSelectionChange(node.id)">
              {{ node.label }}
            </button>
          </ng-template>
        </ng-container>
      </mat-menu>
      
      <mat-icon matSuffix *ngIf="isFilled" class="filled-icon" matTooltip="Field is filled">check_circle</mat-icon>
      <mat-icon matSuffix *ngIf="structure.comment && !isFilled" [matTooltip]="structure.comment" class="info-icon">info</mat-icon>
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
    .filled-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
      margin-right: 4px;
    }
    .filled-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(76, 175, 80, 0.04);
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ClassificationPrimitiveComponent extends BasePrimitiveComponent implements OnInit, OnChanges {
  menuNodes: MenuNode[] = [];

  get selectedLabel(): string {
    if (!this.value) return '';
    const findLabel = (nodes: MenuNode[]): string | null => {
      for (const node of nodes) {
        if (node.id === this.value) {
          return node.label;
        }
        if (node.children && node.children.length > 0) {
          const result = findLabel(node.children);
          if (result) return result;
        }
      }
      return null;
    };
    return findLabel(this.menuNodes) || this.value;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.extractOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['structure']) {
      this.extractOptions();
    }
  }

  private extractOptions() {
    if (this.structure && this.structure.choices && typeof this.structure.choices === 'object') {
      const tree = this.structure.choices;
      const visited = new Set<string>();

      const parseNodeRecursive = (node: any): MenuNode | null => {
        const classname = node['dataset:catalogtype'];
        if (!classname || visited.has(classname)) {
          return null;
        }
        visited.add(classname);

        const label = node['rdfs:label'] || classname;
        const children: MenuNode[] = [];

        const rawChildren = node['dataset:classificationtree'];
        if (Array.isArray(rawChildren)) {
          rawChildren.forEach(child => {
            const parsedChild = parseNodeRecursive(child);
            if (parsedChild) {
              children.push(parsedChild);
            }
          });
        }

        return {
          id: classname,
          label: label,
          children: children
        };
      };

      const nodes: MenuNode[] = [];

      // Check if it's the tree structure from DatabaseOntologyClassification
      if (tree['dataset:classificationtree'] !== undefined) {
        if (Array.isArray(tree['dataset:classificationtree'])) {
          tree['dataset:classificationtree'].forEach((child: any) => {
            const parsed = parseNodeRecursive(child);
            if (parsed) {
              nodes.push(parsed);
            }
          });
        } else if (tree['dataset:catalogtype']) {
          const parsed = parseNodeRecursive(tree);
          if (parsed) {
            nodes.push(parsed);
          }
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
          nodes.push({ id: key, label: label, children: [] });
        });
      }

      this.menuNodes = nodes;
    } else {
      this.menuNodes = [];
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
