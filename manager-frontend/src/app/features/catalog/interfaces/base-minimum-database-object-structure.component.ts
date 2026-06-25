import { Component, OnInit, Input, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../primitives/base-primitive';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DynamicPrimitiveComponent } from '../primitives/dynamic-primitive/dynamic-primitive';
import { MinimumDatabaseObjectStructureComponent } from './minimum-database-object/minimum-database-object';
import { OntologyService } from '../../../core/services/ontology.service';
import { DataObjectLinkComponent } from './data-object-link/data-object-link';
import { ObjectSiteReferenceComponent } from './object-site-reference/object-site-reference';
import { BibliographicReferenceLinkComponent } from './bibliographic-reference-link/bibliographic-reference-link';

@Component({
  selector: 'app-base-minimum-database-object-structure',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    forwardRef(() => DynamicPrimitiveComponent),
    forwardRef(() => MinimumDatabaseObjectStructureComponent),
    DataObjectLinkComponent,
    ObjectSiteReferenceComponent,
    BibliographicReferenceLinkComponent
  ],
  template: `
    <mat-card class="catalog-card mat-elevation-z3" [class.expanded-card]="expanded">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">inventory_2</mat-icon>
        <mat-card-title class="card-title">
          <span>{{ title }}</span>
          <span class="label-badge" *ngIf="headerBadge">{{ headerBadge }}</span>
        </mat-card-title>
        <mat-card-subtitle *ngIf="!expanded" class="subtitle-summary">
          <span class="summary-text">{{ oneLineDescription }}</span>
        </mat-card-subtitle>
        <div class="spacer"></div>
        <button mat-icon-button (click)="toggleExpand()" [matTooltip]="expanded ? 'Collapse to single line' : 'Expand detailed form'" type="button">
          <mat-icon>{{ expanded ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-card-header>

      <mat-card-content *ngIf="expanded" class="card-content-expanded">
        <mat-divider class="header-divider"></mat-divider>

        <div *ngIf="loading" class="loading-msg">Loading UI template...</div>

        <div class="properties-container" *ngIf="!loading">
          <!-- Subclass-specific properties slot (Projected) -->
          <ng-content></ng-content>

          <!-- 1. Array of BibliographicReferenceLink (dataset:bibliographicreferencelink) -->
          <div class="section-block" *ngIf="hasProperty('dataset:bibliographicreferencelink')">
            <div class="section-title">
              <mat-icon color="primary">menu_book</mat-icon>
              <h4>Bibliographic References</h4>
              <button mat-icon-button color="primary" (click)="addBibliographicReferenceLinkItem()" matTooltip="Add Bibliographic Reference" type="button" style="margin-left: 8px;">
                <mat-icon>add_circle</mat-icon>
              </button>
            </div>
            <div *ngFor="let item of getBibliographicReferenceLinkArray(); let i = index" class="bibliographic-reference-row" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; width: 100%;">
              <div style="flex: 1;">
                <app-bibliographic-reference-link
                  [structure]="getPropertyStructure('dataset:bibliographicreferencelink')"
                  [value]="item"
                  (valueChange)="updateBibliographicReferenceLinkItem(i, $event)">
                </app-bibliographic-reference-link>
              </div>
              <button mat-icon-button color="warn" (click)="removeBibliographicReferenceLinkItem(i)" matTooltip="Remove Bibliographic Reference" type="button" style="margin-top: 12px;">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div *ngIf="getBibliographicReferenceLinkArray().length === 0" class="no-links-text" style="color: #94a3b8; font-style: italic; font-size: 0.9rem; padding: 4px 0;">
              No bibliographic references assigned. Click the plus button above to add.
            </div>
          </div>

          <!-- 2. Array of ObjectSiteReference (foaf:page) -->
          <div class="section-block" *ngIf="hasProperty('foaf:page')">
            <div class="section-title">
              <mat-icon color="primary">link</mat-icon>
              <h4>Web References / Site Links</h4>
              <button mat-icon-button color="primary" (click)="addObjectSiteReferenceItem()" matTooltip="Add Web Reference" type="button" style="margin-left: 8px;">
                <mat-icon>add_circle</mat-icon>
              </button>
            </div>
            <div *ngFor="let item of getObjectSiteReferenceArray(); let i = index" class="site-reference-row" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; width: 100%;">
              <div style="flex: 1;">
                <app-object-site-reference
                  [structure]="getPropertyStructure('foaf:page')"
                  [value]="item"
                  (valueChange)="updateObjectSiteReferenceItem(i, $event)">
                </app-object-site-reference>
              </div>
              <button mat-icon-button color="warn" (click)="removeObjectSiteReferenceItem(i)" matTooltip="Remove Web Reference" type="button" style="margin-top: 12px;">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div *ngIf="getObjectSiteReferenceArray().length === 0" class="no-links-text" style="color: #94a3b8; font-style: italic; font-size: 0.9rem; padding: 4px 0;">
              No web references assigned. Click the plus button above to add.
            </div>
          </div>

          <!-- 3. Array of DataObjectLink (skos:mappingRelation) -->
          <div class="section-block" *ngIf="hasProperty('skos:mappingRelation')">
            <div class="section-title">
              <mat-icon color="primary">hub</mat-icon>
              <h4>Data Object Links</h4>
              <button mat-icon-button color="primary" (click)="addMappingRelationItem()" matTooltip="Add Data Object Link" type="button" style="margin-left: 8px;">
                <mat-icon>add_circle</mat-icon>
              </button>
            </div>
            <div *ngFor="let item of getMappingRelationArray(); let i = index" class="mapping-relation-row" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; width: 100%;">
              <div style="flex: 1;">
                <app-data-object-link
                  [structure]="getPropertyStructure('skos:mappingRelation')"
                  [value]="item"
                  (valueChange)="updateMappingRelationItem(i, $event)">
                </app-data-object-link>
              </div>
              <button mat-icon-button color="warn" (click)="removeMappingRelationItem(i)" matTooltip="Remove Data Object Link" type="button" style="margin-top: 12px;">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div *ngIf="getMappingRelationArray().length === 0" class="no-links-text" style="color: #94a3b8; font-style: italic; font-size: 0.9rem; padding: 4px 0;">
              No data object links assigned. Click the plus button above to add.
            </div>
          </div>

          <!-- 4. FirestoreCatalogIDForTransaction (dataset:firestorecatalog) -->
          <div class="section-block" *ngIf="hasProperty('dataset:firestorecatalog')">
            <div class="section-title">
              <mat-icon color="primary">receipt_long</mat-icon>
              <h4>Firestore Transaction Catalog ID</h4>
            </div>
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:firestorecatalog')"
              [value]="value?.['dataset:firestorecatalog']"
              (valueChange)="updateProperty('dataset:firestorecatalog', $event)">
            </app-dynamic-primitive>
          </div>

          <!-- 5. MinimumDatabaseObject component -->
          <div class="metadata-block">
            <mat-divider class="section-divider"></mat-divider>
            <app-minimum-database-object-structure
              [structure]="resolvedStructure!"
              [value]="value"
              (valueChange)="updateValue($event)">
            </app-minimum-database-object-structure>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .catalog-card {
      margin: 16px 0;
      border-left: 5px solid #3b82f6;
      background: #ffffff;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible;
    }
    .expanded-card {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      color: #1e293b;
    }
    .label-badge {
      font-size: 0.8rem;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 500;
      border: 1px solid #cbd5e1;
    }
    .subtitle-summary {
      margin-top: 4px;
      display: flex;
      align-items: center;
    }
    .summary-text {
      color: #64748b;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .spacer {
      flex: 1;
    }
    .card-content-expanded {
      padding: 0 8px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header-divider {
      margin-bottom: 8px;
    }
    .loading-msg {
      padding: 20px;
      color: #64748b;
      text-align: center;
    }
    .properties-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .section-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .section-title h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #475569;
      margin: 0;
    }
    .section-divider {
      margin: 8px 0;
    }
    :host {
      display: block;
      width: 100% !important;
    }
  `]
})
export class BaseMinimumDatabaseObjectStructureComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  protected override isLayoutComponent(): boolean {
    return true;
  }

  resolvedStructure?: OntologyStructure;
  loading = false;
  expanded = false;

  override ngOnInit(): void {
    super.ngOnInit();

    this.loading = true;
    this.ontologyService.getUITemplate('dataset:MinimumDatabaseObjectStructure').subscribe({
      next: (res) => {
        this.resolvedStructure = res['dataobject'];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[BaseMinimumDatabaseObjectStructureComponent] Failed loading ontology template', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.cdr.detectChanges();
  }

  get title(): string {
    if (this.resolvedStructure?.label) {
      return this.resolvedStructure.label;
    }
    return this.classname.split(':').pop() || this.classname;
  }

  get headerBadge(): string {
    if (this.classname.endsWith('DataSet')) {
      return 'DataSet';
    }
    if (this.classname.endsWith('Database')) {
      return 'Database';
    }
    return '';
  }

  get oneLineDescription(): string {
    if (!this.value) return 'not assigned';

    const shortDesc = this.value['dataset:shortdescription'] || 'not assigned';
    const endsWithDataset = this.classname.endsWith('DataSet') || this.classname.endsWith('Dataset');
    const isStagingOrBlock = this.classname === 'dataset:RepositoryFileStaging' ||
      this.classname === 'dataset:RepositoryParsedToFixedBlockSize' ||
      this.classname === 'dataset:RepositoryTherGasThermodynamicsBlock';

    if (endsWithDataset || isStagingOrBlock) {
      const uniqueLabel = this.value['dataset:uniquegenericname'] || this.value['dataset:dataset:uniquegenericname'] || '';
      return uniqueLabel ? `[${uniqueLabel}] ${shortDesc}` : shortDesc;
    }

    if (this.classname.endsWith('Database')) {
      const setLabel = this.value['dataset:datasetcollectionslabel'] || this.value['dataset:uniquegenericname'] || '';
      return setLabel ? `[${setLabel}] ${shortDesc}` : shortDesc;
    }

    return shortDesc;
  }

  hasProperty(key: string): boolean {
    return !!(this.resolvedStructure?.properties?.[key] || this.value?.[key]);
  }

  getPropertyStructure(key: string): OntologyStructure {
    if (this.resolvedStructure?.properties?.[key]) {
      return this.resolvedStructure.properties[key];
    }
    return {
      identifier: key,
      classname: 'dataset:OneLine',
      isOneLine: true,
      isObject: false,
      isArray: false,
      isClassification: false,
      isParagraph: false,
      isEmail: false,
      isURL: false,
      isBoolean: false,
      isKeywordSet: false,
      isFileSource: false
    };
  }

  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      this.updateValue({
        ...this.value,
        [key]: newValue
      });
      this.cdr.detectChanges();
    }
  }

  getMappingRelationArray(): any[] {
    const val = this.value?.['skos:mappingRelation'];
    if (!val) {
      return [];
    }
    if (Array.isArray(val)) {
      return val;
    }
    return [val];
  }

  updateMappingRelationItem(index: number, updatedItem: any): void {
    const currentList = this.getMappingRelationArray();
    const newList = [...currentList];
    newList[index] = updatedItem;
    this.updateProperty('skos:mappingRelation', newList);
  }

  addMappingRelationItem(): void {
    const newItem = {
      'qb:concept': 'Unassigned classification: dataset:DataTypeConcept',
      'dataset:catalogtype': 'not assigned',
      'dataset:catobjid': 'not assigned'
    };
    const currentList = this.getMappingRelationArray();
    this.updateProperty('skos:mappingRelation', [...currentList, newItem]);
  }

  removeMappingRelationItem(index: number): void {
    const currentList = this.getMappingRelationArray();
    const newList = [...currentList];
    newList.splice(index, 1);
    this.updateProperty('skos:mappingRelation', newList);
  }

  getObjectSiteReferenceArray(): any[] {
    const val = this.value?.['foaf:page'];
    if (!val) {
      return [];
    }
    if (Array.isArray(val)) {
      return val;
    }
    return [val];
  }

  updateObjectSiteReferenceItem(index: number, updatedItem: any): void {
    const currentList = this.getObjectSiteReferenceArray();
    const newList = [...currentList];
    newList[index] = updatedItem;
    this.updateProperty('foaf:page', newList);
  }

  addObjectSiteReferenceItem(): void {
    const newItem = {
      'dataset:HttpAddressSourceLocation': 'Unassigned classification: dataset',
      'dataset:HttpAddress': 'not assigned'
    };
    const currentList = this.getObjectSiteReferenceArray();
    this.updateProperty('foaf:page', [...currentList, newItem]);
  }

  removeObjectSiteReferenceItem(index: number): void {
    const currentList = this.getObjectSiteReferenceArray();
    const newList = [...currentList];
    newList.splice(index, 1);
    this.updateProperty('foaf:page', newList);
  }

  getBibliographicReferenceLinkArray(): any[] {
    const val = this.value?.['dataset:bibliographicreferencelink'];
    if (!val) {
      return [];
    }
    if (Array.isArray(val)) {
      return val;
    }
    return [val];
  }

  updateBibliographicReferenceLinkItem(index: number, updatedItem: any): void {
    const currentList = this.getBibliographicReferenceLinkArray();
    const newList = [...currentList];
    newList[index] = updatedItem;
    this.updateProperty('dataset:bibliographicreferencelink', newList);
  }

  addBibliographicReferenceLinkItem(): void {
    const newItem = {
      'datacite:PrimaryResourceIdentifier': 'not assigned',
      'dataset:referencestring': 'not assigned',
      'dataset:referencetitle': 'not assigned',
      'dc:creator': []
    };
    const currentList = this.getBibliographicReferenceLinkArray();
    this.updateProperty('dataset:bibliographicreferencelink', [...currentList, newItem]);
  }

  removeBibliographicReferenceLinkItem(index: number): void {
    const currentList = this.getBibliographicReferenceLinkArray();
    const newList = [...currentList];
    newList.splice(index, 1);
    this.updateProperty('dataset:bibliographicreferencelink', newList);
  }

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data || {};
  }
}
