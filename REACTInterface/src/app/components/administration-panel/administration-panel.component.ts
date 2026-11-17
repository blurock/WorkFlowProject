import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AdminManagementService,
  AuditIssue,
  AuditResult,
  AuditSummary,
  CatalogListsPayload,
  AutoSyncResult
} from '../../services/admin-management.service';
import { AuthService } from '../../services/auth.service';

export type AdminSection = 'verify' | 'molecules' | 'substructures' | 'reaction-patterns' | 'mechanism-paths' | 'mechanisms';

@Component({
  selector: 'app-administration-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './administration-panel.component.html',
  styleUrl: './administration-panel.component.scss'
})
export class AdministrationPanelComponent implements OnInit {
  private adminService = inject(AdminManagementService);
  public authService = inject(AuthService);

  // Top-bar navigation section
  public activeSection = signal<AdminSection>('verify');

  // Verify Integrity state
  public selectedDatabase = signal<'Substructures' | 'Molecules' | 'ReactionPatterns' | 'BensonTables' | 'ALL'>('Substructures');
  public isAuditing = signal<boolean>(false);
  public isRemediating = signal<boolean>(false);
  public auditResults = signal<{ [key: string]: AuditResult }>({});
  public auditIssueFilter = signal<string>('all');
  public statusMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Lists state
  public isLoadingLists = signal<boolean>(false);
  public catalogLists = signal<CatalogListsPayload | null>(null);
  public listSearchQuery = signal<string>('');

  // Sub-tabs
  public substructureTab = signal<'families' | 'molecules' | 'map'>('families');
  public rxnPatternTab = signal<'by-substructures' | 'by-prefix'>('by-substructures');
  public substructureMapSort = signal<'name' | 'id'>('name');

  // Accordion expansion states
  public expandedFamilies = signal<Set<string>>(new Set());
  public expandedPrefixes = signal<Set<string>>(new Set());
  public expandedRxnSubstructures = signal<Set<string>>(new Set());
  public expandedPathways = signal<Set<string>>(new Set());
  public expandedMechanisms = signal<Set<string>>(new Set());

  // Modal Dialogs
  public deleteConfirmIssue = signal<AuditIssue | null>(null);
  public renameModalIssue = signal<AuditIssue | null>(null);
  public renameNewName = signal<string>('');

  // Active Audit summary across all audited databases
  public totalIssuesCount = computed(() => {
    let count = 0;
    const res = this.auditResults() || {};
    for (const key of Object.keys(res)) {
      if (res[key] && res[key].issues) {
        count += res[key].issues.length;
      }
    }
    return count;
  });

  public getSummaryMetric(metric: keyof AuditSummary): number {
    const sel = this.selectedDatabase();
    const res = this.auditResults() || {};
    if (sel === 'ALL') {
      return Object.values(res).reduce((acc, cur) => acc + (cur && cur.summary ? (Number(cur.summary[metric]) || 0) : 0), 0);
    }
    const current = res[sel];
    return current && current.summary ? (Number(current.summary[metric]) || 0) : 0;
  }

  public safeIssuesCount = computed(() => {
    let count = 0;
    const res = this.auditResults() || {};
    for (const key of Object.keys(res)) {
      if (res[key] && res[key].issues) {
        count += res[key].issues.filter(i => i && i.safeToAutoSync).length;
      }
    }
    return count;
  });

  // Filtered issues list for the current database view
  public currentIssues = computed(() => {
    const res = this.auditResults() || {};
    const sel = this.selectedDatabase();
    let all: AuditIssue[] = [];

    if (sel === 'ALL') {
      for (const k of Object.keys(res)) {
        if (res[k] && res[k].issues) {
          all.push(...res[k].issues);
        }
      }
    } else if (res[sel] && res[sel].issues) {
      all = res[sel].issues;
    }

    const filter = this.auditIssueFilter();
    if (filter === 'all') return all;
    if (filter === 'ghosts') return all.filter(i => i.type === 'GHOST_INDEX_KEY');
    if (filter === 'orphans') return all.filter(i => i.type === 'ORPHAN_RECORD');
    if (filter === 'mismatches') return all.filter(i => i.type === 'NAME_MISMATCH');
    if (filter === 'duplicates') return all.filter(i => i.type.includes('DUPLICATE'));
    return all;
  });

