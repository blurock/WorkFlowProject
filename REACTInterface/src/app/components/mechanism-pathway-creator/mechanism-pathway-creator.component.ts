import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';

import {
  MechanismPathwaysService,
  ReadChainSet,
  ReadChainReactionStep,
  PathwaySummaryItem
} from '../../services/mechanism-pathways.service';
import { RxnPatternSelectionDialogComponent } from '../rxn-pattern-selection-dialog/rxn-pattern-selection-dialog.component';
import { MoleculesService } from '../../services/catalog/molecules.service';
import { CatalogItem, ReactCloudApiService } from '../../services/react-cloud-api.service';
import { ReactionPatternLsrService } from '../../services/reaction-pattern-lsr.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { MechReactionClassGroup, MechSdfBlock } from '../../models/task-list.models';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';

export interface MechanismPathwayStep {
  id: number;
  name: string;
  reactionPatterns: string[];
  auxMolecules: string[];
  inputMolecules: string[];
  isExpanded: boolean;
  status: 'draft' | 'running' | 'tested' | 'accepted';
  isExecuting?: boolean;
  hasExecuted?: boolean;
  executionError?: string | null;
  executionOutput?: string | null;
  generatedReactions?: MechReactionClassGroup[];
  generatedMolecules?: MechSdfBlock[];
}

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
    MatSelectModule,
    MatDividerModule,
    KetcherViewerComponent
  ],
  templateUrl: './mechanism-pathway-creator.component.html',
  styleUrls: ['./mechanism-pathway-creator.component.scss']
})
export class MechanismPathwayCreatorComponent implements OnInit {
  @ViewChild('moleculePreviewDialog') moleculePreviewDialogRef!: TemplateRef<any>;

  public pathwayName: string = 'AldehydeDecomposition';

  // Target Molecule
  public targetMolecule: string = 'butane';
  public targetPresets: string[] = ['butane', 'propane', 'isobutane', 'cyclohexane', 'ethane', 'methane'];
  public customTargetInput: string = '';

  // Overall Auxiliary Radicals / Molecules (ExtraMolecules)
  public overallAuxMolecules: string[] = ['hydroxyl-radical'];
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
  public filteredTargetMolecules: CatalogItem[] = [];

  // Sequential Steps Pipeline
  public steps: MechanismPathwayStep[] = [];

  // Firestore pathways list & loader UI toggle
  public storedPathways: PathwaySummaryItem[] = [];
  public selectedPathwayToLoad: string = '';
  public isLoadingList: boolean = false;
  public isSaving: boolean = false;
  public showExistingLoader: boolean = false;

  // Active preview tab
  public activePreviewTab: number = 0;

  // 2D Molecule Ketcher Modal State
  public previewModalMolName: string = '';
  public previewModalSdf: string = '';
  public isLoadingStructurePreview: boolean = false;

  constructor(
    private pathwayService: MechanismPathwaysService,
    private moleculesService: MoleculesService,
    private reactCloudApi: ReactCloudApiService,
    private lsrService: ReactionPatternLsrService,
    private taskOutputParser: TaskOutputParserService,
    private chemParser: ChemStructureParserService,
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
        this.filterTargetMolecules();
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

  public filterTargetMolecules(): void {
    const q = (this.customTargetInput || '').trim().toLowerCase();
    if (!q) {
      this.filteredTargetMolecules = this.availableMolecules.slice(0, 30);
    } else {
      this.filteredTargetMolecules = this.availableMolecules
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
        inputMolecules: ['butane', 'hydroxyl-radical'],
        isExpanded: true,
        status: 'draft'
      },
      {
        id: 2,
        name: 'Step 2: Olefin Formation',
        reactionPatterns: [
          'HLoss-ethyl-radical(hh)(hhh)-to-olefin',
          'HLoss-ethyl-radical(rh)(hhh)-to-olefin'
        ],
        auxMolecules: [],
        inputMolecules: [],
        isExpanded: false,
        status: 'draft'
      }
    ];
  }

  // --- Initial Action Buttons (Dual Paths) ---

