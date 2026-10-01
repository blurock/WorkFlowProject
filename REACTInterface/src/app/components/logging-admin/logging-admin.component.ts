import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoggingAdminService } from '../../services/logging-admin.service';
import { AuthService } from '../../services/auth.service';
import { LogJobDocument, LogFilterQuery, LogTreeNode, LogFileItem } from '../../models/logging-admin.models';

@Component({
  selector: 'app-logging-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './logging-admin.component.html',
  styleUrl: './logging-admin.component.scss'
})
export class LoggingAdminComponent implements OnInit {
  private loggingService = inject(LoggingAdminService);
  public authService = inject(AuthService);

  // State Signals
  // State Signals
  public viewMode = signal<'jobs' | 'grid' | 'tree'>('jobs');
  public jobs = signal<LogJobDocument[]>([]);
  public treeNodes = signal<LogTreeNode[]>([]);
  public isLoading = signal<boolean>(true);
  
  public selectedJob = signal<LogJobDocument | null>(null);
  public selectedFile = signal<LogFileItem | null>(null);
  
  public activeFileContent = signal<string>('');
  public isLoadingFileContent = signal<boolean>(false);
  public activeTab = signal<'document' | 'files' | 'artifacts'>('document');
  public deleteConfirmJob = signal<LogJobDocument | null>(null);
  public showPurgeAllModal = signal<boolean>(false);
  public copySuccess = signal<boolean>(false);

  // Filter Signals
  public filter = signal<LogFilterQuery>({
    accessMode: 'all',
    status: 'all',
    searchTerm: ''
  });

  // Computed Metrics
  public totalStorageBytes = computed(() => {
    return this.jobs().reduce((acc, job) => acc + (job.totalSizeBytes || 0), 0);
  });

  public totalStorageFormatted = computed(() => {
    const bytes = this.totalStorageBytes();
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  });

  public isSuperAdmin = computed(() => this.loggingService.isSuperAdmin());

  public selectedJobFormattedJson = computed(() => {
    const job = this.selectedJob();
    if (!job) return '';
    return JSON.stringify(job, null, 2);
  });

  ngOnInit(): void {
    this.loadLogs(false);
  }

  public loadLogs(forceRefresh: boolean = false): void {
    this.isLoading.set(true);
    this.loggingService.getLogJobs(this.filter(), forceRefresh).subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.treeNodes.set(this.loggingService.buildLogTree(data));
        this.isLoading.set(false);
        if (data.length > 0 && !this.selectedJob()) {
          this.selectJob(data[0]);
        }
      },
      error: (err) => {
        console.error('[LoggingAdminComponent] Error loading logs:', err);
        this.isLoading.set(false);
      }
    });
  }

  public onFilterChange(): void {
    this.loadLogs();
  }

  public selectJob(job: LogJobDocument): void {
    this.selectedJob.set(job);
    this.selectedFile.set(null);
    this.activeFileContent.set('');

    // Pre-select execution log or first file
    if (job.executionLog) {
      this.selectFile(job.executionLog as LogFileItem);
    } else if (job.files && job.files.length > 0) {
      this.selectFile(job.files[0]);
    }
  }

  public selectFile(file: LogFileItem): void {
    this.selectedFile.set(file);
    this.activeFileContent.set('');

    if (file.downloadUrl) {
      this.isLoadingFileContent.set(true);
      this.loggingService.fetchLogContent(file.downloadUrl).subscribe({
        next: (content) => {
          this.activeFileContent.set(content);
          this.isLoadingFileContent.set(false);
        },
        error: () => {
          this.activeFileContent.set('[Failed to download log content]');
          this.isLoadingFileContent.set(false);
        }
      });
    } else {
      this.activeFileContent.set('[No download URL available for this file]');
    }
  }

  public copyDocumentJson(): void {
    const jsonStr = this.selectedJobFormattedJson();
    if (!jsonStr) return;
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  public closeDrawer(): void {
    this.selectedJob.set(null);
  }

  public promptDeleteJob(job: LogJobDocument, event?: Event): void {
    if (event) event.stopPropagation();
    this.deleteConfirmJob.set(job);
  }

  public cancelDelete(): void {
    this.deleteConfirmJob.set(null);
  }

  public confirmDelete(): void {
    const job = this.deleteConfirmJob();
    if (!job) return;

    this.loggingService.deleteJobLog(job).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.selectedJob()?.jobId === job.jobId) {
            this.selectedJob.set(null);
          }
          this.deleteConfirmJob.set(null);
          this.loadLogs(true);
        } else {
          alert(`Failed to delete log: ${res.message || 'Unknown error'}`);
          this.deleteConfirmJob.set(null);
        }
      }
    });
  }

  public promptPurgeAll(): void {
    this.showPurgeAllModal.set(true);
  }

  public cancelPurgeAll(): void {
    this.showPurgeAllModal.set(false);
  }

  public confirmPurgeAll(): void {
    this.isLoading.set(true);
    this.loggingService.purgeAllLogs().subscribe({
      next: (res) => {
        this.showPurgeAllModal.set(false);
        this.selectedJob.set(null);
        this.loadLogs(true);
      },
      error: (err) => {
        alert(`Failed to purge all logs: ${err.message || 'Unknown error'}`);
        this.showPurgeAllModal.set(false);
        this.isLoading.set(false);
      }
    });
  }

  public toggleTreeNode(node: LogTreeNode, event?: Event): void {
    if (event) event.stopPropagation();
    node.isExpanded = !node.isExpanded;
    if (node.type === 'job' && node.data) {
      this.selectJob(node.data);
    }
  }

  public formatBytes(bytes?: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  public formatDate(isoStr?: string): string {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  }
}
