import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import {
  AdminManagementService,
  AuditIssue,
  AuditResult,
  AuditSummary,
  CatalogListsPayload,
  AutoSyncResult
} from '../../services/admin-management.service';
import { AuthService } from '../../services/auth.service';
import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';
import { AtomCorrespondencesCardComponent } from '../task-list-view/cards/atom-correspondences-card.component';

export type AdminSection = 'verify' | 'molecules' | 'substructures' | 'reaction-patterns' | 'mechanism-paths' | 'mechanisms' | string;

export interface DuplicateSubstructureItem {
  id: string;
  name: string;
  data: any;
  molfile: string;
  dependencies: any[];
  isLoadingDependencies: boolean;
}

export interface DynamicAdminTab {
  id: string; // e.g. 'dedup-betaolefinradical' or 'adjust-rxn-501'
  type: 'deduplicate' | 'adjust-pattern';
  title: string;
  substructureName?: string;
  duplicateItems?: DuplicateSubstructureItem[];
  correspondencesMatch?: boolean;
  correspondencesMatchReason?: string;
  // For adjust-pattern
  patternId?: number | string;
  patternName?: string;
  oldSubId?: string;
  newSubId?: string;
}

/**
 * Builds standard MDL V2000 MOL block string from Firestore Molfile structure
 */
export function buildV2000FromMolfile(name: string, id: string | number, rawData: any): string {
  if (rawData?.sdfContent && typeof rawData.sdfContent === 'string' && rawData.sdfContent.includes('M  END')) {
    return rawData.sdfContent;
  }
  const molfile = rawData?.Molfile || rawData?.molfile || rawData || {};
  const atoms = molfile.Atoms || rawData?.atoms || [];
  const bonds = molfile.Bonds || rawData?.bonds || [];
  const nAtoms = molfile.NAtoms || atoms.length;
  const nBonds = molfile.NBonds || bonds.length;

  const atomicNumberToSymbol = (num: number): string => {
    switch (num) {
      case 1: return 'H';
      case 2: return 'He';
      case 6: return 'C';
      case 7: return 'N';
      case 8: return 'O';
      case 9: return 'F';
      case 14: return 'Si';
      case 15: return 'P';
      case 16: return 'S';
      case 17: return 'Cl';
      case 35: return 'Br';
      case 53: return 'I';
      case 221: return 'Q';
      case 320: return 'R';
      case 382: return 'X';
      default: return 'R';
    }
  };

  const lines: string[] = [
    String(id || name),
    '  -CPSS-  Generated',
    String(name || id),
    `${nAtoms.toString().padStart(3, ' ')}${nBonds.toString().padStart(3, ' ')}  0  0  0  0  0  0  0  0999 V2000`
  ];

  atoms.forEach((a: any) => {
    const x = (typeof a.X === 'number' ? a.X : parseFloat(a.x || a.X || 0)).toFixed(4).padStart(10, ' ');
    const y = (typeof a.Y === 'number' ? a.Y : parseFloat(a.y || a.Y || 0)).toFixed(4).padStart(10, ' ');
    const z = (typeof a.Z === 'number' ? a.Z : parseFloat(a.z || a.Z || 0)).toFixed(4).padStart(10, ' ');
    const atNum = a.AtomicNumber !== undefined ? a.AtomicNumber : (a.atomicNumber !== undefined ? a.atomicNumber : 6);
    const sym = (a.symbol || atomicNumberToSymbol(atNum)).padEnd(3, ' ');
    lines.push(`${x}${y}${z} ${sym} 0  0  0  0  0  0  0  0  0  0  0  0`);
  });

  bonds.forEach((b: any) => {
    const i = ((b.I !== undefined ? b.I : (b.i !== undefined ? b.i : 0)) + 1).toString().padStart(3, ' ');
    const j = ((b.J !== undefined ? b.J : (b.j !== undefined ? b.j : 0)) + 1).toString().padStart(3, ' ');
    const order = (b.Order !== undefined ? b.Order : (b.order !== undefined ? b.order : 1)).toString().padStart(3, ' ');
    lines.push(`${i}${j}${order}  0  0  0  0`);
  });

  const radicalAtoms: { idx: number; rad: number }[] = [];
  atoms.forEach((a: any, idx: number) => {
    const r = a.Radical !== undefined ? a.Radical : (a.isRadical ? 2 : 0);
    if (r > 0) {
      radicalAtoms.push({ idx: idx + 1, rad: r });
    }
  });

  if (radicalAtoms.length > 0) {
    let radLine = `M  RAD${radicalAtoms.length.toString().padStart(3, ' ')}`;
    radicalAtoms.forEach(r => {
      radLine += `${r.idx.toString().padStart(4, ' ')}${r.rad.toString().padStart(4, ' ')}`;
    });
    lines.push(radLine);
  }

  lines.push('M  END');
  return lines.join('\n');
}

