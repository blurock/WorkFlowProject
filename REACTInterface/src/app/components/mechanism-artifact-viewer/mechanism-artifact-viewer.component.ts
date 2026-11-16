import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ReactCloudApiService, MechanismStorageFile } from '../../services/react-cloud-api.service';
import { SdfViewerComponent } from '../sdf-viewer/sdf-viewer.component';

@Component({
  selector: 'app-mechanism-artifact-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule,
    SdfViewerComponent
  ],
  templateUrl: './mechanism-artifact-viewer.component.html',
  styleUrls: ['./mechanism-artifact-viewer.component.scss']
})
export class MechanismArtifactViewerComponent implements OnChanges {
  @Input() public mechName: string = '';
  @Input() public storageDirectory: string = '';
  @Input() public files: MechanismStorageFile[] = [];
  @Input() public executionLog?: string;
  @Input() public missingReactionPatterns?: string[];

  public selectedFileIndex: number = 0;
  public activeFile: MechanismStorageFile | null = null;
  public activeContent: string = '';
  public isLoadingContent: boolean = false;
  public isLineWrapEnabled: boolean = false;

  public detectedMissingPatterns: string[] = [];
  public isMissingPanelDismissed: boolean = false;

  constructor(
    private apiService: ReactCloudApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['files'] || changes['mechName']) {
      if (this.files && Array.isArray(this.files)) {
        for (const file of this.files) {
          file.content = undefined;
        }
      }
      this.activeFile = null;
      this.activeContent = '';
      this.selectedFileIndex = 0;
      this.initSelectedFile();
    }
    if (changes['files'] || changes['executionLog'] || changes['missingReactionPatterns']) {
      this.updateMissingPatterns();
    }
  }

  public updateMissingPatterns(): void {
    if (this.missingReactionPatterns && this.missingReactionPatterns.length > 0) {
      this.detectedMissingPatterns = [...this.missingReactionPatterns];
      this.isMissingPanelDismissed = false;
      return;
    }

    if (this.executionLog) {
      this.detectedMissingPatterns = this.apiService.extractMissingReactionPatterns(this.executionLog);
      this.isMissingPanelDismissed = false;
      return;
    }

    // Inspect files array for log file content
    const logFile = this.files?.find(f => f.fileType === 'log' || f.filename.endsWith('.log'));
    if (logFile && logFile.content) {
      this.detectedMissingPatterns = this.apiService.extractMissingReactionPatterns(logFile.content);
      this.isMissingPanelDismissed = false;
    } else if (logFile && logFile.downloadUrl) {
      this.apiService.fetchAsciiFileContent(logFile.downloadUrl, false).subscribe({
        next: (text) => {
          logFile.content = text;
          this.detectedMissingPatterns = this.apiService.extractMissingReactionPatterns(text);
        },
        error: () => {}
      });
    } else {
      this.detectedMissingPatterns = [];
    }
  }

  public copyMissingPatterns(): void {
    if (!this.detectedMissingPatterns || this.detectedMissingPatterns.length === 0) return;
    const text = this.detectedMissingPatterns.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`Copied ${this.detectedMissingPatterns.length} missing pattern name(s) to clipboard!`, 'OK', { duration: 2500 });
    });
  }

  public hasLogFile(): boolean {
    return !!this.files?.some(f => f.fileType === 'log' || f.filename.endsWith('.log'));
  }

  public selectLogFile(): void {
    const logIdx = this.files?.findIndex(f => f.fileType === 'log' || f.filename.endsWith('.log'));
    if (logIdx !== undefined && logIdx >= 0) {
      this.onTabChanged(logIdx);
    }
  }

  public initSelectedFile(): void {
    if (!this.files || this.files.length === 0) {
      this.activeFile = null;
      this.activeContent = '';
      return;
    }
    const idx = Math.min(this.selectedFileIndex, this.files.length - 1);
    this.selectFile(idx, true);
  }

  public onTabChanged(index: number): void {
    this.selectedFileIndex = index;
    this.selectFile(index);
  }

  public refreshCurrentFile(): void {
    if (this.selectedFileIndex >= 0 && this.files?.length) {
      this.selectFile(this.selectedFileIndex, true);
    }
  }

  public selectFile(index: number, forceRefresh: boolean = false): void {
    if (!this.files || index < 0 || index >= this.files.length) return;
    const file = this.files[index];
    this.activeFile = file;

    // If file is zip, no text preview
    if (file.fileType === 'zip') {
      this.activeContent = '';
      return;
    }

    if (!forceRefresh && file.content) {
      this.activeContent = file.content;
      return;
    }

    if (!file.downloadUrl) {
      this.activeContent = '[No download URL available for this artifact.]';
      return;
    }

    this.isLoadingContent = true;
    this.apiService.fetchAsciiFileContent(file.downloadUrl, forceRefresh).subscribe({
      next: (text) => {
        file.content = text;
        this.activeContent = text;
        this.isLoadingContent = false;
      },
      error: (err) => {
        this.activeContent = `[Failed to load artifact: ${err?.message || 'Network error'}]`;
        this.isLoadingContent = false;
      }
    });
  }

  public isSdfActive(): boolean {
    if (!this.activeFile) return false;
    return this.activeFile.fileType === 'sdf' || this.activeFile.filename?.toLowerCase().endsWith('.sdf') === true;
  }

  public getZipFile(): MechanismStorageFile | undefined {
    return this.files?.find(f => f.fileType === 'zip');
  }

  public downloadActiveFile(): void {
    if (!this.activeFile) return;
    this.downloadFile(this.activeFile);
  }

  public downloadFile(file: MechanismStorageFile): void {
    if (!file.downloadUrl) {
      this.snackBar.open(`No download URL for ${file.filename}`, 'Close', { duration: 2500 });
      return;
    }
    const a = document.createElement('a');
    a.href = file.downloadUrl;
    a.download = file.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.snackBar.open(`Downloading ${file.filename}...`, 'OK', { duration: 2000 });
  }

  public copyActiveContent(): void {
    if (!this.activeContent) return;
    navigator.clipboard.writeText(this.activeContent).then(() => {
      this.snackBar.open(`Copied ${this.activeFile?.filename} to clipboard!`, 'OK', { duration: 2500 });
    });
  }

  public toggleLineWrap(): void {
    this.isLineWrapEnabled = !this.isLineWrapEnabled;
  }

  public getLineCount(text: string): number {
    if (!text) return 0;
    return text.split('\n').length;
  }

  public formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  public getFileIcon(type: string): string {
    switch (type) {
      case 'mech': return 'account_tree';
      case 'sdf': return 'science';
      case 'thm': return 'thermostat';
      case 'corrs': return 'sync_alt';
      case 'log': return 'terminal';
      case 'lsr': return 'code';
      case 'zip': return 'folder_zip';
      default: return 'description';
    }
  }
}
