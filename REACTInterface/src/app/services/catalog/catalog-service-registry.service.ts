import { Injectable } from '@angular/core';
import { BaseCatalogService } from './base-catalog.service';
import { MoleculesService } from './molecules.service';
import { RxnPatternsService } from './rxn-patterns.service';
import { MechanismsService } from './mechanisms.service';
import { BensonGroupsService } from './benson-groups.service';
import { SubstructuresService } from './substructures.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogServiceRegistry {
  private readonly servicesMap: Map<string, BaseCatalogService>;

  constructor(
    private moleculesService: MoleculesService,
    private rxnPatternsService: RxnPatternsService,
    private mechanismsService: MechanismsService,
    private bensonGroupsService: BensonGroupsService,
    private substructuresService: SubstructuresService
  ) {
    this.servicesMap = new Map<string, BaseCatalogService>([
      ['molecules', this.moleculesService],
      ['rxn-patterns', this.rxnPatternsService],
      ['mechanisms', this.mechanismsService],
      ['benson-groups', this.bensonGroupsService],
      ['substructures', this.substructuresService]
    ]);
  }

  /**
   * Returns the domain-specific catalog service for a given task ID.
   * Fallback to moleculesService if task ID is unrecognized.
   */
  public getServiceForTask(taskId: string): BaseCatalogService {
    return this.servicesMap.get(taskId) || this.moleculesService;
  }
}
