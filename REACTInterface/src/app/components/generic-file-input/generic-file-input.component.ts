import { Component, Inject, Input, Optional, OnInit } from '@angular/core';
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
import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';

export interface FileSlotConfig {
  extension: string;          // e.g. '-names.lst', '.mol', '.sdf'
  label: string;              // e.g. 'Species Names List (-names.lst)'
  required: boolean;
  description?: string;
}

export interface GenericFileInputConfig {
  taskId: string;
  taskTitle: string;
  description: string;
  targetDirectory: string;    // e.g. 'mol/molsdf'
  rootNameLabel: string;      // e.g. 'Molecule Dataset ROOTNAME'
  defaultRootName?: string;
  fileSlots: FileSlotConfig[];
  inputTemplateFile?: string;   // Optional / legacy template file
  placeholderReplacements?: { [key: string]: string }; // Optional / legacy replacements
}

export interface SelectedFileItem {
  slot: FileSlotConfig;
  expectedFilename: string;
  file: File | null;
  content: string | null;
  isValid: boolean;
}

export interface MoleculeElectronicData {
  atomIndex: number;
  atomicNumber: number;
  charge: number;
  numElectrons: number;
}

export interface MoleculeDetails {
  atomCount: number;
  bondCount: number;
  formula: string;
  electronicTable: MoleculeElectronicData[];
}

export interface ParsedMolecule {
  index: number;
  molHeaderLine: string;
  name: string;
  rawString: string;
  sdfContent: string | null;
  details: MoleculeDetails;
  isExpanded: boolean;
}

export const GENERIC_TASK_CONFIGS: { [key: string]: GenericFileInputConfig } = {
  'read-mol-properties': {
    taskId: 'read-mol-properties',
    taskTitle: 'Read Molecule Properties from File',
    description: 'Upload molecule properties file (ROOTNAME.lst) to data/mol/molsdf and execute property runner.',
    targetDirectory: 'mol/molsdf',
    rootNameLabel: 'Molecule Dataset Root Name (e.g. 22dimethylC3C4, C3HO)',
    defaultRootName: '22dimethylC3C4',
    fileSlots: [
      { extension: '.lst', label: 'Molecule Properties List File (.lst)', required: true }
    ],
    inputTemplateFile: 'ReadInMoleculeProperties.inp',
    placeholderReplacements: { 'XXXXX': '$ROOTNAME' }
  },
  'read-sdf-molecules': {
    taskId: 'read-sdf-molecules',
    taskTitle: 'Read SDF Molecules',
    description: 'Upload SDF molecule structure file (ROOTNAME.sdf) to data/mol/molsdf and read structures into database.',
    targetDirectory: 'mol/molsdf',
    rootNameLabel: 'Molecule Root Name (e.g. 22dimethylC3C4, propane)',
    defaultRootName: '22dimethylC3C4',
    fileSlots: [
      { extension: '.sdf', label: 'SDF Structure Data File (.sdf)', required: true }
    ],
    inputTemplateFile: 'ReadMoleculesFromFile.inp',
    placeholderReplacements: { 'XXXXX': '$ROOTNAME', 'YYYYY': '$ROOTNAME' }
  }
};

@Component({
  selector: 'app-generic-file-input',
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
    KetcherViewerComponent
  ],
  templateUrl: './generic-file-input.component.html',
  styleUrls: ['./generic-file-input.component.scss']
})
export class GenericFileInputComponent implements OnInit {
  @Input() taskId?: string;
  @Input() config!: GenericFileInputConfig;

  public rootName: string = '';
  public fileItems: SelectedFileItem[] = [];
  public isUploading: boolean = false;
  public isExecuting: boolean = false;
  public statusMessage: string = '';
  public errorMessage: string = '';
  public taskOutput: string = '';

  // Parsed Molecule Log State
  public parsedMolecules: ParsedMolecule[] = [];
  public selectedMolecule: ParsedMolecule | null = null;
  public showRawTerminalLog: boolean = false;

  // Preview Modal state
  public previewingFile: SelectedFileItem | null = null;

  constructor(
    private reactCloudApi: ReactCloudApiService,
    @Optional() public dialogRef?: MatDialogRef<GenericFileInputComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: GenericFileInputConfig
  ) {}

  ngOnInit(): void {
    if (this.dialogData) {
      this.config = this.dialogData;
    } else if (this.taskId && GENERIC_TASK_CONFIGS[this.taskId]) {
      this.config = GENERIC_TASK_CONFIGS[this.taskId];
    } else if (!this.config) {
      this.config = GENERIC_TASK_CONFIGS['read-mol-properties'];
    }

    this.rootName = this.config.defaultRootName || '22dimethylC3C4';
    this.updateExpectedFilenames();
  }

