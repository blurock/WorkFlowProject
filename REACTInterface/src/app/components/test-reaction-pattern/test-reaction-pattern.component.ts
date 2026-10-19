import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { ReactionPatternLsrService } from '../../services/reaction-pattern-lsr.service';
import { TargetMoleculeService, TargetMoleculeCheckResult } from '../../services/target-molecule.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { MoleculeSection } from '../../models/task-list.models';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';
import { AuxiliaryMoleculesSelectorComponent } from '../auxiliary-molecules-selector/auxiliary-molecules-selector.component';
import { RxnPatternSelectionDialogComponent } from '../rxn-pattern-selection-dialog/rxn-pattern-selection-dialog.component';
import { BensonGroupDetailComponent } from '../task-list-view/details/benson-group-detail.component';

@Component({
  selector: 'app-test-reaction-pattern',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    KetcherViewerComponent,
    AuxiliaryMoleculesSelectorComponent,
    BensonGroupDetailComponent
  ],
  templateUrl: './test-reaction-pattern.component.html',
  styleUrls: ['./test-reaction-pattern.component.scss']
})
export class TestReactionPatternComponent implements OnInit {
  @ViewChild('ketcherCanvas') public ketcherCanvas?: KetcherViewerComponent;

  // Selected Reaction Patterns (Level 3 patterns)
  public selectedPatterns: string[] = [
    'H-Abstraction-Hydroxyl-Radical-Primary',
    'H-Abstraction-Hydroxyl-Radical-Secondary'
  ];

  // Target Molecule
  public targetMoleculeName: string = 'Temporary';
  public targetMolfile: string | null = null;
  public isCheckingMolecule: boolean = false;
  public isStoringMolecule: boolean = false;
  public targetCheckResult: TargetMoleculeCheckResult | null = null;
  public moleculeStatusMessage: string = 'Draw a molecule or select a preset, then test.';

  // Auxiliary Molecules
  public auxiliaryMolecules: string[] = [
    'hydroxyl-radical',
    'oxygen-radical',
    'oxygen'
  ];

  // Execution Configuration
  public rootName: string = 'ReactionPatternTest';
  public mechName: string = 'TestMechanism';
  public showLsrPreview: boolean = false;
  public generatedLsrContent: string = '';

  // Execution State & Results
  public isExecuting: boolean = false;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;
  public executionLog: string | null = null;
  public itemDetailOutput: string | null = null;
  public moleculeSections: MoleculeSection[] = [];
  public currentSdfContent: string | null = null;
  public selectedTabIndex: number = 0;

  // Presets for quick testing
  public presetMolecules: { name: string; smiles: string }[] = [
    { name: 'butane', smiles: 'CCCC' },
    { name: 'propane', smiles: 'CCC' },
    { name: 'isobutane', smiles: 'CC(C)C' },
    { name: 'cyclohexane', smiles: 'C1CCCCC1' }
  ];

  constructor(
    private reactCloudApi: ReactCloudApiService,
    private lsrService: ReactionPatternLsrService,
    private targetMoleculeService: TargetMoleculeService,
    private taskOutputParser: TaskOutputParserService,
    private chemParser: ChemStructureParserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updateLsrPreview();
  }

  // --- Pattern Selection Dialog ---