  // Filtered Molecules
  public filteredMolecules = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.molecules) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.molecules;
    return lists.molecules.filter(m =>
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.id && m.id.toLowerCase().includes(query))
    );
  });

  // Filtered Substructure Families
  public filteredSubstructureFamilies = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.substructures || !lists.substructures.families) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.substructures.families;
    return lists.substructures.families.filter(f =>
      f.family.toLowerCase().includes(query) ||
      f.items.some(it => it.name.toLowerCase().includes(query) || it.id.toLowerCase().includes(query))
    );
  });

  // Filtered Substructures that are Molecules
  public filteredSubstructuresAsMolecules = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.substructures || !lists.substructures.moleculesInSubstructures) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.substructures.moleculesInSubstructures;
    return lists.substructures.moleculesInSubstructures.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      s.moleculeId.toLowerCase().includes(query)
    );
  });

  // Substructure Map pairs
  public substructureMapPairs = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.substructures || !lists.substructures.substructureMap) return [];
    const map = lists.substructures.substructureMap;
    const query = this.listSearchQuery().trim().toLowerCase();
    let entries = Object.keys(map).map(id => ({ id, name: map[id] }));

    if (query) {
      entries = entries.filter(e => e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query));
    }

    const sortMode = this.substructureMapSort();
    if (sortMode === 'name') {
      return entries.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return entries.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }
  });

  // Filtered Reaction Patterns by Substructure
  public filteredRxnPatternsBySubstructure = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.reactionPatterns || !lists.reactionPatterns.bySubstructure) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.reactionPatterns.bySubstructure;
    return lists.reactionPatterns.bySubstructure.filter(grp =>
      grp.substructure.toLowerCase().includes(query) ||
      grp.patterns.some(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query))
    );
  });

  // Filtered Reaction Patterns by Prefix
  public filteredRxnPatternsByPrefix = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.reactionPatterns || !lists.reactionPatterns.byPrefix) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.reactionPatterns.byPrefix;
    return lists.reactionPatterns.byPrefix.filter(grp =>
      grp.prefix.toLowerCase().includes(query) ||
      grp.patterns.some(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query))
    );
  });

  // Filtered Pathways
  public filteredPathways = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.pathways || !lists.pathways.clusters) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.pathways.clusters;
    return lists.pathways.clusters.filter(c =>
      c.baseName.toLowerCase().includes(query) ||
      c.pathways.some(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query) || p.version.toLowerCase().includes(query))
    );
  });

  // Filtered Mechanisms
  public filteredMechanisms = computed(() => {
    const lists = this.catalogLists();
    if (!lists || !lists.mechanisms || !lists.mechanisms.clusters) return [];
    const query = this.listSearchQuery().trim().toLowerCase();
    if (!query) return lists.mechanisms.clusters;
    return lists.mechanisms.clusters.filter(c =>
      c.targetMolecule.toLowerCase().includes(query) ||
      c.mechanisms.some(m => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    // Run default audit on Substructures initially
    this.runAudit();
  }

  setSection(section: AdminSection): void {
    this.activeSection.set(section);
    if (section !== 'verify' && !this.catalogLists() && !this.isLoadingLists()) {
      this.fetchCatalogLists();
    }
  }

  // -------------------------------------------------------------
  // Audit Operations
  // -------------------------------------------------------------
  runAudit(clearStatus: boolean = true): void {
    const db = this.selectedDatabase();
    this.isAuditing.set(true);
    if (clearStatus) {
      this.statusMessage.set(null);
    }

    this.adminService.runAudit(db).subscribe({
      next: (res: any) => {
        this.isAuditing.set(false);
        const results = res.results || (res.result ? { [res.result.database]: res.result } : {});
        this.auditResults.set(results);
        const total = Object.values(results).reduce((acc: number, cur: any) => acc + (cur?.issues?.length || 0), 0);
        if (!this.statusMessage()) {
          if (total === 0) {
            this.statusMessage.set({ type: 'success', text: `Audit completed successfully. All records are 100% consistent!` });
          } else {
            this.statusMessage.set({ type: 'info', text: `Audit found ${total} issue(s) across selected database(s).` });
          }
        }
      },
      error: (err) => {
        this.isAuditing.set(false);
        this.statusMessage.set({ type: 'error', text: `Audit failed: ${err.message || 'Unknown error'}` });
      }
    });
  }

  autoSyncSafe(): void {
    const db = this.selectedDatabase();
    this.isRemediating.set(true);
    this.statusMessage.set(null);

    this.adminService.autoSyncSafe(db === 'ALL' ? 'Substructures' : db).subscribe({
      next: (res) => {
        this.isRemediating.set(false);
        const r = res.result;
        this.statusMessage.set({
          type: 'success',
          text: `Auto-Sync complete: Pruned ${r.prunedGhosts} ghost keys, synchronized ${r.syncedNames} names, indexed ${r.syncedOrphans} orphan records.`
        });
        // Re-run audit to refresh state while preserving auto-sync message
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Auto-Sync failed: ${err.message || 'Unknown error'}` });
      }
    });
  }

  // Individual issue remediation actions
  pruneGhost(issue: AuditIssue): void {
    this.isRemediating.set(true);
    this.adminService.remediate('prune_ghost_key', issue.database, {
      classIndex: issue.classIndex,
      id: issue.id,
      classDocId: issue.classDocId
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Pruned ghost key #${issue.id} from index.` });
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to prune ghost: ${err.message}` });
      }
    });
  }

  syncName(issue: AuditIssue): void {
    this.isRemediating.set(true);
    this.adminService.remediate('sync_name_to_classification', issue.database, {
      classIndex: issue.classIndex,
      id: issue.id,
      recordName: issue.recordName,
      classDocId: issue.classDocId
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Synchronized index name for #${issue.id} to '${issue.recordName}'.` });
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to sync name: ${err.message}` });
      }
    });
  }

  addOrphanToIndex(issue: AuditIssue): void {
    this.isRemediating.set(true);
    this.adminService.remediate('add_key_to_classification', issue.database, {
      classIndex: issue.classIndex,
      id: issue.id,
      name: issue.name || issue.recordName
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Added record #${issue.id} ('${issue.name}') to index.` });
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to add key to index: ${err.message}` });
      }
    });
  }

  openDeleteModal(issue: AuditIssue): void {
    this.deleteConfirmIssue.set(issue);
  }

  closeDeleteModal(): void {
    this.deleteConfirmIssue.set(null);
  }

  confirmDelete(): void {
    const issue = this.deleteConfirmIssue();
    if (!issue) return;

    this.isRemediating.set(true);
    this.closeDeleteModal();

    this.adminService.remediate('delete_record', issue.database, {
      id: issue.id,
      classIndex: issue.classIndex,
      classDocId: issue.classDocId
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Successfully deleted record #${issue.id} from ${issue.database}.` });
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to delete record: ${err.message}` });
      }
    });
  }

  openRenameModal(issue: AuditIssue): void {
    this.renameModalIssue.set(issue);
    this.renameNewName.set(issue.name || issue.recordName || '');
  }

  closeRenameModal(): void {
    this.renameModalIssue.set(null);
    this.renameNewName.set('');
  }

  confirmRename(): void {
    const issue = this.renameModalIssue();
    const newName = this.renameNewName().trim();
    if (!issue || !newName) return;

    this.isRemediating.set(true);
    this.closeRenameModal();

    this.adminService.remediate('rename_record', issue.database, {
      id: issue.id,
      newName: newName,
      classIndex: issue.classIndex,
      classDocId: issue.classDocId
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Successfully renamed #${issue.id} to '${newName}'.` });
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to rename record: ${err.message}` });
      }
    });
  }

  // -------------------------------------------------------------
  // Catalog Lists Operations
  // -------------------------------------------------------------
  fetchCatalogLists(): void {
    this.isLoadingLists.set(true);
    this.adminService.getCatalogLists('all').subscribe({
      next: (res: any) => {
        this.isLoadingLists.set(false);
        const payload = res?.lists || res?.data || res;
        if (payload) {
          this.catalogLists.set(payload);
        }
      },
      error: (err) => {
        this.isLoadingLists.set(false);
        console.warn('Could not fetch cached catalog lists:', err.message);
      }
    });
  }

  regenerateCatalogLists(): void {
    this.isLoadingLists.set(true);
    this.statusMessage.set(null);

    this.adminService.generateCatalogLists().subscribe({
      next: (res: any) => {
        this.isLoadingLists.set(false);
        const payload = res?.lists || res?.data || res;
        this.catalogLists.set(payload);
        this.statusMessage.set({ type: 'success', text: `Catalog lists successfully regenerated and cached!` });
      },
      error: (err) => {
        this.isLoadingLists.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to regenerate catalog lists: ${err.message}` });
      }
    });
  }

  // Accordion Toggle Helpers
  toggleFamily(family: string): void {
    const s = new Set(this.expandedFamilies());
    if (s.has(family)) s.delete(family);
    else s.add(family);
    this.expandedFamilies.set(s);
  }

  isFamilyExpanded(family: string): boolean {
    return this.expandedFamilies().has(family);
  }

  togglePrefix(prefix: string): void {
    const s = new Set(this.expandedPrefixes());
    if (s.has(prefix)) s.delete(prefix);
    else s.add(prefix);
    this.expandedPrefixes.set(s);
  }

  isPrefixExpanded(prefix: string): boolean {
    return this.expandedPrefixes().has(prefix);
  }

  toggleRxnSubstructure(substructure: string): void {
    const s = new Set(this.expandedRxnSubstructures());
    if (s.has(substructure)) s.delete(substructure);
    else s.add(substructure);
    this.expandedRxnSubstructures.set(s);
  }

  isRxnSubstructureExpanded(substructure: string): boolean {
    return this.expandedRxnSubstructures().has(substructure);
  }

  togglePathway(baseName: string): void {
    const s = new Set(this.expandedPathways());
    if (s.has(baseName)) s.delete(baseName);
    else s.add(baseName);
    this.expandedPathways.set(s);
  }

  isPathwayExpanded(baseName: string): boolean {
    return this.expandedPathways().has(baseName);
  }

  toggleMechanism(targetMolecule: string): void {
    const s = new Set(this.expandedMechanisms());
    if (s.has(targetMolecule)) s.delete(targetMolecule);
    else s.add(targetMolecule);
    this.expandedMechanisms.set(s);
  }

  isMechanismExpanded(targetMolecule: string): boolean {
    return this.expandedMechanisms().has(targetMolecule);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.statusMessage.set({ type: 'info', text: `Copied '${text}' to clipboard.` });
    setTimeout(() => {
      if (this.statusMessage()?.text.includes('Copied')) {
        this.statusMessage.set(null);
      }
    }, 2500);
  }
}
