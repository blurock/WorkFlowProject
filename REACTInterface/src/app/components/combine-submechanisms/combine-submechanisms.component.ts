import { Component, OnInit } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReactCloudApiService, CatalogItem, ApiRunCombineSubmechanismResponse } from '../../services/react-cloud-api.service';
import { MechanismsService } from '../../services/catalog/mechanisms.service';
import { MoleculesService } from '../../services/catalog/molecules.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { MoleculeSection } from '../../models/task-list.models';
import { BensonGroupDetailComponent } from '../task-list-view/details/benson-group-detail.component';

export interface CombineListItem {
  name: string;
  source: 'cartesian' | 'database' | 'manual' | 'json';
  inDatabase: boolean | null;
}

@Component({
  selector: 'app-combine-submechanisms',
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
    MatTabsModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    BensonGroupDetailComponent
  ],
  templateUrl: './combine-submechanisms.component.html',
  styleUrls: ['./combine-submechanisms.component.scss']
})
export class CombineSubmechanismsComponent implements OnInit {
  // Job identification
  public rootName: string = `combine-job-${Date.now().toString().slice(-6)}`;
  public mechName: string = 'PropaneCombinedMech';

  // Master Combine List
  public combineList: CombineListItem[] = [];
  public listSearchFilter: string = '';

  // Method 1: Molecules x Paths Cartesian Grid
  public moleculeInput: string = 'propane';
  public selectedMolecules: string[] = ['propane'];

  public availableMolecules: CatalogItem[] = [];
  public filteredMoleculesToAdd: CatalogItem[] = [];
  public isMoleculesLoading: boolean = false;

  public pathInput: string = '';
  public selectedPaths: string[] = [
    'BasicLowTemp',
    'AlkeneFromRadical',
    'CyclicEtherFromQOOH',
    'ROOHFromPeroxylRadical'
  ];

  public availablePaths: string[] = [];
  public filteredPathsToAdd: string[] = [];
  public isPathsLoading: boolean = false;

  // Method 2: Direct Database Mechanism Selection
  public dbMechInput: string = '';
  public availableDbMechanisms: CatalogItem[] = [];
  public filteredDbMechanisms: CatalogItem[] = [];
  public isDbMechanismsLoading: boolean = false;

  // Method 3: JSON Import / Export
  public jsonInputText: string = '';
  public isJsonInputExpanded: boolean = false;

  // Execution & Status
  public isLoading: boolean = false;
  public isDetailLoading: boolean = false;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;
  public executionOutput: ApiRunCombineSubmechanismResponse | null = null;
  public executionLog: string | null = null;

  // Database Mechanism Detail Output (Post-Execution)
  public selectedItem: CatalogItem | null = null;
  public itemDetailOutput: string | null = null;
  public moleculeSections: MoleculeSection[] = [];
  public currentSdfContent: string | null = null;
  public selectedTabIndex: number = 0;

  constructor(
    private apiService: ReactCloudApiService,
    private mechanismsService: MechanismsService,
    private moleculesService: MoleculesService,
    private taskOutputParser: TaskOutputParserService,
    private chemParser: ChemStructureParserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDatabaseMolecules();
    this.loadSubmechanismPaths();
    this.loadDatabaseMechanisms();
  }

  // --- Catalog Loaders ---

  public loadDatabaseMolecules(): void {
    this.isMoleculesLoading = true;
    this.moleculesService.getCatalogList().subscribe({
      next: (items) => {
        this.availableMolecules = items || [];
        this.filterMoleculesToAdd(this.moleculeInput);
        this.isMoleculesLoading = false;
      },
      error: () => {
        this.isMoleculesLoading = false;
      }
    });
  }

  public loadSubmechanismPaths(): void {
    this.isPathsLoading = true;
    this.apiService.getSubmechanismPaths().subscribe({
      next: (paths) => {
        this.availablePaths = paths || [];
        this.filterPathsToAdd(this.pathInput);
        this.isPathsLoading = false;
      },
      error: () => {
        this.isPathsLoading = false;
      }
    });
  }

  public loadDatabaseMechanisms(): void {
    this.isDbMechanismsLoading = true;
    this.mechanismsService.getCatalogList().subscribe({
      next: (items) => {
        this.availableDbMechanisms = items || [];
        this.filterDbMechanisms(this.dbMechInput);
        this.isDbMechanismsLoading = false;
        // Re-validate combine list items against DB if list already populated
        this.validateCombineListAgainstDatabase();
      },
      error: () => {
        this.isDbMechanismsLoading = false;
      }
    });
  }

  // --- Filtering ---

  public filterMoleculesToAdd(query: string): void {
    const q = (query || '').trim().toLowerCase();
    const remaining = this.availableMolecules.filter(m => !this.selectedMolecules.includes(m.name));
    if (!q) {
      this.filteredMoleculesToAdd = remaining.slice(0, 15);
      return;
    }
    this.filteredMoleculesToAdd = remaining
      .filter(m => m.name.toLowerCase().includes(q))
      .slice(0, 15);
  }

