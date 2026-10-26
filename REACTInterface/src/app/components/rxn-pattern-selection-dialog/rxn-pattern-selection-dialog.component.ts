import { Component, Inject, OnInit, Optional } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { RxnPatternTreeService } from '../../services/rxn-pattern-tree.service';
import { RxnPatternKetcherSearchComponent } from '../rxn-pattern-ketcher-search/rxn-pattern-ketcher-search.component';
import {
  ReactionPatternPrefixGroupNode,
  ReactionPatternClassNode,
  ReactionPatternLeafNode
} from '../../models/rxn-pattern-tree.models';

export interface RxnPatternSelectionDialogData {
  preselectedPatterns?: string[];
  title?: string;
  initialTab?: 'list' | 'pattern';
}

@Component({
  selector: 'app-rxn-pattern-selection-dialog',
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
    MatProgressBarModule,
    MatTabsModule,
    RxnPatternKetcherSearchComponent
  ],
  templateUrl: './rxn-pattern-selection-dialog.component.html',
  styleUrls: ['./rxn-pattern-selection-dialog.component.scss']
})
export class RxnPatternSelectionDialogComponent implements OnInit {
  public treeGroups: ReactionPatternPrefixGroupNode[] = [];
  public filteredGroups: ReactionPatternPrefixGroupNode[] = [];
  public selectedPatternNames: Set<string> = new Set<string>();
  public searchQuery: string = '';
  public isLoading: boolean = true;
  public totalPatternCount: number = 0;
  public selectedTabIndex: number = 0;

  constructor(
    private treeService: RxnPatternTreeService,
    @Optional() public dialogRef?: MatDialogRef<RxnPatternSelectionDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: RxnPatternSelectionDialogData
  ) {
    if (data?.preselectedPatterns && Array.isArray(data.preselectedPatterns)) {
      data.preselectedPatterns.forEach(p => this.selectedPatternNames.add(p.trim()));
    }
    if (data?.initialTab === 'pattern') {
      this.selectedTabIndex = 1;
    }
  }

  ngOnInit(): void {
    this.loadPatternTree();
  }

  public loadPatternTree(): void {
    this.isLoading = true;
    this.treeService.getThreeLevelTree().subscribe({
      next: (groups: ReactionPatternPrefixGroupNode[]) => {
        this.treeGroups = groups || [];
        this.totalPatternCount = this.treeGroups.reduce((acc, g) => acc + g.patternCount, 0);
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('[RxnPatternSelectionDialog] Failed to load reaction pattern tree:', err);
        this.isLoading = false;
      }
    });
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
      this.filteredGroups = this.treeGroups;
      return;
    }

    const filtered: ReactionPatternPrefixGroupNode[] = [];

    for (const group of this.treeGroups) {
      const groupMatches = group.prefix.toLowerCase().includes(q);
      const matchingClasses: ReactionPatternClassNode[] = [];

      for (const cls of group.classes) {
        const classMatches = cls.className.toLowerCase().includes(q);
        const matchingPatterns = cls.patterns.filter(p => p.name.toLowerCase().includes(q));

        if (classMatches || matchingPatterns.length > 0) {
          matchingClasses.push({
            ...cls,
            patterns: classMatches ? cls.patterns : matchingPatterns,
            count: classMatches ? cls.count : matchingPatterns.length,
            isExpanded: true
          });
        }
      }

      if (groupMatches || matchingClasses.length > 0) {
        filtered.push({
          ...group,
          classes: groupMatches ? group.classes : matchingClasses,
          classCount: groupMatches ? group.classCount : matchingClasses.length,
          patternCount: groupMatches
            ? group.patternCount
            : matchingClasses.reduce((acc, c) => acc + c.patterns.length, 0),
          isExpanded: true
        });
      }
    }

    this.filteredGroups = filtered;
  }

  // --- Checkbox Cascading Logic ---

  public isPatternSelected(patName: string): boolean {
    return this.selectedPatternNames.has(patName);
  }

  public togglePattern(patName: string): void {
    if (this.selectedPatternNames.has(patName)) {
      this.selectedPatternNames.delete(patName);
    } else {
      this.selectedPatternNames.add(patName);
    }
  }

  public isClassChecked(cls: ReactionPatternClassNode): boolean {
    if (!cls.patterns || cls.patterns.length === 0) return false;
    return cls.patterns.every(p => this.selectedPatternNames.has(p.name));
  }

  public isClassIndeterminate(cls: ReactionPatternClassNode): boolean {
    if (!cls.patterns || cls.patterns.length === 0) return false;
    const selectedCount = cls.patterns.filter(p => this.selectedPatternNames.has(p.name)).length;
    return selectedCount > 0 && selectedCount < cls.patterns.length;
  }

  public toggleClass(cls: ReactionPatternClassNode): void {
    const allChecked = this.isClassChecked(cls);
    if (allChecked) {
      cls.patterns.forEach(p => this.selectedPatternNames.delete(p.name));
    } else {
      cls.patterns.forEach(p => this.selectedPatternNames.add(p.name));
    }
  }

  public isPrefixGroupChecked(group: ReactionPatternPrefixGroupNode): boolean {
    const allPatterns = this.getAllPatternsInGroup(group);
    if (allPatterns.length === 0) return false;
    return allPatterns.every(p => this.selectedPatternNames.has(p.name));
  }

  public isPrefixGroupIndeterminate(group: ReactionPatternPrefixGroupNode): boolean {
    const allPatterns = this.getAllPatternsInGroup(group);
    if (allPatterns.length === 0) return false;
    const selectedCount = allPatterns.filter(p => this.selectedPatternNames.has(p.name)).length;
    return selectedCount > 0 && selectedCount < allPatterns.length;
  }

  public togglePrefixGroup(group: ReactionPatternPrefixGroupNode): void {
    const allPatterns = this.getAllPatternsInGroup(group);
    const allChecked = this.isPrefixGroupChecked(group);
    if (allChecked) {
      allPatterns.forEach(p => this.selectedPatternNames.delete(p.name));
    } else {
      allPatterns.forEach(p => this.selectedPatternNames.add(p.name));
    }
  }

  private getAllPatternsInGroup(group: ReactionPatternPrefixGroupNode): ReactionPatternLeafNode[] {
    const list: ReactionPatternLeafNode[] = [];
    for (const cls of group.classes) {
      if (cls.patterns) {
        list.push(...cls.patterns);
      }
    }
    return list;
  }

  // --- Mass Selection Actions ---

  public selectAll(): void {
    for (const group of this.treeGroups) {
      for (const cls of group.classes) {
        for (const pat of cls.patterns) {
          this.selectedPatternNames.add(pat.name);
        }
      }
    }
  }

  public clearAll(): void {
    this.selectedPatternNames.clear();
  }

  public expandAll(): void {
    for (const group of this.filteredGroups) {
      group.isExpanded = true;
      for (const cls of group.classes) {
        cls.isExpanded = true;
      }
    }
  }

  public collapseAll(): void {
    for (const group of this.filteredGroups) {
      group.isExpanded = false;
      for (const cls of group.classes) {
        cls.isExpanded = false;
      }
    }
  }

  public onKetcherSelectionChange(names: string[]): void {
    if (Array.isArray(names)) {
      names.forEach(n => this.selectedPatternNames.add(n));
    }
  }

  public getSelectedPatternsArray(): string[] {
    return Array.from(this.selectedPatternNames);
  }

  public onConfirm(): void {
    if (this.dialogRef) {
      this.dialogRef.close(Array.from(this.selectedPatternNames));
    }
  }

  public onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(undefined);
    }
  }
}