  public openPatternSelectionDialog(): void {
    const dialogRef = this.dialog.open(RxnPatternSelectionDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        preselectedPatterns: this.selectedPatterns,
        title: 'Select Reaction Patterns to Test'
      }
    });

    dialogRef.afterClosed().subscribe((result: string[] | undefined) => {
      if (result !== undefined) {
        this.selectedPatterns = result;
        this.updateLsrPreview();
        this.snackBar.open(`${this.selectedPatterns.length} reaction patterns selected.`, 'OK', { duration: 2500 });
      }
    });
  }

  public removePattern(pattern: string): void {
    this.selectedPatterns = this.selectedPatterns.filter(p => p !== pattern);
    this.updateLsrPreview();
  }

  // --- Auxiliary Molecules ---

  public onAuxiliaryMoleculesChange(mols: string[]): void {
    this.auxiliaryMolecules = mols;
    this.updateLsrPreview();
  }

  // --- Target Molecule Handling ---

  public async onCheckTargetMolecule(): Promise<void> {
    if (!this.ketcherCanvas) return;
    this.isCheckingMolecule = true;
    this.moleculeStatusMessage = 'Checking molecule structure in database...';
    this.errorMessage = null;

    try {
      const molfile = await this.ketcherCanvas.exportStructureFromKetcher('mol');
      if (!molfile || !molfile.trim()) {
        this.moleculeStatusMessage = 'No structure drawn in Ketcher window.';
        this.snackBar.open('Please draw a structure in the Ketcher window first.', 'Close', { duration: 3000 });
        this.isCheckingMolecule = false;
        return;
      }

      const res = await this.targetMoleculeService.checkTargetMolecule(molfile, this.targetMoleculeName);
      this.targetCheckResult = res;

      if (res.isExisting && res.matchedDbName) {
        this.moleculeStatusMessage = `Found in REACT database as "${res.matchedDbName}".`;
        this.snackBar.open(`Molecule exists in DB as '${res.matchedDbName}'!`, 'OK', { duration: 3500 });
      } else {
        this.moleculeStatusMessage = `Structure not found in DB. Will be stored as "${res.requestedName}".`;
        this.snackBar.open(`Molecule will be registered as '${res.requestedName}'.`, 'OK', { duration: 3500 });
      }
    } catch (err: any) {
      console.error('[TestReactionPattern] Check molecule error:', err);
      this.moleculeStatusMessage = `Error checking molecule: ${err.message}`;
      this.snackBar.open(`Check error: ${err.message}`, 'Close', { duration: 4000 });
    } finally {
      this.isCheckingMolecule = false;
      this.updateLsrPreview();
    }
  }

  public loadPresetMolecule(preset: { name: string; smiles: string }): void {
    this.targetMoleculeName = preset.name;
    this.targetCheckResult = null;
    this.moleculeStatusMessage = `Loaded preset: ${preset.name}`;
    this.targetMolfile = preset.smiles;
    if (this.ketcherCanvas) {
      this.ketcherCanvas.sendSdfToKetcher(preset.smiles, true, true);
    }
    this.updateLsrPreview();
  }

  // --- LSR Preview ---

  public updateLsrPreview(): void {
    const effectiveTarget = (this.targetCheckResult?.effectiveName || this.targetMoleculeName || 'Temporary').trim();
    this.generatedLsrContent = this.lsrService.generateLsrContent(
      `ReactionPatternTest: ${this.selectedPatterns.length} patterns`,
      this.auxiliaryMolecules,
      this.selectedPatterns,
      effectiveTarget
    );
  }

  public toggleLsrPreview(): void {
    this.showLsrPreview = !this.showLsrPreview;
    if (this.showLsrPreview) {
      this.updateLsrPreview();
    }
  }

  // --- Execution Routine ---

  public async executeTestReactionPattern(): Promise<void> {
    if (this.selectedPatterns.length === 0) {
      this.snackBar.open('Please select at least one reaction pattern.', 'Close', { duration: 3000 });
      return;
    }

    this.isExecuting = true;
    this.errorMessage = null;
    this.executionLog = null;
    this.hasExecuted = false;
    this.moleculeSections = [];
    this.updateLsrPreview();

    try {
      // 1. Resolve Target Molecule
      let effectiveMolecule = (this.targetMoleculeName || 'Temporary').trim();
      let drawnMolfile = '';

      if (this.ketcherCanvas) {
        drawnMolfile = await this.ketcherCanvas.exportStructureFromKetcher('mol');
      }

      if (drawnMolfile && drawnMolfile.trim()) {
        this.snackBar.open('Verifying target molecule with database...', 'Dismiss', { duration: 2000 });
        const checkRes = await this.targetMoleculeService.checkTargetMolecule(drawnMolfile, effectiveMolecule);
        this.targetCheckResult = checkRes;

        if (checkRes.isExisting && checkRes.matchedDbName) {
          effectiveMolecule = checkRes.matchedDbName;
        } else {
          // Store new molecule in database as requested name / Temporary
          this.snackBar.open(`Registering '${effectiveMolecule}' in database...`, 'Dismiss', { duration: 2500 });
          const storeRes = await this.targetMoleculeService.storeTargetMolecule(effectiveMolecule, checkRes.sdfContent);
          if (!storeRes.success && storeRes.error) {
            console.warn('[TestReactionPattern] Target molecule store warning:', storeRes.error);
          }
        }
      }

      // 2. Save .lsr file via /api/save-lsr (noted in execution log)
      this.snackBar.open(`Saving LSR file '${this.rootName}.lsr'...`, 'Dismiss', { duration: 2000 });
      const saveRes = await new Promise<any>((resolve, reject) => {
        this.reactCloudApi.saveLsrFile(this.rootName, this.generatedLsrContent).subscribe({
          next: resolve,
          error: reject
        });
      });
      console.log('[TestReactionPattern] LSR file saved successfully:', saveRes);

      // 3. Execute Submechanism from Path
      const cleanMechName = (this.mechName || 'TestMechanism').trim();
      const supplement = this.auxiliaryMolecules.join(',');

      this.snackBar.open(`Executing submechanism ${cleanMechName}...`, 'Dismiss', { duration: 4000 });

      this.reactCloudApi.runSubmechanismFromPath(
        effectiveMolecule,
        this.rootName,
        supplement,
        'read',
        cleanMechName
      ).subscribe({
        next: (res) => {
          this.isExecuting = false;
          this.hasExecuted = true;
          this.executionLog = res.output;

          if (res.exitCode !== 0 && res.error) {
            this.errorMessage = res.error;
            this.snackBar.open(`Execution error: ${res.error}`, 'Close', { duration: 5000 });
          } else {
            this.snackBar.open(`Submechanism '${cleanMechName}' completed successfully!`, 'OK', { duration: 4000 });
          }

          // Parse mechanism sections from output (.mech, .sdf, .thm, .corrs, etc.)
          this.itemDetailOutput = res.output;
          this.currentSdfContent = this.chemParser.extractSdfContent(res.output);
          this.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(
            res.output,
            'mechanisms',
            this.currentSdfContent
          );

          // Automatically switch to Results Tab
          this.selectedTabIndex = 1;
        },
        error: (err) => {
          this.isExecuting = false;
          this.hasExecuted = true;
          this.errorMessage = err?.error?.error || err?.message || 'Submechanism execution failed.';
          this.snackBar.open(`Execution error: ${this.errorMessage}`, 'Close', { duration: 5000 });
        }
      });

    } catch (err: any) {
      this.isExecuting = false;
      this.errorMessage = err?.message || 'An error occurred during preparation.';
      this.snackBar.open(`Error: ${this.errorMessage}`, 'Close', { duration: 5000 });
    }
  }

  public toggleAllSections(expanded: boolean): void {
    this.moleculeSections.forEach(sec => sec.isExpanded = expanded);
  }

  public copyOutput(): void {
    const text = this.itemDetailOutput || this.executionLog || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied output to clipboard!', 'OK', { duration: 2500 });
    });
  }
}
