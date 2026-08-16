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

import { ReactCloudApiService, CatalogItem } from '../../services/react-cloud-api.service';
import { MechanismsService } from '../../services/catalog/mechanisms.service';
import { MoleculesService } from '../../services/catalog/molecules.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { MoleculeSection } from '../../models/task-list.models';
import { BensonGroupDetailComponent } from '../task-list-view/details/benson-group-detail.component';

export interface CreatedSubmechanism {
  mechName: string;
  pathName: string;
  molecule: string;
  supplement: string;
  exitCode: number;
  output: string;
  error?: string;
  detailOutput?: string;
  moleculeSections?: MoleculeSection[];
  sdfContent?: string | null;
  isDetailLoading?: boolean;
}

@Component({
  selector: 'app-submechanism-path-set',
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
    BensonGroupDetailComponent
  ],
  templateUrl: './submechanism-path-set.component.html',
  styleUrls: ['./submechanism-path-set.component.scss']
})
export class SubmechanismPathSetComponent implements OnInit {
  public molecule: string = 'propane';
  public supplement: string = 'oxygen';
  public mechNamePrefix: string = 'propane';

  // Initial required default path set
  public readonly INITIAL_PATHS: string[] = [
    'BetaHPeroxyToOlefin',
    'AlkoxyFromPeroxy',
    'BasicLowTemperatureV3',
    'OlefinCarbonylFromPeroxy',
    'AlkeneFromRadical',
    'CyclicEtherFromQOOH',
    'ROOHFromPeroxylRadical',
    'PeroxyFromHydrogenPeroxide',
    'AlphaHHydroPeroxylIsomerization'
  ];

  // Active user-configurable list of paths to process
  public selectedPaths: string[] = [...this.INITIAL_PATHS];

  // Input state for adding new paths
  public newPathInput: string = '';

  // Catalogs and filtering
  public availableMolecules: CatalogItem[] = [];
  public filteredMolecules: CatalogItem[] = [];
  public isMoleculesLoading: boolean = false;

  public availablePaths: string[] = [];
  public filteredPathsToAdd: string[] = [];
  public isPathsLoading: boolean = false;

  public presetSupplements: string[] = [
    'oxygen',
    'oxygen,hydrogen-peroxide',
    'oxygen,peroxyl-radical'
  ];

  // Batch execution status
  public isBatchExecuting: boolean = false;
  public currentExecutionIndex: number = 0;
  public currentExecutingPath: string | null = null;
  public executionStatusMessage: string | null = null;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;

  // Results & Pull-down state
  public createdSubmechanisms: CreatedSubmechanism[] = [];
  public selectedMechName: string = '';
  public selectedSubmechanism: CreatedSubmechanism | null = null;
  public selectedItem: CatalogItem | null = null;
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
        this.filterPathsToAdd(this.newPathInput);
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

  public filterPathsToAdd(query: string): void {
    const q = (query || '').trim().toLowerCase();
    // Exclude paths already in selectedPaths from dropdown recommendation if desired, or show all
    const remainingAvailable = this.availablePaths.filter(p => !this.selectedPaths.includes(p));
    if (!q) {
      this.filteredPathsToAdd = remainingAvailable.slice(0, 15);
      return;
    }
    this.filteredPathsToAdd = remainingAvailable
      .filter(p => p.toLowerCase().includes(q))
      .slice(0, 15);
  }

  public onMoleculeInputChange(value: string): void {
    this.molecule = value;
    this.filterMolecules(value);
  }

  public onMoleculeSelected(event: MatAutocompleteSelectedEvent): void {
    this.molecule = event.option.value;
    this.filterMolecules(this.molecule);
  }

  public onNewPathInputChange(value: string): void {
    this.newPathInput = value;
    this.filterPathsToAdd(value);
  }

