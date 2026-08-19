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
  inputTemplateFile: string;   // e.g. 'ReadInMoleculeProperties.inp'
  placeholderReplacements?: { [key: string]: string }; // e.g. { 'XXXXX': '$ROOTNAME' }
}

export interface SelectedFileItem {
  slot: FileSlotConfig;
  expectedFilename: string;
  file: File | null;
  content: string | null;
  isValid: boolean;
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
    MatTooltipModule
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

  public async uploadAndExecute(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isUploading = true;
    this.statusMessage = 'Uploading file & persisting to Cloud Storage data directory...';
    this.errorMessage = '';
    this.taskOutput = '';

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
      this.statusMessage = `Persisted to Cloud Storage (${gcsPaths})! Executing prerequisite task ${this.config.inputTemplateFile}...`;

      // 3. Build replacements map
      const replacements: { [key: string]: string } = {};
      if (this.config.placeholderReplacements) {
        for (const [key, val] of Object.entries(this.config.placeholderReplacements)) {
          replacements[key] = val.replace('$ROOTNAME', this.rootName.trim());
        }
      } else {
        replacements['XXXXX'] = this.rootName.trim();
      }

      // 4. Run Input Task
      const taskRes = await this.reactCloudApi.runInputTaskWithReplacements(
        this.config.inputTemplateFile,
        this.rootName.trim(),
        replacements
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
