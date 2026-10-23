import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import {
  MechanismPathwaysService,
  ReadChainSet,
  ReadChainReactionStep,
  PathwaySummaryItem
} from '../../services/mechanism-pathways.service';
import { RxnPatternSelectionDialogComponent } from '../rxn-pattern-selection-dialog/rxn-pattern-selection-dialog.component';
import { MoleculesService } from '../../services/catalog/molecules.service';
import { CatalogItem } from '../../services/react-cloud-api.service';

@Component({
  selector: 'app-mechanism-pathway-creator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatProgressBarModule,
    MatSelectModule
  ],
  templateUrl: './mechanism-pathway-creator.component.html',
  styleUrls: ['./mechanism-pathway-creator.component.scss']
})
export class MechanismPathwayCreatorComponent implements OnInit {
  public pathwayName: string = 'AldehydeDecomposition';
  public overallAuxMolecules: string[] = ['hydroxyl-radical'];
  public steps: {
    id: number;
    name: string;
    reactionPatterns: string[];
    auxMolecules: string[];
    isExpanded: boolean;
  }[] = [];

  // Common radical presets
  public presetRadicals: string[] = [
    'hydroxyl-radical',
    'oxygen',
    'hydrogen-radical',
    'methyl-radical',
    'oxygen-radical',
    'methoxy-radical',
    'methylperoxy-radical',
    'peroxyl-radical',
    'water',
    'hydrogen-peroxide'
  ];

  public customAuxInput: string = '';
  public availableMolecules: CatalogItem[] = [];
  public filteredMolecules: CatalogItem[] = [];

  // Firestore pathways list
  public storedPathways: PathwaySummaryItem[] = [];
  public selectedPathwayToLoad: string = '';
  public isLoadingList: boolean = false;
  public isSaving: boolean = false;

  // Active preview tab
  public activePreviewTab: number = 0;

  constructor(
    private pathwayService: MechanismPathwaysService,
    private moleculesService: MoleculesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStoredPathwaysList();
    this.loadCatalogMolecules();
    this.initDefaultSteps();
  }

  public loadStoredPathwaysList(): void {
    this.isLoadingList = true;
    this.pathwayService.listPathways().subscribe({
      next: (list) => {
        this.storedPathways = list || [];
        this.isLoadingList = false;
      },
      error: (err) => {
        console.error('[PathwayCreator] Failed to load stored pathways:', err);
        this.isLoadingList = false;
      }
    });
  }

  public loadCatalogMolecules(): void {
    this.moleculesService.getCatalogList().subscribe({
      next: (mols) => {
        this.availableMolecules = mols || [];
        this.filterMolecules();
      },
      error: (err) => {
        console.warn('[PathwayCreator] Failed to load molecules catalog:', err);
      }
    });
  }

  public filterMolecules(): void {
    const q = (this.customAuxInput || '').trim().toLowerCase();
    if (!q) {
      this.filteredMolecules = this.availableMolecules.slice(0, 30);
    } else {
      this.filteredMolecules = this.availableMolecules
        .filter(m => (m.name || '').toLowerCase().includes(q))
        .slice(0, 30);
    }
  }

  public initDefaultSteps(): void {
    this.steps = [
      {
        id: 1,
        name: 'Step 1: Primary H Abstraction',
        reactionPatterns: ['H-Abstraction-Oxygen-Primary'],
        auxMolecules: ['oxygen'],
        isExpanded: true
      },
      {
        id: 2,
        name: 'Step 2: Olefin Formation',
        reactionPatterns: [
          'HLoss-ethyl-radical(hh)(hhh)-to-olefin',
          'HLoss-ethyl-radical(rh)(hhh)-to-olefin'
        ],
        auxMolecules: [],
        isExpanded: false
      }
    ];
  }

  // --- Auxiliary Molecules Management ---

  public addOverallAuxMolecule(name: string): void {
    const clean = (name || '').trim();
    if (clean && !this.overallAuxMolecules.includes(clean)) {
      this.overallAuxMolecules.push(clean);
      this.customAuxInput = '';
      this.filterMolecules();
    }
  }

