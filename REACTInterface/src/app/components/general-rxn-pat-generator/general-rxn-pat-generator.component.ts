import { Component, Inject, Input, Optional, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { ExistenceCheckService, ExistenceCheckItem } from '../../services/existence-check.service';
import { CommandTemplatesRegistry } from '../../templates/command-templates.registry';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';

export interface AtomInfo {
  atomNumber: number;
  molAtomIndex?: number;
  symbol: string;
  isGeneric: boolean;
  moleculeIndex: number;
  isReactant: boolean;
  atomMapNumber?: number;
  x?: number;
  y?: number;
  z?: number;
  radical?: number;
}

export interface BondInfo {
  moleculeIndex: number;
  isReactant: boolean;
  atom1MolIndex: number;
  atom2MolIndex: number;
  atom1Number: number;
  atom2Number: number;
  bondType: number;
}

export interface AtomCorrespondenceRow {
  reactantAtomNumber: number;
  reactantSymbol: string;
  productAtomNumber: number | null;
  candidateProductAtoms: { atomNumber: number; label: string }[];
}

export interface BondChangeRow {
  moleculeIndex: number;
  atom1Number: number;
  atom2Number: number;
  type: number; // 4 = broken, 104 = formed
}

export interface RGroupRow {
  groupIndex: number;
  rAtomNumbers: number[];
  rAtomSymbols: string[];
  centralAtomSymbol: string;
  centralAtomNumber?: number;
  assignmentOptions: string; // e.g. 'R, H'
}

export interface ArrheniusFormValue {
  Aconstant: number;
  Energy: number;
  TempExp: number;
  SymmetryFactor: number;
  Reference: string;
}

export interface SubstructureItem {
  name: string;
  molfile: string;
  isExpanded?: boolean;
}

export interface RxnPatternItem {
  name: string;
  permutationTag: string;
  combination?: string[];
  molfile: string;
  forwardRate: ArrheniusFormValue;
  reverseRate: ArrheniusFormValue;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-general-rxn-pat-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatTableModule,
    MatExpansionModule,
    MatCardModule,
    MatSnackBarModule,
    KetcherViewerComponent
  ],
  templateUrl: './general-rxn-pat-generator.component.html',
  styleUrls: ['./general-rxn-pat-generator.component.scss']
})
export class GeneralRxnPatGeneratorComponent implements OnInit {
  @ViewChild('ketcherCanvas') ketcherCanvas!: KetcherViewerComponent;

  // Workflow Steps: 1=Validate, 2=Assign, 3=Generate, 4=Check Substructures, 5=Check DB, 6=Store DB
  public currentStep: number = 1;
  public isValidated: boolean = false;
  public isAssigned: boolean = false;
  public isGenerated: boolean = false;
  public isSubstructuresChecked: boolean = false;
  public isChecked: boolean = false;
  public isStored: boolean = false;

  // Global State
  public isExecuting: boolean = false;
  public statusMessage: string = '';
  public errorMessage: string = '';
  public validationErrors: string[] = [];

  // 1. Class Name Panel
  public rootName: string = 'AlkOHOODecomposition';
  public generatedClassNamePattern: string = '';

  // 2. Default Rate Constants Panel
  public forwardRateDefault: ArrheniusFormValue = {
    Aconstant: 2.88e8,
    Energy: 27000,
    TempExp: 1.0,
    SymmetryFactor: 1.0,
    Reference: 'From Come Propene'
  };

  public reverseRateDefault: ArrheniusFormValue = {
    Aconstant: 1.0e-40,
    Energy: 0.0,
    TempExp: 0.0,
    SymmetryFactor: 1.0,
    Reference: 'Set to zero because of multiple products'
  };

  // 3. Correspondence Table & Bond Changes Panel
  public correspondenceRows: AtomCorrespondenceRow[] = [];
  public bondChangeRows: BondChangeRow[] = [];
  public unmatchedAtomsCount: number = 0;
  public correspondenceDisplayedColumns: string[] = ['reactantAtom', 'atomType', 'productAtomDropdown'];
  public bondChangesDisplayedColumns: string[] = ['molecule', 'atomX', 'atomY', 'changeType'];

  // 4. Table of R Groupings Panel
  public rGroupRows: RGroupRow[] = [];
  public totalPermutationsCount: number = 0;
  public rGroupDisplayedColumns: string[] = ['groupIndex', 'rAtoms', 'centralAtom', 'assignments'];

  // 5. Substructure Panel
  public substructures: SubstructureItem[] = [];
  public singleSubstructures: SubstructureItem[] = [];

  // 6. Reaction Pattern List Panel
  public generatedRxnPatterns: RxnPatternItem[] = [];

  // 7. Substructure Database Check State
  public isSubstructuresCheckedExecuted: boolean = false;
  public isSubstructuresChecking: boolean = false;
  public substructureDbIdMap: Map<string, string> = new Map();
  public substructureCheckItems: ExistenceCheckItem[] = [];
  public substructureCheckLogLines: { text: string; isError: boolean }[] = [];
  public substructureCheckRawOutput: string = '';
  public substructureHasConflicts: boolean = false;

  // 8, 9, 10. Reaction Pattern Database Check Panels
  public isCheckedExecuted: boolean = false;
  public isDatabaseChecking: boolean = false;
  public isStoringClass: boolean = false;
  public substructureMolfilesCombined: string = '';
  public rxnPatternLstContent: string = '';
  public existenceCheckItems: ExistenceCheckItem[] = [];
  public checkLogLines: { text: string; isError: boolean }[] = [];
  public checkRawOutput: string = '';
  public checkExecutionLogText: string = '';
  public hasConflicts: boolean = false;
  public substructureCheckDisplayedColumns: string[] = ['name', 'dbId', 'status', 'suggestedAction'];
  public rxnPatternCheckDisplayedColumns: string[] = ['name', 'substructureMatch', 'exactMatch', 'status', 'suggestedAction'];

  // Internal Parsed Structure Data
  public templateRxnContent: string = '';
  public reactantAtoms: AtomInfo[] = [];
  public productAtoms: AtomInfo[] = [];
  public reactantBonds: BondInfo[] = [];
  public productBonds: BondInfo[] = [];

  constructor(
    private reactCloudApi: ReactCloudApiService,
    private existenceCheckService: ExistenceCheckService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<GeneralRxnPatGeneratorComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { initialRootName?: string }
  ) { }

  ngOnInit(): void {
    if (this.dialogData?.initialRootName) {
      this.rootName = this.dialogData.initialRootName;
    }
  }

  // --- 1. Button Panel Handlers ---

