import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReactCloudApiService, CatalogItem } from '../react-cloud-api.service';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseCatalogService {

  constructor(protected apiService: ReactCloudApiService) {}

  /**
   * Common method to fetch catalog list items for a given task ID.
   */
  protected fetchCatalogList(taskId: string, rootName: string = 'job1'): Observable<CatalogItem[]> {
    return this.apiService.runCatalogTaskWithRegistry(taskId, rootName);
  }

  /**
   * Common method to fetch detailed output string for a specific catalog item.
   */
  protected fetchItemDetails(taskId: string, itemName: string, rootName: string = 'job1'): Observable<string> {
    return this.apiService.fetchItemDetails(taskId, itemName, rootName);
  }

  /**
   * Abstract method for retrieving the catalog list for this domain.
   */
  public abstract getCatalogList(rootName?: string): Observable<CatalogItem[]>;

  /**
   * Abstract method for retrieving item details for a named catalog item in this domain.
   */
  public abstract getItemDetails(itemName: string, rootName?: string): Observable<string>;
}