  public removeOverallAuxMolecule(name: string): void {
    this.overallAuxMolecules = this.overallAuxMolecules.filter(m => m !== name);
  }

  public addStepAuxMolecule(stepIndex: number, name: string): void {
    const clean = (name || '').trim();
    if (clean && !this.steps[stepIndex].auxMolecules.includes(clean)) {
      this.steps[stepIndex].auxMolecules.push(clean);
    }
  }

  public removeStepAuxMolecule(stepIndex: number, name: string): void {
    this.steps[stepIndex].auxMolecules = this.steps[stepIndex].auxMolecules.filter(m => m !== name);
  }

  // --- Steps Management ---

  public addStep(): void {
    const newId = this.steps.length + 1;
    this.steps.push({
      id: newId,
      name: `Step ${newId}`,
      reactionPatterns: [],
      auxMolecules: [],
      isExpanded: true
    });
  }

  public removeStep(index: number): void {
    this.steps.splice(index, 1);
  }

  public moveStepUp(index: number): void {
    if (index > 0) {
      const temp = this.steps[index];
      this.steps[index] = this.steps[index - 1];
      this.steps[index - 1] = temp;
    }
  }

  public moveStepDown(index: number): void {
    if (index < this.steps.length - 1) {
      const temp = this.steps[index];
      this.steps[index] = this.steps[index + 1];
      this.steps[index + 1] = temp;
    }
  }

  public duplicateStep(index: number): void {
    const original = this.steps[index];
    const copy = {
      id: this.steps.length + 1,
      name: `${original.name} (Copy)`,
      reactionPatterns: [...original.reactionPatterns],
      auxMolecules: [...original.auxMolecules],
      isExpanded: true
    };
    this.steps.splice(index + 1, 0, copy);
  }

  public openPatternSelectionDialog(stepIndex: number): void {
    const step = this.steps[stepIndex];
    const dialogRef = this.dialog.open(RxnPatternSelectionDialogComponent, {
      width: '950px',
      maxHeight: '85vh',
      data: {
        preselectedPatterns: step.reactionPatterns,
        title: `Select Reaction Patterns for ${step.name}`
      }
    });

    dialogRef.afterClosed().subscribe((selected: string[] | undefined) => {
      if (selected && Array.isArray(selected)) {
        step.reactionPatterns = selected;
        this.snackBar.open(`Updated ${selected.length} reaction patterns for ${step.name}`, 'Dismiss', {
          duration: 3000
        });
      }
    });
  }

  public removePatternFromStep(stepIndex: number, pat: string): void {
    this.steps[stepIndex].reactionPatterns = this.steps[stepIndex].reactionPatterns.filter(p => p !== pat);
  }

  // --- ReadChainSet Conversion ---

  public buildReadChainSet(): ReadChainSet {
    const readSteps: ReadChainReactionStep[] = this.steps.map((s, idx) => ({
      ID: idx,
      Name: s.name,
      Reactions: {
        NumberOfReactions: s.reactionPatterns.length,
        Reactions: s.reactionPatterns.map((p, pIdx) => ({ ID: pIdx, Name: p }))
      },
      Molecules: {
        NumberOfMolecules: s.auxMolecules.length,
        Molecules: s.auxMolecules.map((m, mIdx) => ({ ID: mIdx, Name: m }))
      }
    }));

    const pathway: ReadChainSet = {
      Name: (this.pathwayName || 'NewPathway').trim(),
      NumberOfSteps: readSteps.length,
      ExtraMolecules: {
        NumberOfMolecules: this.overallAuxMolecules.length,
        Molecules: this.overallAuxMolecules.map((m, idx) => ({ ID: idx, Name: m }))
      },
      Steps: readSteps
    };

    return this.pathwayService.compileTotals(pathway);
  }

