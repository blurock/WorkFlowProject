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
import { MechanismOutputParser } from '../../services/parsers/mechanism-output-parser';
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
  debugLog?: string | null;
  showDebugLog?: boolean;
  executionFiles?: any[];
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
  public selectedDebugStepIndex: number = 0;

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
    private mechanismParser: MechanismOutputParser,
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
    const oldTarget = this.targetMolecule;
    this.targetMolecule = clean;
    this.customTargetInput = clean;

    if (this.steps.length > 0) {
      const step0 = this.steps[0];
      if (step0.inputMolecules && step0.inputMolecules.length > 0) {
        step0.inputMolecules = step0.inputMolecules.map(m => m.toLowerCase() === oldTarget.toLowerCase() ? clean : m);
        if (!step0.inputMolecules.some(m => m.toLowerCase() === clean.toLowerCase())) {
          step0.inputMolecules.unshift(clean);
        }
      } else {
        step0.inputMolecules = [clean, ...this.overallAuxMolecules];
      }
      // If target molecule changed, reset Step 1 state to draft so testing runs with new target
      if (oldTarget.toLowerCase() !== clean.toLowerCase()) {
        step0.status = 'draft';
        step0.hasExecuted = false;
        step0.executionError = null;
        step0.generatedReactions = [];
        step0.generatedMolecules = [];
        this.snackBar.open(`Target molecule changed to '${clean}'. Step 1 reset to Draft.`, '', { duration: 2500 });
      }
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
    if (stepIndex === 0) {
      const target = this.targetMolecule || 'butane';
      if (step.inputMolecules && step.inputMolecules.length > 0) {
        const nonTarget = step.inputMolecules.filter(m => m.toLowerCase() !== target.toLowerCase());
        return [target, ...nonTarget];
      }
      return [target, ...this.overallAuxMolecules].filter(Boolean);
    }
    if (step.inputMolecules && step.inputMolecules.length > 0) {
      return step.inputMolecules;
    }
    const prevStep = this.steps[stepIndex - 1];
    if (prevStep?.generatedMolecules && prevStep.generatedMolecules.length > 0) {
      return prevStep.generatedMolecules.map(m => m.moleculeName).filter(Boolean);
    }
    return [this.targetMolecule || 'butane', ...this.overallAuxMolecules].filter(Boolean);
  }

  /**
   * Cleans a raw reaction product token into a molecule name without stripping
   * chemical position numbers (e.g. '1-butyl-radical', '2-butyl-radical', '1,2-butadiene').
   */
  public cleanProductMoleculeName(tok: string): string {
    if (!tok) return '';
    let clean = tok.trim().replace(/[{}]/g, '').trim();
    // Strip stoichiometric multiplier followed by space or asterisk (e.g. "2 H2" -> "H2", "2*H2" -> "H2", "(2) H2" -> "H2")
    // Preserves IUPAC/common position prefixes like "1-butyl-radical", "2-butyl-radical", "1,2-butadiene"
    clean = clean.replace(/^\(?\d+\)?\s*[\*]\s*/, '').trim();
    clean = clean.replace(/^\(?\d+\)?\s+/, '').trim();
    return clean;
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
    const combinedAux = Array.from(new Set([...this.overallAuxMolecules, ...step.auxMolecules]));

    // Separate main input molecules from auxiliary radicals
    const targetInputs = effectiveInputs.filter(m => !combinedAux.includes(m));
    const finalInputs = targetInputs.length > 0 ? targetInputs : [this.targetMolecule || 'Temporary'];
    const inputMolsString = finalInputs.join(',');

    const stepRoot = `${(this.pathwayName || 'Pathway').trim()}_Step${stepIndex + 1}`;
    const mechName = `${(this.pathwayName || 'Pathway').trim()}_M${stepIndex + 1}`;

    const lsrContent = this.lsrService.generateLsrContent(
      step.name || `Step ${stepIndex + 1}`,
      combinedAux,
      step.reactionPatterns,
      inputMolsString
    );

    console.log(`[RunStepTest] Preparing Step ${stepIndex + 1} test execution:`, {
      stepIndex: stepIndex + 1,
      stepName: step.name,
      pathwayName: this.pathwayName,
      stepRoot,
      mechName,
      finalInputs,
      inputMolsString,
      combinedAux,
      reactionPatterns: step.reactionPatterns,
      lsrLength: lsrContent.length
    });

    try {
      this.snackBar.open(`Saving step config '${stepRoot}.lsr' to mechpathtest...`, '', { duration: 1500 });
      console.log(`[RunStepTest] Saving ephemeral step LSR via POST /api/save-lsr: '${stepRoot}' in category 'mechpathtest'...`);
      const saveRes = await firstValueFrom(this.reactCloudApi.saveLsrFile(stepRoot, lsrContent, 'mechpathtest'));
      console.log(`[RunStepTest] saveLsrFile completed successfully:`, saveRes);

      this.snackBar.open(`Executing Step ${stepIndex + 1} with ${inputMolsString}...`, '', { duration: 3000 });
      console.log(`[RunStepTest] Calling POST /api/run-submechanism (category: mechpathtest):`, {
        molecule: inputMolsString,
        rootName: stepRoot,
        supplement: combinedAux.join(','),
        runRoot: 'read',
        mechName,
        category: 'mechpathtest'
      });

      const res = await firstValueFrom(
        this.reactCloudApi.runSubmechanismFromPath(
          inputMolsString,
          stepRoot,
          combinedAux.join(','),
          'read',
          mechName,
          lsrContent,
          true,
          'mechpathtest'
        )
      );
      console.log(`[RunStepTest] runSubmechanismFromPath response received:`, res);

      step.isExecuting = false;
      step.hasExecuted = true;
      step.executionOutput = res?.output || '';

      if (res?.exitCode !== 0 && res?.error) {
        step.status = 'draft';
        step.executionError = res.error;
        console.warn(`[RunStepTest] Non-zero exit code: ${res.exitCode}, error:`, res.error);
        this.snackBar.open(`Execution error: ${res.error}`, 'Close', { duration: 5000 });
        return;
      }

      let rawOut = res?.output || '';
      let currentSdf = '';
      const sdfFile = res?.files?.find(f => f.fileType === 'sdf');
      const mechFile = res?.files?.find(f => f.fileType === 'mech');

      if (sdfFile?.downloadUrl) {
        try {
          console.log(`[RunStepTest] Fetching SDF structure artifact from ${sdfFile.downloadUrl}...`);
          currentSdf = await firstValueFrom(this.reactCloudApi.fetchAsciiFileContent(sdfFile.downloadUrl));
          console.log(`[RunStepTest] Successfully fetched SDF artifact (${currentSdf.length} chars).`);
        } catch (sdfErr) {
          console.warn('[RunStepTest] Failed to fetch SDF via downloadUrl, falling back to raw output:', sdfErr);
        }
      } else {
        currentSdf = this.chemParser.extractSdfContent(rawOut) || '';
      }

      let mechContent = '';
      if (mechFile?.downloadUrl) {
        try {
          console.log(`[RunStepTest] Fetching MECH reaction artifact from ${mechFile.downloadUrl}...`);
          mechContent = await firstValueFrom(this.reactCloudApi.fetchAsciiFileContent(mechFile.downloadUrl));
          console.log(`[RunStepTest] Successfully fetched MECH artifact (${mechContent.length} chars).`);
        } catch (mechErr) {
          console.warn('[RunStepTest] Failed to fetch MECH via downloadUrl:', mechErr);
        }
      }

      // Fetch console execution.log artifact if available
      let execLogContent = '';
      const logFile = res?.files?.find(f => f.fileType === 'log');
      if (logFile?.downloadUrl) {
        try {
          console.log(`[RunStepTest] Fetching execution.log from ${logFile.downloadUrl}...`);
          execLogContent = await firstValueFrom(this.reactCloudApi.fetchAsciiFileContent(logFile.downloadUrl));
          console.log(`[RunStepTest] Successfully fetched execution.log (${execLogContent.length} chars).`);
        } catch (logErr) {
          console.warn('[RunStepTest] Failed to fetch execution.log via downloadUrl:', logErr);
        }
      }

      const combinedText = (mechContent ? `--- Mechanism Reactions ---\n${mechContent}\n\n` : '') +
                           (currentSdf ? `--- Molecule Structures ---\n${currentSdf}\n\n` : '') +
                           rawOut;

      const sections = this.taskOutputParser.parseSectionsFromOutput(combinedText, 'mechanisms', currentSdf);
      
      const rxnSection = sections.find(s => s.title === 'Mechanism Reactions' || (s.mechFileData?.reactionClasses && s.mechFileData.reactionClasses.length > 0));
      const structSection = sections.find(s => s.title === 'Molecule Structures' || (s.mechFileData?.sdfBlocks && s.mechFileData.sdfBlocks.length > 0));

      if (rxnSection?.mechFileData?.reactionClasses) {
        step.generatedReactions = rxnSection.mechFileData.reactionClasses;
      }

      // Build available SDF structure map (moleculeName -> sdfContent)
      const availableSdfMap = new Map<string, string>();

      // 1. Populate from Molecule Structures section
      if (structSection?.mechFileData?.sdfBlocks) {
        for (const block of structSection.mechFileData.sdfBlocks) {
          if (block.moleculeName && block.sdfContent) {
            availableSdfMap.set(block.moleculeName.toLowerCase(), block.sdfContent);
            availableSdfMap.set(block.moleculeName, block.sdfContent);
          }
        }
      }

      // 2. Parse from loaded SDF content
      if (currentSdf) {
        const parsedBlocks = this.mechanismParser.parseSdfBlocks(currentSdf);
        for (const block of parsedBlocks) {
          if (block.moleculeName && block.sdfContent) {
            availableSdfMap.set(block.moleculeName.toLowerCase(), block.sdfContent);
            availableSdfMap.set(block.moleculeName, block.sdfContent);
          }
        }
      }

      // 3. Extract from chemParser.extractSdfBlockMap (excluding reaction patterns)
      const blockMap = this.chemParser.extractSdfBlockMap(rawOut);
      blockMap.forEach((sdf, name) => {
        const isPatternName = step.reactionPatterns.some(p => {
          const cleanP = p.replace(/\*$/, '').toLowerCase();
          return name.toLowerCase().includes(cleanP);
        });
        if (!isPatternName && !name.startsWith('Reactant') && !name.startsWith('Product')) {
          if (!availableSdfMap.has(name.toLowerCase())) {
            availableSdfMap.set(name.toLowerCase(), sdf);
            availableSdfMap.set(name, sdf);
          }
        }
      });

      // Build exclusion set: initial inputs, overall target, auxiliaries, and small inorganics
      const excludedNames = new Set<string>();
      for (const inp of finalInputs) {
        excludedNames.add(inp.toLowerCase());
      }
      if (this.targetMolecule) {
        excludedNames.add(this.targetMolecule.toLowerCase());
      }
      for (const aux of combinedAux) {
        excludedNames.add(aux.toLowerCase());
      }
      const inorganic = ['h', 'h2', 'o', 'o2', 'oh', 'ho2', 'h2o', 'water', 'co', 'co2', 'h2o2', 'none'];
      for (const inorg of inorganic) {
        excludedNames.add(inorg);
      }

      // Extract generated intermediate product molecules from all reaction equations
      const intermediateMolNames = new Set<string>();
      if (step.generatedReactions && step.generatedReactions.length > 0) {
        for (const grp of step.generatedReactions) {
          for (const rxn of grp.reactions) {
            const eq = rxn.equation || '';
            const sides = eq.split(/=>|->|<=>|=/);
            if (sides.length >= 2) {
              const productsSide = sides[1];
              const tokens = productsSide.split('+');
              for (const tok of tokens) {
                const cleanName = this.cleanProductMoleculeName(tok);
                if (cleanName && !excludedNames.has(cleanName.toLowerCase())) {
                  intermediateMolNames.add(cleanName);
                }
              }
            }
          }
        }
      }

      const generatedMols: MechSdfBlock[] = [];
      if (intermediateMolNames.size > 0) {
        for (const molName of intermediateMolNames) {
          const sdf = availableSdfMap.get(molName.toLowerCase()) || 
                      availableSdfMap.get(molName) || 
                      availableSdfMap.get(molName.replace(/-/g, ' ')) ||
                      availableSdfMap.get(molName.replace(/\s+/g, '-')) ||
                      '';
          generatedMols.push({
            moleculeName: molName,
            sdfContent: sdf,
            isExpanded: false
          });
        }
      } else if (structSection?.mechFileData?.sdfBlocks && structSection.mechFileData.sdfBlocks.length > 0) {
        // Fallback to sdfBlocks from Molecule Structures section that are not initial reactants
        for (const block of structSection.mechFileData.sdfBlocks) {
          if (!excludedNames.has(block.moleculeName.toLowerCase())) {
            generatedMols.push(block);
          }
        }
      } else {
        // Fallback to non-pattern entries from availableSdfMap
        availableSdfMap.forEach((sdf, name) => {
          if (!excludedNames.has(name.toLowerCase()) && !generatedMols.some(m => m.moleculeName.toLowerCase() === name.toLowerCase())) {
            generatedMols.push({ moleculeName: name, sdfContent: sdf, isExpanded: false });
          }
        });
      }

      step.generatedMolecules = generatedMols;
      step.status = 'tested';
      step.executionFiles = res?.files || [];
      const totalRxns = this.getTotalReactionsCount(step);

      // Assemble comprehensive debug report for this step test
      let debugText = `================================================================================\n`;
      debugText += `[STEP TEST DEBUG REPORT] Step ${stepIndex + 1}: ${step.name || ('Step ' + (stepIndex + 1))}\n`;
      debugText += `Timestamp:         ${new Date().toLocaleString()}\n`;
      debugText += `Target Molecule:   ${this.targetMolecule || '(none)'}\n`;
      debugText += `Effective Inputs:  ${finalInputs.join(', ')}\n`;
      debugText += `Aux Radicals:      ${combinedAux.join(', ') || '(none)'}\n`;
      debugText += `Patterns Tested:   ${step.reactionPatterns.length} pattern(s)\n`;
      debugText += `Step Root LSR:     ${stepRoot}.lsr\n`;
      debugText += `Mechanism Name:    ${mechName}\n`;
      debugText += `Exit Code:         ${res?.exitCode} (${res?.exitCode === 0 ? 'SUCCESS' : 'FAILED'})\n`;
      debugText += `Reactions Created: ${totalRxns}\n`;
      debugText += `Molecules Created: ${step.generatedMolecules.length}\n`;
      debugText += `Storage Directory: ${res?.storageDirectory || '(local)'}\n`;
      debugText += `================================================================================\n\n`;

      if (res?.error && res.error.trim()) {
        debugText += `--- STDERR / EXECUTION WARNINGS ---\n${res.error}\n\n`;
      }

      if (execLogContent && execLogContent.trim()) {
        debugText += `--- EXECUTION LOG (from Storage: execution.log) ---\n${execLogContent}\n\n`;
      } else if (rawOut && rawOut.trim()) {
        debugText += `--- EXECUTION CONSOLE OUTPUT ---\n${rawOut}\n\n`;
      }

      if (res?.files && res.files.length > 0) {
        debugText += `--- GENERATED ARTIFACTS (${res.files.length} files) ---\n`;
        for (const f of res.files) {
          debugText += `  * [${f.fileType?.toUpperCase()}] ${f.filename} (${f.sizeBytes} bytes)\n    URL: ${f.downloadUrl || f.gcsPath}\n`;
        }
        debugText += `\n`;
      }

      debugText += `--- STEP LSR FILE CONTENT (${stepRoot}.lsr) ---\n${lsrContent}\n`;

      step.debugLog = debugText;
      console.log(`[RunStepTest] Step ${stepIndex + 1} test complete: ${totalRxns} reactions, ${step.generatedMolecules.length} intermediate molecules generated.`);
      this.snackBar.open(
        `Step ${stepIndex + 1} completed! Created ${totalRxns} reactions and ${step.generatedMolecules.length} intermediate molecules.`,
        'OK',
        { duration: 4000 }
      );
    } catch (err: any) {
      step.isExecuting = false;
      step.hasExecuted = true;
      step.status = 'draft';

      console.error('[RunStepTest] HTTP / Execution Error encountered:', err);
      console.error('  -> Status:', err?.status);
      console.error('  -> StatusText:', err?.statusText);
      console.error('  -> Error Body:', err?.error);
      console.error('  -> URL:', err?.url);

      const serverMsg = err?.error?.error || err?.error?.message;
      const detailedError = serverMsg
        ? `${serverMsg} (Status: ${err?.status || 'Unknown'})`
        : (err?.message || 'Step execution encountered an error.');

      step.executionError = detailedError;

      // Build failure debug log
      let errDebug = `================================================================================\n`;
      errDebug += `[STEP TEST FAILURE REPORT] Step ${stepIndex + 1}: ${step.name || ('Step ' + (stepIndex + 1))}\n`;
      errDebug += `Timestamp:       ${new Date().toLocaleString()}\n`;
      errDebug += `Target Molecule: ${this.targetMolecule || '(none)'}\n`;
      errDebug += `Effective Inputs:${finalInputs.join(', ')}\n`;
      errDebug += `Step Root LSR:   ${stepRoot}.lsr\n`;
      errDebug += `Mechanism Name:  ${mechName}\n`;
      errDebug += `HTTP Status:     ${err?.status || 'Unknown'} ${err?.statusText || ''}\n`;
      errDebug += `Endpoint URL:    ${err?.url || 'http://localhost:8085/api/run-submechanism'}\n`;
      errDebug += `Error Summary:   ${detailedError}\n`;
      errDebug += `================================================================================\n\n`;

      if (err?.error) {
        errDebug += `--- BACKEND ERROR RESPONSE BODY ---\n${typeof err.error === 'object' ? JSON.stringify(err.error, null, 2) : err.error}\n\n`;
      }

      errDebug += `--- STEP LSR CONFIGURATION (${stepRoot}.lsr) ---\n${lsrContent}\n`;

      step.debugLog = errDebug;
      step.showDebugLog = true; // Auto-expand on error so user immediately sees what went wrong!
      this.snackBar.open(`Error: ${detailedError}`, 'Close', { duration: 10000 });
    }
  }

  public copyDebugLog(step: MechanismPathwayStep): void {
    if (!step?.debugLog) return;
    navigator.clipboard.writeText(step.debugLog).then(() => {
      this.snackBar.open('Debug log copied to clipboard!', 'OK', { duration: 2500 });
    }).catch(() => {
      this.snackBar.open('Could not copy to clipboard.', 'Close', { duration: 2500 });
    });
  }

  public downloadStepDebugLog(step: MechanismPathwayStep, sIdx: number): void {
    if (!step?.debugLog) return;
    const blob = new Blob([step.debugLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(this.pathwayName || 'Pathway').trim()}_Step${sIdx + 1}_debug.log`;
    a.click();
    URL.revokeObjectURL(url);
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

    if (!directSdf || !directSdf.trim()) {
      for (const step of this.steps) {
        const foundMol = step.generatedMolecules?.find(m => m.moleculeName.toLowerCase() === cleanName.toLowerCase() && m.sdfContent);
        if (foundMol && foundMol.sdfContent) {
          directSdf = foundMol.sdfContent;
          break;
        }
        if (step.executionOutput) {
          const parsed = this.mechanismParser.parseSdfBlocks(step.executionOutput);
          const found = parsed.find(b => b.moleculeName.toLowerCase() === cleanName.toLowerCase() && b.sdfContent);
          if (found && found.sdfContent) {
            directSdf = found.sdfContent;
            break;
          }
        }
      }
    }

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
    const cleanTarget = (this.customTargetInput || this.targetMolecule || '').trim();
    const cleanPathwayName = (this.pathwayName || 'NewPathway').trim();

    const readSteps: ReadChainReactionStep[] = this.steps.map((s, idx) => {
      // Gather unique step molecules from Stage 2 (auxMolecules) and Stage 1 (inputMolecules)
      const stepMolsSet = new Set<string>();

      // 1. Auxiliary radicals from Stage 2
      (s.auxMolecules || []).forEach(m => {
        const clean = (m || '').trim();
        if (clean) stepMolsSet.add(clean);
      });

      // 2. Custom input molecules added in Stage 1 (excluding overall target and global radicals)
      if (s.inputMolecules && s.inputMolecules.length > 0) {
        s.inputMolecules.forEach(m => {
          const clean = (m || '').trim();
          if (clean && clean.toLowerCase() !== cleanTarget.toLowerCase() && !this.overallAuxMolecules.includes(clean)) {
            stepMolsSet.add(clean);
          }
        });
      }

      const stepMols = Array.from(stepMolsSet);

      return {
        ID: idx,
        Name: (s.name || `Step ${idx + 1}`).trim(),
        Reactions: {
          NumberOfReactions: s.reactionPatterns.length,
          Reactions: s.reactionPatterns.map((p, pIdx) => ({ ID: pIdx, Name: p.trim() }))
        },
        Molecules: {
          NumberOfMolecules: stepMols.length,
          Molecules: stepMols.map((m, mIdx) => ({ ID: mIdx, Name: m }))
        }
      };
    });

    const pathway: ReadChainSet = {
      Name: cleanPathwayName,
      NumberOfSteps: readSteps.length,
      TargetMolecule: cleanTarget,
      ExtraMolecules: {
        NumberOfMolecules: this.overallAuxMolecules.length,
        Molecules: this.overallAuxMolecules.map((m, idx) => ({ ID: idx, Name: m.trim() }))
      },
      Steps: readSteps
    };

    const compiled = this.pathwayService.compileTotals(pathway);
    return compiled;
  }

  public populateFromReadChainSet(pathway: ReadChainSet): void {
    this.pathwayName = pathway.Name || 'NewPathway';
    if (pathway.TargetMolecule) {
      this.targetMolecule = pathway.TargetMolecule;
      this.customTargetInput = pathway.TargetMolecule;
    }
    this.overallAuxMolecules = (pathway.ExtraMolecules?.Molecules || []).map(m => m.Name);

    this.steps = (pathway.Steps || []).map((s, idx) => {
      const stepMols = (s.Molecules?.Molecules || []).map(m => m.Name);
      return {
        id: idx + 1,
        name: s.Name || `Step ${idx + 1}`,
        reactionPatterns: (s.Reactions?.Reactions || []).map(r => r.Name),
        auxMolecules: stepMols,
        inputMolecules: idx === 0
          ? [this.targetMolecule, ...stepMols, ...this.overallAuxMolecules].filter((v, i, a) => v && a.indexOf(v) === i)
          : [...stepMols],
        isExpanded: false,
        status: 'draft' as const
      };
    });

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
    console.log(`[MechanismPathwayCreator] Saving Mechanism Pathway '${pathway.Name}' to Firestore:`, pathway);

    this.pathwayService.storePathway(pathway).subscribe({
      next: () => {
        this.isSaving = false;
        this.selectedPathwayToLoad = this.pathwayName;
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
