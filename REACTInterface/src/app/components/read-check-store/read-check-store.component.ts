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
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { CommandTemplatesRegistry } from '../../templates/command-templates.registry';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';

export type DataTypeOption = 'molecule' | 'substructure' | 'rxn-pattern' | 'reaction';
export type FormatOption = 'sdf' | 'ascii';

export interface ExistenceCheckItem {
  id: string;
  name: string;
  inDatabase: boolean;
  status: 'Present' | 'New' | 'Unknown';
  suggestedAction: 'Skip' | 'Replace' | 'Add';
}

export interface StoredRecordItem {
  name: string;
  recordId: string;
  storagePath: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface LogLineItem {
  text: string;
  isError: boolean;
}

@Component({
  selector: 'app-read-check-store',
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
    KetcherViewerComponent
  ],
  templateUrl: './read-check-store.component.html',
  styleUrls: ['./read-check-store.component.scss']
})
export class ReadCheckStoreComponent implements OnInit {
  @Input() initialDataType: DataTypeOption = 'molecule';

  // Configuration & Common State
  public dataType: DataTypeOption = 'molecule';
  public format: FormatOption = 'sdf';
  public rootName: string = '22dimethylC3C4';
  public selectedFile: File | null = null;
  public fileContent: string | null = null;

  // Cached Options & Labels for Stable Template Rendering
  public supportedFormats: { value: FormatOption; label: string }[] = [];
  public fileExtensionLabel: string = '.sdf / .mol';

  // Active Workflow Step (1 = Read, 2 = Check, 3 = Store)
  public activeStep: number = 1;
  public step1Completed: boolean = false;
  public step2Completed: boolean = false;
  public step3Completed: boolean = false;

  // Execution State
  public isExecuting: boolean = false;
  public isUploading: boolean = false;
  public statusMessage: string = '';
  public errorMessage: string = '';
  public orchestratorWarning: boolean = false;

  // Output Logs per Step (Cached Array References for *ngFor)
  public step1Log: string = '';
  public step2Log: string = '';
  public step3Log: string = '';
  public step1Lines: LogLineItem[] = [];
  public step2Lines: LogLineItem[] = [];
  public step3Lines: LogLineItem[] = [];

  // Visualized Data
  public existenceItems: ExistenceCheckItem[] = [];
  public storedRecords: StoredRecordItem[] = [];
  public parsedStructuresCount: number = 0;
  public hasConflicts: boolean = false;

  constructor(
    private reactCloudApi: ReactCloudApiService,
    @Optional() public dialogRef?: MatDialogRef<ReadCheckStoreComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { dataType?: DataTypeOption }
  ) {}

  ngOnInit(): void {
    if (this.dialogData?.dataType) {
      this.dataType = this.dialogData.dataType;
    } else if (this.initialDataType) {
      this.dataType = this.initialDataType;
    }
    this.updateFormatDefaults();
  }

  public onDataTypeChange(): void {
    this.updateFormatDefaults();
    this.resetWorkflow();
  }

  public onFormatChange(): void {
    this.updateFileExtensionLabel();
    this.resetWorkflow();
  }

  private updateFormatDefaults(): void {
    if (this.dataType === 'molecule' || this.dataType === 'substructure') {
      this.format = 'sdf';
      this.supportedFormats = [{ value: 'sdf', label: 'SDF / Molfile' }];
    } else {
      this.format = 'ascii';
      this.supportedFormats = [
        { value: 'ascii', label: 'ASCII Text Format' },
        { value: 'sdf', label: 'SDF / Molfile' }
      ];
    }
    this.updateFileExtensionLabel();
  }

