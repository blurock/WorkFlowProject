import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collectionGroup, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  DocumentData
} from 'firebase/firestore';
import { AuthService, SecurityFlag, UserRole } from './auth.service';
import {
  LogJobDocument,
  LogFilterQuery,
  LogTreeNode,
  JobCategoryTaxonomyItem
} from '../models/logging-admin.models';

export interface AdminManagedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  emailVerified?: boolean;
  providers?: string[];
  role: UserRole;
  authorized: boolean;
  blocked: boolean;
  storageUsedBytes: number;
  securityFlags: SecurityFlag[];
  callsLastMinute?: number;
  jobsLastMinute?: number;
  totalSessionCalls?: number;
  createdAt?: string | null;
  lastLoginAt?: string | null;
}

export interface SecurityThresholdConfig {
  maxCallsPerMinute: number;
  maxJobsPerMinute: number;
  maxStorageMB: number;
  hardLimitMultiplier: number;
  updatedAt?: string;
}

const firebaseConfig = {
  projectId: "blurock-database",
  appId: "1:315685320181:web:212000ed2f64b4c730419d",
  storageBucket: "blurock-database.firebasestorage.app",
  apiKey: "AIzaSyBFHXqA8MXdv-KbON_IU78BItS9KangM1Y",
  authDomain: "blurock-database.firebaseapp.com",
  messagingSenderId: "315685320181"
};