  public createNewPathway(): void {
    this.pathwayName = 'NewPathway';
    this.targetMolecule = 'butane';
    this.customTargetInput = 'butane';
    this.overallAuxMolecules = ['hydroxyl-radical'];
    this.steps = [
      {
        id: 1,
        name: 'Step 1: Primary H Abstraction',
        reactionPatterns: ['H-Abstraction-Oxygen-Primary'],
        auxMolecules: ['oxygen'],
        inputMolecules: ['butane', 'hydroxyl-radical'],
        isExpanded: true,
        status: 'draft'
      }
    ];
    this.snackBar.open('New mechanism pathway created. Configure Step 1 to begin.', 'OK', { duration: 3000 });
  }

  public toggleExistingLoader(): void {
    this.showExistingLoader = !this.showExistingLoader;
  }

  // --- Target Molecule Management ---

  public setTargetMolecule(name: string): void {
    const clean = (name || '').trim();
    if (!clean) return;
    this.targetMolecule = clean;
    this.customTargetInput = clean;

    // Keep Step 1 input synchronized if still in draft
    if (this.steps.length > 0 && this.steps[0].status === 'draft') {
      this.steps[0].inputMolecules = [this.targetMolecule, ...this.overallAuxMolecules];
    }
  }

  // --- Auxiliary Molecules Management ---

  public addOverallAuxMolecule(name: string): void {
    const clean = (name || '').trim();
    if (clean && !this.overallAuxMolecules.includes(clean)) {
      this.overallAuxMolecules.push(clean);
      this.customAuxInput = '';
      this.filterMolecules();

      if (this.steps.length > 0 && this.steps[0].status === 'draft') {
        this.steps[0].inputMolecules = [this.targetMolecule, ...this.overallAuxMolecules];
      }
    }
  }