  /**
   * Button 1: 'Validate Template' (ValidateRxnPatternDialogTemplate)
   */
  public async validateTemplate(): Promise<void> {
    this.isExecuting = true;
    this.statusMessage = 'Reading reaction template from Ketcher & validating...';
    this.errorMessage = '';
    this.validationErrors = [];

    try {
      if (this.ketcherCanvas) {
        this.templateRxnContent = await this.ketcherCanvas.exportStructureFromKetcher('rxn');
      }

      if (!this.templateRxnContent || !this.templateRxnContent.trim()) {
        this.errorMessage = 'No reaction structure found in Ketcher drawing area. Please draw a reaction template.';
        this.isExecuting = false;
        return;
      }

      this.parseRxnStructure(this.templateRxnContent);
      const errors = this.performValidationChecks();

      if (errors.length > 0) {
        this.validationErrors = errors;
        this.errorMessage = 'Template validation failed: ' + errors.join(' ');
        this.isValidated = false;
      } else {
        this.isValidated = true;
        this.currentStep = 2;

        // Auto-populate Correspondences, Bond Changes, and R-Groupings upon validation
        this.buildCorrespondencesTable();
        this.buildBondChangesTable();
        this.buildRGroupingsTable();
        this.updateClassNamePatternPreview();
        this.isAssigned = true;

        this.statusMessage = 'Reaction template validated successfully! Atom Correspondences & Bond Changes panel populated.';
        this.snackBar.open('Template Validated & Correspondences Populated!', 'Dismiss', { duration: 3000 });
      }
    } catch (err: any) {
      console.error('[RxnPatGenerator] Template validation error:', err);
      this.errorMessage = err?.message || 'Error parsing or validating Ketcher reaction template.';
      this.isValidated = false;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Button 2: 'Assign Atoms' (FillInCorrespondences)
   */
  public assignAtoms(): void {
    if (!this.isValidated) return;

    this.isExecuting = true;
    this.statusMessage = 'Filling in atom correspondences, bond changes, and R-groupings...';

    try {
      this.buildCorrespondencesTable();
      this.buildBondChangesTable();
      this.buildRGroupingsTable();

      this.updateClassNamePatternPreview();
      this.isAssigned = true;
      this.currentStep = 3;
      this.statusMessage = 'Atom correspondences & R-groupings assigned! Ready to generate class.';
      this.snackBar.open('Atom Correspondences Assigned!', 'Dismiss', { duration: 2500 });
    } catch (err: any) {
      console.error('[RxnPatGenerator] Assign atoms error:', err);
      this.errorMessage = err?.message || 'Error populating atom correspondences.';
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Button 3: 'Generate Class' (GenerateRxnClassFromTemplate)
   */
  public generateClass(): void {
    if (!this.isAssigned) return;

    if (!this.rootName || !this.rootName.trim()) {
      this.errorMessage = 'Please specify a valid Root Class Name in the Class Name Panel.';
      return;
    }

    this.isExecuting = true;
    this.statusMessage = 'Defining substructures & generating reaction pattern permutations...';

    try {
      // Step A: Define Substructures
      this.defineSubstructuresFromTemplate();

      // Step B: Calculate Permutations & Generate Patterns
      this.generatePatternsFromRGroupings();

      this.isGenerated = true;
      this.currentStep = 4;
      this.statusMessage = `Successfully generated reaction class '${this.rootName.trim()}' with ${this.generatedRxnPatterns.length} reaction patterns!`;
      this.snackBar.open(`Generated ${this.generatedRxnPatterns.length} Reaction Patterns!`, 'Dismiss', { duration: 3000 });
    } catch (err: any) {
      console.error('[RxnPatGenerator] Generate class error:', err);
      this.errorMessage = err?.message || 'Error generating reaction class from template.';
    } finally {
      this.isExecuting = false;
    }
  }

  public copyToClipboard(text: string, label: string = 'Content'): void {
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text).then(() => {
        this.snackBar.open(`${label} copied to clipboard!`, 'Dismiss', { duration: 2500 });
      });
    }
  }

  public generateCheckDataFiles(): void {
    this.rxnPatternLstContent = this.serializeToLstFile();

    const combinedMap = new Map<string, SubstructureItem>();
    this.singleSubstructures.forEach(s => combinedMap.set(s.name, s));
    this.substructures.forEach(s => combinedMap.set(s.name, s));

    const sourceSubs = Array.from(combinedMap.values());
    this.substructureMolfilesCombined = sourceSubs.map((s, idx) => {
      const lines = s.molfile.trim().split(/\r?\n/);
      if (lines.length > 0) {
        lines[0] = (idx + 1).toString();
      }
      return lines.join('\n');
    }).join('\n');
  }

  public getSubstructuresTotalCount(): number {
    const combinedSet = new Set<string>();
    this.singleSubstructures.forEach(s => combinedSet.add(s.name));
    this.substructures.forEach(s => combinedSet.add(s.name));
    return combinedSet.size || (this.singleSubstructures.length + this.substructures.length);
  }

  private parseLogToLines(logText: string): { text: string; isError: boolean }[] {
    if (!logText) return [];
    return logText.split('\n').map(lineText => {
      const lower = lineText.toLowerCase();
      const isError = lower.includes('error') || lower.includes('fail') || lower.includes('cannot open');
      return { text: lineText, isError };
    });
  }

  private parseExistenceCheckOutput(output: string): void {
    const items: { id: string; name: string; dbId: string; inDatabase: boolean; status: string; suggestedAction: string }[] = [];
    this.hasConflicts = false;

    if (output) {
      const lines = output.split(/\r?\n/);
      let inReportTable = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (
          /^\:\s*\d+\s+(Molecules|Substructures|ReactionPatterns|Mechanisms)/i.test(trimmed) ||
          /^Summary:/i.test(trimmed) ||
          /^Command:/i.test(trimmed) ||
          /^\:\s*Mol/i.test(trimmed) ||
          trimmed.includes('Molecule Structures') ||
          (trimmed.startsWith('--') && !/^[\-\s]+$/.test(trimmed))
        ) {
          if (inReportTable && items.length > 0) {
            inReportTable = false;
            break;
          }
        }

        if (trimmed.includes('Index') && trimmed.includes('Name') && (trimmed.includes('Status') || trimmed.includes('Database'))) {
          inReportTable = true;
          continue;
        }

        if (inReportTable) {
          if (
            trimmed.includes('Molecule Structures') ||
            (trimmed.startsWith('--') && !/^[\-\s]+$/.test(trimmed))
          ) {
            inReportTable = false;
            break;
          }

          if (/^[\-\=\s]+$/.test(trimmed)) {
            continue;
          }

          const tokens = trimmed.split(/\s+/);
          if (tokens.length >= 2) {
            let name = tokens[0];
            let dbId = '';
            let statusStr = '';

            if (/^\d+$/.test(tokens[0]) && tokens.length >= 3) {
              name = tokens[1];
              dbId = tokens[2];
              statusStr = tokens.slice(3).join(' ') || tokens[2];
            } else if (tokens.length >= 3) {
              name = tokens[0];
              dbId = tokens[1];
              statusStr = tokens.slice(2).join(' ');
            } else {
              name = tokens[0];
              statusStr = tokens[1];
            }

            const upperStatus = statusStr.toUpperCase();
            const upperDbId = dbId.toUpperCase();
            const isNotFound = upperStatus.includes('NOT FOUND') ||
              upperStatus.includes('NOT_FOUND') ||
              upperStatus.includes('NOT') ||
              upperDbId === '---' ||
              upperDbId === 'NOT_FOUND';

            const isPresent = !isNotFound && (
              upperStatus.includes('EXISTS') ||
              upperStatus.includes('PRESENT') ||
              (upperStatus.includes('FOUND') && !upperStatus.includes('NOT')) ||
              (dbId !== '' && dbId !== '---' && dbId !== 'NOT_FOUND' && /^\d+$/.test(dbId))
            );

            if (isPresent) {
              this.hasConflicts = true;
            }

            items.push({
              id: `ITEM-${items.length + 1}`,
              name: name,
              dbId: dbId,
              inDatabase: isPresent,
              status: isPresent ? 'Present' : 'New',
              suggestedAction: isPresent ? 'Replace' : 'Add'
            });
          }
        }
      }
    }

    if (items.length === 0) {
      this.substructures.forEach((sub, idx) => {
        items.push({
          id: `SUB-${idx + 1}`,
          name: sub.name,
          dbId: 'N/A',
          inDatabase: false,
          status: 'New',
          suggestedAction: 'Add to DB'
        });
      });
      this.generatedRxnPatterns.forEach((pat, idx) => {
        items.push({
          id: `PAT-${idx + 1}`,
          name: pat.name,
          dbId: 'N/A',
          inDatabase: false,
          status: 'New',
          suggestedAction: 'Add to DB'
        });
      });
    }

    this.existenceCheckItems = items;
  }

  /**
   * Button 4: 'Check Substructures' (CheckSubstructuresInDatabase)
   * Generates SDF for substructures, runs existence check against database,
   * and maps matching database IDs to substituted substructure names.
   */
  public async checkSubstructures(): Promise<void> {
    if (!this.isGenerated) return;

    this.isExecuting = true;
    this.isSubstructuresChecking = true;
    this.statusMessage = `Checking database for generated substructures of '${this.rootName.trim()}'... Please wait.`;
    this.errorMessage = '';
    this.snackBar.open(`Running substructure database existence check for '${this.rootName.trim()}'...`, 'Dismiss', { duration: 4000 });

    try {
      await this.runSubstructuresCheckInternal();
      const matchedCount = this.substructureDbIdMap.size;
      this.statusMessage = `Substructures database check complete! Matched ${matchedCount} substructure(s) in DB and substituted Database IDs into reaction pattern equations.`;
      this.snackBar.open(`Substructure Check Complete! (${matchedCount} DB IDs substituted)`, 'Dismiss', { duration: 3500 });
    } catch (err: any) {
      console.error('[RxnPatGenerator] Check substructures error:', err);
      this.errorMessage = err?.message || 'Error executing Substructure Existence Check.';
    } finally {
      this.isExecuting = false;
      this.isSubstructuresChecking = false;
    }
  }

  private async runSubstructuresCheckInternal(): Promise<void> {
    // Generate .sdf content for substructures
    this.generateCheckDataFiles();
    this.isSubstructuresCheckedExecuted = true;

    const filename = `${this.rootName.trim()}.sdf`;
    const result = await this.existenceCheckService.checkDatabaseExistence(
      'substructure',
      'sdf',
      this.rootName.trim(),
      `${this.rootName.trim()}_sub_check`,
      [{ filename, content: this.substructureMolfilesCombined }]
    );

    this.substructureCheckRawOutput = result.rawOutput;
    this.substructureCheckLogLines = result.logLines;
    this.substructureCheckItems = result.items;
    this.substructureHasConflicts = result.hasConflicts;
    this.substructureDbIdMap = result.dbIdMap;

    this.isSubstructuresChecked = true;
    this.currentStep = 5;

    // Re-generate reaction pattern .lst content with substituted Database IDs
    this.rxnPatternLstContent = this.serializeToLstFile();
  }

  /**
   * Button 5: 'Check Database' (CheckRxnClass)
   */
  public async checkDatabase(): Promise<void> {
    if (!this.isGenerated) return;

    this.isExecuting = true;
    this.isDatabaseChecking = true;
    this.statusMessage = `Checking database for existing class '${this.rootName.trim()}'... Please wait.`;
    this.errorMessage = '';
    this.snackBar.open(`Running reaction class database existence check for '${this.rootName.trim()}'...`, 'Dismiss', { duration: 4000 });

    try {
      // 1. Ensure substructures are checked first so DB IDs are substituted into .lst equations
      if (!this.isSubstructuresChecked || this.substructureDbIdMap.size === 0) {
        this.statusMessage = `Checking substructures in database first for '${this.rootName.trim()}'...`;
        await this.runSubstructuresCheckInternal();
      }

      // 2. Ensure data file contents for Panels are generated (including .lst with substituted DB IDs)
      this.generateCheckDataFiles();
      this.isCheckedExecuted = true;

      const lstFilename = `${this.rootName.trim()}.lst`;
      const result = await this.existenceCheckService.checkDatabaseExistence(
        'rxn-pattern',
        'ascii',
        this.rootName.trim(),
        `${this.rootName.trim()}_check`,
        [{ filename: lstFilename, content: this.rxnPatternLstContent }]
      );

      this.checkRawOutput = result.rawOutput;
      this.checkExecutionLogText = result.executionLogText;
      this.checkLogLines = result.logLines;
      this.existenceCheckItems = result.items;
      this.hasConflicts = result.hasConflicts;

      if (result.success) {
        this.isChecked = true;
        this.currentStep = 6;
        this.statusMessage = `Database check complete! Reaction class '${this.rootName.trim()}' checked against database.`;
        this.snackBar.open('Database Check Complete!', 'Dismiss', { duration: 3000 });
      } else {
        this.errorMessage = 'Database existence check returned warnings or errors.';
        this.isChecked = true;
      }
    } catch (err: any) {
      console.error('[RxnPatGenerator] Check database error:', err);
      this.errorMessage = err?.message || 'Error executing Database Existence Check.';
      this.isChecked = true;
    } finally {
      this.isExecuting = false;
      this.isDatabaseChecking = false;
    }
  }

  /**
   * Button 6: 'Store Class' (StoreRxnClassFromTemplate)
   */
  public async storeClass(): Promise<void> {
    if (!this.isGenerated) return;

    this.isExecuting = true;
    this.isStoringClass = true;
    this.statusMessage = `Storing reaction class '${this.rootName.trim()}' in database... Please wait.`;
    this.errorMessage = '';
    this.snackBar.open(`Storing reaction class '${this.rootName.trim()}' in database...`, 'Dismiss', { duration: 4000 });

    try {
      // 1. Ensure substructures are checked first so DB IDs are substituted into .lst equations
      if (!this.isSubstructuresChecked || this.substructureDbIdMap.size === 0) {
        this.statusMessage = `Checking substructures in database first for '${this.rootName.trim()}'...`;
        await this.runSubstructuresCheckInternal();
      }

      const lstContent = this.serializeToLstFile();
      const filename = `${this.rootName.trim()}.lst`;
      await firstValueFrom(this.reactCloudApi.uploadUserDataFiles('.', [{ filename, content: lstContent }]));

      const commands = CommandTemplatesRegistry.getReadCheckStoreCommands(
        'rxn-pattern',
        'store',
        'ascii',
        this.rootName.trim(),
        `${this.rootName.trim()}_store`
      );

      const res = await firstValueFrom(this.reactCloudApi.runCommands(commands, this.rootName.trim()));

      if (res && res.exitCode === 0) {
        this.isStored = true;
        this.statusMessage = `Reaction class '${this.rootName.trim()}' stored successfully in REACTCLOUD database!`;
        this.snackBar.open('Reaction Class Stored Successfully!', 'Dismiss', { duration: 4000 });
      } else {
        this.errorMessage = res?.error || 'Error storing reaction class in database.';
      }
    } catch (err: any) {
      console.error('[RxnPatGenerator] Store class error:', err);
      this.errorMessage = err?.message || 'Error executing Store Reaction Class task.';
    } finally {
      this.isExecuting = false;
      this.isStoringClass = false;
    }
  }

  // --- Helper Routines for Template Parsing & Validation ---

  private isReactionSmiles(str: string): boolean {
    return str.includes('>>') || (!str.includes('$RXN') && !str.includes('V2000') && !str.includes('V3000') && str.includes('>'));
  }

  private parseReactionSmiles(rxnSmiles: string): void {
    console.log('[RxnPatGenerator] Parsing structure as Reaction SMILES / CXSMILES...');

    let smilesPart = rxnSmiles.trim();
    let extBlock = '';
    const firstPipe = rxnSmiles.indexOf('|');
    const lastPipe = rxnSmiles.lastIndexOf('|');

    if (firstPipe >= 0 && lastPipe > firstPipe) {
      smilesPart = rxnSmiles.substring(0, firstPipe).trim();
      extBlock = rxnSmiles.substring(firstPipe + 1, lastPipe).trim();
    }

    const cxLabels: string[] = [];
    const dollarMatch = extBlock.match(/\$([^$]+)\$/);
    if (dollarMatch) {
      const rawLabels = dollarMatch[1].split(';');
      rawLabels.forEach(lbl => {
        let clean = lbl.trim();
        if (clean.startsWith('_')) clean = clean.substring(1);
        cxLabels.push(clean);
      });
    }

    const rxnParts = smilesPart.split(/>+/);
    const reactantSmiles = rxnParts[0] || '';
    const productSmiles = rxnParts.length > 1 ? rxnParts[rxnParts.length - 1] : '';

    let globalSmilesAtomIdx = 0;

    // Parse Reactants SMILES (start atom counter at 1)
    const rResult = this.parseSmilesSection(
      reactantSmiles,
      true,
      1,
      1,
      globalSmilesAtomIdx,
      cxLabels
    );
    this.reactantAtoms = rResult.atoms;
    this.reactantBonds = rResult.bonds;
    globalSmilesAtomIdx = rResult.nextGlobalSmilesIdx;

    // Start product atom numbering AFTER total reactant atom count (N)
    const productStartAtomNumber = this.reactantAtoms.length + 1;

    // Parse Products SMILES
    const pResult = this.parseSmilesSection(
      productSmiles,
      false,
      rResult.maxMolIndex + 1,
      productStartAtomNumber,
      globalSmilesAtomIdx,
      cxLabels
    );
    this.productAtoms = pResult.atoms;
    this.productBonds = pResult.bonds;

    console.log('[RxnPatGenerator] Summary of parsed Reaction SMILES structure:', {
      reactantAtoms: this.reactantAtoms,
      productAtoms: this.productAtoms,
      reactantBonds: this.reactantBonds,
      productBonds: this.productBonds
    });
  }

  private parseSmilesSection(
    smilesStr: string,
    isReactant: boolean,
    startMolIndex: number,
    startAtomCounter: number,
    startGlobalSmilesIdx: number,
    cxLabels: string[]
  ): { atoms: AtomInfo[]; bonds: BondInfo[]; nextGlobalSmilesIdx: number; maxMolIndex: number } {
    const atoms: AtomInfo[] = [];
    const bonds: BondInfo[] = [];

    let currentMolIdx = startMolIndex;
    let atomCounter = startAtomCounter;
    let globalSmilesIdx = startGlobalSmilesIdx;

    const molTokens = smilesStr.split('.');

    molTokens.forEach(molToken => {
      if (!molToken.trim()) return;

      const molAtoms: AtomInfo[] = [];
      let activeAtomIdx: number | null = null;
      const branchStack: (number | null)[] = [];
      let pendingBondType = 1;

      const regex = /\[([^\]]+)\]|([A-Z][a-z]?|\*)|(=|#|-)|(\()|(\))/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(molToken)) !== null) {
        if (match[1] || match[2]) {
          const rawAtomStr = match[1] || match[2];
          let symbol = rawAtomStr;

          const cxLabel = cxLabels[globalSmilesIdx] || '';
          globalSmilesIdx++;

          if (cxLabel) {
            symbol = cxLabel;
          } else if (symbol === '*') {
            symbol = `R${atomCounter}`;
          }

          let atomMapNumber: number | undefined = undefined;
          const mapMatch = rawAtomStr.match(/:(\d+)$/);
          if (mapMatch) {
            atomMapNumber = parseInt(mapMatch[1], 10);
            symbol = rawAtomStr.replace(/:(\d+)$/, '').trim();
          }

          const isGeneric = /^R\d*$/i.test(symbol) || symbol === 'A' || symbol === 'X' || symbol === '*' || symbol.startsWith('R');
          const atomNum = atomMapNumber !== undefined ? atomMapNumber : (isReactant ? atomCounter++ : atomCounter++);

          const atomObj: AtomInfo = {
            atomNumber: atomNum,
            molAtomIndex: molAtoms.length + 1,
            symbol: symbol,
            isGeneric: isGeneric,
            moleculeIndex: currentMolIdx,
            isReactant: isReactant,
            atomMapNumber: atomMapNumber
          };

          molAtoms.push(atomObj);
          atoms.push(atomObj);

          if (activeAtomIdx !== null) {
            const parentAtom = molAtoms[activeAtomIdx];
            if (parentAtom) {
              bonds.push({
                moleculeIndex: currentMolIdx,
                isReactant: isReactant,
                atom1MolIndex: parentAtom.molAtomIndex!,
                atom2MolIndex: atomObj.molAtomIndex!,
                atom1Number: parentAtom.atomNumber,
                atom2Number: atomObj.atomNumber,
                bondType: pendingBondType
              });
            }
          }

          activeAtomIdx = molAtoms.length - 1;
          pendingBondType = 1;
        } else if (match[3]) {
          const bSym = match[3];
          if (bSym === '=') pendingBondType = 2;
          else if (bSym === '#') pendingBondType = 3;
          else pendingBondType = 1;
        } else if (match[4]) {
          branchStack.push(activeAtomIdx);
        } else if (match[5]) {
          if (branchStack.length > 0) {
            activeAtomIdx = branchStack.pop()!;
          }
        }
      }

      currentMolIdx++;
    });

    return { atoms, bonds, nextGlobalSmilesIdx: globalSmilesIdx, maxMolIndex: currentMolIdx - 1 };
  }