/**
 * Checks if atom-atom correspondences between two substructures are identical
 */
export function compareSubstructureCorrespondences(subA: any, subB: any): { identical: boolean; reason?: string } {
  const molA = subA?.Molfile || subA?.molfile || subA || {};
  const molB = subB?.Molfile || subB?.molfile || subB || {};

  const atomsA = molA.Atoms || subA?.atoms || [];
  const atomsB = molB.Atoms || subB?.atoms || [];
  const bondsA = molA.Bonds || subA?.bonds || [];
  const bondsB = molB.Bonds || subB?.bonds || [];

  if (atomsA.length !== atomsB.length) {
    return { identical: false, reason: `Atom counts differ (${atomsA.length} vs ${atomsB.length})` };
  }

  // Compare atom types and radicals sequentially
  for (let idx = 0; idx < atomsA.length; idx++) {
    const aA = atomsA[idx];
    const aB = atomsB[idx];
    const numA = aA.AtomicNumber !== undefined ? aA.AtomicNumber : aA.atomicNumber;
    const numB = aB.AtomicNumber !== undefined ? aB.AtomicNumber : aB.atomicNumber;
    if (numA !== numB) {
      return { identical: false, reason: `Atom #${idx + 1} elements differ (Atomic #${numA} vs #${numB})` };
    }
    const radA = aA.Radical !== undefined ? aA.Radical : (aA.isRadical ? 2 : 0);
    const radB = aB.Radical !== undefined ? aB.Radical : (aB.isRadical ? 2 : 0);
    if (radA !== radB) {
      return { identical: false, reason: `Atom #${idx + 1} radical states differ (${radA} vs ${radB})` };
    }
  }

  if (bondsA.length !== bondsB.length) {
    return { identical: false, reason: `Bond counts differ (${bondsA.length} vs ${bondsB.length})` };
  }

  // Compare bonds topology
  const normalizeBond = (b: any) => {
    const i = b.I !== undefined ? b.I : (b.i !== undefined ? b.i : 0);
    const j = b.J !== undefined ? b.J : (b.j !== undefined ? b.j : 0);
    const order = b.Order !== undefined ? b.Order : (b.order !== undefined ? b.order : 1);
    return `${Math.min(i, j)}-${Math.max(i, j)}-${order}`;
  };

  const bondsSetA = new Set(bondsA.map(normalizeBond));
  for (const b of bondsB) {
    const key = normalizeBond(b);
    if (!bondsSetA.has(key)) {
      return { identical: false, reason: `Bond connectivity differs (${key} missing in counterpart)` };
    }
  }

  return { identical: true };
}

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
    MatProgressSpinnerModule,
    KetcherViewerComponent,
    AtomCorrespondencesCardComponent
  ],
  templateUrl: './administration-panel.component.html',
  styleUrl: './administration-panel.component.scss'
})
export class AdministrationPanelComponent implements OnInit {
  private adminService = inject(AdminManagementService);
  private apiService = inject(ReactCloudApiService);
  public authService = inject(AuthService);

  // Top-bar navigation section
  public activeSection = signal<AdminSection>('verify');