@Injectable({
  providedIn: 'root'
})
export class LoggingAdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = environment.apiBaseUrl ?? 'http://localhost:8085';

  private firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  private db = getFirestore(this.firebaseApp);

  private readonly CACHE_KEY_PREFIX = 'reactcloud_log_jobs_cache_';
  private cachedJobsByUser = new Map<string, LogJobDocument[]>();

  public static readonly DEFAULT_TAXONOMY: JobCategoryTaxonomyItem[] = [
    { jobCategory: 'submechanism_generation', label: 'Submechanism Generation', defaultAccessMode: 'db-modifying', subCategoryField: 'molecule', targetField: 'rootName', signatureFormat: 'submechanism_generation::<molecule>::<rootName>' },
    { jobCategory: 'mechanism_combine', label: 'Combine Submechanisms', defaultAccessMode: 'db-modifying', subCategoryField: 'mechName', targetField: 'rootName', signatureFormat: 'mechanism_combine::<mechName>' },
    { jobCategory: 'format_check', label: 'Catalog Format Check', defaultAccessMode: 'read-only', subCategoryField: 'entityType', targetField: 'targetName / inputFile', signatureFormat: 'format_check::<entityType>::<targetName>' },
    { jobCategory: 'catalog_print', label: 'Catalog Print / Query', defaultAccessMode: 'read-only', subCategoryField: 'entityType', targetField: 'targetName / List All', signatureFormat: 'catalog_print::<entityType>::<targetName>' },
    { jobCategory: 'catalog_store', label: 'Catalog Storage', defaultAccessMode: 'db-modifying', subCategoryField: 'entityType', targetField: 'targetName / inputFile', signatureFormat: 'catalog_store::<entityType>::<targetName>' },
    { jobCategory: 'thermo_calc', label: 'Thermodynamics Calculation', defaultAccessMode: 'read-only', subCategoryField: 'thermoType', targetField: 'targetName', signatureFormat: 'thermo_calc::<thermoType>::<targetName>' },
    { jobCategory: 'thermo_store', label: 'Thermodynamics Storage', defaultAccessMode: 'db-modifying', subCategoryField: 'thermoType', targetField: 'targetName', signatureFormat: 'thermo_store::<thermoType>::<targetName>' },
    { jobCategory: 'mechanism_query', label: 'Mechanism Query', defaultAccessMode: 'read-only', subCategoryField: 'entityType / mechName', targetField: 'targetName', signatureFormat: 'mechanism_query::<targetName>' },
    { jobCategory: 'mechanism_store', label: 'Mechanism Storage', defaultAccessMode: 'db-modifying', subCategoryField: 'entityType / mechName', targetField: 'targetName', signatureFormat: 'mechanism_store::<targetName>' },
    { jobCategory: 'script_runner', label: 'Generic Script Runner', defaultAccessMode: 'read-only', subCategoryField: 'inputFile', targetField: 'root', signatureFormat: 'script_runner::<inputFile>::<root>' },
    { jobCategory: 'db_mutation', label: 'Database Mutation', defaultAccessMode: 'db-modifying', subCategoryField: 'entityType', targetField: 'targetName', signatureFormat: 'db_mutation::<entityType>::<targetName>' },
    { jobCategory: 'read_query', label: 'Database Read Query', defaultAccessMode: 'read-only', subCategoryField: 'entityType', targetField: 'targetName', signatureFormat: 'read_query::<entityType>::<targetName>' }
  ];

  constructor() {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Determines whether the current authenticated user holds the Administrator role
   * via verified Firebase Custom Claims / Firestore user profile (zero hardcoded UIDs/emails).
   */
  public isSuperAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Fetch all registered users, live call rates, storage usage, and security flags (Admin only)
   */
  public getAdminUsers(): Observable<{ users: AdminManagedUser[]; securityConfig: SecurityThresholdConfig }> {
    return this.http.get<{ users: AdminManagedUser[]; securityConfig: SecurityThresholdConfig }>(
      `${this.baseUrl}/api/admin/users`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Update a user's role, block/unblock status, or clear security flags (Admin only)
   */
  public updateAdminUser(
    uid: string,
    payload: {
      role?: UserRole;
      authorized?: boolean;
      blocked?: boolean;
      clearFlags?: boolean;
    }
  ): Observable<{ success: boolean; uid: string; role: UserRole; authorized: boolean; blocked: boolean }> {
    return this.http.patch<{ success: boolean; uid: string; role: UserRole; authorized: boolean; blocked: boolean }>(
      `${this.baseUrl}/api/admin/users/${encodeURIComponent(uid)}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Update global rate-limiting and storage quota flag thresholds (Admin only)
   */
  public updateSecurityConfig(config: Partial<SecurityThresholdConfig>): Observable<{ success: boolean; config: SecurityThresholdConfig }> {
    return this.http.put<{ success: boolean; config: SecurityThresholdConfig }>(
      `${this.baseUrl}/api/admin/security-config`,
      config,
      { headers: this.getAuthHeaders() }
    );
  }

  public getLogTaxonomy(): Observable<JobCategoryTaxonomyItem[]> {
    return this.http.get<{ success: boolean; taxonomy: JobCategoryTaxonomyItem[] }>(
      `${this.baseUrl}/api/logs/taxonomy`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => (res?.taxonomy && res.taxonomy.length > 0 ? res.taxonomy : LoggingAdminService.DEFAULT_TAXONOMY)),
      catchError(() => of(LoggingAdminService.DEFAULT_TAXONOMY))
    );
  }

  public deriveJobTaxonomy(job: LogJobDocument): {
    catalogLabel: string;
    subCategory: string;
    targetName: string;
    jobSignature: string;
  } {
    const cat = job.jobCategory || 'script_runner';
    const taxEntry = LoggingAdminService.DEFAULT_TAXONOMY.find(t => t.jobCategory === cat);
    const catalogLabel = job.catalogLabel || taxEntry?.label || cat;

    if (job.subCategory && job.targetName && job.jobSignature) {
      return {
        catalogLabel,
        subCategory: job.subCategory,
        targetName: job.targetName,
        jobSignature: job.jobSignature
      };
    }

    if (cat === 'submechanism_generation') {
      const subCategory = (job.molecule || 'Unknown Molecule').trim();
      const targetName = (job.rootName || job.mechName || 'Unknown Pathway').trim();
      return {
        catalogLabel,
        subCategory,
        targetName,
        jobSignature: `submechanism_generation::${subCategory}::${targetName}`
      };
    }

    if (cat === 'mechanism_combine') {
      const subCategory = (job.mechName || 'Combined Mechanism').trim();
      const targetName = (job.rootName || job.mechName || 'combine').trim();
      return {
        catalogLabel,
        subCategory,
        targetName,
        jobSignature: `mechanism_combine::${subCategory}`
      };
    }

    const fileNames = (job.files || []).map(f => f.filename || '').join(' ');
    const text = `${job.inputFile || ''} ${job.root || ''} ${job.targetItem || ''} ${fileNames}`.toLowerCase();
    let subCategory = job.subCategory || 'General';
    if (!job.subCategory) {
      if (cat === 'thermo_calc' || cat === 'thermo_store') {
        subCategory = text.includes('benson') ? 'Benson' : (text.includes('nasa') || text.includes('.thm') ? 'NASA' : 'General');
      } else if (text.includes('substructure') || text.includes('subs')) {
        subCategory = 'Substructures';
      } else if (text.includes('rxnpat') || text.includes('reactionpattern') || text.includes('rxnpattern')) {
        subCategory = 'ReactionPatterns';
      } else if (text.includes('reaction') || text.includes('rxn')) {
        subCategory = 'Reactions';
      } else if (text.includes('mech') || text.includes('pathway') || text.includes('.lsr')) {
        subCategory = 'Mechanisms';
      } else if (text.includes('mol') || text.includes('.sdf')) {
        subCategory = 'Molecules';
      }
    }

    const nonLogFile = (job.files || []).find(f =>
      f.filename && f.filename !== 'execution.log' && f.filename !== 'run.inp' && !f.filename.endsWith('.api.inp')
    );
    const targetName = job.targetName
      || job.targetItem
      || job.rootName
      || job.mechName
      || (job.inputFile ? job.inputFile.replace(/\.[^.]+$/, '') : '')
      || (job.root && job.root !== 'ROOT' && job.root !== 'api' ? job.root : '')
      || (nonLogFile ? nonLogFile.filename.replace(/\.(Format\.out|out|ans|mech|sdf|thm|corrs|lsr)$/i, '') : '')
      || job.jobId;

    return {
      catalogLabel,
      subCategory,
      targetName,
      jobSignature: job.jobSignature || `${cat}::${subCategory}::${targetName}`
    };
  }

  private enrichJob(job: LogJobDocument): LogJobDocument {
    const tax = this.deriveJobTaxonomy(job);
    return {
      ...job,
      catalogLabel: tax.catalogLabel,
      subCategory: tax.subCategory,
      targetName: tax.targetName,
      jobSignature: tax.jobSignature
    };
  }

  private getStoredCache(cacheScopeUid: string): LogJobDocument[] | null {
    if (this.cachedJobsByUser.has(cacheScopeUid)) {
      return this.cachedJobsByUser.get(cacheScopeUid)!;
    }
    try {
      const stored = sessionStorage.getItem(`${this.CACHE_KEY_PREFIX}${cacheScopeUid}`);
      if (stored) {
        const parsed = (JSON.parse(stored) as LogJobDocument[]).map(j => this.enrichJob(j));
        this.cachedJobsByUser.set(cacheScopeUid, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('[LoggingAdminService] Failed to parse sessionStorage cache:', e);
    }
    return null;
  }

  private setStoredCache(cacheScopeUid: string, jobs: LogJobDocument[]): void {
    const enriched = jobs.map(j => this.enrichJob(j));
    this.cachedJobsByUser.set(cacheScopeUid, enriched);
    try {
      sessionStorage.setItem(`${this.CACHE_KEY_PREFIX}${cacheScopeUid}`, JSON.stringify(enriched));
    } catch (e) {
      console.warn('[LoggingAdminService] Failed to write sessionStorage cache:', e);
    }
  }

  public clearCache(cacheScopeUid?: string): void {
    if (cacheScopeUid) {
      this.cachedJobsByUser.delete(cacheScopeUid);
      sessionStorage.removeItem(`${this.CACHE_KEY_PREFIX}${cacheScopeUid}`);
      return;
    }
    this.cachedJobsByUser.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
  }

  /**
   * Fetch log jobs via Orchestrator Backend REST API (with client Firestore fallback).
   * Always scoped to a single target user (defaults to current user; Admin can select any user).
   */
  public getLogJobs(filter?: LogFilterQuery, forceRefresh: boolean = false): Observable<LogJobDocument[]> {
    const currentUser = this.authService.currentUser();
    const uid = currentUser?.uid || 'user_anonymous';
    const admin = this.isSuperAdmin();
    const targetUid = (admin && filter?.userId) ? filter.userId : uid;

    // Return cached data immediately if not forcing a background refresh
    if (!forceRefresh) {
      const localCache = this.getStoredCache(targetUid);
      if (localCache && localCache.length > 0) {
        return of(localCache.filter(j => this.matchesFilter(j, filter)));
      }
    }

    return this.http.get<LogJobDocument[]>(`${this.baseUrl}/api/logs/list`, {
      headers: this.getAuthHeaders(),
      params: { userId: targetUid }
    }).pipe(
      map(jobs => {
        const enriched = jobs.map(j => this.enrichJob(j));
        this.setStoredCache(targetUid, enriched);
        return enriched.filter(j => this.matchesFilter(j, filter));
      }),
      catchError(err => {
        console.warn('[LoggingAdminService] Backend API query failed, falling back to client Firestore:', err);
        return from(this.fetchJobsFromFirestore(targetUid, false, filter)).pipe(
          map(jobs => {
            const enriched = jobs.map(j => this.enrichJob(j));
            if (enriched.length > 0) this.setStoredCache(targetUid, enriched);
            return enriched.filter(j => this.matchesFilter(j, filter));
          })
        );
      })
    );
  }

  private async fetchJobsFromFirestore(
    uid: string, 
    isAdmin: boolean, 
    filter?: LogFilterQuery
  ): Promise<LogJobDocument[]> {
    const jobsMap = new Map<string, LogJobDocument>();

    try {
      let q;
      if (isAdmin && (!filter?.userId || filter.userId === 'all')) {
        // Super-Admin: Search across all users using Collection Group Query
        q = query(
          collectionGroup(this.db, 'jobs'),
          limit(150)
        );
      } else {
        const targetUid = filter?.userId && filter.userId !== 'all' ? filter.userId : uid;
        q = query(
          collection(this.db, 'users', targetUid, 'jobs'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        const data = doc.data() as LogJobDocument;
        const jobId = data.jobId || doc.id;
        if (this.matchesFilter(data, filter)) {
          if (!jobsMap.has(jobId) || (data.docPath && data.docPath.includes('/logs/'))) {
            jobsMap.set(jobId, {
              ...data,
              docPath: data.docPath || doc.ref.path
            });
          }
        }
      });

      const jobs = Array.from(jobsMap.values());
      // Client-side sort by timestamp descending
      jobs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return jobs;
    } catch (err) {
      console.error('[LoggingAdminService] Error fetching jobs from client Firestore:', err);
      return [];
    }
  }

  private matchesFilter(job: LogJobDocument, filter?: LogFilterQuery): boolean {
    if (!filter) return true;

    if (filter.accessMode && filter.accessMode !== 'all' && job.accessMode !== filter.accessMode) {
      return false;
    }
    if (filter.status && filter.status !== 'all' && job.status !== filter.status) {
      return false;
    }
    if (filter.jobCategory && filter.jobCategory !== 'all' && job.jobCategory !== filter.jobCategory) {
      return false;
    }
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      const matchId = job.jobId?.toLowerCase().includes(term);
      const matchCat = job.jobCategory?.toLowerCase().includes(term);
      const matchLabel = job.catalogLabel?.toLowerCase().includes(term);
      const matchSub = job.subCategory?.toLowerCase().includes(term);
      const matchTarget = job.targetName?.toLowerCase().includes(term);
      const matchMol = job.molecule?.toLowerCase().includes(term);
      const matchRoot = job.rootName?.toLowerCase().includes(term);
      const matchMech = job.mechName?.toLowerCase().includes(term);
      const matchEmail = job.userEmail?.toLowerCase().includes(term);
      const matchFile = job.files?.some(f => f.filename.toLowerCase().includes(term));
      if (!matchId && !matchCat && !matchLabel && !matchSub && !matchTarget && !matchMol && !matchRoot && !matchMech && !matchEmail && !matchFile) {
        return false;
      }
    }
    return true;
  }

  /**
   * Build the hierarchical Job View Tree:
   * Access Mode (DB Modifying / Read Only)
   *   -> Display Label (jobCategory)
   *     -> Subcategory (e.g. butane, Molecules)
   *       -> Target / Job Group (latest run + expandable superseded older runs)
   * All levels start collapsed by default unless expandAll is true (e.g. active search).
   */
  public buildCategorizedJobTree(
    jobs: LogJobDocument[],
    options: { latestOnly?: boolean; expandAll?: boolean } = {}
  ): LogTreeNode[] {
    const latestOnly = options.latestOnly !== false;
    const expandAll = Boolean(options.expandAll);

    // Ensure sorted newest-first
    const sorted = [...jobs]
      .map(j => this.enrichJob(j))
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    const modeOrder: Array<'db-modifying' | 'read-only'> = ['db-modifying', 'read-only'];
    const modeLabels: Record<string, string> = {
      'db-modifying': 'DB Modifying',
      'read-only': 'Read Only'
    };

    const modeMap = new Map<string, LogTreeNode>();

    for (const job of sorted) {
      const accessMode = job.accessMode || 'read-only';
      const category = job.jobCategory || 'script_runner';
      const categoryLabel = job.catalogLabel || category;
      const subCategory = job.subCategory || 'General';
      const targetName = job.targetName || job.jobId;
      const signature = job.jobSignature || `${category}::${subCategory}::${targetName}`;

      // Level 1: Access Mode
      let modeNode = modeMap.get(accessMode);
      if (!modeNode) {
        modeNode = {
          id: `mode_${accessMode}`,
          label: modeLabels[accessMode] || accessMode,
          path: accessMode,
          type: 'accessMode',
          accessMode,
          children: [],
          count: 0,
          isExpanded: expandAll
        };
        modeMap.set(accessMode, modeNode);
      }

      // Level 2: Display Label (jobCategory)
      const catId = `cat_${accessMode}_${category}`;
      let catNode = modeNode.children!.find(n => n.id === catId);
      if (!catNode) {
        catNode = {
          id: catId,
          label: categoryLabel,
          path: `${accessMode}/${category}`,
          type: 'category',
          accessMode,
          jobCategory: category,
          children: [],
          count: 0,
          isExpanded: expandAll
        };
        modeNode.children!.push(catNode);
      }

      // Level 3: Subcategory
      const subId = `sub_${accessMode}_${category}_${subCategory}`;
      let subNode = catNode.children!.find(n => n.id === subId);
      if (!subNode) {
        subNode = {
          id: subId,
          label: subCategory,
          path: `${accessMode}/${category}/${subCategory}`,
          type: 'subCategory',
          accessMode,
          jobCategory: category,
          children: [],
          count: 0,
          isExpanded: expandAll
        };
        catNode.children!.push(subNode);
      }

      // Level 4: Target / Job Group
      if (latestOnly) {
        const groupId = `grp_${accessMode}_${category}_${signature}`;
        let groupNode = subNode.children!.find(n => n.id === groupId);
        if (!groupNode) {
          groupNode = {
            id: groupId,
            label: targetName,
            path: job.docPath || job.jobId,
            type: 'jobGroup',
            accessMode,
            jobCategory: category,
            jobSignature: signature,
            status: job.status,
            timestamp: job.timestamp,
            data: job,
            supersededJobs: [],
            showSuperseded: false,
            count: 1
          };
          subNode.children!.push(groupNode);
          subNode.count = (subNode.count || 0) + 1;
          catNode.count = (catNode.count || 0) + 1;
          modeNode.count = (modeNode.count || 0) + 1;
        } else {
          groupNode.supersededJobs!.push(job);
          groupNode.count = (groupNode.count || 1) + 1;
        }
      } else {
        subNode.children!.push({
          id: job.jobId,
          label: targetName,
          path: job.docPath || job.jobId,
          type: 'job',
          accessMode,
          jobCategory: category,
          jobSignature: signature,
          status: job.status,
          timestamp: job.timestamp,
          data: job
        });
        subNode.count = (subNode.count || 0) + 1;
        catNode.count = (catNode.count || 0) + 1;
        modeNode.count = (modeNode.count || 0) + 1;
      }
    }

    const roots: LogTreeNode[] = [];
    for (const m of modeOrder) {
      const node = modeMap.get(m);
      if (node) roots.push(node);
    }
    for (const [key, node] of modeMap.entries()) {
      if (!modeOrder.includes(key as any)) roots.push(node);
    }
    return roots;
  }

  /**
   * Count how many superseded (non-latest) runs exist in a list of jobs
   */
  public countSupersededRuns(jobs: LogJobDocument[]): number {
    const seen = new Set<string>();
    let superseded = 0;
    for (const raw of jobs) {
      const job = this.enrichJob(raw);
      const key = `${job.jobCategory}::${job.jobSignature}`;
      if (seen.has(key)) {
        superseded++;
      } else {
        seen.add(key);
      }
    }
    return superseded;
  }

  /**
   * Build a hierarchical folder tree structure from a flat array of LogJobDocuments
   */
  public buildLogTree(jobs: LogJobDocument[]): LogTreeNode[] {
    const rootNodes: LogTreeNode[] = [];
    const userMap = new Map<string, LogTreeNode>();

    for (const job of jobs) {
      const userKey = job.userId || 'unknown_user';
      const userLabel = job.userEmail || userKey;

      if (!userMap.has(userKey)) {
        const userNode: LogTreeNode = {
          id: `user_${userKey}`,
          label: userLabel,
          path: `users/${userKey}`,
          type: 'user',
          children: [],
          isExpanded: true
        };
        userMap.set(userKey, userNode);
        rootNodes.push(userNode);
      }

      const userNode = userMap.get(userKey)!;
      const datePartition = job.datePartition || '2026/09/27';
      const accessMode = job.accessMode || 'read-only';

      // Find or create AccessMode node
      let modeNode = userNode.children?.find(n => n.label === accessMode);
      if (!modeNode) {
        modeNode = {
          id: `${userKey}_${accessMode}`,
          label: accessMode,
          path: `users/${userKey}/logs/${accessMode}`,
          type: 'accessMode',
          children: []
        };
        userNode.children?.push(modeNode);
      }

      // Find or create Date node
      let dateNode = modeNode.children?.find(n => n.label === datePartition);
      if (!dateNode) {
        dateNode = {
          id: `${userKey}_${accessMode}_${datePartition}`,
          label: datePartition,
          path: `users/${userKey}/logs/${accessMode}/${datePartition}`,
          type: 'day',
          children: []
        };
        modeNode.children?.push(dateNode);
      }

      // Add Job Node
      dateNode.children?.push({
        id: job.jobId,
        label: `${job.jobCategory} (${job.jobId})`,
        path: job.docPath || `job_${job.jobId}`,
        type: 'job',
        data: job
      });
    }

    return rootNodes;
  }

  /**
   * Fetch Log File Plain Text Content for In-App Previewer
   */
  public fetchLogContent(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(err => {
        console.warn('[LoggingAdminService] Failed to load log content from URL:', err.message);
        return of(`[Error loading log file content: ${err.message}]`);
      })
    );
  }

  /**
   * Delete a single job execution log record and purge GCS artifacts
   */
  public deleteJobLog(job: LogJobDocument): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.baseUrl}/api/logs/job`, {
      headers: this.getAuthHeaders(),
      body: {
        jobId: job.jobId,
        gcsPrefix: job.rawGcsPrefix || job.gcsPrefix,
        docPath: job.docPath,
        userId: job.userId,
        sessionId: job.sessionId
      }
    }).pipe(
      map(res => {
        if (res.success && job.userId) {
          const existing = this.cachedJobsByUser.get(job.userId);
          if (existing) {
            this.setStoredCache(job.userId, existing.filter(j => j.jobId !== job.jobId));
          }
        }
        return res;
      }),
      catchError(err => {
        console.error('[LoggingAdminService] Delete job error:', err);
        return of({ success: false, message: err.error?.error || err.message });
      })
    );
  }

  /**
   * Prune superseded (non-latest) runs sharing the same (jobCategory, jobSignature)
   */
  public pruneSupersededLogs(params: {
    targetUserId?: string;
    jobCategory?: string;
    jobSignature?: string;
  } = {}): Observable<{ success: boolean; prunedCount?: number; deletedFilesCount?: number; message?: string }> {
    return this.http.post<{ success: boolean; prunedCount?: number; deletedFilesCount?: number; message?: string }>(
      `${this.baseUrl}/api/logs/prune-superseded`,
      params,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => {
        if (res.success) {
          this.clearCache(params.targetUserId);
        }
        return res;
      }),
      catchError(err => {
        console.error('[LoggingAdminService] Prune superseded logs error:', err);
        return of({ success: false, message: err.error?.error || err.message });
      })
    );
  }

  /**
   * Purge all execution logs, session jobs, and GCS artifacts
   */
  public purgeAllLogs(userId?: string): Observable<{ success: boolean; message?: string; deletedDocsCount?: number }> {
    return this.http.post<{ success: boolean; message?: string; deletedDocsCount?: number }>(
      `${this.baseUrl}/api/logs/purge-all`,
      { targetUserId: userId || (this.isSuperAdmin() ? 'all' : undefined) },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => {
        if (res.success) {
          this.clearCache();
        }
        return res;
      }),
      catchError(err => {
        console.error('[LoggingAdminService] Purge all logs error:', err);
        return of({ success: false, message: err.error?.error || err.message });
      })
    );
  }

  /**
   * Prune read-only logs older than X days
   */
  public pruneLogs(olderThanDays: number = 30, accessMode: string = 'read-only'): Observable<{ success: boolean; prunedCount?: number }> {
    return this.http.post<{ success: boolean; prunedCount?: number }>(
      `${this.baseUrl}/api/logs/prune`,
      { olderThanDays, accessMode },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(err => {
        console.error('[LoggingAdminService] Prune logs error:', err);
        return of({ success: false });
      })
    );
  }
}
