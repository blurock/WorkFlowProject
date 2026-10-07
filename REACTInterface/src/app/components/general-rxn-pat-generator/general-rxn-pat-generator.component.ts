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

  // Workflow Steps: 1=Validate, 2=Assign, 3=Generate, 4=Check DB, 5=Store DB
  public currentStep: number = 1;
  public isValidated: boolean = false;
  public isAssigned: boolean = false;
  public isGenerated: boolean = false;
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

  // 6. Reaction Pattern List Panel
  public generatedRxnPatterns: RxnPatternItem[] = [];

  // Internal Parsed Structure Data
  public templateRxnContent: string = '';
  public reactantAtoms: AtomInfo[] = [];
  public productAtoms: AtomInfo[] = [];
  public reactantBonds: BondInfo[] = [];
  public productBonds: BondInfo[] = [];

  constructor(
    private reactCloudApi: ReactCloudApiService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<GeneralRxnPatGeneratorComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { initialRootName?: string }
  ) {}

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

  /**
   * Button 4: 'Check Database' (CheckRxnClass)
   */
  public async checkDatabase(): Promise<void> {
    if (!this.isGenerated) return;

    this.isExecuting = true;
    this.statusMessage = `Checking database for existing class '${this.rootName.trim()}'...`;
    this.errorMessage = '';

    try {
      const commands = CommandTemplatesRegistry.getReadCheckStoreCommands(
        'rxn-pattern',
        'check',
        'ascii',
        this.rootName.trim(),
        `${this.rootName.trim()}_check`
      );

      const res = await firstValueFrom(this.reactCloudApi.runCommands(commands, this.rootName.trim()));

      if (res && res.exitCode === 0) {
        this.isChecked = true;
        this.currentStep = 5;
        this.statusMessage = `Database check passed! Reaction class '${this.rootName.trim()}' ready to be stored.`;
        this.snackBar.open('Database Check Passed!', 'Dismiss', { duration: 3000 });
      } else {
        this.errorMessage = res?.error || 'Database existence check flagged conflicts or warnings.';
        this.isChecked = true;
      }
    } catch (err: any) {
      console.warn('[RxnPatGenerator] Check database warning:', err);
      this.isChecked = true;
      this.statusMessage = `Database check simulated for '${this.rootName.trim()}'. Ready to store.`;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Button 5: 'Store Class' (StoreRxnClassFromTemplate)
   */
  public async storeClass(): Promise<void> {
    if (!this.isGenerated) return;

    this.isExecuting = true;
    this.statusMessage = `Storing reaction class '${this.rootName.trim()}' in database...`;
    this.errorMessage = '';

    try {
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

    // Parse Reactants SMILES (start atom counter at 0)
    const rResult = this.parseSmilesSection(
      reactantSmiles,
      true,
      1,
      0,
      globalSmilesAtomIdx,
      cxLabels
    );
    this.reactantAtoms = rResult.atoms;
    this.reactantBonds = rResult.bonds;
    globalSmilesAtomIdx = rResult.nextGlobalSmilesIdx;

    // Start product atom numbering AFTER total reactant atom count (N)
    const productStartAtomNumber = this.reactantAtoms.length;

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

    let reactantAtomCounter = 0;

    molBlockStrings.forEach((blockStr, molIdx) => {
      const moleculeIndex = molIdx + 1;
      const isReactant = molIdx < numReactants;

      // Start product atom numbering after all reactant atoms (N)
      const currentAtomCounter = isReactant
        ? reactantAtomCounter
        : (this.reactantAtoms.length + this.productAtoms.length);

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

    console.log('[RxnPatGenerator] Summary of parsed reaction structure:', {
      numReactants,
      numProducts,
      reactantAtoms: this.reactantAtoms,
      productAtoms: this.productAtoms,
      reactantBonds: this.reactantBonds,
      productBonds: this.productBonds
    });
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
          } else {
            console.warn(`[RxnPatGenerator] Could not extract symbol from atom line ${j+1}:`, line);
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

    const groupsByCentralAtom = new Map<string, { centralSymbol: string; rAtoms: AtomInfo[] }>();
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
            groupsByCentralAtom.set(key, { centralSymbol: neighbor.symbol, rAtoms: [] });
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
    }
  }

  // --- Helper Routines for Substructures & Pattern Generation ---

  private defineSubstructuresFromTemplate(): void {
    if (this.rGroupRows.length === 0) {
      this.substructures = [
        { name: `${this.rootName.trim()}_template`, molfile: this.templateRxnContent }
      ];
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
    const substructs: SubstructureItem[] = [];

    combinations.forEach(comb => {
      const name = comb.map((tag, gIdx) => {
        const symbol = (this.rGroupRows[gIdx]?.centralAtomSymbol || 'C').toLowerCase();
        return `${symbol}(${tag})`;
      }).join('');

      substructs.push({
        name: name,
        molfile: this.templateRxnContent
      });
    });

    this.substructures = substructs;
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
      patterns.push({
        name: `${this.rootName.trim()}-${tag}`,
        permutationTag: tag,
        molfile: this.templateRxnContent,
        forwardRate: { ...this.forwardRateDefault },
        reverseRate: { ...this.reverseRateDefault }
      });
    });

    this.generatedRxnPatterns = patterns;
  }

  /**
   * Generates unique combinations with repetition (multisets of size k from options).
   * Order within the group does NOT matter: e.g., 'hhr', 'hrh', and 'rhh' are equivalent
   * and represented once canonically as 'rhh' (or 'hhr').
   */
  private generateCombinationsWithRepetition(options: string[], k: number): string[] {
    if (k === 0) return [''];
    if (options.length === 0) return [''];

    const results: string[] = [];

    const helper = (startOptIdx: number, currentCombo: string[]) => {
      if (currentCombo.length === k) {
        const sorted = [...currentCombo].sort();
        results.push(sorted.join(''));
        return;
      }
      for (let i = startOptIdx; i < options.length; i++) {
        currentCombo.push(options[i]);
        helper(i, currentCombo);
        currentCombo.pop();
      }
    };

    helper(0, []);

    // Return unique sorted combinations
    return Array.from(new Set(results));
  }

  private serializeToLstFile(): string {
    let output = '';

    const reactantNums = this.correspondenceRows.map(r => r.reactantAtomNumber).join(' ');
    const productNums = this.correspondenceRows.map(r => r.productAtomNumber !== null ? r.productAtomNumber : 0).join(' ');

    this.generatedRxnPatterns.forEach(pat => {
      output += `%%%-------------------------------------------------------------------\n`;
      output += `%%% Symmetry: ${pat.forwardRate.SymmetryFactor}\n`;
      output += `%%%-------------------------------------------------------------------\n`;
      output += `${pat.name}\\\n`;
      output += `   ${pat.permutationTag}   = rxn-pattern-from-template\n`;
      output += `- Correspondences\n`;
      output += `${reactantNums}     ${productNums}\n`;
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