  public getAcceptFilter(extension: string): string {
    if (!extension) return '*';
    const lastDot = extension.lastIndexOf('.');
    if (lastDot !== -1) {
      return extension.substring(lastDot); // e.g. "-names.lst" -> ".lst"
    }
    return extension.startsWith('.') ? extension : `.${extension}`;
  }

  public onRootNameChange(): void {
    this.updateExpectedFilenames();
  }

  private updateExpectedFilenames(): void {
    const cleanRoot = this.rootName.trim();
    this.fileItems = this.config.fileSlots.map(slot => {
      const existing = this.fileItems.find(item => item.slot.extension === slot.extension);
      const expectedFilename = cleanRoot ? `${cleanRoot}${slot.extension}` : `ROOTNAME${slot.extension}`;
      return {
        slot,
        expectedFilename,
        file: existing?.file || null,
        content: existing?.content || null,
        isValid: !!existing?.file
      };
    });
  }

  public onFileSelected(event: Event, item: SelectedFileItem): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      item.file = file;
      item.isValid = true;

      // Extract root name from filename (e.g. C3HO-names.lst -> C3HO, propane.sdf -> propane)
      let filename = file.name;
      const lastDotIndex = filename.lastIndexOf('.');
      if (lastDotIndex > 0) {
        filename = filename.substring(0, lastDotIndex);
      }
      if (filename.endsWith('-names')) {
        filename = filename.substring(0, filename.length - '-names'.length);
      }
      if (filename.trim()) {
        this.rootName = filename.trim();
        this.updateExpectedFilenames();
      }