  public filterPathsToAdd(query: string): void {
    const q = (query || '').trim().toLowerCase();
    const remaining = this.availablePaths.filter(p => !this.selectedPaths.includes(p));
    if (!q) {
      this.filteredPathsToAdd = remaining.slice(0, 15);
      return;
    }
    this.filteredPathsToAdd = remaining
      .filter(p => p.toLowerCase().includes(q))
      .slice(0, 15);
  }

  public filterDbMechanisms(query: string): void {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.filteredDbMechanisms = this.availableDbMechanisms.slice(0, 15);
      return;
    }
    this.filteredDbMechanisms = this.availableDbMechanisms
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 15);
  }

  // --- Method 1: Molecules x Paths Cartesian Grid Management ---

  public addMoleculeToGrid(molName?: string): void {
    const target = (molName || this.moleculeInput || '').trim();
    if (!target) return;
    if (!this.selectedMolecules.includes(target)) {
      this.selectedMolecules.push(target);
      this.snackBar.open(`Added molecule "${target}" to Cartesian grid.`, 'OK', { duration: 2000 });
    }
    this.moleculeInput = '';
    this.filterMoleculesToAdd('');
  }

  public removeMoleculeFromGrid(molName: string): void {
    const idx = this.selectedMolecules.indexOf(molName);
    if (idx !== -1) {
      this.selectedMolecules.splice(idx, 1);
      this.filterMoleculesToAdd(this.moleculeInput);
    }
  }

  public addPathToGrid(pathName?: string): void {
    const target = (pathName || this.pathInput || '').trim();
    if (!target) return;
    if (!this.selectedPaths.includes(target)) {
      this.selectedPaths.push(target);
      this.snackBar.open(`Added path "${target}" to Cartesian grid.`, 'OK', { duration: 2000 });
    }
    this.pathInput = '';
    this.filterPathsToAdd('');
  }

  public removePathFromGrid(pathName: string): void {
    const idx = this.selectedPaths.indexOf(pathName);
    if (idx !== -1) {
      this.selectedPaths.splice(idx, 1);
      this.filterPathsToAdd(this.pathInput);
    }
  }

  public addCartesianCombinations(): void {
    if (this.selectedMolecules.length === 0) {
      this.snackBar.open('Please add at least one molecule to the grid.', 'Close', { duration: 3000 });
      return;
    }
    if (this.selectedPaths.length === 0) {
      this.snackBar.open('Please add at least one mechanism path to the grid.', 'Close', { duration: 3000 });
      return;
    }

    let addedCount = 0;
    this.selectedMolecules.forEach(mol => {
      this.selectedPaths.forEach(path => {
        const comboName = `${mol.trim()}-${path.trim()}`;
        if (!this.combineList.some(item => item.name === comboName)) {
          this.combineList.push({
            name: comboName,
            source: 'cartesian',
            inDatabase: this.isNameInDatabase(comboName)
          });
          addedCount++;
        }
      });
    });

    this.snackBar.open(`Added ${addedCount} Cartesian combination(s) to combine list.`, 'OK', { duration: 3000 });
  }

  // --- Method 2: Direct Database Mechanism Picker ---

  public addDatabaseMechanism(mechName?: string): void {
    const target = (mechName || this.dbMechInput || '').trim();
    if (!target) {
      this.snackBar.open('Please select or enter a mechanism name.', 'Close', { duration: 2500 });
      return;
    }
    if (this.combineList.some(item => item.name === target)) {
      this.snackBar.open(`Mechanism "${target}" is already in the combine list.`, 'Close', { duration: 2500 });
      return;
    }

    this.combineList.push({
      name: target,
      source: 'database',
      inDatabase: this.isNameInDatabase(target)
    });
    this.dbMechInput = '';
    this.filterDbMechanisms('');
    this.snackBar.open(`Added mechanism "${target}" to combine list.`, 'OK', { duration: 2000 });
  }

  // --- Method 3: JSON Import / Export ---

  public importJsonList(): void {
    const text = (this.jsonInputText || '').trim();
    if (!text) {
      this.snackBar.open('Please paste a JSON array of mechanism names.', 'Close', { duration: 3000 });
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        this.snackBar.open('JSON input must be an array of strings.', 'Close', { duration: 4000 });
        return;
      }

      let addedCount = 0;
      parsed.forEach((item: any) => {
        if (typeof item === 'string' && item.trim()) {
          const name = item.trim();
          if (!this.combineList.some(c => c.name === name)) {
            this.combineList.push({
              name: name,
              source: 'json',
              inDatabase: this.isNameInDatabase(name)
            });
            addedCount++;
          }
        }
      });

      this.snackBar.open(`Imported ${addedCount} mechanism(s) from JSON array.`, 'OK', { duration: 3000 });
      this.jsonInputText = '';
      this.isJsonInputExpanded = false;
    } catch (err: any) {
      this.snackBar.open(`Invalid JSON format: ${err.message}`, 'Close', { duration: 4000 });
    }
  }

  public exportJsonList(): void {
    const jsonStr = JSON.stringify(this.getCombineSubmechanismsList(), null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.snackBar.open('Copied combine list JSON array to clipboard!', 'OK', { duration: 3000 });
    });
  }

  // --- Database Validation Logic ---

  public isNameInDatabase(name: string): boolean {
    if (this.availableDbMechanisms.length === 0) return true; // Default to true if catalog not yet loaded
    const trimmed = (name || '').trim().toLowerCase();
    return this.availableDbMechanisms.some(m => m.name.toLowerCase() === trimmed);
  }

  public validateCombineListAgainstDatabase(): void {
    if (this.availableDbMechanisms.length === 0) return;
    this.combineList.forEach(item => {
      item.inDatabase = this.isNameInDatabase(item.name);
    });
  }

  public getMissingDatabaseCount(): number {
    return this.combineList.filter(item => item.inDatabase === false).length;
  }

  public getVerifiedDatabaseCount(): number {
    return this.combineList.filter(item => item.inDatabase === true).length;
  }

  // --- List Management ---

  public removeCombineItem(name: string): void {
    const idx = this.combineList.findIndex(item => item.name === name);
    if (idx !== -1) {
      this.combineList.splice(idx, 1);
    }
  }

  public clearCombineList(): void {
    this.combineList = [];
    this.snackBar.open('Cleared combine submechanisms list.', 'OK', { duration: 2000 });
  }

  public getFilteredCombineList(): CombineListItem[] {
    const q = (this.listSearchFilter || '').trim().toLowerCase();
    if (!q) return this.combineList;
    return this.combineList.filter(item => item.name.toLowerCase().includes(q));
  }

  public getCombineSubmechanismsList(): string[] {
    return this.combineList.map(item => item.name);
  }

  // --- Execution & Results ---

  public executeCombineTask(): void {
    if (!this.mechName || !this.mechName.trim()) {
      this.snackBar.open('Please enter a target mechanism name (MECHNAME).', 'Close', { duration: 3000 });
      return;
    }
    if (this.combineList.length === 0) {
      this.snackBar.open('Please add submechanisms to the combine list.', 'Close', { duration: 3000 });
      return;
    }

    const submechs = this.getCombineSubmechanismsList();
    const missingCount = this.getMissingDatabaseCount();

    if (missingCount > 0) {
      this.snackBar.open(`Warning: ${missingCount} submechanism(s) in the list are missing from database. Proceeding with job...`, 'Dismiss', { duration: 4000 });
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.executionOutput = null;
    this.executionLog = null;
    this.hasExecuted = false;
    this.selectedItem = null;
    this.itemDetailOutput = null;
    this.moleculeSections = [];

    this.snackBar.open(`Executing Combine Submechanisms job (${submechs.length} items)...`, 'Dismiss', { duration: 3000 });

    this.apiService.runCombineSubmechanisms(this.rootName.trim(), this.mechName.trim(), submechs).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.hasExecuted = true;
        this.executionOutput = res;
        this.executionLog = res.output;

        if (res.exitCode !== 0 && res.error) {
          this.errorMessage = res.error;
          this.snackBar.open(`Combine task returned error: ${res.error}`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(`Mechanism ${this.mechName} successfully combined and saved to database!`, 'OK', { duration: 3500 });
          this.fetchGeneratedMechanismDetails();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasExecuted = true;
        this.errorMessage = err?.error?.error || 'Failed to execute combine submechanisms task. Is REACTCLOUD API running?';
        this.snackBar.open(`Error: ${this.errorMessage}`, 'Close', { duration: 5000 });
      }
    });
  }

  public fetchGeneratedMechanismDetails(): void {
    this.isDetailLoading = true;
    this.selectedItem = {
      id: '1',
      name: this.mechName,
      rawLine: `: --> 1: ${this.mechName}`
    };

    this.mechanismsService.getItemDetails(this.mechName).subscribe({
      next: (detailOutput) => {
        this.itemDetailOutput = detailOutput;
        this.currentSdfContent = this.chemParser.extractSdfContent(detailOutput);
        this.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(detailOutput, 'mechanisms', this.currentSdfContent);
        this.isDetailLoading = false;
        this.selectedTabIndex = 1;
      },
      error: (err) => {
        this.isDetailLoading = false;
        const fallbackText = this.executionLog || `Details for ${this.mechName} could not be loaded: ${err?.error?.error || err.message}`;
        this.itemDetailOutput = fallbackText;
        this.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(fallbackText, 'mechanisms', null);
        this.selectedTabIndex = 1;
      }
    });
  }

  public toggleAllSections(expanded: boolean): void {
    this.moleculeSections.forEach(sec => sec.isExpanded = expanded);
  }

  public copyOutputLog(): void {
    if (!this.executionLog && !this.itemDetailOutput) return;
    const textToCopy = this.itemDetailOutput || this.executionLog || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.snackBar.open('Copied mechanism output to clipboard!', 'OK', { duration: 3000 });
    });
  }
}
