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

import { ReactCloudApiService, CatalogItem } from '../../services/react-cloud-api.service';
import { MechanismsService } from '../../services/catalog/mechanisms.service';
import { MoleculesService } from '../../services/catalog/molecules.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { MoleculeSection } from '../../models/task-list.models';
import { BensonGroupDetailComponent } from '../task-list-view/details/benson-group-detail.component';

@Component({
  selector: 'app-submechanism-creator',
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
    BensonGroupDetailComponent
  ],
  templateUrl: './submechanism-creator.component.html',
  styleUrls: ['./submechanism-creator.component.scss']
})
export class SubmechanismCreatorComponent implements OnInit {
  public molecule: string = 'propane';
  public supplement: string = 'oxygen';
  public rootName: string = 'BasicLowTemp';

  public availableMolecules: CatalogItem[] = [];
  public filteredMolecules: CatalogItem[] = [];
  public isMoleculesLoading: boolean = false;

  public availablePaths: string[] = [];
  public filteredPaths: string[] = [];
  public isPathsLoading: boolean = false;

  public presetPaths: string[] = [
    'BasicLowTemperature',
    'BasicLowTemp',
    'AlkeneFromRadical',
    'PeroxyFromHydrogenPeroxide',
    'ROOHFromPeroxylRadical',
    'BetaHPeroxyToOlefin',
    'CyclicEtherFromQOOH',
    'OlefinCarbonylFromPeroxy',
    'AlkoxyFromPeroxy',
    'AlphaHHydroPeroxylIsomerization'
  ];

  public presetSupplements: string[] = [
    'oxygen',
    'oxygen,hydrogen-peroxide',
    'oxygen,peroxyl-radical'
  ];

  public isLoading: boolean = false;
  public isDetailLoading: boolean = false;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;
  public executionLog: string | null = null;

  public mechName: string = 'propane-BasicLowTemp';
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
  ) {
    this.updateMechName();
  }

  ngOnInit(): void {
    this.loadDatabaseMolecules();
    this.loadSubmechanismPaths();
  }

  public loadDatabaseMolecules(): void {
    this.isMoleculesLoading = true;
    this.moleculesService.getCatalogList().subscribe({
      next: (items) => {
        this.availableMolecules = items || [];
        this.filterMolecules(this.molecule);
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
        this.filterPaths(this.rootName);
        this.isPathsLoading = false;
      },
      error: () => {
        this.isPathsLoading = false;
      }
    });
  }

  public filterMolecules(query: string): void {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.filteredMolecules = this.availableMolecules.slice(0, 15);
      return;
    }
    this.filteredMolecules = this.availableMolecules
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 15);
  }

  public filterPaths(query: string): void {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.filteredPaths = this.availablePaths.slice(0, 15);
      return;
    }
    this.filteredPaths = this.availablePaths
      .filter(p => p.toLowerCase().includes(q))
      .slice(0, 15);
  }

  public onMoleculeInputChange(value: string): void {
    this.molecule = value;
    this.filterMolecules(value);
    this.updateMechName();
  }

  public onMoleculeSelected(event: MatAutocompleteSelectedEvent): void {
    this.molecule = event.option.value;
    this.filterMolecules(this.molecule);
    this.updateMechName();
  }

  public onPathInputChange(value: string): void {
    this.rootName = value;
    this.filterPaths(value);
    this.updateMechName();
  }

  public onPathSelected(event: MatAutocompleteSelectedEvent): void {
    this.rootName = event.option.value;
    this.filterPaths(this.rootName);
    this.updateMechName();
  }

  public selectPresetMolecule(molName: string): void {
    this.molecule = molName;
    this.filterMolecules(this.molecule);
    this.updateMechName();
  }

  public selectPresetPath(path: string): void {
    this.rootName = path;
    this.filterPaths(this.rootName);
    this.updateMechName();
  }

  public isMoleculeInDatabase(name: string): boolean {
    const trimmed = (name || '').trim().toLowerCase();
    if (!trimmed) return false;
    return this.availableMolecules.some(item => item.name.toLowerCase() === trimmed);
  }

  public isPathInDatabase(name: string): boolean {
    const trimmed = (name || '').trim().toLowerCase();
    if (!trimmed) return false;
    return this.availablePaths.some(p => p.toLowerCase() === trimmed);
  }

  public updateMechName(): void {
    const mol = (this.molecule || '').trim();
    const root = (this.rootName || '').trim();
    if (mol && root) {
      this.mechName = `${mol}-${root}`;
    } else {
      this.mechName = mol || root || '';
    }
  }

  public selectPresetSupplement(supp: string): void {
    this.supplement = supp;
  }

  public getFullInitialMolecules(): string {
    const mol = (this.molecule || '').trim();
    const supp = (this.supplement || '').trim();
    return supp ? `${mol},${supp}` : mol;
  }

  public executeSubmechanismTask(): void {
    if (!this.molecule || !this.molecule.trim()) {
      this.snackBar.open('Please enter a molecule name (MOLECULE)', 'Close', { duration: 3000 });
      return;
    }
    if (!this.rootName || !this.rootName.trim()) {
      this.snackBar.open('Please select or enter a mechanism path (ROOTNAME)', 'Close', { duration: 3000 });
      return;
    }

    this.updateMechName();
    this.isLoading = true;
    this.errorMessage = null;
    this.executionLog = null;
    this.hasExecuted = false;
    this.selectedItem = null;
    this.itemDetailOutput = null;
    this.moleculeSections = [];

    this.snackBar.open(`Generating submechanism ${this.mechName}...`, 'Dismiss', { duration: 3000 });

    this.apiService.runSubmechanismFromPath(this.molecule.trim(), this.rootName.trim(), (this.supplement || '').trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.hasExecuted = true;
        this.mechName = res.mechName || `${this.molecule}-${this.rootName}`;
        this.executionLog = res.output;

        if (res.exitCode !== 0 && res.error) {
          this.errorMessage = res.error;
          this.snackBar.open(`Task returned error: ${res.error}`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(`Submechanism ${this.mechName} generated! Fetching database details...`, 'OK', { duration: 3000 });
          this.fetchGeneratedMechanismDetails();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasExecuted = true;
        this.errorMessage = err?.error?.error || 'Failed to execute submechanism generation task. Is REACTCLOUD API running?';
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

  public copyFullOutput(): void {
    if (!this.itemDetailOutput && !this.executionLog) return;
    const textToCopy = this.itemDetailOutput || this.executionLog || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.snackBar.open('Copied mechanism output to clipboard!', 'OK', { duration: 3000 });
    });
  }
}