  public populateFromReadChainSet(pathway: ReadChainSet): void {
    this.pathwayName = pathway.Name || 'NewPathway';
    this.overallAuxMolecules = (pathway.ExtraMolecules?.Molecules || []).map(m => m.Name);

    this.steps = (pathway.Steps || []).map((s, idx) => ({
      id: idx + 1,
      name: s.Name || `Step ${idx + 1}`,
      reactionPatterns: (s.Reactions?.Reactions || []).map(r => r.Name),
      auxMolecules: (s.Molecules?.Molecules || []).map(m => m.Name),
      isExpanded: idx === 0
    }));

    if (this.steps.length === 0) {
      this.initDefaultSteps();
    }
  }

  // --- Save / Load / Export ---

  public saveToFirestore(): void {
    if (!this.pathwayName.trim()) {
      this.snackBar.open('Please specify a valid pathway name before saving.', 'Close', { duration: 4000 });
      return;
    }

    this.isSaving = true;
    const pathway = this.buildReadChainSet();

    this.pathwayService.storePathway(pathway).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.snackBar.open(`Mechanism Pathway '${this.pathwayName}' successfully saved to Firestore!`, 'Close', {
          duration: 4000
        });
        this.loadStoredPathwaysList();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('[PathwayCreator] Save error:', err);
        this.snackBar.open(`Failed to save pathway: ${err.message || 'Server error'}`, 'Close', {
          duration: 5000
        });
      }
    });
  }

  public loadSelectedPathway(): void {
    if (!this.selectedPathwayToLoad) return;
    this.isSaving = true;
    this.pathwayService.fetchPathway(this.selectedPathwayToLoad).subscribe({
      next: (pathway) => {
        this.isSaving = false;
        if (pathway) {
          this.populateFromReadChainSet(pathway);
          this.snackBar.open(`Loaded Mechanism Pathway '${pathway.Name}' from Firestore`, 'Dismiss', {
            duration: 3000
          });
        } else {
          this.snackBar.open(`Pathway '${this.selectedPathwayToLoad}' not found`, 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open(`Error fetching pathway: ${err.message}`, 'Close', { duration: 4000 });
      }
    });
  }

  public deletePathwayFromFirestore(): void {
    if (!this.selectedPathwayToLoad) return;
    const name = this.selectedPathwayToLoad;
    if (confirm(`Are you sure you want to delete '${name}' from Firestore?`)) {
      this.pathwayService.deletePathway(name).subscribe({
        next: () => {
          this.snackBar.open(`Deleted '${name}' from Firestore`, 'Close', { duration: 3000 });
          this.selectedPathwayToLoad = '';
          this.loadStoredPathwaysList();
        },
        error: (err) => {
          this.snackBar.open(`Failed to delete '${name}': ${err.message}`, 'Close', { duration: 4000 });
        }
      });
    }
  }

  public exportLsrFile(): void {
    const lsrContent = this.pathwayService.generateLsr(this.buildReadChainSet());
    const blob = new Blob([lsrContent], { type: 'text/plain;charset=utf-8' });
    const filename = `${this.pathwayName || 'MechanismPathway'}.lsr`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    this.snackBar.open(`Exported ${filename}`, 'Dismiss', { duration: 3000 });
  }

  public onImportLsrFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const parsed = this.pathwayService.parseLsr(text);
          this.populateFromReadChainSet(parsed);
          this.snackBar.open(`Imported ${file.name} with ${this.steps.length} steps`, 'Dismiss', {
            duration: 3000
          });
        }
      };
      reader.readAsText(file);
    }
  }

  public resetAll(): void {
    if (confirm('Reset editor to default values?')) {
      this.pathwayName = 'NewPathway';
      this.overallAuxMolecules = ['hydroxyl-radical'];
      this.initDefaultSteps();
    }
  }

  public getLsrPreview(): string {
    return this.pathwayService.generateLsr(this.buildReadChainSet());
  }

  public getJsonPreview(): string {
    return JSON.stringify(this.buildReadChainSet(), null, 2);
  }

  public getTotalPatternsCount(): number {
    return this.steps.reduce((sum, s) => sum + s.reactionPatterns.length, 0);
  }
}
