import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCatalogService } from './base-catalog.service';
import { CatalogItem, ReactCloudApiService } from '../react-cloud-api.service';

@Injectable({
  providedIn: 'root'
})
export class SubstructuresService extends BaseCatalogService {

  constructor(apiService: ReactCloudApiService) {
    super(apiService);
  }

  public getCatalogList(rootName: string = 'job1'): Observable<CatalogItem[]> {
    return this.fetchCatalogList('substructures', rootName);
  }

  public getItemDetails(itemName: string, rootName: string = 'job1'): Observable<string> {
    return this.fetchItemDetails('substructures', itemName, rootName);
  }
}
