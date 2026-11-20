import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MechanismPathSet {
  Name: string;
  Title?: string;
  Description?: string;
  Paths: string[];
  Count?: number;
  TargetMolecule?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  Author?: string;
  IsSystem?: boolean;
  scope?: 'system' | 'personal';
  overridesSystem?: boolean;
}

export interface PathSetSummaryItem {
  Name: string;
  Title?: string;
  Description?: string;
  Count?: number;
  TargetMolecule?: string;
  scope?: 'system' | 'personal';
  overridesSystem?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MechanismPathSetsService {
  private baseUrl = environment.apiBaseUrl ?? 'http://localhost:8085';

  constructor(private http: HttpClient) {}

  /**
   * Lists all MechanismPathSet records stored in Firestore (respecting active view scope)
   */
  public listPathSets(): Observable<PathSetSummaryItem[]> {
    const url = `${this.baseUrl}/api/db/listSummary`;
    return this.http.post<{ found: boolean; records: PathSetSummaryItem[] }>(url, {
      dbName: 'MechanismPathSet',
      fields: ['Name', 'Title', 'Description', 'Paths', 'TargetMolecule', 'scope', 'overridesSystem']
    }).pipe(
      map(res => {
        if (!res || !res.records) return [];
        return res.records.map(r => ({
          ...r,
          Count: Array.isArray((r as any).Paths) ? (r as any).Paths.length : ((r as any).Count || 0)
        }));
      }),
      catchError(err => {
        console.error('[MechanismPathSetsService] listPathSets error:', err);
        return of([]);
      })
    );
  }

  /**
   * Fetches a single MechanismPathSet by Name from Firestore
   */
  public fetchPathSet(name: string): Observable<MechanismPathSet | null> {
    const url = `${this.baseUrl}/api/db/fetch`;
    return this.http.post<{ found: boolean; data: any; scope?: 'system' | 'personal'; overridesSystem?: boolean }>(url, {
      dbName: 'MechanismPathSet',
      type: 'string',
      key: name
    }).pipe(
      map(res => {
        if (res && res.found && res.data) {
          const raw = res.data;
          const paths = Array.isArray(raw.Paths) ? raw.Paths : [];
          return {
            Name: raw.Name || name,
            Title: raw.Title || raw.Name || name,
            Description: raw.Description || '',
            Paths: paths,
            Count: paths.length,
            TargetMolecule: raw.TargetMolecule || '',
            CreatedAt: raw.CreatedAt || null,
            UpdatedAt: raw.UpdatedAt || null,
            Author: raw.Author || null,
            IsSystem: res.scope === 'system' || raw.scope === 'system',
            scope: res.scope || raw.scope || 'system',
            overridesSystem: Boolean(res.overridesSystem ?? raw.overridesSystem)
          } as MechanismPathSet;
        }
        return null;
      }),
      catchError(err => {
        console.error(`[MechanismPathSetsService] fetchPathSet(${name}) error:`, err);
        return of(null);
      })
    );
  }

  /**
   * Stores a MechanismPathSet in Firestore (personal or system scope)
   */
  public storePathSet(pathSet: MechanismPathSet): Observable<{ status: string; path?: string }> {
    const url = `${this.baseUrl}/api/db/store`;
    const cleanName = (pathSet.Name || '').trim();
    const payload = {
      ...pathSet,
      Name: cleanName,
      Paths: Array.isArray(pathSet.Paths) ? pathSet.Paths : [],
      Count: Array.isArray(pathSet.Paths) ? pathSet.Paths.length : 0,
      UpdatedAt: new Date().toISOString()
    };
    if (!payload.CreatedAt) {
      payload.CreatedAt = new Date().toISOString();
    }
    return this.http.post<{ status: string; path?: string }>(url, {
      dbName: 'MechanismPathSet',
      key: cleanName,
      jsonStr: JSON.stringify(payload)
    });
  }

  /**
   * Deletes a MechanismPathSet from Firestore
   */
  public deletePathSet(name: string): Observable<{ status: string }> {
    const url = `${this.baseUrl}/api/db/delete`;
    return this.http.post<{ status: string }>(url, {
      dbName: 'MechanismPathSet',
      key: name
    });
  }

  /**
   * Admin: Promotes a personal MechanismPathSet to the System baseline catalog
   */
  public promoteToSystem(name: string): Observable<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}/api/db/promoteToSystem`;
    return this.http.post<{ success: boolean; message: string }>(url, {
      dbName: 'MechanismPathSet',
      key: name
    });
  }

  /**
   * Reverts a personal override of a System MechanismPathSet, restoring system default
   */
  public revertOverride(name: string): Observable<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}/api/db/revertOverride`;
    return this.http.post<{ success: boolean; message: string }>(url, {
      dbName: 'MechanismPathSet',
      key: name
    });
  }
}
