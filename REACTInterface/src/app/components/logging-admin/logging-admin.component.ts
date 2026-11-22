import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LoggingAdminService,
  AdminManagedUser,
  SecurityThresholdConfig
} from '../../services/logging-admin.service';
import { AuthService, UserRole } from '../../services/auth.service';
import {
  LogJobDocument,
  LogFilterQuery,
  LogTreeNode,
  LogFileItem,
  JobCategoryTaxonomyItem
} from '../../models/logging-admin.models';

export interface PruneSupersededContext {
  targetUserId: string;
  jobCategory?: string;
  jobSignature?: string;
  label: string;
  count: number;
}

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
  public viewMode = signal<'jobs' | 'grid' | 'tree' | 'security'>('jobs');
  public jobs = signal<LogJobDocument[]>([]);
  public jobTreeNodes = signal<LogTreeNode[]>([]);
  public treeNodes = signal<LogTreeNode[]>([]);
  public taxonomy = signal<JobCategoryTaxonomyItem[]>(LoggingAdminService.DEFAULT_TAXONOMY);
  public isLoading = signal<boolean>(true);
  public isPruning = signal<boolean>(false);

  public selectedJob = signal<LogJobDocument | null>(null);
  public selectedFile = signal<LogFileItem | null>(null);

  public activeFileContent = signal<string>('');
  public isLoadingFileContent = signal<boolean>(false);
  public activeTab = signal<'document' | 'files' | 'artifacts'>('document');
  public deleteConfirmJob = signal<LogJobDocument | null>(null);
  public pruneConfirmContext = signal<PruneSupersededContext | null>(null);
  public showPurgeAllModal = signal<boolean>(false);
  public showTaxonomyModal = signal<boolean>(false);
  public copySuccess = signal<boolean>(false);

  // Single-User Selection (Super Admin defaults to own admin account; only one user shown at a time)
  public selectedUserId = signal<string>('');

  // Admin User & Security Management State
  public managedUsers = signal<AdminManagedUser[]>([]);
  public isLoadingUsers = signal<boolean>(false);
  public securityConfig = signal<SecurityThresholdConfig>({
    maxCallsPerMinute: 60,
    maxJobsPerMinute: 12,
    maxStorageMB: 100,
    hardLimitMultiplier: 2.5
  });
  public configSavedMessage = signal<string | null>(null);

  // Filter Signals
  public filter = signal<LogFilterQuery>({
    accessMode: 'all',
    jobCategory: 'all',
    status: 'all',
    searchTerm: '',
    latestOnly: true
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

  public supersededCount = computed(() => {
    return this.loggingService.countSupersededRuns(this.jobs());
  });

  public displayedGridJobs = computed(() => {
    const allJobs = this.jobs();
    if (!this.filter().latestOnly) {
      return allJobs.map(job => ({ job, olderCount: 0 }));
    }
    const grouped = new Map<string, { job: LogJobDocument; olderCount: number }>();
    for (const job of allJobs) {
      const key = `${job.jobCategory}::${job.jobSignature || job.jobId}`;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { job, olderCount: 0 });
      } else {
        existing.olderCount += 1;
      }
    }
    return Array.from(grouped.values());
  });

  public selectableUsers = computed(() => {
    const current = this.authService.currentUser();
    const list = [...this.managedUsers()];
    if (current?.uid && !list.some(u => u.uid === current.uid)) {
      list.unshift({
        uid: current.uid,
        email: current.email || current.username || current.uid,
        displayName: current.username || current.email || current.uid,
        role: current.role || 'admin',
        authorized: true,
        blocked: false,
        storageUsedBytes: 0,
        securityFlags: []
      });
    }
    return list;
  });

  public isSuperAdmin = computed(() => this.loggingService.isSuperAdmin());

  public flaggedUsersCount = computed(() => {
    return this.managedUsers().filter(u => (u.securityFlags?.length || 0) > 0).length;
  });

  public selectedJobFormattedJson = computed(() => {
    const job = this.selectedJob();
    if (!job) return '';
    return JSON.stringify(job, null, 2);
  });

  ngOnInit(): void {
    const currentUid = this.authService.currentUser()?.uid || '';
    this.selectedUserId.set(currentUid);

    this.loggingService.getLogTaxonomy().subscribe({
      next: (items) => this.taxonomy.set(items)
    });

    this.loadLogs(true);
    if (this.isSuperAdmin()) {
      this.loadAdminUsers();
    }
  }

  public onSelectedUserChange(newUid: string): void {
    this.selectedUserId.set(newUid);
    this.selectedJob.set(null);
    this.loadLogs(true);
  }

  public switchToSecurityTab(): void {
    this.viewMode.set('security');
    this.loadAdminUsers();
  }

  public loadAdminUsers(): void {
    if (!this.isSuperAdmin()) return;
    this.isLoadingUsers.set(true);
    this.loggingService.getAdminUsers().subscribe({
      next: (res) => {
        this.managedUsers.set(res.users || []);
        if (res.securityConfig) {
          this.securityConfig.set(res.securityConfig);
        }
        this.isLoadingUsers.set(false);
      },
      error: (err) => {
        console.warn('[LoggingAdminComponent] Could not load users list:', err);
        this.isLoadingUsers.set(false);
      }
    });
  }

  public onChangeUserRole(user: AdminManagedUser, newRole: UserRole): void {
    this.loggingService.updateAdminUser(user.uid, { role: newRole }).subscribe({
      next: () => this.loadAdminUsers(),
      error: (err) => alert(err.error?.error || err.message || 'Failed to update user role')
    });
  }

  public onToggleBlockUser(user: AdminManagedUser): void {
    const nextBlocked = !user.blocked;
    this.loggingService.updateAdminUser(user.uid, {
      blocked: nextBlocked,
      authorized: !nextBlocked
    }).subscribe({
      next: () => this.loadAdminUsers(),
      error: (err) => alert(err.error?.error || err.message || 'Failed to update account status')
    });
  }

  public onClearUserFlags(user: AdminManagedUser): void {
    this.loggingService.updateAdminUser(user.uid, { clearFlags: true }).subscribe({
      next: () => this.loadAdminUsers(),
      error: (err) => alert(err.error?.error || err.message || 'Failed to clear security flags')
    });
  }

  public onSaveSecurityConfig(): void {
    this.loggingService.updateSecurityConfig(this.securityConfig()).subscribe({
      next: (res) => {
        if (res.config) {
          this.securityConfig.set(res.config);
        }
        this.configSavedMessage.set('Security thresholds saved.');
        setTimeout(() => this.configSavedMessage.set(null), 3000);
      },
      error: (err) => alert(err.error?.error || err.message || 'Failed to save security thresholds')
    });
  }

  public loadLogs(forceRefresh: boolean = false): void {
    this.isLoading.set(true);
    const activeUid = this.selectedUserId() || this.authService.currentUser()?.uid || '';
    const activeFilter: LogFilterQuery = {
      ...this.filter(),
      userId: activeUid || undefined
    };

    this.loggingService.getLogJobs(activeFilter, forceRefresh).subscribe({
      next: (data) => {
        this.jobs.set(data);
        const hasSearch = Boolean((activeFilter.searchTerm || '').trim());
        this.jobTreeNodes.set(
          this.loggingService.buildCategorizedJobTree(data, {
            latestOnly: activeFilter.latestOnly !== false,
            expandAll: hasSearch
          })
        );
        this.treeNodes.set(this.loggingService.buildLogTree(data));
        this.isLoading.set(false);
        if (data.length > 0 && !this.selectedJob()) {
          this.selectJob(data[0]);
        } else if (data.length === 0) {
          this.selectedJob.set(null);
        }
      },
      error: (err) => {
        console.error('[LoggingAdminComponent] Error loading logs:', err);
        this.isLoading.set(false);
      }
    });
  }

  public onFilterChange(): void {
    // Re-trigger computed signals by cloning the filter object reference
    this.filter.set({ ...this.filter() });
    this.loadLogs(false);
  }

  public expandAllJobTree(): void {
    this.setExpansionRecursive(this.jobTreeNodes(), true);
  }

  public collapseAllJobTree(): void {
    this.setExpansionRecursive(this.jobTreeNodes(), false);
  }

  private setExpansionRecursive(nodes: LogTreeNode[], expanded: boolean): void {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        node.isExpanded = expanded;
        this.setExpansionRecursive(node.children, expanded);
      }
    }
  }

  public toggleSupersededRuns(node: LogTreeNode, event: Event): void {
    event.stopPropagation();
    node.showSuperseded = !node.showSuperseded;
  }

  public selectJob(job: LogJobDocument): void {
    this.selectedJob.set(job);
    this.selectedFile.set(null);
    this.activeFileContent.set('');

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

  public promptPruneAllSuperseded(): void {
    const count = this.supersededCount();
    if (count === 0) return;
    const targetUserId = this.selectedUserId() || this.authService.currentUser()?.uid || '';
    this.pruneConfirmContext.set({
      targetUserId,
      label: 'all superseded runs for the selected user',
      count
    });
  }

  public promptPruneGroupSuperseded(node: LogTreeNode, event: Event): void {
    event.stopPropagation();
    const count = node.supersededJobs?.length || 0;
    if (count === 0) return;
    const targetUserId = node.data?.userId || this.selectedUserId() || this.authService.currentUser()?.uid || '';
    this.pruneConfirmContext.set({
      targetUserId,
      jobCategory: node.jobCategory,
      jobSignature: node.jobSignature,
      label: `"${node.label}"`,
      count
    });
  }

  public cancelPruneSuperseded(): void {
    this.pruneConfirmContext.set(null);
  }

  public confirmPruneSuperseded(): void {
    const ctx = this.pruneConfirmContext();
    if (!ctx) return;

    this.isPruning.set(true);
    this.loggingService.pruneSupersededLogs({
      targetUserId: ctx.targetUserId,
      jobCategory: ctx.jobCategory,
      jobSignature: ctx.jobSignature
    }).subscribe({
      next: (res) => {
        this.isPruning.set(false);
        this.pruneConfirmContext.set(null);
        if (res.success) {
          this.loadLogs(true);
        } else {
          alert(`Failed to prune superseded runs: ${res.message || 'Unknown error'}`);
        }
      },
      error: (err) => {
        this.isPruning.set(false);
        this.pruneConfirmContext.set(null);
        alert(`Failed to prune superseded runs: ${err.message || 'Unknown error'}`);
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
    const targetUserId = this.selectedUserId() || this.authService.currentUser()?.uid || undefined;
    this.loggingService.purgeAllLogs(targetUserId).subscribe({
      next: () => {
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
    if (node.type === 'job' || node.type === 'jobGroup') {
      if (node.data) {
        this.selectJob(node.data);
      }
      return;
    }
    node.isExpanded = !node.isExpanded;
  }

  public formatBytes(bytes?: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  public formatDate(isoStr?: string | null): string {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  }

  public formatShortTime(isoStr?: string | null): string {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  }
}
