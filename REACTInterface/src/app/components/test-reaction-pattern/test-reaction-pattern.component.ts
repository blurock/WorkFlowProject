import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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

import { firstValueFrom } from 'rxjs';
import { ReactCloudApiService, MechanismStorageFile } from '../../services/react-cloud-api.service';
import { ReactionPatternLsrService } from '../../services/reaction-pattern-lsr.service';
import { TargetMoleculeService, TargetMoleculeCheckResult } from '../../services/target-molecule.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { MoleculeSection } from '../../models/task-list.models';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';
import { AuxiliaryMoleculesSelectorComponent } from '../auxiliary-molecules-selector/auxiliary-molecules-selector.component';
import { RxnPatternSelectionDialogComponent } from '../rxn-pattern-selection-dialog/rxn-pattern-selection-dialog.component';
import { BensonGroupDetailComponent } from '../task-list-view/details/benson-group-detail.component';
import { MechanismArtifactViewerComponent } from '../mechanism-artifact-viewer/mechanism-artifact-viewer.component';
import { DatabaseStructureSelectorComponent, StructureLoadedEvent } from '../database-structure-selector/database-structure-selector.component';
import { CatalogItem } from '../../services/react-cloud-api.service';

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
    BensonGroupDetailComponent,
    MechanismArtifactViewerComponent,
    DatabaseStructureSelectorComponent
  ],
  templateUrl: './test-reaction-pattern.component.html',
  styleUrls: ['./test-reaction-pattern.component.scss']
})
export class TestReactionPatternComponent implements OnInit, OnDestroy {
  @ViewChild('ketcherCanvas') public ketcherCanvas?: KetcherViewerComponent;

  // Selected Reaction Patterns (Level 3 patterns)
  public selectedPatterns: string[] = [
    'H-Abstraction-Hydroxyl-Radical-Primary',
    'H-Abstraction-Hydroxyl-Radical-Secondary'
  ];

  // Target Molecule
  public targetMoleculeName: string = 'Target_Molecule';
  public targetMolfile: string | null = null;
  public isCheckingMolecule: boolean = false;
  public isStoringMolecule: boolean = false;
  public targetCheckResult: TargetMoleculeCheckResult | null = null;
  public moleculeStatusMessage: string = 'Draw a molecule or select a preset, then test.';
  public isEphemeralTarget: boolean = false;
  public ephemeralRecordName: string | null = null;
  public promoteMoleculeName: string = '';
  public isPromotingMolecule: boolean = false;
  public lastDrawnSdf: string | null = null;

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
  public storageDirectory: string = '';
  public storageFiles: MechanismStorageFile[] = [];
  public missingReactionPatterns: string[] = [];

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