  public removeOverallAuxMolecule(name: string): void {
    this.overallAuxMolecules = this.overallAuxMolecules.filter(m => m !== name);
    if (this.steps.length > 0 && this.steps[0].status === 'draft') {
      this.steps[0].inputMolecules = [this.targetMolecule, ...this.overallAuxMolecules];
    }
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

  // --- Step Input Molecules Management ---

  public getEffectiveInputMolecules(stepIndex: number): string[] {
    const step = this.steps[stepIndex];
    if (!step) return [];
    if (step.inputMolecules && step.inputMolecules.length > 0) {
      return step.inputMolecules;
    }
    if (stepIndex === 0) {
      const target = this.targetMolecule || 'butane';
      return [target, ...this.overallAuxMolecules].filter(Boolean);
    }
    const prevStep = this.steps[stepIndex - 1];
    if (prevStep?.generatedMolecules && prevStep.generatedMolecules.length > 0) {
      return prevStep.generatedMolecules.map(m => m.moleculeName).filter(Boolean);
    }
    return [this.targetMolecule || 'butane', ...this.overallAuxMolecules].filter(Boolean);
  }

  public addStepInputMolecule(stepIndex: number, mol: string): void {
    const clean = (mol || '').trim();
    if (!clean) return;
    const step = this.steps[stepIndex];
    if (!step.inputMolecules) {
      step.inputMolecules = [...this.getEffectiveInputMolecules(stepIndex)];
    }
    if (!step.inputMolecules.includes(clean)) {
      step.inputMolecules.push(clean);
    }
  }

  public removeStepInputMolecule(stepIndex: number, mol: string): void {
    const step = this.steps[stepIndex];
    if (!step.inputMolecules) {
      step.inputMolecules = [...this.getEffectiveInputMolecules(stepIndex)];
    }
    step.inputMolecules = step.inputMolecules.filter(m => m !== mol);
  }

  // --- Step Lifecycle & Reordering ---

  public addStep(): void {
    const newId = this.steps.length + 1;
    // Cascade output molecules from the latest completed step if available
    let cascadedInputs: string[] = [];
    if (this.steps.length > 0) {
      const prev = this.steps[this.steps.length - 1];
      if (prev.generatedMolecules && prev.generatedMolecules.length > 0) {
        cascadedInputs = prev.generatedMolecules.map(m => m.moleculeName).filter(Boolean);
      } else {
        cascadedInputs = [...this.getEffectiveInputMolecules(this.steps.length - 1)];
      }
    } else {
      cascadedInputs = [this.targetMolecule, ...this.overallAuxMolecules];
    }

    this.steps.push({
      id: newId,
      name: `Step ${newId}`,
      reactionPatterns: [],
      auxMolecules: [],
      inputMolecules: cascadedInputs,
      isExpanded: true,
      status: 'draft'
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
    const copy: MechanismPathwayStep = {
      id: this.steps.length + 1,
      name: `${original.name} (Copy)`,
      reactionPatterns: [...original.reactionPatterns],
      auxMolecules: [...original.auxMolecules],
      inputMolecules: [...this.getEffectiveInputMolecules(index)],
      isExpanded: true,
      status: 'draft'
    };
    this.steps.splice(index + 1, 0, copy);
  }

  public toggleStep(step: MechanismPathwayStep): void {
    step.isExpanded = !step.isExpanded;
  }

  // --- Reaction Pattern Selection Dialog ---

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

  // --- Step Execution & Decision Logic ---

  public async runStepTest(stepIndex: number): Promise<void> {
    const step = this.steps[stepIndex];
    if (!step || step.reactionPatterns.length === 0) {
      this.snackBar.open('Please select at least one reaction pattern for this step.', 'Close', { duration: 3000 });
      return;
    }

    step.isExecuting = true;
    step.status = 'running';
    step.executionError = null;
    step.hasExecuted = false;
    step.generatedReactions = [];
    step.generatedMolecules = [];

    const effectiveInputs = this.getEffectiveInputMolecules(stepIndex);
    const primaryInput = effectiveInputs[0] || this.targetMolecule || 'Temporary';
    const combinedAux = Array.from(new Set([...this.overallAuxMolecules, ...step.auxMolecules]));
    const stepRoot = `${(this.pathwayName || 'Pathway').trim()}_Step${stepIndex + 1}`;
    const mechName = `${(this.pathwayName || 'Pathway').trim()}_M${stepIndex + 1}`;

    const lsrContent = this.lsrService.generateLsrContent(
      step.name || `Step ${stepIndex + 1}`,
      combinedAux,
      step.reactionPatterns,
      primaryInput
    );

    try {
      this.snackBar.open(`Saving step config '${stepRoot}.lsr'...`, '', { duration: 1500 });
      await firstValueFrom(this.reactCloudApi.saveLsrFile(stepRoot, lsrContent));

      this.snackBar.open(`Executing Step ${stepIndex + 1} with ${primaryInput}...`, '', { duration: 3000 });
      const res = await firstValueFrom(
        this.reactCloudApi.runSubmechanismFromPath(
          primaryInput,
          stepRoot,
          combinedAux.join(','),
          'read',
          mechName
        )
      );

      step.isExecuting = false;
      step.hasExecuted = true;
      step.executionOutput = res?.output || '';

      if (res?.exitCode !== 0 && res?.error) {
        step.status = 'draft';
        step.executionError = res.error;
        this.snackBar.open(`Execution error: ${res.error}`, 'Close', { duration: 5000 });
        return;
      }

      const currentSdf = this.chemParser.extractSdfContent(res?.output || '');
      const sections = this.taskOutputParser.parseSectionsFromOutput(res?.output || '', 'mechanisms', currentSdf);
      const mechSection = sections.find(s => s.mechFileData);

      if (mechSection?.mechFileData) {
        step.generatedReactions = mechSection.mechFileData.reactionClasses || [];
        step.generatedMolecules = mechSection.mechFileData.sdfBlocks || [];
      }

      // Fallback: populate generatedMolecules from SDF block map if not in mechFileData
      if (!step.generatedMolecules || step.generatedMolecules.length === 0) {
        const blockMap = this.chemParser.extractSdfBlockMap(res?.output || '');
        const molBlocks: MechSdfBlock[] = [];
        blockMap.forEach((sdf, name) => {
          if (!name.startsWith('Reactant') && !name.startsWith('Product') && !molBlocks.some(b => b.moleculeName === name)) {
            molBlocks.push({ moleculeName: name, sdfContent: sdf });
          }
        });
        step.generatedMolecules = molBlocks;
      }

      step.status = 'tested';
      const totalRxns = this.getTotalReactionsCount(step);
      this.snackBar.open(
        `Step ${stepIndex + 1} completed! Created ${totalRxns} reactions and ${step.generatedMolecules.length} intermediate molecules.`,
        'OK',
        { duration: 4000 }
      );
    } catch (err: any) {
      step.isExecuting = false;
      step.hasExecuted = true;
      step.status = 'draft';
      step.executionError = err?.message || 'Step execution encountered an error.';
      this.snackBar.open(`Error: ${step.executionError}`, 'Close', { duration: 5000 });
    }
  }

  public acceptStep(stepIndex: number): void {
    const step = this.steps[stepIndex];
    if (!step) return;

    step.status = 'accepted';
    step.isExpanded = false; // Collapse to one-line summary

    // Intermediate molecules created become the inputs for the next step
    const newMols = (step.generatedMolecules || []).map(m => m.moleculeName).filter(Boolean);
    const nextInputMolecules = newMols.length > 0 ? Array.from(new Set(newMols)) : [...this.getEffectiveInputMolecules(stepIndex)];

    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < this.steps.length) {
      this.steps[nextStepIndex].inputMolecules = nextInputMolecules;
      this.steps[nextStepIndex].isExpanded = true;
    } else {
      const newId = this.steps.length + 1;
      this.steps.push({
        id: newId,
        name: `Step ${newId}`,
        reactionPatterns: [],
        auxMolecules: [],
        inputMolecules: nextInputMolecules,
        isExpanded: true,
        status: 'draft'
      });
    }

    this.snackBar.open(`Step ${stepIndex + 1} accepted! Proceeding to Step ${nextStepIndex + 1}.`, 'OK', {
      duration: 3500
    });
  }

  public rejectStep(stepIndex: number): void {
    const step = this.steps[stepIndex];
    if (!step) return;

    step.status = 'draft';
    step.hasExecuted = false;
    step.executionError = null;
    step.generatedReactions = [];
    step.generatedMolecules = [];
    step.isExpanded = true;

    this.snackBar.open(`Step ${stepIndex + 1} reset to Draft. Adjust reaction patterns or auxiliaries and test again.`, 'OK', {
      duration: 3000
    });
  }

  public getTotalReactionsCount(step: MechanismPathwayStep): number {
    if (!step.generatedReactions) return 0;
    return step.generatedReactions.reduce((acc, grp) => acc + (grp.reactions ? grp.reactions.length : 0), 0);
  }

  public getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'badge-green';
      case 'tested':
        return 'badge-indigo';
      case 'running':
        return 'badge-amber';
      case 'draft':
      default:
        return 'badge-blue';
    }
  }

