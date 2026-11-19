import { Component, EventEmitter, Inject, Input, OnInit, Optional, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  GroupedPathway,
  PathwayVersionItem,
  groupPathwayItems,
  filterGroupedPathways
} from '../../services/mechanism-pathways.service';

export interface MechanismPathwayTreeDialogData {
  title?: string;
  pathways?: (string | { Name?: string; name?: string })[];
  groupedPathways?: GroupedPathway[];
  multiSelect?: boolean;
  selected?: string | string[];
}

export interface TreeGroupNode extends GroupedPathway {
  isExpanded: boolean;
}

@Component({
  selector: 'app-mechanism-pathway-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './mechanism-pathway-tree.component.html',
  styleUrls: ['./mechanism-pathway-tree.component.scss']
})
export class MechanismPathwayTreeComponent implements OnInit {
  @Input() pathways: (string | { Name?: string; name?: string })[] = [];
  @Input() multiSelect: boolean = false;
  @Input() selectedPathways: string[] = [];
  @Input() title: string = 'Select Mechanism Pathway';
  @Input() showHeader: boolean = true;
  @Input() showActions: boolean = true;
  @Input() defaultExpanded: boolean = false;

  @Output() pathwaySelected = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() canceled = new EventEmitter<void>();

  public treeNodes: TreeGroupNode[] = [];
  public filteredTreeNodes: TreeGroupNode[] = [];
  public selectedNames: Set<string> = new Set<string>();
  public searchQuery: string = '';
  public totalPathwaysCount: number = 0;
  public isDialogMode: boolean = false;

  constructor(
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<MechanismPathwayTreeComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: MechanismPathwayTreeDialogData
  ) {
    if (this.dialogRef && this.dialogData) {
      this.isDialogMode = true;
      if (this.dialogData.title) this.title = this.dialogData.title;
      if (this.dialogData.multiSelect !== undefined) this.multiSelect = this.dialogData.multiSelect;
      if (this.dialogData.pathways) this.pathways = this.dialogData.pathways;

      if (this.dialogData.selected) {
        if (Array.isArray(this.dialogData.selected)) {
          this.selectedPathways = [...this.dialogData.selected];
        } else if (typeof this.dialogData.selected === 'string' && this.dialogData.selected.trim()) {
          this.selectedPathways = [this.dialogData.selected.trim()];
        }
      }
    }
  }

  ngOnInit(): void {
    if (this.selectedPathways && this.selectedPathways.length > 0) {
      this.selectedPathways.forEach(p => {
        if (p) this.selectedNames.add(p.trim());
      });
    }

    this.buildTree();
  }

  public buildTree(): void {
    let grouped: GroupedPathway[] = [];

    if (this.dialogData?.groupedPathways && this.dialogData.groupedPathways.length > 0) {
      grouped = this.dialogData.groupedPathways;
    } else if (this.pathways && this.pathways.length > 0) {
      grouped = groupPathwayItems(this.pathways);
    }

    let total = 0;
    this.treeNodes = grouped.map(g => {
      total += g.versions.length;
      const hasSelectedChild = g.versions.some(v => this.selectedNames.has(v.name));
      return {
        ...g,
        isExpanded: this.defaultExpanded || hasSelectedChild // Default collapsed; open when needed or if child is selected
      };
    });
    this.totalPathwaysCount = total;
    this.applyFilter();
  }

  public onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilter();
  }

  public clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
  }

  public applyFilter(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredTreeNodes = this.treeNodes.map(node => ({
        ...node,
        versions: [...node.versions]
      }));
      return;
    }

    const results: TreeGroupNode[] = [];
    for (const node of this.treeNodes) {
      const baseMatches = node.baseName.toLowerCase().includes(q);
      const matchingVersions = node.versions.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.versionLabel.toLowerCase().includes(q) ||
        baseMatches
      );

      if (matchingVersions.length > 0) {
        results.push({
          baseName: node.baseName,
          count: matchingVersions.length,
          versions: matchingVersions,
          isExpanded: true // Auto expand matching groups
        });
      }
    }
    this.filteredTreeNodes = results;
  }

  public expandAll(): void {
    this.treeNodes.forEach(n => n.isExpanded = true);
    this.filteredTreeNodes.forEach(n => n.isExpanded = true);
  }

  public collapseAll(): void {
    this.treeNodes.forEach(n => n.isExpanded = false);
    this.filteredTreeNodes.forEach(n => n.isExpanded = false);
  }

  public toggleGroup(node: TreeGroupNode): void {
    node.isExpanded = !node.isExpanded;
    const original = this.treeNodes.find(n => n.baseName === node.baseName);
    if (original) {
      original.isExpanded = node.isExpanded;
    }
  }

  // Multi-select helpers
  public isVersionSelected(name: string): boolean {
    return this.selectedNames.has(name);
  }

  public toggleVersion(version: PathwayVersionItem): void {
    if (this.multiSelect) {
      if (this.selectedNames.has(version.name)) {
        this.selectedNames.delete(version.name);
      } else {
        this.selectedNames.add(version.name);
      }
      this.emitSelectionChange();
    } else {
      this.selectedNames.clear();
      this.selectedNames.add(version.name);
      this.pathwaySelected.emit(version.name);
      if (this.isDialogMode && this.dialogRef) {
        this.dialogRef.close(version.name);
      }
    }
  }

  public isGroupChecked(node: TreeGroupNode): boolean {
    if (!node.versions || node.versions.length === 0) return false;
    return node.versions.every(v => this.selectedNames.has(v.name));
  }

  public isGroupIndeterminate(node: TreeGroupNode): boolean {
    if (!node.versions || node.versions.length === 0) return false;
    const count = node.versions.filter(v => this.selectedNames.has(v.name)).length;
    return count > 0 && count < node.versions.length;
  }

  public toggleGroupSelection(node: TreeGroupNode): void {
    const allChecked = this.isGroupChecked(node);
    if (allChecked) {
      node.versions.forEach(v => this.selectedNames.delete(v.name));
    } else {
      node.versions.forEach(v => this.selectedNames.add(v.name));
    }
    this.emitSelectionChange();
  }

  public selectAll(): void {
    this.treeNodes.forEach(node => {
      node.versions.forEach(v => this.selectedNames.add(v.name));
    });
    this.emitSelectionChange();
  }

  public clearAll(): void {
    this.selectedNames.clear();
    this.emitSelectionChange();
  }

  public emitSelectionChange(): void {
    this.selectionChange.emit(Array.from(this.selectedNames));
  }

  public selectSingle(version: PathwayVersionItem): void {
    this.selectedNames.clear();
    this.selectedNames.add(version.name);
    this.pathwaySelected.emit(version.name);
    if (this.isDialogMode && this.dialogRef) {
      this.dialogRef.close(version.name);
    }
  }

  public copyPathwayName(name: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(name).then(() => {
      this.snackBar.open(`Copied "${name}" to clipboard`, 'OK', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open(`Failed to copy to clipboard`, 'OK', { duration: 2000 });
    });
  }

  public onConfirmDialog(): void {
    if (!this.dialogRef) return;
    if (this.multiSelect) {
      this.dialogRef.close(Array.from(this.selectedNames));
    } else {
      const first = Array.from(this.selectedNames)[0] || '';
      this.dialogRef.close(first);
    }
  }

  public onCancel(): void {
    this.canceled.emit();
    if (this.dialogRef) {
      this.dialogRef.close(null);
    }
  }
}