  private updateFileExtensionLabel(): void {
    if (this.format === 'sdf') {
      this.fileExtensionLabel = '.sdf / .mol';
    } else {
      this.fileExtensionLabel = '.dat / .txt / .inp';
    }
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      // Extract root name automatically
      let filename = file.name;
      const lastDot = filename.lastIndexOf('.');
      if (lastDot > 0) filename = filename.substring(0, lastDot);
      if (filename.trim()) {
        this.rootName = filename.trim();
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileContent = e.target?.result as string;
      };
      reader.readAsText(file);

      // Reset step workflow on new file
      this.resetWorkflow();
    }
  }

  public resetWorkflow(): void {
    this.activeStep = 1;
    this.step1Completed = false;
    this.step2Completed = false;
    this.step3Completed = false;
    this.step1Log = '';
    this.step2Log = '';
    this.step3Log = '';
    this.step1Lines = [];
    this.step2Lines = [];
    this.step3Lines = [];
    this.existenceItems = [];
    this.storedRecords = [];
    this.parsedStructuresCount = 0;
    this.hasConflicts = false;
    this.errorMessage = '';
    this.statusMessage = '';
    this.orchestratorWarning = false;
  }

  /**
   * Action for 'Reread File' button (Transfers from Step 2 back to Step 1 for file edit/re-upload)
   */
  public rereadFile(): void {
    this.activeStep = 1;
    this.step1Completed = false;
    this.step2Completed = false;
    this.step3Completed = false;
    this.statusMessage = 'File reset. Please upload/verify file and run Step 1 again.';
    this.errorMessage = '';
  }

  private parseLogToLines(logText: string): LogLineItem[] {
    if (!logText) return [];
    return logText.split('\n').map(lineText => {
      const lower = lineText.toLowerCase();
      const isError = lower.includes('error') || lower.includes('fail') || lower.includes('cannot open');
      return { text: lineText, isError };
    });
  }

  // --- Step 1: Read & Format Check ---
  public async executeStep1Read(): Promise<void> {
    console.log('[ReadCheckStoreComponent] Starting Step 1 Read execution...', {
      dataType: this.dataType,
      format: this.format,
      rootName: this.rootName,
      fileSelected: !!this.selectedFile
    });

    if (!this.rootName.trim()) {
      this.errorMessage = 'Please provide a valid dataset root name.';
      return;
    }

    this.isExecuting = true;
    this.statusMessage = 'Step 1: Uploading file & executing Format Check / Read...';
    this.errorMessage = '';

    try {
      // 1. Upload file to working directory if present
      if (this.selectedFile && this.fileContent !== null) {
        const ext = this.format === 'sdf' ? '.sdf' : '.dat';
        const targetFilename = `${this.rootName.trim()}${ext}`;
        console.log(`[ReadCheckStoreComponent] Uploading user file ${targetFilename}...`);
        await firstValueFrom(this.reactCloudApi.uploadUserDataFiles('.', [{ filename: targetFilename, content: this.fileContent }]));
      }

      // 2. Execute Step 1 Commands
      const commands = CommandTemplatesRegistry.getReadCheckStoreCommands(
        this.dataType,
        'read',
        this.format,
        this.rootName.trim(),
        `${this.rootName.trim()}_out`
      );

      console.log('[ReadCheckStoreComponent] Dispatching runCommands:', commands);
      const res = await firstValueFrom(this.reactCloudApi.runCommands(commands, this.rootName.trim()));
      console.log('[ReadCheckStoreComponent] Step 1 response received:', res);
      this.isExecuting = false;

      if (res) {
        this.step1Log = res.output || 'Step 1 completed.';
        if (res.error) this.step1Log += `\n--- ERRORS ---\n${res.error}`;
        this.step1Lines = this.parseLogToLines(this.step1Log);

        if (res.exitCode === 0 && !res.output.includes('ERROR:')) {
          this.step1Completed = true;
          this.statusMessage = 'Step 1 Read & Format Check successful!';
          this.parsedStructuresCount = (res.output.match(/:Mol|:Rxn|:Sub/g) || []).length || 1;
        } else {
          this.errorMessage = 'Format error detected during Step 1 Read. Check output log.';
        }
      }
    } catch (err: any) {
      console.error('[ReadCheckStoreComponent] Error executing Step 1 Read:', err);
      this.isExecuting = false;
      this.errorMessage = err?.error?.error || err?.message || 'Error executing Step 1 Read task.';
    }
  }

  // --- Step 2: Database Existence Check ---
  public async executeStep2Check(): Promise<void> {
    console.log('[ReadCheckStoreComponent] Starting Step 2 Database Check...', {
      dataType: this.dataType,
      format: this.format,
      rootName: this.rootName
    });

    if (!this.step1Completed) return;

    this.activeStep = 2;
    this.isExecuting = true;
    this.statusMessage = 'Step 2: Checking database for existing structures...';
    this.errorMessage = '';

    try {
      const commands = CommandTemplatesRegistry.getReadCheckStoreCommands(
        this.dataType,
        'check',
        this.format,
        this.rootName.trim(),
        `${this.rootName.trim()}_out`
      );

      const res = await firstValueFrom(this.reactCloudApi.runCommands(commands, this.rootName.trim()));
      console.log('[ReadCheckStoreComponent] Step 2 response received:', res);
      this.isExecuting = false;

      if (res) {
        this.step2Log = res.output || 'Step 2 completed.';
        if (res.error) this.step2Log += `\n--- ERRORS ---\n${res.error}`;
        this.step2Lines = this.parseLogToLines(this.step2Log);

        this.parseExistenceCheckOutput(res.output);
        this.step2Completed = true;
        this.statusMessage = 'Step 2 Database Check completed!';
      }
    } catch (err: any) {
      console.error('[ReadCheckStoreComponent] Error executing Step 2 Check:', err);
      this.isExecuting = false;
      this.errorMessage = err?.error?.error || err?.message || 'Error executing Step 2 Existence Check.';
    }
  }

  private parseExistenceCheckOutput(output: string): void {
    const items: ExistenceCheckItem[] = [];
    this.hasConflicts = false;

    if (output) {
      const lines = output.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('FOUND') || line.includes('EXISTS') || line.includes('PRESENT')) {
          this.hasConflicts = true;
          items.push({
            id: `ITEM-${idx}`,
            name: line.trim(),
            inDatabase: true,
            status: 'Present',
            suggestedAction: 'Replace'
          });
        } else if (line.includes(':Mol') || line.includes(':Rxn') || line.includes(':Sub')) {
          items.push({
            id: `ITEM-${idx}`,
            name: line.trim(),
            inDatabase: false,
            status: 'New',
            suggestedAction: 'Add'
          });
        }
      });
    }

    if (items.length === 0) {
      items.push({
        id: '1',
        name: `${this.rootName.trim()} Dataset`,
        inDatabase: false,
        status: 'New',
        suggestedAction: 'Add'
      });
    }

    this.existenceItems = items;
  }

  // --- Step 3: Database Store ---
  public async executeStep3Store(): Promise<void> {
    console.log('[ReadCheckStoreComponent] Starting Step 3 Database Store...', {
      dataType: this.dataType,
      format: this.format,
      rootName: this.rootName
    });

    if (!this.step2Completed) return;

    this.activeStep = 3;
    this.isExecuting = true;
    this.statusMessage = 'Step 3: Committing and storing data structures in REACTCLOUD database...';
    this.errorMessage = '';
    this.orchestratorWarning = false;

    try {
      const commands = CommandTemplatesRegistry.getReadCheckStoreCommands(
        this.dataType,
        'store',
        this.format,
        this.rootName.trim(),
        `${this.rootName.trim()}_out`
      );

      const res = await firstValueFrom(this.reactCloudApi.runCommands(commands, this.rootName.trim()));
      console.log('[ReadCheckStoreComponent] Step 3 response received:', res);
      this.isExecuting = false;

      if (res) {
        this.step3Log = res.output || 'Step 3 completed.';
        if (res.error) this.step3Log += `\n--- ERRORS ---\n${res.error}`;
        this.step3Lines = this.parseLogToLines(this.step3Log);

        if (res.exitCode === 0) {
          this.step3Completed = true;
          this.statusMessage = 'Step 3 Database Store successfully completed!';
          this.parseStoredRecordsOutput(res.output);
        } else {
          this.errorMessage = 'Step 3 Database Store failed.';
          this.orchestratorWarning = true;
        }
      }
    } catch (err: any) {
      console.error('[ReadCheckStoreComponent] Error executing Step 3 Store:', err);
      this.isExecuting = false;
      this.errorMessage = err?.error?.error || err?.message || 'Error executing Step 3 Store task.';
      this.orchestratorWarning = true;
    }
  }

  private parseStoredRecordsOutput(output: string): void {
    const records: StoredRecordItem[] = [
      {
        name: this.rootName.trim(),
        recordId: `DB-REC-${Date.now().toString().slice(-6)}`,
        storagePath: `data/${this.dataType}/${this.rootName.trim()}`,
        status: 'SUCCESS'
      }
    ];
    this.storedRecords = records;
  }

  public closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
