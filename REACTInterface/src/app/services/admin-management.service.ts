import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AuditIssue {
  type: 'GHOST_INDEX_KEY' | 'ORPHAN_RECORD' | 'NAME_MISMATCH' | 'DUPLICATE_NAME_IN_INDEX' | 'DUPLICATE_ID_IN_INDEX' | 'DUPLICATE_NAME_IN_RECORDS' | 'DUPLICATE_RECORD_NAME' | 'DUPLICATE_RECORD_ID' | 'DUPLICATE_INDEX_NAME' | 'DUPLICATE_INDEX_ID' | 'MISSING_NAME_IN_RECORD' | string;
  database: string;
  id: string;
  name?: string;
  recordName?: string;
  indexName?: string;
  classDocId?: string;
  classIndex?: string;
  count?: number;
  ids?: string[];
  docId?: string;
  docs?: string[];
  message: string;
  severity: 'error' | 'warning' | 'info';
  safeToAutoSync: boolean;
}

export interface AuditSummary {
  totalRecords: number;
  totalKeys: number;
  uniqueNames: number;
  orphanCount: number;
  ghostCount: number;
  mismatchCount: number;
  duplicateNameCount: number;
  duplicateIdCount: number;
  temporaryRecordsCount?: number;
  personalOverridesCount?: number;
}

export interface AuditResult {
  database: string;
  classIndex: string;
  scope?: 'system' | 'personal';
  targetUid?: string;
  summary: AuditSummary;
  issues: AuditIssue[];
  temporaryRecords?: any[];
  personalOverrides?: any[];
}

export interface AutoSyncResult {
  database: string;
  prunedGhosts: number;
  syncedNames: number;
  syncedOrphans: number;
}

export interface CatalogListsPayload {
  generatedAt: string;
  targetUid: string;
  scope?: string;
  molecules: { id: string; name: string; docId?: string; scope?: 'system' | 'personal'; overridesSystem?: boolean }[];
  substructures: {
    total: number;
    families: { family: string; count: number; items: { id: string; name: string; scope?: 'system' | 'personal'; overridesSystem?: boolean }[] }[];
    moleculesInSubstructures: { id: string; name: string; moleculeId: string; scope?: 'system' | 'personal'; overridesSystem?: boolean }[];
    substructureMap: { [id: string]: string };
  };
  reactionPatterns: {
    total: number;
    bySubstructure: {
      substructure: string;
      count: number;
      patterns: { id: string; name: string; role: 'reactant' | 'product'; scope?: 'system' | 'personal'; overridesSystem?: boolean }[];
    }[];
    byPrefix: {
      prefix: string;
      count: number;
      patterns: { id: string; name: string; scope?: 'system' | 'personal'; overridesSystem?: boolean }[];
    }[];
  };
  pathways: {
    total: number;
    clusters: {
      baseName: string;
      count: number;
      pathways: { id: string; name: string; version: string; scope?: 'system' | 'personal'; overridesSystem?: boolean }[];
    }[];
  };
  mechanisms: {
    total: number;
    clusters: {
      targetMolecule: string;
      count: number;
      mechanisms: { id: string; name: string; scope?: 'system' | 'personal'; overridesSystem?: boolean }[];
    }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminManagementService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8085';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    const scope = this.authService.activeDataScope() || 'personal';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-React-Data-Scope': scope
    });
  }

  /**
   * Run cross-reconciliation audit for a database (or 'ALL')
   */
  runAudit(database: string = 'Substructures'): Observable<{ success: boolean; targetUid: string; results: { [key: string]: AuditResult } }> {
    return this.http.post<{ success: boolean; targetUid: string; results: { [key: string]: AuditResult } }>(
      `${this.baseUrl}/api/admin/integrity/audit`,
      { database, scope: this.authService.activeDataScope() },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Executes Auto-Sync Safe Inconsistencies (pruning ghosts, syncing name mismatches, syncing orphans)
   */
  autoSyncSafe(database: string = 'Substructures'): Observable<{ success: boolean; targetUid: string; result: AutoSyncResult }> {
    return this.http.post<{ success: boolean; targetUid: string; result: AutoSyncResult }>(
      `${this.baseUrl}/api/admin/integrity/remediate`,
      { action: 'auto_sync_safe', database, scope: this.authService.activeDataScope() },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Remediates a single issue manually
   */
  remediate(action: string, database: string, params: any = {}): Observable<{ success: boolean; targetUid: string; result: any }> {
    return this.http.post<{ success: boolean; targetUid: string; result: any }>(
      `${this.baseUrl}/api/admin/integrity/remediate`,
      { action, database, ...params, scope: this.authService.activeDataScope() },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Migrates all usages of oldId to newId in ReactionPatterns and deletes oldId
   */
  migrateSubstructure(oldId: string | number, newId: string | number, deleteOld: boolean = true): Observable<{
    success: boolean;
    targetUid: string;
    oldId: number;
    newId: number;
    updatedPatterns: { id: number; name: string }[];
    countUpdated: number;
    deletedOld: boolean;
  }> {
    return this.http.post<any>(
      `${this.baseUrl}/api/admin/substructures/migrate`,
      { oldId, newId, deleteOld, scope: this.authService.activeDataScope() },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Fetches raw database record by key or ID
   */
  fetchRecord(database: string, key: string | number): Observable<{ found: boolean; data?: any }> {
    const isNum = !isNaN(Number(key));
    return this.http.post<{ found: boolean; data?: any }>(
      `${this.baseUrl}/api/db/fetch`,
      { dbName: database, type: isNum ? 'int' : 'string', key: isNum ? Number(key) : String(key) },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Generates catalog lists on-demand and caches them
   */
  generateCatalogLists(): Observable<{ success: boolean; targetUid: string; lists: CatalogListsPayload }> {
    return this.http.post<{ success: boolean; targetUid: string; lists: CatalogListsPayload }>(
      `${this.baseUrl}/api/admin/lists/generate`,
      { scope: this.authService.activeDataScope() },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Fetches cached catalog lists (all or a specific listType)
   */
  getCatalogLists(listType: 'all' | 'molecules' | 'substructures' | 'reactionPatterns' | 'pathways' | 'mechanisms' = 'all'): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/admin/lists/${listType}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Promotes a personal record or override to the System database (Admin Only)
   */
  promoteToSystem(dbName: string, keyOrId: string | number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/db/promoteToSystem`,
      { dbName, key: keyOrId, id: keyOrId },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Reverts a personal override, restoring the System baseline
   */
  revertPersonalOverride(dbName: string, keyOrId: string | number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/db/revertOverride`,
      { dbName, key: keyOrId, id: keyOrId },
      { headers: this.getHeaders() }
    );
  }
}