  // Dynamic Tabs (Deduplication and Adjust Pattern)
  public dynamicTabs = signal<DynamicAdminTab[]>([]);
  public activeDynamicTab = computed(() => this.dynamicTabs().find(t => t.id === this.activeSection()));

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
    if (filter === 'temporary') return all.filter(i => i.type === 'TEMPORARY_SCRATCH_RECORD');
    return all;
  });

  // Filtered Temporary / Scratch Records
  public currentTemporaryRecords = computed<any[]>(() => {
    const res = this.auditResults() || {};
    const sel = this.selectedDatabase();
    const temps: any[] = [];
    if (sel === 'ALL') {
      for (const k of Object.keys(res)) {
        if (res[k] && Array.isArray((res[k] as any).temporaryRecords)) {
          temps.push(...(res[k] as any).temporaryRecords);
        }
      }
    } else if (res[sel] && Array.isArray((res[sel] as any).temporaryRecords)) {
      temps.push(...(res[sel] as any).temporaryRecords);
    }
    return temps;
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

        // Normalize each issue to guarantee database and classIndex are populated
        for (const [dbKey, audit] of Object.entries<any>(results)) {
          if (audit && Array.isArray(audit.issues)) {
            for (const issue of audit.issues) {
              if (!issue.database) issue.database = audit.database || dbKey;
              if (!issue.classIndex) issue.classIndex = audit.classIndex;
            }
          }
        }

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

  purgeAllTemporaryRecords(): void {
    const db = this.selectedDatabase() === 'ALL' ? 'Molecules' : this.selectedDatabase();
    this.isRemediating.set(true);
    this.statusMessage.set(null);

    this.adminService.remediate('purge_all_temporary_records', db, {}).subscribe({
      next: (res: any) => {
        this.isRemediating.set(false);
        const r = res.result;
        this.statusMessage.set({
          type: 'success',
          text: `Purge complete: Removed ${r?.purgedCount ?? 0} temporary record(s) and pruned ${r?.prunedKeysTotal ?? 0} index key(s).`
        });
        this.runAudit(false);
      },
      error: (err: any) => {
        this.isRemediating.set(false);
        this.statusMessage.set({
          type: 'error',
          text: `Failed to purge temporary records: ${err.message || 'Unknown error'}`
        });
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
    const newName = issue.recordName || issue.name;
    this.adminService.remediate('sync_name_to_classification', issue.database, {
      classIndex: issue.classIndex,
      id: issue.id,
      name: newName,
      recordName: newName,
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
    const recName = issue.name || issue.recordName;
    this.adminService.remediate('sync_to_classification', issue.database, {
      classIndex: issue.classIndex,
      id: issue.id,
      name: recName
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Added record #${issue.id} ('${recName}') to index.` });
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
      name: issue.name || issue.recordName,
      classIndex: issue.classIndex,
      classDocId: issue.classDocId,
      recordDocId: issue.docId || (issue.docs && issue.docs[0]) || String(issue.id)
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
  // Dynamic Deduplication & Adjustment Tab Operations
  // -------------------------------------------------------------
  isDuplicateSubstructure(issue: AuditIssue): boolean {
    const db = issue.database || this.selectedDatabase();
    const isSub = (db === 'Substructures') || (issue.classIndex?.toLowerCase().includes('substructure'));
    const isDup = (issue.type && issue.type.includes('DUPLICATE')) || 
                  issue.type === 'DUPLICATE_RECORD_NAME' || 
                  issue.type === 'DUPLICATE_NAME_IN_RECORDS' ||
                  issue.type === 'DUPLICATE_INDEX_NAME' ||
                  issue.type === 'DUPLICATE_NAME_IN_INDEX';
    return !!(isSub && isDup);
  }

  openDeduplicateTab(issue: AuditIssue): void {
    const subName = issue.name || issue.recordName || String(issue.id || '');
    const tabId = `dedup-${subName}`;

    const existing = this.dynamicTabs().find(t => t.id === tabId);
    if (existing) {
      this.activeSection.set(tabId);
      return;
    }

    const newTab: DynamicAdminTab = {
      id: tabId,
      type: 'deduplicate',
      title: `Deduplicate: ${subName}`,
      substructureName: subName,
      duplicateItems: [],
      correspondencesMatch: false,
      correspondencesMatchReason: 'Loading substructures and checking dependencies...'
    };

    this.dynamicTabs.update(tabs => [...tabs, newTab]);
    this.activeSection.set(tabId);

    const idsToFetch: string[] = [];
    if (issue.ids && issue.ids.length > 0) {
      issue.ids.forEach(id => {
        const s = String(id);
        if (!idsToFetch.includes(s)) idsToFetch.push(s);
      });
    }
    if (issue.id && !idsToFetch.includes(String(issue.id))) {
      idsToFetch.push(String(issue.id));
    }

    // Fallback: search current issues for any other records with the same name
    if (idsToFetch.length <= 1) {
      const allIssues = this.currentIssues();
      allIssues.forEach(i => {
        const matchName = i.name || i.recordName;
        if (matchName === subName) {
          if (i.ids) {
            i.ids.forEach(mid => {
              const ms = String(mid);
              if (!idsToFetch.includes(ms)) idsToFetch.push(ms);
            });
          }
          if (i.id && !idsToFetch.includes(String(i.id))) {
            idsToFetch.push(String(i.id));
          }
        }
      });
    }

    this.loadDeduplicateSubstructures(newTab, idsToFetch, subName);
  }

  async loadDeduplicateSubstructures(tab: DynamicAdminTab, ids: string[], subName: string): Promise<void> {
    const items: DuplicateSubstructureItem[] = [];

    for (const id of ids) {
      try {
        const rec = await firstValueFrom(this.adminService.fetchRecord('Substructures', id));
        const data = rec.found ? rec.data : { ID: Number(id), Name: subName };
        const molfile = buildV2000FromMolfile(data.Name || subName, data.ID || id, data);

        let dependencies: any[] = [];
        try {
          const depRes = await firstValueFrom(this.apiService.checkDatabaseDependencies('Substructures', subName, Number(id)));
          if (depRes && depRes.dependencies) {
            dependencies = depRes.dependencies.filter(d => d.type === 'ReactionPattern');
          }
        } catch (e) {
          console.warn(`[AdminPanel] Error fetching dependencies for substructure #${id}:`, e);
        }

        items.push({
          id: String(id),
          name: data.Name || subName,
          data,
          molfile,
          dependencies,
          isLoadingDependencies: false
        });
      } catch (err) {
        console.error(`[AdminPanel] Error loading substructure #${id}:`, err);
      }
    }

    let identical = false;
    let reason = 'Single substructure';
    if (items.length >= 2) {
      const cmp = compareSubstructureCorrespondences(items[0].data, items[1].data);
      identical = cmp.identical;
      reason = cmp.reason || (identical ? 'Atom-atom correspondences are identical.' : 'Atom-atom correspondences differ.');
    }

    tab.duplicateItems = items;
    tab.correspondencesMatch = identical;
    tab.correspondencesMatchReason = reason;

    this.dynamicTabs.update(tabs => tabs.map(t => t.id === tab.id ? { ...tab } : t));
  }

  getOtherSubstructure(tab: DynamicAdminTab, item: DuplicateSubstructureItem): DuplicateSubstructureItem {
    const others = (tab.duplicateItems || []).filter(i => i.id !== item.id);
    return others[0] || item;
  }

  getAdjustSection(tab: DynamicAdminTab): any {
    return {
      title: `Reaction Pattern Atom Correspondences for ${tab.patternName || tab.patternId}`,
      content: '',
      isExpanded: true
    };
  }

  deleteUnusedSubstructure(tab: DynamicAdminTab, subItem: DuplicateSubstructureItem): void {
    if (!confirm(`Are you sure you want to permanently delete unused duplicate substructure #${subItem.id} ('${subItem.name}')?`)) {
      return;
    }

    this.isRemediating.set(true);
    this.adminService.remediate('delete_record', 'Substructures', { 
      id: subItem.id,
      name: subItem.name,
      recordDocId: subItem.data?.docId || subItem.id 
    }).subscribe({
      next: () => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'success', text: `Successfully deleted unused duplicate substructure #${subItem.id}.` });
        
        tab.duplicateItems = (tab.duplicateItems || []).filter(i => i.id !== subItem.id);
        if (tab.duplicateItems.length <= 1) {
          this.closeDynamicTab(tab.id);
        } else {
          this.dynamicTabs.update(tabs => tabs.map(t => t.id === tab.id ? { ...tab } : t));
        }
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Failed to delete substructure: ${err.message}` });
      }
    });
  }

  executeSafeMove(tab: DynamicAdminTab, sourceSub: DuplicateSubstructureItem, targetSub: DuplicateSubstructureItem): void {
    if (!confirm(`Substructures have identical atom correspondences.\n\nMigrate all reaction pattern references from #${sourceSub.id} to #${targetSub.id}, and delete #${sourceSub.id}?`)) {
      return;
    }

    this.isRemediating.set(true);
    this.adminService.migrateSubstructure(sourceSub.id, targetSub.id, true).subscribe({
      next: (res) => {
        this.isRemediating.set(false);
        this.statusMessage.set({
          type: 'success',
          text: `Safe Migration Complete: Updated ${res.countUpdated} reaction patterns to #${targetSub.id} and eliminated duplicate #${sourceSub.id}.`
        });
        this.closeDynamicTab(tab.id);
        this.runAudit(false);
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Migration failed: ${err.message}` });
      }
    });
  }

  executeMoveAndAdjust(tab: DynamicAdminTab, sourceSub: DuplicateSubstructureItem, targetSub: DuplicateSubstructureItem): void {
    if (!confirm(`Atom correspondences differ between the substructures.\n\nAll reaction patterns referencing #${sourceSub.id} will be updated to #${targetSub.id}, #${sourceSub.id} will be deleted, and new tabs will open for you to adjust atom correspondences.\n\nProceed?`)) {
      return;
    }

    this.isRemediating.set(true);
    this.adminService.migrateSubstructure(sourceSub.id, targetSub.id, true).subscribe({
      next: (res) => {
        this.isRemediating.set(false);
        this.statusMessage.set({
          type: 'info',
          text: `Migrated references to #${targetSub.id}. Substructure #${sourceSub.id} deleted. Opening adjustment tabs for ${res.updatedPatterns.length} pattern(s)...`
        });

        this.closeDynamicTab(tab.id);

        const newAdjustTabs: DynamicAdminTab[] = [];
        res.updatedPatterns.forEach(pat => {
          const adjTabId = `adjust-${pat.id}`;
          newAdjustTabs.push({
            id: adjTabId,
            type: 'adjust-pattern',
            title: `Adjust: ${pat.name}`,
            patternId: pat.id,
            patternName: pat.name,
            oldSubId: String(sourceSub.id),
            newSubId: String(targetSub.id)
          });
        });

        if (newAdjustTabs.length > 0) {
          this.dynamicTabs.update(tabs => [...tabs, ...newAdjustTabs]);
          this.activeSection.set(newAdjustTabs[0].id);
        } else {
          this.runAudit(false);
        }
      },
      error: (err) => {
        this.isRemediating.set(false);
        this.statusMessage.set({ type: 'error', text: `Move and adjust failed: ${err.message}` });
      }
    });
  }

  closeDynamicTab(tabId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const currentTabs = this.dynamicTabs();
    const remaining = currentTabs.filter(t => t.id !== tabId);
    this.dynamicTabs.set(remaining);

    if (this.activeSection() === tabId) {
      if (remaining.length > 0) {
        this.activeSection.set(remaining[remaining.length - 1].id);
      } else {
        this.activeSection.set('verify');
      }
    }
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
