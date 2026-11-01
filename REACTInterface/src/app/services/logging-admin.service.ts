import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';
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
import { LogJobDocument, LogFilterQuery, LogTreeNode } from '../models/logging-admin.models';

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
  private readonly baseUrl = 'http://localhost:8085';

  private firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  private db = getFirestore(this.firebaseApp);

  private readonly CACHE_KEY = 'reactcloud_log_jobs_cache';
  private cachedJobs: LogJobDocument[] | null = null;

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

  private getStoredCache(): LogJobDocument[] | null {
    if (this.cachedJobs) return this.cachedJobs;
    try {
      const stored = sessionStorage.getItem(this.CACHE_KEY);
      if (stored) {
        this.cachedJobs = JSON.parse(stored) as LogJobDocument[];
        return this.cachedJobs;
      }
    } catch (e) {
      console.warn('[LoggingAdminService] Failed to parse sessionStorage cache:', e);
    }
    return null;
  }

  private setStoredCache(jobs: LogJobDocument[]): void {
    this.cachedJobs = jobs;
    try {
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.warn('[LoggingAdminService] Failed to write sessionStorage cache:', e);
    }
  }

  public clearCache(): void {
    this.cachedJobs = null;
    sessionStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Fetch log jobs via Orchestrator Backend REST API (with client Firestore fallback)
   * Uses local sessionStorage caching to minimize background network calls.
   */
  public getLogJobs(filter?: LogFilterQuery, forceRefresh: boolean = false): Observable<LogJobDocument[]> {
    const currentUser = this.authService.currentUser();
    const uid = currentUser?.uid || 'user_anonymous';
    const admin = this.isSuperAdmin();

    // Return cached data immediately if not forcing a background refresh
    if (!forceRefresh) {
      const localCache = this.getStoredCache();
      if (localCache && localCache.length > 0) {
        console.log(`[LoggingAdminService] Returning ${localCache.length} jobs from local session cache (0 network calls)`);
        return of(localCache.filter(j => this.matchesFilter(j, filter)));
      }
    }

    return this.http.get<LogJobDocument[]>(`${this.baseUrl}/api/logs/list`, {
      headers: this.getAuthHeaders(),
      params: filter?.userId ? { userId: filter.userId } : {}
    }).pipe(
      map(jobs => {
        console.log(`[LoggingAdminService] Fetched ${jobs.length} jobs via Orchestrator API & updated session cache`);
        this.setStoredCache(jobs);
        return jobs.filter(j => this.matchesFilter(j, filter));
      }),
      catchError(err => {
        console.warn('[LoggingAdminService] Backend API query failed, falling back to client Firestore:', err);
        return from(this.fetchJobsFromFirestore(uid, admin, filter)).pipe(
          map(jobs => {
            if (jobs.length > 0) this.setStoredCache(jobs);
            return jobs;
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
      const matchEmail = job.userEmail?.toLowerCase().includes(term);
      const matchFile = job.files?.some(f => f.filename.toLowerCase().includes(term));
      if (!matchId && !matchCat && !matchEmail && !matchFile) return false;
    }
    return true;
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
        if (res.success && this.cachedJobs) {
          const updated = this.cachedJobs.filter(j => j.jobId !== job.jobId);
          this.setStoredCache(updated);
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
