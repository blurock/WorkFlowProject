import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCatalogService } from './base-catalog.service';
import { CatalogItem, ReactCloudApiService, StoredMechanismDocument } from '../react-cloud-api.service';

@Injectable({
  providedIn: 'root'
})
export class MechanismsService extends BaseCatalogService {

  constructor(apiService: ReactCloudApiService) {
    super(apiService);
  }

  /**
   * Retrieves the catalog list of genuine stored mechanisms as CatalogItem[]
   * (used by combine-submechanisms or standard task list fallbacks)
   */
  public override getCatalogList(rootName: string = 'job1', forceRefresh: boolean = false): Observable<CatalogItem[]> {
    return this.apiService.getStoredMechanisms().pipe(
      map(mechs => (mechs || []).map((m, idx) => ({
        id: String(idx + 1),
        name: m.mechName,
        rawLine: `${idx + 1} : --> ${m.mechName}`
      })))
    );
  }

  /**
   * Directly get rich StoredMechanismDocument[] from Firestore/GCS
   */
  public getStoredMechanisms(type?: string, targetMolecule?: string): Observable<StoredMechanismDocument[]> {
    return this.apiService.getStoredMechanisms(type, targetMolecule);
  }

  public getStoredMechanismDetails(mechName: string): Observable<StoredMechanismDocument> {
    return this.apiService.getStoredMechanismDetails(mechName);
  }

  public deleteMechanism(mechName: string): Observable<any> {
    return this.apiService.deleteStoredMechanism(mechName);
  }

  public override getItemDetails(itemName: string, rootName: string = 'job1', forceRefresh: boolean = false): Observable<string> {
    return this.fetchItemDetails('mechanisms', itemName, rootName, forceRefresh);
  }
}
