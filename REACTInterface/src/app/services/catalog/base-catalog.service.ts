import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ReactCloudApiService, CatalogItem } from '../react-cloud-api.service';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseCatalogService {
  private listCacheMap = new Map<string, CatalogItem[]>();
  private detailCacheMap = new Map<string, string>();

  constructor(protected apiService: ReactCloudApiService) {}

  private getListStorageKey(taskId: string, rootName: string): string {
    return `reactcloud_catalog_list_${taskId}_${rootName}`;
  }

  private getDetailStorageKey(taskId: string, itemName: string, rootName: string): string {
    return `reactcloud_detail_${taskId}_${rootName}_${itemName}`;
  }

  /**
   * Common method to fetch catalog list items for a given task ID with local session caching.
   */
  protected fetchCatalogList(
    taskId: string, 
    rootName: string = 'job1', 
    forceRefresh: boolean = false
  ): Observable<CatalogItem[]> {
    const key = this.getListStorageKey(taskId, rootName);

    // 1. Check in-memory / sessionStorage cache if not forcing refresh
    if (!forceRefresh) {
      if (this.listCacheMap.has(key)) {
        console.log(`[BaseCatalogService] Returning ${taskId} list from in-memory cache (0 network calls)`);
        return of(this.listCacheMap.get(key)!);
      }
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as CatalogItem[];
          this.listCacheMap.set(key, parsed);
          console.log(`[BaseCatalogService] Returning ${taskId} list from sessionStorage cache (0 network calls)`);
          return of(parsed);
        }
      } catch (e) {
        console.warn(`[BaseCatalogService] Failed to parse sessionStorage for ${key}:`, e);
      }
    }

    // 2. Fetch from backend API and update session cache
    return this.apiService.runCatalogTaskWithRegistry(taskId, rootName).pipe(
      tap(items => {
        if (items) {
          this.listCacheMap.set(key, items);
          try {
            sessionStorage.setItem(key, JSON.stringify(items));
          } catch (e) {}
        }
      })
    );
  }

  /**
   * Common method to fetch detailed output string for a specific catalog item with local session caching.
   */
  protected fetchItemDetails(
    taskId: string, 
    itemName: string, 
    rootName: string = 'job1', 
    forceRefresh: boolean = false
  ): Observable<string> {
    const key = this.getDetailStorageKey(taskId, itemName, rootName);

    if (!forceRefresh) {
      if (this.detailCacheMap.has(key)) {
        console.log(`[BaseCatalogService] Returning ${taskId}/${itemName} detail from in-memory cache (0 network calls)`);
        return of(this.detailCacheMap.get(key)!);
      }
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          this.detailCacheMap.set(key, stored);
          console.log(`[BaseCatalogService] Returning ${taskId}/${itemName} detail from sessionStorage cache (0 network calls)`);
          return of(stored);
        }
      } catch (e) {}
    }

    return this.apiService.fetchItemDetails(taskId, itemName, rootName).pipe(
      tap(output => {
        if (output) {
          this.detailCacheMap.set(key, output);
          try {
            sessionStorage.setItem(key, output);
          } catch (e) {}
        }
      })
    );
  }

  /**
   * Clear cache for a specific task domain or all catalog domains.
   */
  public clearCatalogCache(taskId?: string): void {
    if (taskId) {
      for (const k of Array.from(this.listCacheMap.keys())) {
        if (k.includes(`_${taskId}_`)) this.listCacheMap.delete(k);
      }
      for (const k of Array.from(this.detailCacheMap.keys())) {
        if (k.includes(`_${taskId}_`)) this.detailCacheMap.delete(k);
      }
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const sk = sessionStorage.key(i);
          if (sk && sk.includes(`_${taskId}_`)) keysToRemove.push(sk);
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      } catch (e) {}
    } else {
      this.listCacheMap.clear();
      this.detailCacheMap.clear();
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const sk = sessionStorage.key(i);
          if (sk && (sk.startsWith('reactcloud_catalog_list_') || sk.startsWith('reactcloud_detail_'))) {
            keysToRemove.push(sk);
          }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      } catch (e) {}
    }
  }

  /**
   * Abstract method for retrieving the catalog list for this domain.
   */
  public abstract getCatalogList(rootName?: string, forceRefresh?: boolean): Observable<CatalogItem[]>;

  /**
   * Abstract method for retrieving item details for a named catalog item in this domain.
   */
  public abstract getItemDetails(itemName: string, rootName?: string, forceRefresh?: boolean): Observable<string>;
}
