import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import {
  MechanismPathSetsService,
  MechanismPathSet,
  PathSetSummaryItem
} from '../../services/mechanism-path-sets.service';
import {
  MechanismPathwaysService,
  GroupedPathway,
  groupPathwayItems,
  filterGroupedPathways
} from '../../services/mechanism-pathways.service';
import { AuthService } from '../../services/auth.service';
import { MechanismPathwayTreeComponent } from '../mechanism-pathway-tree/mechanism-pathway-tree.component';

@Component({
  selector: 'app-manage-path-sets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule,
    MatTooltipModule,
    MatDividerModule,
    MechanismPathwayTreeComponent
  ],
  templateUrl: './manage-path-sets.component.html',
  styleUrls: ['./manage-path-sets.component.scss']
})
export class ManagePathSetsComponent implements OnInit {
  public pathSetsService = inject(MechanismPathSetsService);
  public pathwaysService = inject(MechanismPathwaysService);
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Path Set Summaries
  public pathSets: PathSetSummaryItem[] = [];
  public filteredPathSets: PathSetSummaryItem[] = [];
  public searchFilter: string = '';
  public isLoadingList: boolean = false;

  // Active Path Set in Editor
  public selectedSetName: string | null = null;
  public currentSet: MechanismPathSet = this.createEmptyPathSet();
  public isEditingExisting: boolean = false;
  public isDirty: boolean = false;
  public isLoadingSet: boolean = false;
  public isSaving: boolean = false;

  // Available Pathways Catalog (for validation & autocomplete)
  public availablePathways: string[] = [];
  public availablePathwaysSet: Set<string> = new Set();
  public groupedPathways: GroupedPathway[] = [];
  public filteredGroupedPathwaysToAdd: GroupedPathway[] = [];
  public newPathInput: string = '';
  public isPathwaysLoading: boolean = false;

  ngOnInit(): void {
    this.loadPathSets();
    this.loadAvailablePathways();
  }

  public createEmptyPathSet(): MechanismPathSet {
    return {
      Name: '',
      Title: '',
      Description: '',
      TargetMolecule: '',
      Paths: [],
      Count: 0
    };
  }