      if (res.isExisting && res.matchedDbName && !/^(_?temp(_.*)?|temporary|target_molecule)$/i.test(res.matchedDbName)) {
        this.targetMoleculeName = res.matchedDbName;
        this.isEphemeralTarget = false;
        this.moleculeStatusMessage = `Found in REACT database as "${res.matchedDbName}".`;
        this.snackBar.open(`Molecule exists in DB as '${res.matchedDbName}'!`, 'OK', { duration: 3500 });
      } else {
        this.isEphemeralTarget = true;
        this.lastDrawnSdf = res.sdfContent;
        this.promoteMoleculeName = (this.targetMoleculeName !== 'Target_Molecule' && this.targetMoleculeName !== 'Temporary') ? this.targetMoleculeName : '';
        this.moleculeStatusMessage = `Structure not found in DB. Will execute as scratch target molecule.`;
        this.snackBar.open(`Structure not in DB. Ready for scratch test.`, 'OK', { duration: 3500 });
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

  public async onResetMolecule(): Promise<void> {
    if (this.isEphemeralTarget && this.ephemeralRecordName) {
      const old = this.ephemeralRecordName;
      this.ephemeralRecordName = null;
      this.isEphemeralTarget = false;
      await this.targetMoleculeService.deleteTargetMolecule(old);
    }
    this.targetMoleculeName = 'Target_Molecule';
    this.targetMolfile = null;
    this.targetCheckResult = null;
    this.isEphemeralTarget = false;
    this.ephemeralRecordName = null;
    this.promoteMoleculeName = '';
    this.lastDrawnSdf = null;
    this.moleculeStatusMessage = 'Draw a molecule or select a preset, then test.';
    if (this.ketcherCanvas) {
      this.ketcherCanvas.clearCanvas();
    }
    this.updateLsrPreview();
    this.snackBar.open('Target molecule reset to clean canvas.', 'OK', { duration: 2500 });
  }

  public onResetTest(): void {
    this.onResetMolecule();
    this.hasExecuted = false;
    this.isExecuting = false;
    this.errorMessage = null;
    this.executionLog = null;
    this.missingReactionPatterns = [];
    this.itemDetailOutput = null;
    this.moleculeSections = [];
    this.currentSdfContent = null;
    this.storageFiles = [];
    this.storageDirectory = '';
    this.selectedTabIndex = 0;
    this.snackBar.open('Test parameters and previous run outputs reset.', 'OK', { duration: 2500 });
  }

  public onTargetMoleculeNameChange(newName: string): void {
    this.targetMoleculeName = newName;
    this.targetCheckResult = null;
    this.updateLsrPreview();
  }

  public onTargetStructureLoaded(event: StructureLoadedEvent): void {
    this.targetMoleculeName = event.name;
    this.targetMolfile = event.structure;
    this.targetCheckResult = null;
    this.moleculeStatusMessage = `Loaded ${event.format.toUpperCase()} structure for '${event.name}'.`;
    if (this.ketcherCanvas) {
      this.ketcherCanvas.sendSdfToKetcher(event.structure, true, true);
    }
    this.updateLsrPreview();
  }

  public onTargetMoleculeSelected(item: CatalogItem): void {
    this.targetMoleculeName = item.name;
    this.targetCheckResult = null;
    this.moleculeStatusMessage = `Selected '${item.name}' from database (#${item.id || 'registered'}).`;
    this.updateLsrPreview();
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

  public updateLsrPreview(overrideTarget?: string): void {
    const effectiveTarget = (overrideTarget || this.targetCheckResult?.effectiveName || this.targetMoleculeName || 'Target_Molecule').trim();
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
      let effectiveMolecule = (this.targetMoleculeName || 'Target_Molecule').trim();
      let drawnMolfile = '';

      if (this.ketcherCanvas) {
        drawnMolfile = await this.ketcherCanvas.exportStructureFromKetcher('mol');
      }

      if (drawnMolfile && drawnMolfile.trim()) {
        this.snackBar.open('Verifying target molecule with database...', 'Dismiss', { duration: 2000 });
        const checkRes = await this.targetMoleculeService.checkTargetMolecule(drawnMolfile, effectiveMolecule);
        this.targetCheckResult = checkRes;
        this.lastDrawnSdf = checkRes.sdfContent;

        if (checkRes.isExisting && checkRes.matchedDbName && !/^(_?temp(_.*)?|temporary|target_molecule)$/i.test(checkRes.matchedDbName)) {
          effectiveMolecule = checkRes.matchedDbName;
          this.targetMoleculeName = effectiveMolecule;
          this.isEphemeralTarget = false;
        } else {
          // If a previous ephemeral record was registered for this session, clean it up first
          if (this.ephemeralRecordName) {
            await this.targetMoleculeService.deleteTargetMolecule(this.ephemeralRecordName);
          }

          const hasCustomName = effectiveMolecule &&
            effectiveMolecule.toLowerCase() !== 'temporary' &&
            effectiveMolecule.toLowerCase() !== 'target_molecule';

          // Assign unique ephemeral ID to prevent any collisions during chemdb execution
          const tempId = `Temp_${Date.now()}`;
          this.ephemeralRecordName = tempId;
          this.isEphemeralTarget = true;
          this.promoteMoleculeName = hasCustomName ? effectiveMolecule : '';

          effectiveMolecule = tempId;

          // Store temporary molecule in database for chemdb execution
          this.snackBar.open(`Registering scratch molecule '${tempId}' for execution...`, 'Dismiss', { duration: 2000 });
          const storeRes = await this.targetMoleculeService.storeTargetMolecule(tempId, checkRes.sdfContent);
          if (!storeRes.success && storeRes.error) {
            console.warn('[TestReactionPattern] Target molecule store warning:', storeRes.error);
          }
        }

        // Regenerate LSR content with the verified molecule name
        this.updateLsrPreview(effectiveMolecule);
      }

      // 2. Save .lsr file via /api/save-lsr (noted in execution log) under 'rxnpattests' category
      this.snackBar.open(`Saving LSR file '${this.rootName}.lsr' to rxnpattests...`, 'Dismiss', { duration: 2000 });
      const saveRes = await new Promise<any>((resolve, reject) => {
        this.reactCloudApi.saveLsrFile(this.rootName, this.generatedLsrContent, 'rxnpattests').subscribe({
          next: resolve,
          error: reject
        });
      });
      console.log('[TestReactionPattern] LSR file saved successfully:', saveRes);

      // 3. Execute Submechanism from Path under 'rxnpattests' category
      const cleanMechName = (this.mechName || 'TestMechanism').trim();
      const supplement = this.auxiliaryMolecules.join(',');

      // Invalidate in-memory cache to guarantee freshly fetched artifacts for this run
      this.reactCloudApi.clearAsciiCache();

      this.snackBar.open(`Executing submechanism ${cleanMechName}...`, 'Dismiss', { duration: 4000 });

      this.reactCloudApi.runSubmechanismFromPath(
        effectiveMolecule,
        this.rootName,
        supplement,
        'read',
        cleanMechName,
        this.generatedLsrContent,
        true,
        'rxnpattests'
      ).subscribe({
        next: async (res) => {
          this.isExecuting = false;
          this.hasExecuted = true;
          this.storageDirectory = res.storageDirectory || '';
          this.storageFiles = res.files || [];

          // 1. Process Execution Log
          let logContent = res.executionLog || '';
          if (!logContent) {
            const logFile = res.files?.find(f => f.fileType === 'log');
            if (logFile?.downloadUrl) {
              try {
                logContent = await firstValueFrom(this.reactCloudApi.fetchAsciiFileContent(logFile.downloadUrl, true));
              } catch (_) {}
            }
          }
          if (!logContent && res.output) {
            const idx = res.output.indexOf('--- Execution Log ---');
            if (idx !== -1) {
              logContent = res.output.substring(idx + '--- Execution Log ---'.length).trim();
            } else {
              logContent = res.output;
            }
          }
          this.executionLog = logContent;
          this.missingReactionPatterns = res.missingReactionPatterns ||
            this.reactCloudApi.extractMissingReactionPatterns(logContent || res.output || '');

          // 2. Check for Execution Failure
          const hasError = (res.exitCode !== 0 && res.exitCode !== undefined) || !!res.error;
          if (hasError) {
            this.errorMessage = res.error || `Execution failed with exit code ${res.exitCode}${res.signal ? ` (${res.signal})` : ''}`;
            this.snackBar.open(`Execution error: ${this.errorMessage}`, 'Close', { duration: 6000 });
            this.selectedTabIndex = 2; // Switch to Execution Log tab
            return;
          } else {
            this.snackBar.open(`Submechanism '${cleanMechName}' completed successfully!`, 'OK', { duration: 4000 });
          }

          // 3. Assemble full output for parsing reactions and structures (.mech, .sdf, etc.)
          let fullOutput = res.combinedOutput || '';
          if (!fullOutput || fullOutput.indexOf('--- Mechanism Reactions ---') === -1) {
            const mechFile = res.files?.find(f => f.fileType === 'mech');
            const sdfFile = res.files?.find(f => f.fileType === 'sdf');
            let mechContent = '';
            let sdfContent = '';
            if (mechFile?.downloadUrl) {
              try {
                mechContent = await firstValueFrom(this.reactCloudApi.fetchAsciiFileContent(mechFile.downloadUrl, true));
              } catch (_) {}
            }
            if (sdfFile?.downloadUrl) {
              try {
                sdfContent = await firstValueFrom(this.reactCloudApi.fetchAsciiFileContent(sdfFile.downloadUrl, true));
              } catch (_) {}
            }
            if (mechContent || sdfContent) {
              fullOutput = (mechContent ? `--- Mechanism Reactions ---\n${mechContent}\n\n` : '') +
                           (sdfContent ? `--- Molecule Structures ---\n${sdfContent}\n\n` : '') +
                           (fullOutput || res.output || '');
            } else if (!fullOutput) {
              fullOutput = res.output;
            }
          }

          // Parse mechanism sections from output (.mech, .sdf, .thm, .corrs, etc.)
          this.itemDetailOutput = fullOutput;
          this.currentSdfContent = this.chemParser.extractSdfContent(fullOutput);
          this.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(
            fullOutput,
            'mechanisms',
            this.currentSdfContent
          );

          // Automatically switch to Results Tab if sections exist, otherwise stay on Log
          if (this.moleculeSections.length > 0) {
            this.selectedTabIndex = 1;
          } else {
            this.selectedTabIndex = 2;
          }
        },
        error: (err) => {
          this.isExecuting = false;
          this.hasExecuted = true;
          this.errorMessage = err?.error?.error || err?.message || 'Submechanism execution failed.';
          this.snackBar.open(`Execution error: ${this.errorMessage}`, 'Close', { duration: 6000 });
          this.selectedTabIndex = 2;
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

  public async onPromoteTargetMolecule(): Promise<void> {
    const newName = (this.promoteMoleculeName || '').trim();
    if (!newName) {
      this.snackBar.open('Please enter a valid molecule name to save into catalog.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.lastDrawnSdf) {
      this.snackBar.open('No structure data available to save.', 'Close', { duration: 3000 });
      return;
    }

    this.isPromotingMolecule = true;
    try {
      const res = await this.targetMoleculeService.promoteTargetMolecule(
        this.ephemeralRecordName || '',
        newName,
        this.lastDrawnSdf
      );

      if (res.success) {
        this.isEphemeralTarget = false;
        this.ephemeralRecordName = null;
        this.targetMoleculeName = newName;
        this.moleculeStatusMessage = `Molecule '${newName}' saved into database catalog!`;
        this.snackBar.open(`Molecule '${newName}' successfully saved into catalog!`, 'OK', { duration: 3500 });
      } else {
        this.snackBar.open(`Failed to save molecule: ${res.error || 'Unknown error'}`, 'Close', { duration: 4000 });
      }
    } catch (err: any) {
      this.snackBar.open(`Error saving molecule: ${err.message}`, 'Close', { duration: 4000 });
    } finally {
      this.isPromotingMolecule = false;
    }
  }

  public async onDiscardEphemeralTarget(): Promise<void> {
    if (this.ephemeralRecordName) {
      const targetToDelete = this.ephemeralRecordName;
      this.ephemeralRecordName = null;
      this.isEphemeralTarget = false;
      await this.targetMoleculeService.deleteTargetMolecule(targetToDelete);
      this.snackBar.open(`Scratch target molecule '${targetToDelete}' discarded.`, 'OK', { duration: 2500 });
    } else {
      this.isEphemeralTarget = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up unpromoted ephemeral record when leaving the view
    if (this.isEphemeralTarget && this.ephemeralRecordName) {
      this.targetMoleculeService.deleteTargetMolecule(this.ephemeralRecordName).catch(() => {});
    }
  }
}