  // --- Molecule 2D Structure Ketcher Preview ---

  public previewMoleculeStructure(moleculeName: string, directSdf?: string): void {
    const cleanName = (moleculeName || '').trim();
    if (!cleanName) return;

    this.previewModalMolName = cleanName;
    this.previewModalSdf = '';

    if (directSdf && directSdf.trim()) {
      this.previewModalSdf = directSdf.trim();
      this.dialog.open(this.moleculePreviewDialogRef, {
        width: '850px',
        maxHeight: '90vh'
      });
      return;
    }

    this.isLoadingStructurePreview = true;
    const snack = this.snackBar.open(`Fetching 2D structure for ${cleanName}...`, '', { duration: 3000 });

    this.moleculesService.getItemDetails(cleanName).subscribe({
      next: (details) => {
        this.isLoadingStructurePreview = false;
        snack.dismiss();
        const extractedSdf = this.chemParser.extractSdfContent(details, cleanName);
        if (extractedSdf) {
          this.previewModalSdf = extractedSdf;
        } else {
          this.previewModalSdf = `${cleanName}\n  -REACTCLOUD- 2D\n\n  1  0  0  0  0  0  0  0  0  0999 V2000\n    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\nM  END\n$$$$\n`;
        }
        this.dialog.open(this.moleculePreviewDialogRef, {
          width: '850px',
          maxHeight: '90vh'
        });
      },
      error: (err) => {
        this.isLoadingStructurePreview = false;
        snack.dismiss();
        console.warn(`[PathwayCreator] Could not fetch details for ${cleanName}:`, err);
        this.snackBar.open(`Structure for '${cleanName}' not found in catalog.`, 'Close', { duration: 3000 });
      }
    });
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
      inputMolecules: idx === 0 ? [this.targetMolecule, ...this.overallAuxMolecules] : [],
      isExpanded: false,
      status: 'draft' as const
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
      next: () => {
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
          // Collapse all steps to single-line summaries as required
          this.steps.forEach(s => s.isExpanded = false);
          this.snackBar.open(`Loaded Mechanism Pathway '${pathway.Name}' with ${this.steps.length} steps.`, 'OK', {
            duration: 3500
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
          this.steps.forEach(s => s.isExpanded = false);
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
      this.createNewPathway();
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