  /**
   * Loads all MechanismPathSet summaries from Firestore
   */
  public loadPathSets(selectNameAfterLoad?: string): void {
    this.isLoadingList = true;
    this.pathSetsService.listPathSets().subscribe({
      next: (items) => {
        this.pathSets = items || [];
        this.applyFilter();
        this.isLoadingList = false;

        if (selectNameAfterLoad) {
          this.selectPathSet(selectNameAfterLoad);
        } else if (!this.selectedSetName && this.pathSets.length > 0) {
          // Auto-select first available set
          this.selectPathSet(this.pathSets[0].Name);
        }
      },
      error: (err) => {
        console.error('[ManagePathSets] Failed to load path sets:', err);
        this.isLoadingList = false;
        this.snackBar.open('Failed to load path sets from database.', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Loads all available mechanism pathways for validation & tree/autocomplete picker
   */
  public loadAvailablePathways(): void {
    this.isPathwaysLoading = true;
    this.pathwaysService.listPathways().subscribe({
      next: (items) => {
        this.availablePathways = (items || []).map(p => p.Name).sort((a, b) => a.localeCompare(b));
        this.availablePathwaysSet = new Set(this.availablePathways);
        this.groupedPathways = groupPathwayItems(this.availablePathways);
        this.filterPathsToAdd(this.newPathInput);
        this.isPathwaysLoading = false;
      },
      error: (err) => {
        console.error('[ManagePathSets] Failed to load pathways catalog:', err);
        this.isPathwaysLoading = false;
      }
    });
  }

  public applyFilter(): void {
    const q = (this.searchFilter || '').trim().toLowerCase();
    if (!q) {
      this.filteredPathSets = [...this.pathSets];
    } else {
      this.filteredPathSets = this.pathSets.filter(s =>
        (s.Name || '').toLowerCase().includes(q) ||
        (s.Title || '').toLowerCase().includes(q) ||
        (s.Description || '').toLowerCase().includes(q) ||
        (s.TargetMolecule || '').toLowerCase().includes(q)
      );
    }
  }

  public selectPathSet(name: string): void {
    if (this.selectedSetName === name && this.isEditingExisting) return;
    this.selectedSetName = name;
    this.isLoadingSet = true;
    this.pathSetsService.fetchPathSet(name).subscribe({
      next: (set) => {
        if (set) {
          this.currentSet = {
            ...set,
            Paths: Array.isArray(set.Paths) ? [...set.Paths] : []
          };
          this.isEditingExisting = true;
          this.isDirty = false;
        } else {
          this.snackBar.open(`Path Set '${name}' could not be loaded.`, 'Close', { duration: 3000 });
        }
        this.isLoadingSet = false;
        this.filterPathsToAdd(this.newPathInput);
      },
      error: (err) => {
        console.error(`[ManagePathSets] Failed to fetch path set ${name}:`, err);
        this.isLoadingSet = false;
        this.snackBar.open(`Failed to load '${name}'.`, 'Close', { duration: 3000 });
      }
    });
  }

  public startNewPathSet(): void {
    this.selectedSetName = null;
    this.currentSet = this.createEmptyPathSet();
    this.isEditingExisting = false;
    this.isDirty = true;
    this.filterPathsToAdd(this.newPathInput);
  }

  public duplicateCurrentSet(): void {
    const cloneName = `${this.currentSet.Name || 'NewPathSet'}_Copy`;
    this.currentSet = {
      ...this.currentSet,
      Name: cloneName,
      Title: `${this.currentSet.Title || this.currentSet.Name} (Copy)`,
      Paths: [...this.currentSet.Paths],
      scope: 'personal',
      overridesSystem: false,
      IsSystem: false
    };
    this.selectedSetName = null;
    this.isEditingExisting = false;
    this.isDirty = true;
    this.snackBar.open(`Duplicated as '${cloneName}'. Ready to edit and save.`, 'OK', { duration: 3000 });
  }

  // Pathway Autocomplete and Tree Dialog
  public filterPathsToAdd(search: string): void {
    const q = (search || '').trim().toLowerCase();
    const alreadySelected = new Set(this.currentSet.Paths);
    const unselected = this.availablePathways.filter(p => !alreadySelected.has(p));
    const grouped = groupPathwayItems(unselected);
    this.filteredGroupedPathwaysToAdd = filterGroupedPathways(grouped, q);
  }

  public onNewPathInputChange(val: string): void {
    this.newPathInput = val;
    this.filterPathsToAdd(val);
  }

  public onPathOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const val = event.option.value;
    if (val) {
      this.addPath(val);
      this.newPathInput = '';
      this.filterPathsToAdd('');
    }
  }

  public addPath(pathName?: string): void {
    const p = (pathName || this.newPathInput || '').trim();
    if (!p) return;
    if (this.currentSet.Paths.includes(p)) {
      this.snackBar.open(`Pathway '${p}' is already in this set.`, 'OK', { duration: 2000 });
      return;
    }
    this.currentSet.Paths.push(p);
    this.currentSet.Count = this.currentSet.Paths.length;
    this.newPathInput = '';
    this.isDirty = true;
    this.filterPathsToAdd('');
  }

  public removePath(p: string): void {
    const idx = this.currentSet.Paths.indexOf(p);
    if (idx >= 0) {
      this.currentSet.Paths.splice(idx, 1);
      this.currentSet.Count = this.currentSet.Paths.length;
      this.isDirty = true;
      this.filterPathsToAdd(this.newPathInput);
    }
  }

  public clearAllPaths(): void {
    this.currentSet.Paths = [];
    this.currentSet.Count = 0;
    this.isDirty = true;
    this.filterPathsToAdd(this.newPathInput);
  }

  public movePathUp(index: number): void {
    if (index > 0) {
      const temp = this.currentSet.Paths[index];
      this.currentSet.Paths[index] = this.currentSet.Paths[index - 1];
      this.currentSet.Paths[index - 1] = temp;
      this.isDirty = true;
    }
  }

  public movePathDown(index: number): void {
    if (index < this.currentSet.Paths.length - 1) {
      const temp = this.currentSet.Paths[index];
      this.currentSet.Paths[index] = this.currentSet.Paths[index + 1];
      this.currentSet.Paths[index + 1] = temp;
      this.isDirty = true;
    }
  }

  public openPathwayTreeDialog(): void {
    const dialogRef = this.dialog.open(MechanismPathwayTreeComponent, {
      width: '720px',
      data: {
        title: 'Select Mechanism Pathways for Path Set',
        pathways: this.availablePathways,
        multiSelect: true,
        selected: [...this.currentSet.Paths]
      }
    });

    dialogRef.afterClosed().subscribe((selected: string[] | string | null) => {
      if (selected) {
        const arr = Array.isArray(selected) ? selected : [selected];
        this.currentSet.Paths = [...arr];
        this.currentSet.Count = this.currentSet.Paths.length;
        this.isDirty = true;
        this.filterPathsToAdd(this.newPathInput);
        this.snackBar.open(`Updated set to ${arr.length} pathway${arr.length === 1 ? '' : 's'}.`, 'OK', { duration: 2500 });
      }
    });
  }

  public isPathKnown(p: string): boolean {
    return this.availablePathwaysSet.has(p);
  }

  // Persistence Actions
  public savePathSet(): void {
    const cleanName = (this.currentSet.Name || '').trim();
    if (!cleanName) {
      this.snackBar.open('Please provide a unique Path Set Name.', 'Close', { duration: 3000 });
      return;
    }

    if (this.currentSet.Paths.length === 0) {
      this.snackBar.open('Please add at least one mechanism pathway to the set.', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    this.pathSetsService.storePathSet(this.currentSet).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.isDirty = false;
        this.snackBar.open(`Path Set '${cleanName}' saved successfully to database!`, 'OK', { duration: 3000 });
        this.loadPathSets(cleanName);
      },
      error: (err) => {
        console.error('[ManagePathSets] Save error:', err);
        this.isSaving = false;
        const msg = err?.error?.error || 'Failed to save Path Set.';
        this.snackBar.open(`Error: ${msg}`, 'Close', { duration: 4000 });
      }
    });
  }

  public deletePathSet(): void {
    const name = this.currentSet.Name;
    if (!name) return;

    if (!confirm(`Are you sure you want to delete Path Set '${name}'?`)) {
      return;
    }

    this.pathSetsService.deletePathSet(name).subscribe({
      next: () => {
        this.snackBar.open(`Path Set '${name}' deleted.`, 'OK', { duration: 2500 });
        this.selectedSetName = null;
        this.currentSet = this.createEmptyPathSet();
        this.isEditingExisting = false;
        this.isDirty = false;
        this.loadPathSets();
      },
      error: (err) => {
        console.error('[ManagePathSets] Delete error:', err);
        const msg = err?.error?.error || 'Failed to delete Path Set.';
        this.snackBar.open(`Error: ${msg}`, 'Close', { duration: 4000 });
      }
    });
  }

  public promoteToSystem(): void {
    const name = this.currentSet.Name;
    if (!name) return;

    if (!confirm(`Promote Path Set '${name}' to the System database? It will become a read-only baseline for all users.`)) {
      return;
    }

    this.pathSetsService.promoteToSystem(name).subscribe({
      next: (res) => {
        this.snackBar.open(`Path Set '${name}' promoted to System baseline catalog!`, 'OK', { duration: 3000 });
        this.loadPathSets(name);
      },
      error: (err) => {
        console.error('[ManagePathSets] Promotion error:', err);
        const msg = err?.error?.error || 'Failed to promote Path Set.';
        this.snackBar.open(`Error: ${msg}`, 'Close', { duration: 4000 });
      }
    });
  }

  public revertOverride(): void {
    const name = this.currentSet.Name;
    if (!name) return;

    if (!confirm(`Revert personal override for '${name}'? This will restore the default System baseline version.`)) {
      return;
    }

    this.pathSetsService.revertOverride(name).subscribe({
      next: () => {
        this.snackBar.open(`Reverted personal override for '${name}'. System default restored.`, 'OK', { duration: 3000 });
        this.loadPathSets(name);
      },
      error: (err) => {
        console.error('[ManagePathSets] Revert error:', err);
        const msg = err?.error?.error || 'Failed to revert override.';
        this.snackBar.open(`Error: ${msg}`, 'Close', { duration: 4000 });
      }
    });
  }

  public getMissingPathwaysCount(): number {
    return this.currentSet.Paths.filter(p => !this.isPathKnown(p)).length;
  }
}