  public onPathOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.addPath(event.option.value);
    this.newPathInput = '';
    this.filterPathsToAdd('');
  }

  public isMoleculeInDatabase(name: string): boolean {
    const trimmed = (name || '').trim().toLowerCase();
    if (!trimmed) return false;
    return this.availableMolecules.some(item => item.name.toLowerCase() === trimmed);
  }

  // --- Path Set Management (Add / Remove) ---

  public addPath(pathName?: string): void {
    const targetPath = (pathName || this.newPathInput || '').trim();
    if (!targetPath) {
      this.snackBar.open('Please enter or select a path name to add.', 'Close', { duration: 2500 });
      return;
    }
    if (this.selectedPaths.includes(targetPath)) {
      this.snackBar.open(`Path "${targetPath}" is already in the list.`, 'Close', { duration: 2500 });
      return;
    }
    this.selectedPaths.push(targetPath);
    this.newPathInput = '';
    this.filterPathsToAdd('');
    this.snackBar.open(`Added path "${targetPath}" to path set.`, 'OK', { duration: 2000 });
  }

  public removePath(pathName: string): void {
    const index = this.selectedPaths.indexOf(pathName);
    if (index !== -1) {
      this.selectedPaths.splice(index, 1);
      this.filterPathsToAdd(this.newPathInput);
      this.snackBar.open(`Removed path "${pathName}" from set.`, 'OK', { duration: 2000 });
    }
  }

  public resetDefaultPaths(): void {
    this.selectedPaths = [...this.INITIAL_PATHS];
    this.filterPathsToAdd(this.newPathInput);
    this.snackBar.open('Reset path set to default 9 submechanisms.', 'OK', { duration: 2500 });
  }

  public clearAllPaths(): void {
    this.selectedPaths = [];
    this.filterPathsToAdd(this.newPathInput);
    this.snackBar.open('Cleared all paths from set.', 'OK', { duration: 2000 });
  }

  public selectPresetSupplement(supp: string): void {
    this.supplement = supp;
  }

  public getFullInitialMolecules(): string {
    const mol = (this.molecule || '').trim();
    const supp = (this.supplement || '').trim();
    return supp ? `${mol},${supp}` : mol;
  }

  // --- Batch Execution Engine ---

  public executeSubmechanismTaskSet(): void {
    const targetMol = (this.molecule || '').trim();
    if (!targetMol) {
      this.snackBar.open('Please select or enter a target molecule.', 'Close', { duration: 3000 });
      return;
    }
    if (this.selectedPaths.length === 0) {
      this.snackBar.open('Please add at least one pathway to the path set.', 'Close', { duration: 3000 });
      return;
    }

    this.isBatchExecuting = true;
    this.currentExecutionIndex = 0;
    this.hasExecuted = false;
    this.errorMessage = null;
    this.createdSubmechanisms = [];
    this.selectedMechName = '';
    this.selectedSubmechanism = null;
    this.selectedItem = null;

    this.snackBar.open(`Starting batch creation for ${this.selectedPaths.length} submechanisms...`, 'Dismiss', { duration: 3000 });

    this.processNextPathInSet();
  }

  private processNextPathInSet(): void {
    if (this.currentExecutionIndex >= this.selectedPaths.length) {
      // Batch finished!
      this.isBatchExecuting = false;
      this.hasExecuted = true;
      this.currentExecutingPath = null;
      this.executionStatusMessage = `Completed generation of ${this.createdSubmechanisms.length} submechanisms!`;

      if (this.createdSubmechanisms.length > 0) {
        this.snackBar.open(`Batch execution complete! ${this.createdSubmechanisms.length} submechanisms created.`, 'View Results', { duration: 4000 });
        // Automatically select the first created submechanism and switch tab
        this.onSubmechanismPulldownChange(this.createdSubmechanisms[0].mechName);
        this.selectedTabIndex = 1;
      } else {
        this.errorMessage = 'No submechanisms could be generated.';
        this.snackBar.open('Batch completed with errors.', 'Close', { duration: 4000 });
      }
      return;
    }

    const currentPath = this.selectedPaths[this.currentExecutionIndex];
    this.currentExecutingPath = currentPath;
    const pathStepNum = this.currentExecutionIndex + 1;
    const totalSteps = this.selectedPaths.length;
    this.executionStatusMessage = `[${pathStepNum}/${totalSteps}] Generating submechanism for path: ${currentPath}...`;

    const targetMol = this.molecule.trim();
    const supp = (this.supplement || '').trim();

    this.apiService.runSubmechanismFromPath(targetMol, currentPath, supp).subscribe({
      next: (res) => {
        const derivedMechName = res.mechName || `${targetMol}-${currentPath}`;
        const createdItem: CreatedSubmechanism = {
          mechName: derivedMechName,
          pathName: currentPath,
          molecule: targetMol,
          supplement: supp,
          exitCode: res.exitCode,
          output: res.output,
          error: res.error,
          isDetailLoading: true
        };

        this.createdSubmechanisms.push(createdItem);

        // Fetch detailed mechanism output from catalog database asynchronously
        this.fetchDetailsForCreatedItem(createdItem);

        // Move to next path
        this.currentExecutionIndex++;
        this.processNextPathInSet();
      },
      error: (err) => {
        const fallbackMechName = `${targetMol}-${currentPath}`;
        const errText = err?.error?.error || `Failed to execute path ${currentPath}.`;
        const failedItem: CreatedSubmechanism = {
          mechName: fallbackMechName,
          pathName: currentPath,
          molecule: targetMol,
          supplement: supp,
          exitCode: -1,
          output: `Error executing submechanism generation for path ${currentPath}: ${errText}`,
          error: errText,
          isDetailLoading: false
        };

        this.createdSubmechanisms.push(failedItem);

        // Move to next path despite error
        this.currentExecutionIndex++;
        this.processNextPathInSet();
      }
    });
  }

  private fetchDetailsForCreatedItem(item: CreatedSubmechanism): void {
    item.isDetailLoading = true;
    this.mechanismsService.getItemDetails(item.mechName).subscribe({
      next: (detailOutput) => {
        item.detailOutput = detailOutput;
        item.sdfContent = this.chemParser.extractSdfContent(detailOutput);
        item.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(detailOutput, 'mechanisms', item.sdfContent);
        item.isDetailLoading = false;
      },
      error: (err) => {
        item.isDetailLoading = false;
        const fallbackText = item.output || `Details for ${item.mechName} could not be loaded: ${err?.error?.error || err.message}`;
        item.detailOutput = fallbackText;
        item.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(fallbackText, 'mechanisms', null);
      }
    });
  }

  // --- Pull-down List & Submechanism Display ---

  public onSubmechanismPulldownChange(mechName: string): void {
    this.selectedMechName = mechName;
    const found = this.createdSubmechanisms.find(m => m.mechName === mechName);
    if (found) {
      this.selectedSubmechanism = found;
      this.selectedItem = {
        id: `${this.createdSubmechanisms.indexOf(found) + 1}`,
        name: found.mechName,
        rawLine: `: --> ${found.mechName}`
      };

      // If details haven't loaded yet, try refetching
      if (!found.detailOutput && !found.isDetailLoading) {
        this.fetchDetailsForCreatedItem(found);
      }
    } else {
      this.selectedSubmechanism = null;
      this.selectedItem = null;
    }
  }

  public toggleAllSections(expanded: boolean): void {
    if (this.selectedSubmechanism?.moleculeSections) {
      this.selectedSubmechanism.moleculeSections.forEach(sec => sec.isExpanded = expanded);
    }
  }

  public copyCurrentOutput(): void {
    if (!this.selectedSubmechanism) return;
    const textToCopy = this.selectedSubmechanism.detailOutput || this.selectedSubmechanism.output || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.snackBar.open(`Copied output for ${this.selectedSubmechanism?.mechName} to clipboard!`, 'OK', { duration: 3000 });
    });
  }

  public getFullRawBatchLog(): string {
    return this.createdSubmechanisms.map(sub => {
      return `=======================================================\n` +
             ` SUBMECHANISM: ${sub.mechName} (Path: ${sub.pathName})\n` +
             `=======================================================\n` +
             (sub.detailOutput || sub.output || sub.error || 'No output recorded.') + `\n\n`;
    }).join('\n');
  }
}