      // Read content for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        item.content = e.target?.result as string;
      };
      reader.readAsText(file);
    }
  }

  public openPreview(item: SelectedFileItem): void {
    if (item.file && item.content !== null) {
      this.previewingFile = item;
    }
  }

  public closePreview(): void {
    this.previewingFile = null;
  }

  public isFormValid(): boolean {
    if (!this.rootName.trim()) return false;
    return this.fileItems.every(item => item.slot.required ? item.isValid : true);
  }

  public parseMoleculesFromLog(logText: string): ParsedMolecule[] {
    if (!logText) return [];

    const lines = logText.split(/\r?\n/);
    const molIndices: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith(':Mol')) {
        molIndices.push(i);
      }
    }

    if (molIndices.length === 0) {
      return [];
    }

    const parsedMolecules: ParsedMolecule[] = [];

    for (let k = 0; k < molIndices.length; k++) {
      const lineIdx = molIndices[k];
      const nextLineIdx = (k + 1 < molIndices.length) ? molIndices[k + 1] : lines.length;

      // Look for line beginning with ':Mol' and find name 4 lines later (lineIdx + 4)
      const nameLineIdx = lineIdx + 4;
      let name = '';
      if (nameLineIdx < lines.length) {
        name = lines[nameLineIdx].trim();
      }

      if (!name) {
        name = `Molecule ${k + 1}`;
      }

      const blockLines = lines.slice(lineIdx, nextLineIdx);
      const rawString = blockLines.join('\n');
      const sdfContent = this.extractSdfFromBlock(blockLines, name);
      const details = this.parseMoleculeDetails(rawString, sdfContent);

      parsedMolecules.push({
        index: k + 1,
        molHeaderLine: lines[lineIdx].trim(),
        name,
        rawString,
        sdfContent,
        details,
        isExpanded: true
      });
    }

    return parsedMolecules;
  }

  private extractSdfFromBlock(lines: string[], molName: string): string | null {
    let vIndex = -1;
    let mEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('V2000') || lines[i].includes('V3000')) {
        vIndex = i;
      }
      if (lines[i].trim() === 'M  END' || lines[i].trim().startsWith('M END')) {
        mEndIndex = i;
        if (vIndex !== -1) break;
      }
    }

    if (vIndex !== -1 && mEndIndex !== -1 && mEndIndex >= vIndex) {
      // MDL V2000 format REQUIRES 3 header lines before line 4 (counts line)
      const headerLines = [
        molName || 'Molecule',
        '  -CPSS-  Generated',
        ''
      ];
      const countsAndBody = lines.slice(vIndex, mEndIndex + 1);
      return [...headerLines, ...countsAndBody].join('\n');
    }
    return null;
  }

  public parseMoleculeDetails(rawString: string, sdfContent: string | null): MoleculeDetails {
    const lines = rawString.split(/\r?\n/);
    let atomCount = 0;
    let bondCount = 0;
    const elementCounts: { [elem: string]: number } = {};
    const electronicTable: MoleculeElectronicData[] = [];

    // 1. Parse SDF counts line and atom symbols
    if (sdfContent) {
      const sdfLines = sdfContent.split('\n');
      if (sdfLines.length >= 4) {
        const countsLine = sdfLines[3]; // Line 4 (index 3) is counts line in V2000
        const aCount = parseInt(countsLine.substring(0, 3).trim(), 10);
        const bCount = parseInt(countsLine.substring(3, 6).trim(), 10);
        if (!isNaN(aCount)) atomCount = aCount;
        if (!isNaN(bCount)) bondCount = bCount;

        for (let i = 4; i < 4 + atomCount && i < sdfLines.length; i++) {
          const atomLine = sdfLines[i];
          if (atomLine.length >= 34) {
            const symbol = atomLine.substring(30, 34).trim();
            if (symbol) {
              elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
            }
          }
        }
      }
    }

    const formula = Object.entries(elementCounts)
      .map(([elem, count]) => count > 1 ? `${elem}${count}` : elem)
      .join(' ');

    // 2. Parse Electronic Charges & Parameters
    let inElectronic = false;
    let electronicIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('----- Electronic')) {
        inElectronic = true;
        continue;
      }
      if (inElectronic && line.trim() === '~') {
        inElectronic = false;
        continue;
      }
      if (inElectronic && line.startsWith(':')) {
        const parts = line.substring(1).split(':').map(p => p.trim());
        if (parts.length >= 3) {
          const atNum = parseInt(parts[0], 10);
          const chg = parseFloat(parts[1]);
          const nElec = parseFloat(parts[2]);
          if (!isNaN(atNum) && !isNaN(chg)) {
            electronicIdx++;
            electronicTable.push({
              atomIndex: electronicIdx,
              atomicNumber: atNum,
              charge: chg,
              numElectrons: nElec
            });
          }
        }
      }
    }

    return {
      atomCount,
      bondCount,
      formula,
      electronicTable
    };
  }

  public getElementSymbol(atomicNumber: number): string {
    const symbols: { [key: number]: string } = {
      1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
      11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar', 35: 'Br', 53: 'I'
    };
    return symbols[atomicNumber] || `El(${atomicNumber})`;
  }

  public selectMolecule(mol: ParsedMolecule): void {
    this.selectedMolecule = mol;
  }

  public getLineCount(text: string): number {
    if (!text) return 0;
    return text.split('\n').length;
  }

  public async uploadAndExecute(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isUploading = true;
    this.statusMessage = 'Uploading file & persisting to Cloud Storage data directory...';
    this.errorMessage = '';
    this.taskOutput = '';
    this.parsedMolecules = [];
    this.selectedMolecule = null;

    try {
      // 1. Prepare files payload
      const uploadPayload = this.fileItems
        .filter(item => item.file && item.content !== null)
        .map(item => ({
          filename: item.expectedFilename,
          content: item.content as string
        }));

      // 2. Upload to Cloud Storage & Session Cache via API
      const uploadRes = await this.reactCloudApi.uploadUserDataFiles(this.config.targetDirectory, uploadPayload).toPromise();
      console.log('[GenericFileInput] Upload response:', uploadRes);

      const gcsPaths = uploadRes?.files?.map(f => f.gcsPath || f.filename).join(', ') || '';
      this.isUploading = false;
      this.isExecuting = true;
      this.statusMessage = `Persisted to Cloud Storage (${gcsPaths})! Executing task '${this.config.taskId}' via Command Templates Registry...`;

      // 3. Execute Task using CommandTemplatesRegistry (stateless memory-piped execution)
      const taskRes = await this.reactCloudApi.runTaskWithRegistry(
        this.config.taskId,
        this.rootName.trim()
      ).toPromise();

      this.isExecuting = false;
      if (taskRes) {
        this.statusMessage = `Task finished with exit code ${taskRes.exitCode} (${taskRes.elapsedMs || 0}ms)!`;
        let combinedLog = taskRes.output || '';
        if (taskRes.error) {
          combinedLog += `\n\n--- ERRORS / WARNINGS ---\n${taskRes.error}`;
        }
        this.taskOutput = combinedLog || 'Execution complete.';
      } else {
        this.statusMessage = 'Task completed.';
        this.taskOutput = 'Task finished successfully.';
      }

      // Parse output for molecule blocks
      this.parsedMolecules = this.parseMoleculesFromLog(this.taskOutput);
      if (this.parsedMolecules.length > 0) {
        this.selectedMolecule = this.parsedMolecules[0];
        this.showRawTerminalLog = false;
      } else {
        this.showRawTerminalLog = true;
      }

    } catch (err: any) {
      this.isUploading = false;
      this.isExecuting = false;
      this.errorMessage = err?.error?.error || err?.message || 'Error executing task';
    }
  }

  public closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