  private parseRxnStructure(rxnStr: string): void {
    this.reactantAtoms = [];
    this.productAtoms = [];
    this.reactantBonds = [];
    this.productBonds = [];

    console.log('[RxnPatGenerator] --- Beginning parseRxnStructure ---');
    console.log('[RxnPatGenerator] Raw Ketcher RXN Content:\n', rxnStr);

    if (!rxnStr || !rxnStr.trim()) {
      console.warn('[RxnPatGenerator] Rxn content is empty.');
      return;
    }

    if (this.isReactionSmiles(rxnStr)) {
      this.parseReactionSmiles(rxnStr);
      return;
    }

    const lines = rxnStr.split(/\r?\n/);
    const rxnHeaderIdx = lines.findIndex(l => l.trim().startsWith('$RXN'));
    let numReactants = 1;
    let numProducts = 1;

    if (rxnHeaderIdx >= 0) {
      for (let i = rxnHeaderIdx + 1; i < Math.min(lines.length, rxnHeaderIdx + 8); i++) {
        const countsMatch = lines[i].match(/^\s*(\d+)\s+(\d+)\s*$/);
        if (countsMatch) {
          numReactants = parseInt(countsMatch[1], 10);
          numProducts = parseInt(countsMatch[2], 10);
          console.log(`[RxnPatGenerator] $RXN header counts line found at line ${i}: numReactants=${numReactants}, numProducts=${numProducts}`);
          break;
        }
      }
    } else {
      console.log('[RxnPatGenerator] No $RXN header found in text.');
    }

    const molBlockStrings: string[] = [];
    let currentBlockLines: string[] = [];
    let insideMol = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('$MOL')) {
        if (insideMol && currentBlockLines.length > 0) {
          molBlockStrings.push(currentBlockLines.join('\n'));
        }
        currentBlockLines = [];
        insideMol = true;
      } else if (insideMol) {
        currentBlockLines.push(line);
      }
    }
    if (insideMol && currentBlockLines.length > 0) {
      molBlockStrings.push(currentBlockLines.join('\n'));
    }

    if (molBlockStrings.length === 0) {
      console.log('[RxnPatGenerator] No $MOL delimiters found; using full rxnStr as single MOL block.');
      molBlockStrings.push(rxnStr);
    } else {
      console.log(`[RxnPatGenerator] Discovered ${molBlockStrings.length} $MOL blocks.`);
    }

    let reactantAtomCounter = 1;

    molBlockStrings.forEach((blockStr, molIdx) => {
      const moleculeIndex = molIdx + 1;
      const isReactant = molIdx < numReactants;

      // Start product atom numbering after all reactant atoms (N)
      const currentAtomCounter = isReactant
        ? reactantAtomCounter
        : (this.reactantAtoms.length + this.productAtoms.length + 1);

      console.log(`[RxnPatGenerator] Parsing MOL block #${moleculeIndex} (isReactant=${isReactant})...`);

      const parsed = this.parseMolBlock(
        blockStr,
        moleculeIndex,
        isReactant,
        currentAtomCounter,
        currentAtomCounter
      );

      if (isReactant) {
        reactantAtomCounter = parsed.nextReactantCounter;
      }

      parsed.atoms.forEach(a => {
        if (a.isReactant) {
          this.reactantAtoms.push(a);
        } else {
          this.productAtoms.push(a);
        }
      });

      parsed.bonds.forEach(b => {
        if (b.isReactant) {
          this.reactantBonds.push(b);
        } else {
          this.productBonds.push(b);
        }
      });

      console.log(`[RxnPatGenerator] MOL block #${moleculeIndex} parsed: ${parsed.atoms.length} atoms, ${parsed.bonds.length} bonds.`);
    });

    if (this.productAtoms.length === 0 && this.reactantAtoms.length > 0) {
      console.warn('[RxnPatGenerator] Product atoms array empty; performing automatic fallback partition...');
      const all = [...this.reactantAtoms];
      if (all.length === 1) {
        this.productAtoms = [{ ...all[0], atomNumber: 1, isReactant: false }];
      } else {
        const half = Math.ceil(all.length / 2);
        this.reactantAtoms = all.slice(0, half).map((a, idx) => ({ ...a, atomNumber: idx, isReactant: true }));
        this.productAtoms = all.slice(half).map((a, idx) => ({ ...a, atomNumber: half + idx, isReactant: false }));
      }
    }

    if (this.reactantAtoms.length === 0 && this.productAtoms.length > 0) {
      console.warn('[RxnPatGenerator] Reactant atoms array empty; performing automatic fallback partition...');
      const all = [...this.productAtoms];
      if (all.length === 1) {
        this.reactantAtoms = [{ ...all[0], atomNumber: 0, isReactant: true }];
      } else {
        const half = Math.ceil(all.length / 2);
        this.reactantAtoms = all.slice(0, half).map((a, idx) => ({ ...a, atomNumber: idx, isReactant: true }));
        this.productAtoms = all.slice(half).map((a, idx) => ({ ...a, atomNumber: half + idx, isReactant: false }));
      }
    }

    // Resolve any overlapping or duplicate atom coordinates from template file
    this.resolveOverlappingCoordinates(this.reactantAtoms, this.reactantBonds);
    this.resolveOverlappingCoordinates(this.productAtoms, this.productBonds);

    console.log('[RxnPatGenerator] Summary of parsed reaction structure:', {
      numReactants,
      numProducts,
      reactantAtoms: this.reactantAtoms,
      productAtoms: this.productAtoms,
      reactantBonds: this.reactantBonds,
      productBonds: this.productBonds
    });
  }

  private resolveOverlappingCoordinates(atoms: AtomInfo[], bonds: BondInfo[]): void {
    if (!atoms || atoms.length === 0) return;

    // 1. If no non-zero coordinates exist across all atoms, place in a 2D circle
    const hasAnyCoords = atoms.some(a => a.x !== undefined && a.y !== undefined && (Math.abs(a.x) > 0.0001 || Math.abs(a.y) > 0.0001));
    if (!hasAnyCoords) {
      atoms.forEach((a, idx) => {
        const angle = (2 * Math.PI * idx) / atoms.length;
        const radius = 1.5;
        a.x = radius * Math.cos(angle);
        a.y = radius * Math.sin(angle);
      });
      return;
    }

    // 2. Identify duplicate/overlapping atoms (distance < 0.1 Å)
    const processed = new Set<number>();
    for (let i = 0; i < atoms.length; i++) {
      const a1 = atoms[i];
      if (processed.has(a1.atomNumber)) continue;

      const overlapping: AtomInfo[] = [a1];
      for (let j = i + 1; j < atoms.length; j++) {
        const a2 = atoms[j];
        const dx = (a1.x || 0) - (a2.x || 0);
        const dy = (a1.y || 0) - (a2.y || 0);
        if (Math.sqrt(dx * dx + dy * dy) < 0.1) {
          overlapping.push(a2);
          processed.add(a2.atomNumber);
        }
      }

      if (overlapping.length > 1) {
        const mainAtom = overlapping[0];
        const parentBond = bonds.find(b =>
          (b.atom1Number === mainAtom.atomNumber && !overlapping.some(o => o.atomNumber === b.atom2Number)) ||
          (b.atom2Number === mainAtom.atomNumber && !overlapping.some(o => o.atomNumber === b.atom1Number))
        );

        let parentAtom: AtomInfo | undefined;
        if (parentBond) {
          const parentNum = parentBond.atom1Number === mainAtom.atomNumber ? parentBond.atom2Number : parentBond.atom1Number;
          parentAtom = atoms.find(a => a.atomNumber === parentNum);
        }

        let baseAngle = 0;
        if (parentAtom && parentAtom.x !== undefined && parentAtom.y !== undefined) {
          baseAngle = Math.atan2((mainAtom.y || 0) - parentAtom.y, (mainAtom.x || 0) - parentAtom.x);
        }

        const countToOffset = overlapping.length;
        overlapping.forEach((atomToOffset, idx) => {
          if (idx === 0) return; // Keep main atom at original position
          const spreadAngle = baseAngle + (2 * Math.PI * idx) / countToOffset;
          const dist = 1.2;
          atomToOffset.x = (mainAtom.x || 0) + dist * Math.cos(spreadAngle);
          atomToOffset.y = (mainAtom.y || 0) + dist * Math.sin(spreadAngle);
        });
      }
    }
  }

  private parseMolBlock(
    blockStr: string,
    moleculeIndex: number,
    isReactant: boolean,
    reactantAtomCounter: number,
    productAtomCounter: number
  ): { atoms: AtomInfo[]; bonds: BondInfo[]; nextReactantCounter: number; nextProductCounter: number } {
    const blockLines = blockStr.split(/\r?\n/);
    const molAtoms: AtomInfo[] = [];
    const molBonds: BondInfo[] = [];

    let rCounter = reactantAtomCounter;
    let pCounter = productAtomCounter;

    // Strategy A: Check V3000 format (M  V30)
    const isV3000 = blockLines.some(l => l.includes('V3000') || l.includes('M  V30'));
    if (isV3000) {
      console.log(`[RxnPatGenerator] Parsing block #${moleculeIndex} using Strategy A (V3000)...`);
      let inAtomBlock = false;
      let inBondBlock = false;

      for (const line of blockLines) {
        const trimmed = line.trim();
        if (trimmed.includes('BEGIN ATOM')) {
          inAtomBlock = true;
          continue;
        }
        if (trimmed.includes('END ATOM')) {
          inAtomBlock = false;
          continue;
        }
        if (trimmed.includes('BEGIN BOND')) {
          inBondBlock = true;
          continue;
        }
        if (trimmed.includes('END BOND')) {
          inBondBlock = false;
          continue;
        }

        if (inAtomBlock && trimmed.startsWith('M  V30')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 6) {
            const localIdx = parseInt(parts[2], 10);
            const symbol = parts[3];

            let atomMapNumber: number | undefined = undefined;
            const mapMatch = trimmed.match(/ATOMMAP=(\d+)/i);
            if (mapMatch) {
              atomMapNumber = parseInt(mapMatch[1], 10);
            }

            if (symbol && isNaN(Number(symbol))) {
              const isGeneric = /^R\d*$/i.test(symbol) || symbol === 'A' || symbol === 'X' || symbol === '*' || symbol.startsWith('R');
              const atomNum = atomMapNumber !== undefined ? atomMapNumber : (isReactant ? rCounter++ : pCounter++);

              molAtoms.push({
                atomNumber: atomNum,
                molAtomIndex: localIdx,
                symbol: symbol,
                isGeneric: isGeneric,
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atomMapNumber: atomMapNumber
              });
            }
          }
        }

        if (inBondBlock && trimmed.startsWith('M  V30')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 6) {
            const bType = parseInt(parts[3], 10);
            const a1Local = parseInt(parts[4], 10);
            const a2Local = parseInt(parts[5], 10);

            const a1Obj = molAtoms.find(a => a.molAtomIndex === a1Local);
            const a2Obj = molAtoms.find(a => a.molAtomIndex === a2Local);

            if (a1Obj && a2Obj) {
              molBonds.push({
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atom1MolIndex: a1Local,
                atom2MolIndex: a2Local,
                atom1Number: a1Obj.atomNumber,
                atom2Number: a2Obj.atomNumber,
                bondType: isNaN(bType) ? 1 : bType
              });
            }
          }
        }
      }

      return { atoms: molAtoms, bonds: molBonds, nextReactantCounter: rCounter, nextProductCounter: pCounter };
    }

    // Strategy B: V2000 Counts Line Parsing
    const countsLineIdx = blockLines.findIndex(l => l.includes('V2000'));
    if (countsLineIdx >= 0) {
      const countsLine = blockLines[countsLineIdx];
      const countsMatch = countsLine.match(/^\s*(\d+)\s+(\d+)/);
      if (countsMatch) {
        const nAtoms = parseInt(countsMatch[1], 10);
        const nBonds = parseInt(countsMatch[2], 10);

        console.log(`[RxnPatGenerator] Parsing block #${moleculeIndex} using Strategy B (V2000): countsLineIdx=${countsLineIdx}, nAtoms=${nAtoms}, nBonds=${nBonds}`);

        // Parse Atom Lines
        for (let j = 0; j < nAtoms && (countsLineIdx + 1 + j) < blockLines.length; j++) {
          const line = blockLines[countsLineIdx + 1 + j];
          let symbol = '';

          if (line.length >= 34) {
            symbol = line.substring(31, 34).trim();
          }

          if (!symbol || /^\d+$/.test(symbol)) {
            const tokens = line.trim().split(/\s+/);
            if (tokens.length >= 4 && isNaN(Number(tokens[3]))) {
              symbol = tokens[3];
            } else {
              const symToken = tokens.find(t => /^[A-Za-z*#][A-Za-z0-9*#]*$/.test(t));
              if (symToken) symbol = symToken;
            }
          }

          if (symbol) {
            let atomMapNumber: number | undefined = undefined;
            if (line.length >= 63) {
              const mapStr = line.substring(60, 63).trim();
              const mapVal = parseInt(mapStr, 10);
              if (!isNaN(mapVal) && mapVal > 0) {
                atomMapNumber = mapVal;
              }
            }

            let xVal: number | undefined;
            let yVal: number | undefined;
            let zVal: number | undefined;
            if (line.length >= 30) {
              const xP = parseFloat(line.substring(0, 10).trim());
              const yP = parseFloat(line.substring(10, 20).trim());
              const zP = parseFloat(line.substring(20, 30).trim());
              if (!isNaN(xP)) xVal = xP;
              if (!isNaN(yP)) yVal = yP;
              if (!isNaN(zP)) zVal = zP;
            }

            let radVal = 0;
            if (line.length >= 38) {
              const radStr = line.substring(36, 38).trim();
              const parsedRad = parseInt(radStr, 10);
              if (!isNaN(parsedRad)) radVal = parsedRad;
            }

            const isGeneric = /^R\d*$/i.test(symbol) || symbol === 'A' || symbol === 'X' || symbol === '*' || symbol.startsWith('R');
            const atomNum = atomMapNumber !== undefined ? atomMapNumber : (isReactant ? rCounter++ : pCounter++);

            molAtoms.push({
              atomNumber: atomNum,
              molAtomIndex: j + 1,
              symbol: symbol,
              isGeneric: isGeneric,
              moleculeIndex: moleculeIndex,
              isReactant: isReactant,
              atomMapNumber: atomMapNumber,
              x: xVal,
              y: yVal,
              z: zVal,
              radical: radVal
            });
          } else {
            console.warn(`[RxnPatGenerator] Could not extract symbol from atom line ${j + 1}:`, line);
          }
        }

        // Parse Bond Lines
        const bondStartIdx = countsLineIdx + 1 + nAtoms;
        for (let k = 0; k < nBonds && (bondStartIdx + k) < blockLines.length; k++) {
          const line = blockLines[bondStartIdx + k];
          const tokens = line.trim().split(/\s+/);

          let a1Local = 0;
          let a2Local = 0;
          let bType = 1;

          if (tokens.length >= 3) {
            a1Local = parseInt(tokens[0], 10);
            a2Local = parseInt(tokens[1], 10);
            bType = parseInt(tokens[2], 10);
          } else if (line.length >= 6) {
            a1Local = parseInt(line.substring(0, 3).trim(), 10);
            a2Local = parseInt(line.substring(3, 6).trim(), 10);
            bType = line.length >= 9 ? parseInt(line.substring(6, 9).trim(), 10) : 1;
          }

          if (a1Local > 0 && a2Local > 0) {
            const a1Obj = molAtoms.find(a => a.molAtomIndex === a1Local);
            const a2Obj = molAtoms.find(a => a.molAtomIndex === a2Local);

            if (a1Obj && a2Obj) {
              molBonds.push({
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atom1MolIndex: a1Local,
                atom2MolIndex: a2Local,
                atom1Number: a1Obj.atomNumber,
                atom2Number: a2Obj.atomNumber,
                bondType: isNaN(bType) ? 1 : bType
              });
            }
          }
        }

        // Parse Property Lines (M  RAD)
        const propStartIdx = countsLineIdx + 1 + nAtoms + nBonds;
        for (let p = propStartIdx; p < blockLines.length; p++) {
          const pLine = blockLines[p].trim();
          if (pLine.startsWith('M  RAD')) {
            const tokens = pLine.split(/\s+/);
            if (tokens.length >= 4) {
              const entryCount = parseInt(tokens[2], 10);
              for (let e = 0; e < entryCount && (3 + e * 2 + 1) < tokens.length; e++) {
                const localIdx = parseInt(tokens[3 + e * 2], 10);
                const radType = parseInt(tokens[3 + e * 2 + 1], 10);
                const atomObj = molAtoms.find(a => a.molAtomIndex === localIdx);
                if (atomObj) {
                  atomObj.radical = radType;
                }
              }
            }
          }
        }

        return { atoms: molAtoms, bonds: molBonds, nextReactantCounter: rCounter, nextProductCounter: pCounter };
      }
    }

    // Strategy C: Generic Fallback Token Scanning
    console.log(`[RxnPatGenerator] Parsing block #${moleculeIndex} using Strategy C (Generic Token Scanning)...`);
    const atomLines: { line: string; index: number }[] = [];
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];
      const isAtomLine = /^\s*[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[A-Za-z0-9*#]+/.test(line) ||
        (line.length >= 34 && /^\s*[-+]?\d+\.\d+/.test(line) && /[A-Za-z*#]/.test(line.substring(30, 36)));

      if (isAtomLine) {
        atomLines.push({ line, index: i });
      }
    }

    atomLines.forEach((item, j) => {
      const line = item.line;
      let symbol = '';

      if (line.length >= 34) {
        symbol = line.substring(31, 34).trim();
      }
      if (!symbol || /^\d+$/.test(symbol)) {
        const coordMatch = line.match(/^\s*[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+([A-Za-z0-9*#]+)/);
        if (coordMatch) symbol = coordMatch[1];
      }

      if (symbol) {
        let atomMapNumber: number | undefined = undefined;
        if (line.length >= 63) {
          const mapStr = line.substring(60, 63).trim();
          const mapVal = parseInt(mapStr, 10);
          if (!isNaN(mapVal) && mapVal > 0) {
            atomMapNumber = mapVal;
          }
        }

        const isGeneric = /^R\d*$/i.test(symbol) || symbol === 'A' || symbol === 'X' || symbol === '*' || symbol.startsWith('R');
        const atomNum = atomMapNumber !== undefined ? atomMapNumber : (isReactant ? rCounter++ : pCounter++);

        molAtoms.push({
          atomNumber: atomNum,
          molAtomIndex: j + 1,
          symbol: symbol,
          isGeneric: isGeneric,
          moleculeIndex: moleculeIndex,
          isReactant: isReactant,
          atomMapNumber: atomMapNumber
        });
      }
    });

    const lastAtomIdx = atomLines.length > 0 ? atomLines[atomLines.length - 1].index : -1;
    if (lastAtomIdx >= 0) {
      for (let k = lastAtomIdx + 1; k < blockLines.length; k++) {
        const line = blockLines[k];
        if (line.startsWith('M  ') || line.startsWith('$') || line.startsWith('>')) break;

        const bondMatch = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)/);
        if (bondMatch || line.length >= 6) {
          const a1Local = bondMatch ? parseInt(bondMatch[1], 10) : parseInt(line.substring(0, 3).trim(), 10);
          const a2Local = bondMatch ? parseInt(bondMatch[2], 10) : parseInt(line.substring(3, 6).trim(), 10);
          const bType = bondMatch ? parseInt(bondMatch[3], 10) : (line.length >= 9 ? parseInt(line.substring(6, 9).trim(), 10) : 1);

          if (!isNaN(a1Local) && !isNaN(a2Local) && a1Local > 0 && a2Local > 0) {
            const a1Obj = molAtoms.find(a => a.molAtomIndex === a1Local);
            const a2Obj = molAtoms.find(a => a.molAtomIndex === a2Local);

            if (a1Obj && a2Obj) {
              molBonds.push({
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atom1MolIndex: a1Local,
                atom2MolIndex: a2Local,
                atom1Number: a1Obj.atomNumber,
                atom2Number: a2Obj.atomNumber,
                bondType: isNaN(bType) ? 1 : bType
              });
            }
          }
        }
      }
    }

    return { atoms: molAtoms, bonds: molBonds, nextReactantCounter: rCounter, nextProductCounter: pCounter };
  }

  private performValidationChecks(): string[] {
    const errors: string[] = [];

    if (this.reactantAtoms.length === 0) {
      errors.push('No reactant atoms detected in reaction template.');
    }
    if (this.productAtoms.length === 0) {
      errors.push('No product atoms detected in reaction template.');
    }

    const reactantCounts: { [sym: string]: number } = {};
    const productCounts: { [sym: string]: number } = {};

    this.reactantAtoms.forEach(a => reactantCounts[a.symbol] = (reactantCounts[a.symbol] || 0) + 1);
    this.productAtoms.forEach(a => productCounts[a.symbol] = (productCounts[a.symbol] || 0) + 1);

    const genericRInReactants = this.reactantAtoms.filter(a => a.isGeneric).length;
    const genericRInProducts = this.productAtoms.filter(a => a.isGeneric).length;

    const allSymbols = new Set([...Object.keys(reactantCounts), ...Object.keys(productCounts)]);
    allSymbols.forEach(sym => {
      const rCount = reactantCounts[sym] || 0;
      const pCount = productCounts[sym] || 0;
      const isGenericSym = /^R\d*$/i.test(sym) || sym === 'A' || sym === 'X' || sym.startsWith('R');

      if (rCount !== pCount && !isGenericSym) {
        errors.push(`Atom count imbalance for '${sym}': ${rCount} in reactants vs ${pCount} in products.`);
      }
    });

    if (genericRInReactants !== genericRInProducts) {
      errors.push(`Generic atom count imbalance: ${genericRInReactants} R-group(s) in reactants vs ${genericRInProducts} in products.`);
    }

    return errors;
  }

  // --- Helper Routines for Correspondences & Tables ---

  private buildCorrespondencesTable(): void {
    this.correspondenceRows = this.reactantAtoms.map((rAtom, idx) => {
      const candidates = this.productAtoms
        .filter(pAtom => pAtom.symbol === rAtom.symbol || (rAtom.isGeneric && pAtom.isGeneric))
        .map(pAtom => ({
          atomNumber: pAtom.atomNumber,
          label: `Atom #${pAtom.atomNumber} (${pAtom.symbol})`
        }));

      let matchedProd = rAtom.atomMapNumber !== undefined
        ? candidates.find(c => c.atomNumber === rAtom.atomMapNumber)
        : undefined;

      if (!matchedProd) {
        // Find matching product candidate by relative index within same type
        const sameTypeReactantIndex = this.reactantAtoms
          .filter((a, i) => i < idx && (a.symbol === rAtom.symbol || (rAtom.isGeneric && a.isGeneric)))
          .length;

        if (sameTypeReactantIndex < candidates.length) {
          matchedProd = candidates[sameTypeReactantIndex];
        }
      }

      if (!matchedProd && candidates.length > 0) {
        matchedProd = candidates[0];
      }

      return {
        reactantAtomNumber: rAtom.atomNumber,
        reactantSymbol: rAtom.symbol,
        productAtomNumber: matchedProd ? matchedProd.atomNumber : null,
        candidateProductAtoms: candidates
      };
    });
  }

  public onCorrespondenceChange(): void {
    this.buildBondChangesTable();
  }

  private buildBondChangesTable(): void {
    this.bondChangeRows = [];

    const rToPMap = new Map<number, number>();
    const pToRMap = new Map<number, number>();

    this.correspondenceRows.forEach(row => {
      if (row.productAtomNumber !== null) {
        rToPMap.set(row.reactantAtomNumber, row.productAtomNumber);
        pToRMap.set(row.productAtomNumber, row.reactantAtomNumber);
      }
    });

    // 1. Broken Bonds in Reactants (Type 4)
    this.reactantBonds.forEach(rBond => {
      const pAtom1 = rToPMap.get(rBond.atom1Number);
      const pAtom2 = rToPMap.get(rBond.atom2Number);

      let bondExistsInProduct = false;
      if (pAtom1 !== undefined && pAtom2 !== undefined) {
        bondExistsInProduct = this.productBonds.some(pBond =>
          (pBond.atom1Number === pAtom1 && pBond.atom2Number === pAtom2) ||
          (pBond.atom1Number === pAtom2 && pBond.atom2Number === pAtom1)
        );
      }

      if (!bondExistsInProduct || rBond.bondType === 4) {
        this.bondChangeRows.push({
          moleculeIndex: rBond.moleculeIndex,
          atom1Number: rBond.atom1Number,
          atom2Number: rBond.atom2Number,
          type: 4
        });
      }
    });

    // 2. Formed Bonds in Products (Type 104)
    this.productBonds.forEach(pBond => {
      const rAtom1 = pToRMap.get(pBond.atom1Number);
      const rAtom2 = pToRMap.get(pBond.atom2Number);

      let bondExistsInReactant = false;
      if (rAtom1 !== undefined && rAtom2 !== undefined) {
        bondExistsInReactant = this.reactantBonds.some(rBond =>
          (rBond.atom1Number === rAtom1 && rBond.atom2Number === rAtom2) ||
          (rBond.atom1Number === rAtom2 && rBond.atom2Number === rAtom1)
        );
      }

      if (!bondExistsInReactant || pBond.bondType === 4 || pBond.bondType === 104) {
        this.bondChangeRows.push({
          moleculeIndex: pBond.moleculeIndex,
          atom1Number: pBond.atom1Number,
          atom2Number: pBond.atom2Number,
          type: 104
        });
      }
    });

    this.unmatchedAtomsCount = this.correspondenceRows.filter(r => r.productAtomNumber === null).length;
  }

  private buildRGroupingsTable(): void {
    const rAtoms = this.reactantAtoms.filter(a => a.isGeneric);

    if (rAtoms.length === 0) {
      this.rGroupRows = [];
      this.calculateTotalPermutations();
      return;
    }

    const groupsByCentralAtom = new Map<string, { centralSymbol: string; centralAtomNumber: number; rAtoms: AtomInfo[] }>();
    const unattachedRAtoms: AtomInfo[] = [];

    rAtoms.forEach(rAtom => {
      const connectedBond = this.reactantBonds.find(b =>
        b.atom1Number === rAtom.atomNumber || b.atom2Number === rAtom.atomNumber
      );

      if (connectedBond) {
        const neighborNum = connectedBond.atom1Number === rAtom.atomNumber
          ? connectedBond.atom2Number
          : connectedBond.atom1Number;
        const neighbor = this.reactantAtoms.find(a => a.atomNumber === neighborNum);

        if (neighbor && !neighbor.isGeneric) {
          const key = `${neighbor.symbol}_${neighbor.atomNumber}`;
          if (!groupsByCentralAtom.has(key)) {
            groupsByCentralAtom.set(key, { centralSymbol: neighbor.symbol, centralAtomNumber: neighbor.atomNumber, rAtoms: [] });
          }
          groupsByCentralAtom.get(key)!.rAtoms.push(rAtom);
        } else {
          unattachedRAtoms.push(rAtom);
        }
      } else {
        unattachedRAtoms.push(rAtom);
      }
    });

    const groups: RGroupRow[] = [];
    let groupCounter = 1;

    groupsByCentralAtom.forEach((groupData) => {
      groups.push({
        groupIndex: groupCounter++,
        rAtomNumbers: groupData.rAtoms.map(a => a.atomNumber),
        rAtomSymbols: groupData.rAtoms.map(a => a.symbol),
        centralAtomSymbol: groupData.centralSymbol,
        centralAtomNumber: groupData.centralAtomNumber,
        assignmentOptions: 'R, H'
      });
    });

    if (unattachedRAtoms.length > 0) {
      groups.push({
        groupIndex: groupCounter++,
        rAtomNumbers: unattachedRAtoms.map(a => a.atomNumber),
        rAtomSymbols: unattachedRAtoms.map(a => a.symbol),
        centralAtomSymbol: 'C',
        assignmentOptions: 'R, H'
      });
    }

    this.rGroupRows = groups;
    this.calculateTotalPermutations();
  }

  public calculateTotalPermutations(): void {
    if (this.rGroupRows.length === 0) {
      this.totalPermutationsCount = 1;
      return;
    }

    let total = 1;
    this.rGroupRows.forEach(g => {
      const options = g.assignmentOptions.split(',').map(o => o.trim().toLowerCase()).filter(o => o);
      const k = g.rAtomNumbers.length;
      const combos = this.generateCombinationsWithRepetition(options.length > 0 ? options : ['h', 'r'], k);
      total *= combos.length;
    });
    this.totalPermutationsCount = total;
  }

  public updateClassNamePatternPreview(): void {
    if (this.rGroupRows.length === 0) {
      this.generatedClassNamePattern = `${this.rootName.trim()}-(default)`;
      return;
    }

    const groupTags = this.rGroupRows.map(g => {
      const xs = 'X'.repeat(g.rAtomNumbers.length);
      return `(${xs})`;
    }).join('');
    this.generatedClassNamePattern = `${this.rootName.trim()}-${groupTags}`;
  }

  public onRootNameChange(): void {
    this.updateClassNamePatternPreview();
  }

  public onRGroupAssignmentChange(): void {
    this.calculateTotalPermutations();
    this.updateClassNamePatternPreview();
    if (this.isGenerated) {
      this.defineSubstructuresFromTemplate();
      this.generatePatternsFromRGroupings();
      this.generateCheckDataFiles();
    }
  }

  public onDefaultRatesChange(): void {
    if (this.isGenerated) {
      this.generatePatternsFromRGroupings();
      this.generateCheckDataFiles();
    }
  }

  // --- Helper Routines for Substructures & Pattern Generation ---

  private buildSubstitutionsForCombination(comb: string[]): Map<number, string> {
    const substitutions = new Map<number, string>();

    comb.forEach((tag, gIdx) => {
      const g = this.rGroupRows[gIdx];
      if (!g) return;

      for (let i = 0; i < g.rAtomNumbers.length && i < tag.length; i++) {
        const rAtomNum = g.rAtomNumbers[i];
        const subChar = tag[i];
        const newSym = subChar.toUpperCase();

        substitutions.set(rAtomNum, newSym);

        const corr = this.correspondenceRows.find(c => c.reactantAtomNumber === rAtomNum);
        if (corr && corr.productAtomNumber !== null) {
          substitutions.set(corr.productAtomNumber, newSym);
        }
      }
    });

    return substitutions;
  }

  private generateSubstitutedStructure(templateStr: string, substitutions: Map<number, string>): string {
    if (!templateStr || substitutions.size === 0) {
      return templateStr;
    }

    if (this.isReactionSmiles(templateStr)) {
      return this.convertSmilesToRxnMolfile(substitutions);
    } else {
      return this.substituteRxnMolfile(templateStr, substitutions);
    }
  }

  private convertSmilesToRxnMolfile(substitutions: Map<number, string>): string {
    const numReactants = new Set(this.reactantAtoms.map(a => a.moleculeIndex)).size || 1;
    const numProducts = new Set(this.productAtoms.map(a => a.moleculeIndex)).size || 1;

    let molfile = `$RXN\n`;
    molfile += `  -REACTCLOUD-\n`;
    molfile += `  Substituted Reaction Pattern\n\n`;
    molfile += `${numReactants.toString().padStart(3, ' ')}${numProducts.toString().padStart(3, ' ')}\n`;

    const allMols = new Map<number, { isReactant: boolean; atoms: AtomInfo[]; bonds: BondInfo[] }>();

    [...this.reactantAtoms, ...this.productAtoms].forEach(a => {
      const mIdx = a.moleculeIndex || 1;
      if (!allMols.has(mIdx)) {
        allMols.set(mIdx, { isReactant: a.isReactant, atoms: [], bonds: [] });
      }
      allMols.get(mIdx)!.atoms.push(a);
    });

    [...this.reactantBonds, ...this.productBonds].forEach(b => {
      const mIdx = b.moleculeIndex || 1;
      if (allMols.has(mIdx)) {
        allMols.get(mIdx)!.bonds.push(b);
      }
    });

    allMols.forEach((molData) => {
      molfile += `$MOL\n`;
      molfile += `Molecule\n`;
      molfile += `  -REACTCLOUD-\n\n`;

      const nAtoms = molData.atoms.length;
      const nBonds = molData.bonds.length;
      molfile += `${nAtoms.toString().padStart(3, ' ')}${nBonds.toString().padStart(3, ' ')}  0  0  0  0  0  0  0  0999 V2000\n`;

      molData.atoms.forEach((a, idx) => {
        let sym = a.symbol;
        if (substitutions.has(a.atomNumber)) {
          sym = substitutions.get(a.atomNumber)!;
        } else if (sym === '*' || /^R\d*$/i.test(sym)) {
          sym = 'R';
        }

        const formattedSym = sym.toUpperCase().padEnd(3, ' ');
        const mapVal = a.atomMapNumber !== undefined ? a.atomMapNumber : a.atomNumber;
        const mapStr = mapVal > 0 ? mapVal.toString().padStart(3, ' ') : '  0';

        molfile += `    0.0000    0.0000    0.0000 ${formattedSym} 0  0  0  0  0  0  0  0  0${mapStr}  0  0\n`;
      });

      molData.bonds.forEach(b => {
        const a1Obj = molData.atoms.find(a => a.atomNumber === b.atom1Number);
        const a2Obj = molData.atoms.find(a => a.atomNumber === b.atom2Number);
        const a1Local = a1Obj ? (a1Obj.molAtomIndex || molData.atoms.indexOf(a1Obj) + 1) : 1;
        const a2Local = a2Obj ? (a2Obj.molAtomIndex || molData.atoms.indexOf(a2Obj) + 1) : 2;
        const bType = b.bondType || 1;

        molfile += `${a1Local.toString().padStart(3, ' ')}${a2Local.toString().padStart(3, ' ')}${bType.toString().padStart(3, ' ')}  0  0  0  0\n`;
      });

      molfile += `M  END\n`;
    });

    return molfile;
  }

  private substituteRxnMolfile(rxnStr: string, substitutions: Map<number, string>): string {
    const lines = rxnStr.split(/\r?\n/);
    const resultLines: string[] = [];

    const allAtoms = [...this.reactantAtoms, ...this.productAtoms];
    const substitutedLocalAtoms = new Set<string>();
    substitutions.forEach((newSym, atomNum) => {
      const matched = allAtoms.find(a => a.atomNumber === atomNum);
      if (matched && matched.moleculeIndex !== undefined && matched.molAtomIndex !== undefined) {
        substitutedLocalAtoms.add(`${matched.moleculeIndex}_${matched.molAtomIndex}`);
      }
    });

    let currentMolIdx = 0;
    const hasMolDelim = lines.some(l => l.trim().startsWith('$MOL'));

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (line.trim().startsWith('$MOL')) {
        currentMolIdx++;
        resultLines.push(line);
        continue;
      }

      if (!hasMolDelim && currentMolIdx === 0) {
        currentMolIdx = 1;
      }

      const countsMatch = line.match(/^\s*(\d+)\s+(\d+)/);
      const isCountsLine = countsMatch && (line.includes('V2000') || line.includes('V3000') || line.length >= 10);

      if (isCountsLine && countsMatch) {
        const nAtoms = parseInt(countsMatch[1], 10);
        resultLines.push(line);

        for (let j = 0; j < nAtoms && (i + 1 + j) < lines.length; j++) {
          let atomLine = lines[i + 1 + j];
          const molAtomIndex = j + 1;

          const matchedAtom = allAtoms.find(
            a => a.moleculeIndex === currentMolIdx && a.molAtomIndex === molAtomIndex
          );

          if (matchedAtom && substitutions.has(matchedAtom.atomNumber)) {
            const newSym = substitutions.get(matchedAtom.atomNumber)!;
            const symFormatted = newSym.toUpperCase();

            if (atomLine.length >= 34) {
              atomLine = atomLine.substring(0, 31) + symFormatted.padEnd(3, ' ') + atomLine.substring(34);
            } else {
              const tokens = atomLine.trim().split(/\s+/);
              if (tokens.length >= 4) {
                tokens[3] = symFormatted;
                atomLine = '  ' + tokens.join('   ');
              }
            }
          }

          resultLines.push(atomLine);
        }

        i += nAtoms;
        continue;
      }

      // Handle 'A  <atom_index>' alias lines (V2000)
      const aLineMatch = line.match(/^A\s+(\d+)/);
      if (aLineMatch) {
        const localAtomIdx = parseInt(aLineMatch[1], 10);
        const key = `${currentMolIdx}_${localAtomIdx}`;
        if (substitutedLocalAtoms.has(key)) {
          if (i + 1 < lines.length && !lines[i + 1].startsWith('$') && !lines[i + 1].startsWith('M  ')) {
            i++;
          }
          continue;
        }
      }

      // Handle 'V  <atom_index> <alias>' lines
      const vLineMatch = line.match(/^V\s+(\d+)/);
      if (vLineMatch) {
        const localAtomIdx = parseInt(vLineMatch[1], 10);
        const key = `${currentMolIdx}_${localAtomIdx}`;
        if (substitutedLocalAtoms.has(key)) {
          continue;
        }
      }

      // Handle M RGP lines
      if (line.startsWith('M  RGP')) {
        const tokens = line.trim().split(/\s+/);
        if (tokens.length >= 4) {
          const entryCount = parseInt(tokens[2], 10);
          const newEntries: { localIdx: number; rNum: number }[] = [];

          for (let e = 0; e < entryCount && (3 + e * 2 + 1) < tokens.length; e++) {
            const localIdx = parseInt(tokens[3 + e * 2], 10);
            const rNum = parseInt(tokens[3 + e * 2 + 1], 10);
            const key = `${currentMolIdx}_${localIdx}`;

            if (!substitutedLocalAtoms.has(key)) {
              newEntries.push({ localIdx, rNum });
            }
          }

          if (newEntries.length === 0) {
            continue;
          } else {
            let mRgpStr = `M  RGP${newEntries.length.toString().padStart(3, ' ')}`;
            newEntries.forEach(entry => {
              mRgpStr += `${entry.localIdx.toString().padStart(4, ' ')}${entry.rNum.toString().padStart(4, ' ')}`;
            });
            line = mRgpStr;
          }
        }
      }

      // Handle M ALS lines
      if (line.startsWith('M  ALS')) {
        const tokens = line.trim().split(/\s+/);
        if (tokens.length >= 3) {
          const localIdx = parseInt(tokens[2], 10);
          const key = `${currentMolIdx}_${localIdx}`;
          if (substitutedLocalAtoms.has(key)) {
            continue;
          }
        }
      }

      resultLines.push(line);
    }

    return resultLines.join('\n');
  }

  private substituteReactionSmiles(rxnSmiles: string, substitutions: Map<number, string>): string {
    return this.convertSmilesToRxnMolfile(substitutions);
  }

  private extractMolBlockForMolecule(rxnStr: string, molIdx: number = 1): string {
    const lines = rxnStr.split(/\r?\n/);
    const molBlocks: string[] = [];
    let currentLines: string[] = [];
    let insideMol = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('$MOL')) {
        if (insideMol && currentLines.length > 0) {
          molBlocks.push(currentLines.join('\n'));
        }
        currentLines = [];
        insideMol = true;
      } else if (insideMol) {
        currentLines.push(line);
      }
    }
    if (insideMol && currentLines.length > 0) {
      molBlocks.push(currentLines.join('\n'));
    }

    if (molBlocks.length === 0) {
      return rxnStr;
    }

    const idx = Math.min(Math.max(1, molIdx), molBlocks.length) - 1;
    return molBlocks[idx];
  }

  private formatV2000AtomLine(
    x: number | undefined,
    y: number | undefined,
    z: number | undefined,
    symbol: string,
    aam: number = 0,
    radical: number = 0
  ): string {
    const xStr = (x !== undefined && !isNaN(x) ? x : 0.0).toFixed(4).padStart(10, ' ');
    const yStr = (y !== undefined && !isNaN(y) ? y : 0.0).toFixed(4).padStart(10, ' ');
    const zStr = (z !== undefined && !isNaN(z) ? z : 0.0).toFixed(4).padStart(10, ' ');
    const symFormatted = symbol.toUpperCase().padEnd(3, ' ');
    const massDiffStr = ' 0';
    const radStr = radical > 0 ? radical.toString().padStart(2, ' ') : ' 0';
    const aamStr = aam > 0 ? aam.toString().padStart(3, ' ') : '  0';

    return `${xStr}${yStr}${zStr} ${symFormatted}${massDiffStr} ${radStr}  0  0  0  0  0  0  0${aamStr}  0  0`;
  }

  private buildMolBlockFromAtoms(subName: string, substitutions: Map<number, string>, molIdx: number = 1, subId: number = 1): string {
    const allAtoms = [...this.reactantAtoms, ...this.productAtoms];
    const molAtoms = allAtoms.filter(a => a.moleculeIndex === molIdx);
    const allBonds = [...this.reactantBonds, ...this.productBonds];
    const molBonds = allBonds.filter(b => b.moleculeIndex === molIdx);

    const localMap = new Map<number, number>();
    molAtoms.forEach((a, idx) => localMap.set(a.atomNumber, idx + 1));

    const resultLines: string[] = [];
    resultLines.push(subId.toString());
    resultLines.push('');
    resultLines.push(subName);

    const nAtomsStr = molAtoms.length.toString().padStart(3, ' ');
    const nBondsStr = molBonds.length.toString().padStart(3, ' ');
    resultLines.push(`${nAtomsStr}${nBondsStr}  0  0  0  0  0  0  0  0  1 V2000`);

    const hasExistingCoords = molAtoms.some(a => a.x !== undefined && a.y !== undefined && (Math.abs(a.x) > 0.0001 || Math.abs(a.y) > 0.0001));
    const rgpEntries: { localIdx: number; rNum: number }[] = [];

    molAtoms.forEach((a, idx) => {
      let x = a.x;
      let y = a.y;
      let z = a.z || 0.0;

      if (!hasExistingCoords) {
        const n = molAtoms.length || 1;
        const angle = (2 * Math.PI * idx) / n;
        const radius = 1.5;
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);
      }

      const localNum = idx + 1;
      let sym = a.symbol;
      if (substitutions.has(a.atomNumber)) {
        sym = substitutions.get(a.atomNumber)!;
      }

      const isGenericSym = /^R\d*$/i.test(sym) || sym === 'A' || sym === 'X' || sym === '*' || sym.startsWith('R') || sym.includes('#');

      if (isGenericSym) {
        let rNum = 1;
        const rMatch = sym.match(/^R(\d+)$/i);
        if (rMatch) {
          rNum = parseInt(rMatch[1], 10);
        }
        rgpEntries.push({ localIdx: localNum, rNum });
        sym = 'R#';
      }

      resultLines.push(this.formatV2000AtomLine(x, y, z, sym, localNum, 0));
    });

    molBonds.forEach(b => {
      const a1Local = localMap.get(b.atom1Number) || 1;
      const a2Local = localMap.get(b.atom2Number) || 2;
      const bType = b.bondType || 1;
      resultLines.push(`${a1Local.toString().padStart(3, ' ')}${a2Local.toString().padStart(3, ' ')}${bType.toString().padStart(3, ' ')}  0  0  0  0`);
    });

    if (rgpEntries.length > 0) {
      let mRgpStr = `M  RGP${rgpEntries.length.toString().padStart(3, ' ')}`;
      rgpEntries.forEach(entry => {
        mRgpStr += `${entry.localIdx.toString().padStart(4, ' ')}${entry.rNum.toString().padStart(4, ' ')}`;
      });
      resultLines.push(mRgpStr);
    }

    resultLines.push('M  END');

    return resultLines.join('\n');
  }

  private generateSubstructureMolfile(subName: string, substitutions: Map<number, string>, molIdx: number = 1, subId: number = 1): string {
    const rawBlockStr = this.extractMolBlockForMolecule(this.templateRxnContent, molIdx);
    const lines = rawBlockStr.split(/\r?\n/).map(l => l.trimEnd());

    let headerCountsLineIdx = -1;
    let nAtoms = 0;
    let nBonds = 0;

    // Search strictly for V2000/V3000 counts line
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/V2000|V3000/i.test(l)) {
        const match = l.match(/^\s*(\d+)\s+(\d+)/);
        if (match) {
          headerCountsLineIdx = i;
          nAtoms = parseInt(match[1], 10);
          nBonds = parseInt(match[2], 10);
          break;
        }
      }
    }

    if (headerCountsLineIdx === -1) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (l.length >= 20 && !l.includes('$') && /^\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}/.test(l)) {
          const match = l.match(/^\s*(\d+)\s+(\d+)/);
          if (match) {
            headerCountsLineIdx = i;
            nAtoms = parseInt(match[1], 10);
            nBonds = parseInt(match[2], 10);
            break;
          }
        }
      }
    }

    if (headerCountsLineIdx === -1 || isNaN(nAtoms) || nAtoms === 0) {
      console.log(`[RxnPatGenerator] Raw V2000 counts line missing for ${subName}; generating MOL block directly from parsed atom/bond structures.`);
      return this.buildMolBlockFromAtoms(subName, substitutions, molIdx, subId);
    }

    const resultLines: string[] = [];

    // Header Lines: Line 1 = subId, Line 2 = '', Line 3 = subName
    resultLines.push(subId.toString());
    resultLines.push('');
    resultLines.push(subName);

    // Counts line
    resultLines.push(lines[headerCountsLineIdx]);

    const allAtoms = [...this.reactantAtoms, ...this.productAtoms];
    const substitutedLocalAtoms = new Set<string>();
    substitutions.forEach((newSym, atomNum) => {
      const matched = allAtoms.find(a => a.atomNumber === atomNum);
      if (matched && matched.moleculeIndex !== undefined && matched.molAtomIndex !== undefined) {
        substitutedLocalAtoms.add(`${matched.moleculeIndex}_${matched.molAtomIndex}`);
      }
    });

    // Check if any atom line has non-zero coordinates
    let hasNonZeroCoords = false;
    const atomStartIdx = headerCountsLineIdx + 1;
    for (let j = 0; j < nAtoms && (atomStartIdx + j) < lines.length; j++) {
      const atomLine = lines[atomStartIdx + j];
      if (atomLine.length >= 30) {
        const xP = Math.abs(parseFloat(atomLine.substring(0, 10).trim()));
        const yP = Math.abs(parseFloat(atomLine.substring(10, 20).trim()));
        if (!isNaN(xP) && !isNaN(yP) && (xP > 0.0001 || yP > 0.0001)) {
          hasNonZeroCoords = true;
          break;
        }
      }
    }

    // Atom lines
    let atomCounter = 0;
    for (let j = 0; j < nAtoms && (atomStartIdx + j) < lines.length; j++) {
      let atomLine = lines[atomStartIdx + j];
      const molAtomIndex = j + 1;
      atomCounter++;

      const matchedAtom = allAtoms.find(
        a => a.moleculeIndex === molIdx && a.molAtomIndex === molAtomIndex
      );

      if (matchedAtom && substitutions.has(matchedAtom.atomNumber)) {
        const newSym = substitutions.get(matchedAtom.atomNumber)!.toUpperCase();

        if (atomLine.length >= 34) {
          atomLine = atomLine.substring(0, 31) + newSym.padEnd(3, ' ') + atomLine.substring(34);
        } else {
          const tokens = atomLine.trim().split(/\s+/);
          if (tokens.length >= 4) {
            tokens[3] = newSym;
            atomLine = '  ' + tokens.join('   ');
          }
        }
      }

      if (matchedAtom && matchedAtom.x !== undefined && matchedAtom.y !== undefined) {
        const xStr = matchedAtom.x.toFixed(4).padStart(10, ' ');
        const yStr = matchedAtom.y.toFixed(4).padStart(10, ' ');
        const zStr = (matchedAtom.z || 0.0).toFixed(4).padStart(10, ' ');
        if (atomLine.length >= 30) {
          atomLine = `${xStr}${yStr}${zStr}` + atomLine.substring(30);
        }
      } else if (!hasNonZeroCoords) {
        const angle = (2 * Math.PI * j) / nAtoms;
        const radius = 1.8;
        const xStr = (radius * Math.cos(angle)).toFixed(4).padStart(10, ' ');
        const yStr = (radius * Math.sin(angle)).toFixed(4).padStart(10, ' ');
        const zStr = (0.0).toFixed(4).padStart(10, ' ');
        if (atomLine.length >= 30) {
          atomLine = `${xStr}${yStr}${zStr}` + atomLine.substring(30);
        }
      }

      // Renumber Column 11 atom mapping to 1..N (cols 61-63, index 60-63)
      const mapStr = atomCounter.toString().padStart(3, ' ');
      if (atomLine.length >= 60) {
        let rest = atomLine.length >= 69 ? atomLine.substring(63, 69) : '  0  0';
        const invRet = rest.substring(0, 3);
        const extFlag = rest.substring(3, 6);
        const invVal = parseInt(invRet.trim(), 10);
        const extVal = parseInt(extFlag.trim(), 10);

        const safeInv = (!isNaN(invVal) && (invVal === 0 || invVal === 1 || invVal === 2)) ? invRet : '  0';
        const safeExt = (!isNaN(extVal) && (extVal === 0 || extVal === 1)) ? extFlag : '  0';

        atomLine = atomLine.substring(0, 60) + mapStr + safeInv + safeExt;
      } else {
        const tokens = atomLine.trim().split(/\s+/);
        if (tokens.length >= 12) {
          tokens[11] = atomCounter.toString();
          atomLine = '  ' + tokens.join('   ');
        }
      }

      resultLines.push(atomLine);
    }

    // Bond lines
    const bondStartIdx = atomStartIdx + nAtoms;
    for (let b = 0; b < nBonds && (bondStartIdx + b) < lines.length; b++) {
      resultLines.push(lines[bondStartIdx + b]);
    }

    // Property lines up to M END
    const propStartIdx = bondStartIdx + nBonds;
    for (let p = propStartIdx; p < lines.length; p++) {
      let line = lines[p];
      if (line.trim().startsWith('$MOL') || line.trim().startsWith('$$$$')) {
        break;
      }

      // Filter out alias lines for substituted atoms
      const aLineMatch = line.match(/^A\s+(\d+)/);
      if (aLineMatch) {
        const localAtomIdx = parseInt(aLineMatch[1], 10);
        const key = `${molIdx}_${localAtomIdx}`;
        if (substitutedLocalAtoms.has(key)) {
          if (p + 1 < lines.length && !lines[p + 1].startsWith('$') && !lines[p + 1].startsWith('M  ')) {
            p++;
          }
          continue;
        }
      }

      const vLineMatch = line.match(/^V\s+(\d+)/);
      if (vLineMatch) {
        const localAtomIdx = parseInt(vLineMatch[1], 10);
        const key = `${molIdx}_${localAtomIdx}`;
        if (substitutedLocalAtoms.has(key)) {
          continue;
        }
      }

      if (line.startsWith('M  RGP')) {
        const tokens = line.trim().split(/\s+/);
        if (tokens.length >= 4) {
          const entryCount = parseInt(tokens[2], 10);
          const newEntries: { localIdx: number; rNum: number }[] = [];

          for (let e = 0; e < entryCount && (3 + e * 2 + 1) < tokens.length; e++) {
            const localIdx = parseInt(tokens[3 + e * 2], 10);
            const rNum = parseInt(tokens[3 + e * 2 + 1], 10);
            const key = `${molIdx}_${localIdx}`;

            if (!substitutedLocalAtoms.has(key)) {
              newEntries.push({ localIdx, rNum });
            }
          }

          if (newEntries.length === 0) {
            continue;
          } else {
            let mRgpStr = `M  RGP${newEntries.length.toString().padStart(3, ' ')}`;
            newEntries.forEach(entry => {
              mRgpStr += `${entry.localIdx.toString().padStart(4, ' ')}${entry.rNum.toString().padStart(4, ' ')}`;
            });
            line = mRgpStr;
          }
        }
      }

      if (line.startsWith('M  ALS')) {
        const tokens = line.trim().split(/\s+/);
        if (tokens.length >= 3) {
          const localIdx = parseInt(tokens[2], 10);
          const key = `${molIdx}_${localIdx}`;
          if (substitutedLocalAtoms.has(key)) {
            continue;
          }
        }
      }

      resultLines.push(line);
      if (line.trim() === 'M  END') {
        break;
      }
    }

    if (!resultLines.some(l => l.trim() === 'M  END')) {
      resultLines.push('M  END');
    }

    return resultLines.join('\n');
  }

  private generateSingleCenterSubstructureMolfile(
    g: RGroupRow,
    subName: string,
    substitutions: Map<number, string>,
    subId: number = 1
  ): string {
    let centralNum = g.centralAtomNumber;
    if (centralNum === undefined && g.rAtomNumbers.length > 0) {
      const firstR = g.rAtomNumbers[0];
      const connBond = this.reactantBonds.find(
        b => b.atom1Number === firstR || b.atom2Number === firstR
      );
      if (connBond) {
        centralNum = connBond.atom1Number === firstR ? connBond.atom2Number : connBond.atom1Number;
      }
    }

    const targetAtomNumbers: number[] = [];
    if (centralNum !== undefined) {
      targetAtomNumbers.push(centralNum);
    }
    g.rAtomNumbers.forEach(rNum => {
      if (!targetAtomNumbers.includes(rNum)) {
        targetAtomNumbers.push(rNum);
      }
    });

    const targetAtoms = this.reactantAtoms.filter(a => targetAtomNumbers.includes(a.atomNumber));
    const targetBonds = this.reactantBonds.filter(
      b => targetAtomNumbers.includes(b.atom1Number) && targetAtomNumbers.includes(b.atom2Number)
    );

    const localMap = new Map<number, number>();
    targetAtoms.forEach((a, idx) => localMap.set(a.atomNumber, idx + 1));

    const resultLines: string[] = [];
    resultLines.push(subId.toString());
    resultLines.push('');
    resultLines.push(subName);

    const nAtomsStr = targetAtoms.length.toString().padStart(3, ' ');
    const nBondsStr = targetBonds.length.toString().padStart(3, ' ');
    resultLines.push(`${nAtomsStr}${nBondsStr}  0  0  0  0  0  0  0  0  1 V2000`);

    const hasExistingCoords = targetAtoms.some(a => a.x !== undefined && a.y !== undefined && (Math.abs(a.x) > 0.0001 || Math.abs(a.y) > 0.0001));
    const rgpEntries: { localIdx: number; rNum: number }[] = [];

    targetAtoms.forEach((a, idx) => {
      let x = a.x;
      let y = a.y;
      let z = a.z || 0.0;

      if (!hasExistingCoords) {
        if (a.atomNumber === centralNum) {
          x = 0.0;
          y = 0.0;
        } else {
          const rIndex = g.rAtomNumbers.indexOf(a.atomNumber);
          const k = g.rAtomNumbers.length || 1;
          const angle = (2 * Math.PI * (rIndex >= 0 ? rIndex : idx - 1)) / k;
          const radius = 1.2;
          x = radius * Math.cos(angle);
          y = radius * Math.sin(angle);
        }
      }

      const localNum = idx + 1;
      let sym = a.symbol;
      if (substitutions.has(a.atomNumber)) {
        sym = substitutions.get(a.atomNumber)!;
      }

      const isGenericSym = /^R\d*$/i.test(sym) || sym === 'A' || sym === 'X' || sym === '*' || sym.startsWith('R') || sym.includes('#');

      if (isGenericSym) {
        let rNum = 1;
        const rMatch = sym.match(/^R(\d+)$/i);
        if (rMatch) {
          rNum = parseInt(rMatch[1], 10);
        } else if (g.rAtomNumbers.includes(a.atomNumber)) {
          rNum = g.rAtomNumbers.indexOf(a.atomNumber) + 1;
        }
        rgpEntries.push({ localIdx: localNum, rNum });
        sym = 'R#';
      }

      resultLines.push(this.formatV2000AtomLine(x, y, z, sym, localNum, 0));
    });

    targetBonds.forEach(b => {
      const a1Local = localMap.get(b.atom1Number) || 1;
      const a2Local = localMap.get(b.atom2Number) || 2;
      const bType = b.bondType || 1;
      resultLines.push(`${a1Local.toString().padStart(3, ' ')}${a2Local.toString().padStart(3, ' ')}${bType.toString().padStart(3, ' ')}  0  0  0  0`);
    });

    if (rgpEntries.length > 0) {
      let mRgpStr = `M  RGP${rgpEntries.length.toString().padStart(3, ' ')}`;
      rgpEntries.forEach(entry => {
        mRgpStr += `${entry.localIdx.toString().padStart(4, ' ')}${entry.rNum.toString().padStart(4, ' ')}`;
      });
      resultLines.push(mRgpStr);
    }

    resultLines.push('M  END');

    return resultLines.join('\n');
  }

  private getFixedMoleculeName(atoms: AtomInfo[], isReactant: boolean): string {
    if (!atoms || atoms.length === 0) return isReactant ? 'react' : 'prod';

    const counts: { [sym: string]: number } = {};
    atoms.forEach(a => {
      const s = a.symbol.toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });

    const hasRadical = atoms.some(a => (a.radical && a.radical > 0));
    const hCount = counts['h'] || 0;
    const oCount = counts['o'] || 0;
    const cCount = counts['c'] || 0;
    const nCount = counts['n'] || 0;

    if (cCount === 0 && nCount === 0) {
      if (hCount === 1 && oCount === 2) return hasRadical ? 'hoo.' : 'hoo';
      if (hCount === 2 && oCount === 2) return 'hooh';
      if (hCount === 1 && oCount === 1) return hasRadical ? 'oh.' : 'oh';
      if (hCount === 2 && oCount === 1) return 'h2o';
      if (hCount === 0 && oCount === 2) return 'o2';
      if (hCount === 0 && oCount === 1) return hasRadical ? 'o.' : 'o';
      if (hCount === 1 && oCount === 0) return hasRadical ? 'h.' : 'h';
      if (hCount === 2 && oCount === 0) return 'h2';
    } else if (cCount === 1 && oCount === 0 && nCount === 0) {
      if (hCount === 3) return hasRadical ? 'ch3.' : 'ch3';
      if (hCount === 4) return 'ch4';
    } else if (cCount === 1 && oCount === 1 && hCount === 0) {
      return 'co';
    } else if (cCount === 1 && oCount === 2 && hCount === 0) {
      return 'co2';
    }

    let formula = '';
    if (cCount > 0) formula += `c${cCount > 1 ? cCount : ''}`;
    if (hCount > 0) formula += `h${hCount > 1 ? hCount : ''}`;
    Object.keys(counts).sort().forEach(sym => {
      if (sym !== 'c' && sym !== 'h') {
        const count = counts[sym];
        formula += `${sym}${count > 1 ? count : ''}`;
      }
    });

    if (hasRadical) formula += '.';
    return formula || (isReactant ? 'react' : 'prod');
  }

  private defineSubstructuresFromTemplate(): void {
    if (this.rGroupRows.length === 0) {
      const defaultName = `${this.rootName.trim()}_template`;
      const molfile = this.generateSubstructureMolfile(defaultName, new Map(), 1, 1);
      this.substructures = [{ name: defaultName, molfile }];
      this.singleSubstructures = [{ name: defaultName, molfile }];
      return;
    }

    let subCounter = 1;
    const allSubstructs: SubstructureItem[] = [];
    const seenNames = new Set<string>();

    const addSubstruct = (name: string, molfile: string) => {
      if (!seenNames.has(name)) {
        seenNames.add(name);
        allSubstructs.push({ name, molfile });
      }
    };

    const singleSubstructs: SubstructureItem[] = [];

    // 1. Process All Reactant Molecules (with R-groups or fixed)
    const reactantMolIndices = Array.from(new Set(this.reactantAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    if (reactantMolIndices.length === 0 && this.reactantAtoms.length > 0) reactantMolIndices.push(1);

    reactantMolIndices.forEach(mIdx => {
      const molAtoms = this.reactantAtoms.filter(a => a.moleculeIndex === mIdx);
      const molAtomNums = molAtoms.map(a => a.atomNumber);
      const groupsOnMol = this.rGroupRows.filter(g =>
        (g.centralAtomNumber !== undefined && molAtomNums.includes(g.centralAtomNumber)) ||
        g.rAtomNumbers.some(rNum => molAtomNums.includes(rNum))
      );

      if (groupsOnMol.length > 0) {
        // Generate permutations for R-groups on this reactant
        groupsOnMol.forEach(g => {
          const options = g.assignmentOptions.split(',').map(o => o.trim().toLowerCase()).filter(o => o);
          const k = g.rAtomNumbers.length;
          const combos = this.generateCombinationsWithRepetition(options.length > 0 ? options : ['h', 'r'], k);

          const centralAtom = molAtoms.find(a => a.atomNumber === g.centralAtomNumber);
          const radPrefix = (centralAtom && centralAtom.radical && centralAtom.radical > 0) ? '.' : '';
          const symbol = (g.centralAtomSymbol || 'C').toLowerCase();

          combos.forEach(tag => {
            const subName = `${radPrefix}${symbol}(${tag})`;

            const substitutions = new Map<number, string>();
            for (let i = 0; i < g.rAtomNumbers.length && i < tag.length; i++) {
              const rAtomNum = g.rAtomNumbers[i];
              const subChar = tag[i];
              const newSym = subChar.toUpperCase();
              substitutions.set(rAtomNum, newSym);

              const corr = this.correspondenceRows.find(c => c.reactantAtomNumber === rAtomNum);
              if (corr && corr.productAtomNumber !== null) {
                substitutions.set(corr.productAtomNumber, newSym);
              }
            }

            const molfile = this.generateSubstructureMolfile(subName, substitutions, mIdx, subCounter++);
            singleSubstructs.push({ name: subName, molfile });
            addSubstruct(subName, molfile);
          });
        });
      } else {
        // Fixed reactant molecule without R-groups
        const name = this.getFixedMoleculeName(molAtoms, true);
        const molfile = this.generateSubstructureMolfile(name, new Map(), mIdx, subCounter++);
        singleSubstructs.push({ name: name, molfile });
        addSubstruct(name, molfile);
      }
    });

    this.singleSubstructures = singleSubstructs;

    // 2. Process All Product Molecules (with R-groups or fixed)
    const productMolIndices = Array.from(new Set(this.productAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    if (productMolIndices.length === 0 && this.productAtoms.length > 0) productMolIndices.push(1);

    productMolIndices.forEach(pIdx => {
      const pAtoms = this.productAtoms.filter(a => a.moleculeIndex === pIdx);
      const mappedReactantNums: number[] = [];
      pAtoms.forEach(pa => {
        const corr = this.correspondenceRows.find(c => c.productAtomNumber === pa.atomNumber);
        if (corr) mappedReactantNums.push(corr.reactantAtomNumber);
        else mappedReactantNums.push(pa.atomNumber);
      });

      const groupsOnMol = this.rGroupRows.filter(g =>
        (g.centralAtomNumber !== undefined && mappedReactantNums.includes(g.centralAtomNumber)) ||
        g.rAtomNumbers.some(rNum => mappedReactantNums.includes(rNum))
      );

      if (groupsOnMol.length > 0) {
        // Generate permutations for R-groups on this product
        groupsOnMol.forEach(g => {
          const options = g.assignmentOptions.split(',').map(o => o.trim().toLowerCase()).filter(o => o);
          const k = g.rAtomNumbers.length;
          const combos = this.generateCombinationsWithRepetition(options.length > 0 ? options : ['h', 'r'], k);

          const centralAtom = pAtoms.find(a => {
            const corr = this.correspondenceRows.find(c => c.productAtomNumber === a.atomNumber);
            return corr ? corr.reactantAtomNumber === g.centralAtomNumber : a.atomNumber === g.centralAtomNumber;
          });
          const radPrefix = (centralAtom && centralAtom.radical && centralAtom.radical > 0) ? '.' : '';
          const symbol = (g.centralAtomSymbol || 'C').toLowerCase();

          combos.forEach(tag => {
            let subName = `${radPrefix}${symbol}(${tag})`;
            if (seenNames.has(subName)) {
              subName = `p_${subName}`;
            }

            const substitutions = new Map<number, string>();
            for (let i = 0; i < g.rAtomNumbers.length && i < tag.length; i++) {
              const rAtomNum = g.rAtomNumbers[i];
              const subChar = tag[i];
              const newSym = subChar.toUpperCase();
              substitutions.set(rAtomNum, newSym);

              const corr = this.correspondenceRows.find(c => c.reactantAtomNumber === rAtomNum);
              if (corr && corr.productAtomNumber !== null) {
                substitutions.set(corr.productAtomNumber, newSym);
              }
            }

            const molfile = this.generateSubstructureMolfile(subName, substitutions, pIdx, subCounter++);
            addSubstruct(subName, molfile);
          });
        });
      } else {
        // Fixed product molecule without R-groups
        let name = this.getFixedMoleculeName(pAtoms, false);
        if (seenNames.has(name)) {
          name = `p_${name}`;
        }
        const molfile = this.generateSubstructureMolfile(name, new Map(), pIdx, subCounter++);
        addSubstruct(name, molfile);
      }
    });

    this.singleSubstructures = allSubstructs;
    this.substructures = allSubstructs;
  }

  private generatePatternsFromRGroupings(): void {
    if (this.rGroupRows.length === 0) {
      this.generatedRxnPatterns = [{
        name: `${this.rootName.trim()}-default`,
        permutationTag: '(default)',
        molfile: this.templateRxnContent,
        forwardRate: { ...this.forwardRateDefault },
        reverseRate: { ...this.reverseRateDefault }
      }];
      return;
    }

    const groupOptions: string[][] = this.rGroupRows.map(g => {
      const options = g.assignmentOptions.split(',').map(o => o.trim().toLowerCase()).filter(o => o);
      const k = g.rAtomNumbers.length;
      return this.generateCombinationsWithRepetition(options.length > 0 ? options : ['h', 'r'], k);
    });

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap(x => curr.map(y => [...x, y])),
        [[]]
      );
    };

    const combinations = cartesian(groupOptions);
    const patterns: RxnPatternItem[] = [];

    combinations.forEach(comb => {
      const tag = comb.map(c => `(${c})`).join('');
      const substitutions = this.buildSubstitutionsForCombination(comb);
      const molfile = this.generateSubstitutedStructure(this.templateRxnContent, substitutions);
      const symFactor = this.calculateSymmetryFactorForCombination(comb);

      patterns.push({
        name: `${this.rootName.trim()}-${tag}`,
        permutationTag: tag,
        combination: comb,
        molfile: molfile,
        forwardRate: {
          ...this.forwardRateDefault,
          SymmetryFactor: symFactor
        },
        reverseRate: {
          ...this.reverseRateDefault,
          SymmetryFactor: symFactor
        }
      });
    });

    this.generatedRxnPatterns = patterns;
  }

  /**
   * Calculates group symmetry factor based on element multiset inside parentheses.
   * - Size 2: if both elements are identical (e.g. hh, rr), factor = 2; else 1.
   * - Size 3: if all 3 elements are identical (e.g. hhh, rrr), factor = 6;
   *           if 2 elements are identical (e.g. rhh, rrh, hrr, hhr), factor = 2; else 1.
   */
  public calculateSymmetryFactorForGroup(groupStr: string): number {
    const clean = groupStr.replace(/[\(\)]/g, '').trim().toLowerCase();
    if (!clean) return 1;

    const charCounts: { [ch: string]: number } = {};
    for (const ch of clean) {
      charCounts[ch] = (charCounts[ch] || 0) + 1;
    }

    const counts = Object.values(charCounts);
    const len = clean.length;

    if (len === 2) {
      return counts.includes(2) ? 2 : 1;
    } else if (len === 3) {
      if (counts.includes(3)) return 6;
      if (counts.includes(2)) return 2;
      return 1;
    } else if (len === 4) {
      if (counts.includes(4)) return 24;
      if (counts.includes(3)) return 6;
      if (counts.filter(c => c === 2).length === 2) return 4;
      if (counts.includes(2)) return 2;
      return 1;
    }

    return 1;
  }

  /**
   * Calculates overall symmetry factor for a reaction pattern by multiplying symmetry factors of all groups.
   */
  public calculateSymmetryFactorForCombination(comb: string[]): number {
    if (!comb || comb.length === 0) return 1;
    let factor = 1;
    comb.forEach(gStr => {
      factor *= this.calculateSymmetryFactorForGroup(gStr);
    });
    return factor;
  }

  /**
   * Generates unique combinations with repetition (multisets of size k from options).
   * Order within the group does NOT matter: e.g., 'hhr', 'hrh', and 'rhh' are equivalent
   * and represented once canonically as 'rhh' (r before h).
   */
  private generateCombinationsWithRepetition(options: string[], k: number): string[] {
    if (k === 0) return [''];
    if (options.length === 0) return [''];

    const results: string[] = [];

    const helper = (startOptIdx: number, currentCombo: string[]) => {
      if (currentCombo.length === k) {
        results.push(this.sortGroupTag(currentCombo));
        return;
      }
      for (let i = startOptIdx; i < options.length; i++) {
        currentCombo.push(options[i]);
        helper(i, currentCombo);
        currentCombo.pop();
      }
    };

    helper(0, []);

    // Return unique canonical combinations
    return Array.from(new Set(results));
  }

  /**
   * Sorts group tag characters canonically, prioritizing 'r' before 'h' (e.g. 'rhh' instead of 'hhr').
   */
  private sortGroupTag(combo: string[]): string {
    const customOrder: { [key: string]: number } = {
      'r': 1,
      'h': 2
    };
    const sorted = [...combo].sort((a, b) => {
      const orderA = customOrder[a] ?? (100 + a.charCodeAt(0));
      const orderB = customOrder[b] ?? (100 + b.charCodeAt(0));
      return orderA - orderB;
    });
    return sorted.join('');
  }

  private buildSubstructureEquation(comb: string[]): string {
    if (this.rGroupRows.length === 0) {
      return `${this.rootName.toLowerCase()} = ${this.rootName.toLowerCase()}`;
    }

    const resolveSubId = (name: string): string => {
      if (this.substructureDbIdMap && this.substructureDbIdMap.has(name)) {
        return this.substructureDbIdMap.get(name)!;
      }
      return name;
    };

    const knownSubNames = new Set(this.substructures.map(s => s.name));

    // 1. Reactant Substructures
    const reactantMolIndices = Array.from(new Set(this.reactantAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    if (reactantMolIndices.length === 0) reactantMolIndices.push(1);

    const reactantSubNames: string[] = [];
    reactantMolIndices.forEach(mIdx => {
      const molAtoms = this.reactantAtoms.filter(a => a.moleculeIndex === mIdx);
      const molAtomNums = molAtoms.map(a => a.atomNumber);

      const molGroups = this.rGroupRows.filter(g =>
        (g.centralAtomNumber !== undefined && molAtomNums.includes(g.centralAtomNumber)) ||
        g.rAtomNumbers.some(rNum => molAtomNums.includes(rNum))
      );

      if (molGroups.length > 0) {
        const subStr = molGroups.map(g => {
          const gIdx = this.rGroupRows.indexOf(g);
          const tag = (comb && comb[gIdx]) ? comb[gIdx] : 'r';
          const centralAtom = molAtoms.find(a => a.atomNumber === g.centralAtomNumber);
          const radPrefix = (centralAtom && centralAtom.radical && centralAtom.radical > 0) ? '.' : '';
          const sym = (g.centralAtomSymbol || 'C').toLowerCase();
          return `${radPrefix}${sym}(${tag})`;
        }).join('');
        reactantSubNames.push(resolveSubId(subStr));
      } else {
        const name = this.getFixedMoleculeName(molAtoms, true);
        reactantSubNames.push(resolveSubId(name));
      }
    });

    // 2. Product Substructures
    const productMolIndices = Array.from(new Set(this.productAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    if (productMolIndices.length === 0) productMolIndices.push(1);

    const productSubNames: string[] = [];
    productMolIndices.forEach(pIdx => {
      const pAtoms = this.productAtoms.filter(a => a.moleculeIndex === pIdx);

      const mappedReactantNums: number[] = [];
      pAtoms.forEach(pa => {
        const corr = this.correspondenceRows.find(c => c.productAtomNumber === pa.atomNumber);
        if (corr) {
          mappedReactantNums.push(corr.reactantAtomNumber);
        } else {
          mappedReactantNums.push(pa.atomNumber);
        }
      });

      const molGroups = this.rGroupRows.filter(g =>
        (g.centralAtomNumber !== undefined && mappedReactantNums.includes(g.centralAtomNumber)) ||
        g.rAtomNumbers.some(rNum => mappedReactantNums.includes(rNum))
      );

      if (molGroups.length > 0) {
        let subStr = molGroups.map(g => {
          const gIdx = this.rGroupRows.indexOf(g);
          const tag = (comb && comb[gIdx]) ? comb[gIdx] : 'r';
          const centralAtom = pAtoms.find(a => {
            const corr = this.correspondenceRows.find(c => c.productAtomNumber === a.atomNumber);
            return corr ? corr.reactantAtomNumber === g.centralAtomNumber : a.atomNumber === g.centralAtomNumber;
          });
          const radPrefix = (centralAtom && centralAtom.radical && centralAtom.radical > 0) ? '.' : '';
          const sym = (g.centralAtomSymbol || 'C').toLowerCase();
          return `${radPrefix}${sym}(${tag})`;
        }).join('');
        if (!knownSubNames.has(subStr) && knownSubNames.has(`p_${subStr}`)) {
          subStr = `p_${subStr}`;
        }
        productSubNames.push(resolveSubId(subStr));
      } else {
        let name = this.getFixedMoleculeName(pAtoms, false);
        if (!knownSubNames.has(name) && knownSubNames.has(`p_${name}`)) {
          name = `p_${name}`;
        }
        productSubNames.push(resolveSubId(name));
      }
    });

    return `${reactantSubNames.join(' ')} = ${productSubNames.join(' ')}`;
  }

  private buildLstCorrespondencesBlock(): string {
    const lines: string[] = [];

    const isBondChange = (a1: number, a2: number): boolean => {
      return this.bondChangeRows.some(bc =>
        (bc.atom1Number === a1 && bc.atom2Number === a2) ||
        (bc.atom1Number === a2 && bc.atom2Number === a1)
      );
    };

    // 1. Reactant Molecules
    const reactantMolIndices = Array.from(new Set(this.reactantAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    if (reactantMolIndices.length === 0 && this.reactantAtoms.length > 0) reactantMolIndices.push(1);

    reactantMolIndices.forEach(mIdx => {
      const molAtoms = this.reactantAtoms.filter(a => a.moleculeIndex === mIdx);
      const atomNums = molAtoms.map(a => Math.max(1, a.atomNumber));
      const molBonds = this.reactantBonds.filter(b => b.moleculeIndex === mIdx);

      const atomNumsStr = atomNums.join(' ');
      if (molBonds.length > 0) {
        const bondTypesStr = molBonds.map(b => {
          if (isBondChange(b.atom1Number, b.atom2Number) || b.bondType === 4) {
            return '4';
          }
          return (b.bondType || 1).toString();
        }).join(' ');

        lines.push(`${atomNumsStr.padEnd(24, ' ')}${bondTypesStr}`);
      } else {
        lines.push(atomNumsStr);
      }
    });

    // 2. Product Molecules
    const productMolIndices = Array.from(new Set(this.productAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    if (productMolIndices.length === 0 && this.productAtoms.length > 0) productMolIndices.push(1);

    productMolIndices.forEach(pIdx => {
      const pAtoms = this.productAtoms.filter(a => a.moleculeIndex === pIdx);

      const mappedAtomNums = pAtoms.map(pa => {
        const corr = this.correspondenceRows.find(c => c.productAtomNumber === pa.atomNumber);
        return corr ? Math.max(1, corr.reactantAtomNumber) : Math.max(1, pa.atomNumber);
      });

      const pBonds = this.productBonds.filter(b => b.moleculeIndex === pIdx);

      const atomNumsStr = mappedAtomNums.join(' ');
      if (pBonds.length > 0) {
        const bondTypesStr = pBonds.map(b => {
          const r1 = this.correspondenceRows.find(c => c.productAtomNumber === b.atom1Number)?.reactantAtomNumber ?? b.atom1Number;
          const r2 = this.correspondenceRows.find(c => c.productAtomNumber === b.atom2Number)?.reactantAtomNumber ?? b.atom2Number;

          if (isBondChange(r1, r2) || b.bondType === 4 || b.bondType === 104) {
            return '4';
          }
          return (b.bondType || 1).toString();
        }).join(' ');

        lines.push(`${atomNumsStr.padEnd(24, ' ')}${bondTypesStr}`);
      } else {
        lines.push(atomNumsStr);
      }
    });

    return lines.join('\n');
  }

  private serializeToLstFile(): string {
    let output = '';
    const correspondencesBlock = this.buildLstCorrespondencesBlock();

    this.generatedRxnPatterns.forEach((pat, idx) => {
      const eqLine = this.buildSubstructureEquation(pat.combination || []);

      const groupFactors = (pat.combination || []).map(g => this.calculateSymmetryFactorForGroup(g));
      const symExpr = groupFactors.length > 1 ? `${groupFactors.join('*')} = ${pat.forwardRate.SymmetryFactor}` : `${pat.forwardRate.SymmetryFactor}`;

      output += `%%%-------------------------------------------------------------------\n`;
      output += `%%% Symmetry: ${symExpr}\n`;
      output += `%%%-------------------------------------------------------------------\n`;
      output += `${pat.name}\\\n`;
      output += `       ${eqLine}\n`;
      output += `- ID ${idx}\n`;
      output += `- Correspondences\n`;
      output += `${correspondencesBlock}\n`;
      output += `>  <ForwardRxn>\n`;
      output += `Standard ${pat.forwardRate.Aconstant.toExponential(2)}   ${pat.forwardRate.TempExp.toFixed(2)}  ${pat.forwardRate.Energy.toFixed(1)} ${pat.forwardRate.SymmetryFactor}; ${pat.forwardRate.Reference}\n`;
      output += `>  <ReverseRxn>\n`;
      output += `Standard ${pat.reverseRate.Aconstant.toExponential(2)} ${pat.reverseRate.TempExp.toFixed(1)} ${pat.reverseRate.Energy.toFixed(2)}   ${pat.reverseRate.SymmetryFactor}; ${pat.reverseRate.Reference}\n`;
      output += `$$$$\n`;
    });

    return output;
  }

  public closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
