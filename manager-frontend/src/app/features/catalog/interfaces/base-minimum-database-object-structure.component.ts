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
    <div class="metadata-container">
      <!-- 1. Collapsed State -->
      <div class="one-line-summary-row" *ngIf="!expanded">
        <div class="one-line-summary-text">
          <mat-icon color="primary">inventory_2</mat-icon>
          <span class="one-line-summary-badge badge-blue" *ngIf="headerBadge">{{ headerBadge }}</span>
          <span class="one-line-summary-title">{{ title }}</span>
          <span class="one-line-summary-title" *ngIf="oneLineDescription && oneLineDescription !== 'not assigned'"> - {{ oneLineDescription }}</span>
          <span class="one-line-summary-placeholder" *ngIf="!oneLineDescription || oneLineDescription === 'not assigned'"> - not assigned</span>
        </div>
        <button mat-icon-button (click)="toggleExpand()" matTooltip="View details" type="button">
          <mat-icon>visibility</mat-icon>
        </button>
      </div>

      <!-- 2. Expanded State -->
      <div class="one-line-summary-card" *ngIf="expanded">
        <div class="one-line-summary-card-header">
          <div class="one-line-summary-card-title">
            <mat-icon color="primary">inventory_2</mat-icon>
            <span>{{ title }} Details</span>
            <span class="one-line-summary-badge badge-blue" *ngIf="headerBadge" style="margin-left: 8px;">{{ headerBadge }}</span>
          </div>
          <button mat-icon-button (click)="toggleExpand()" matTooltip="Collapse details" type="button">
            <mat-icon>visibility_off</mat-icon>
          </button>
        </div>

        <mat-divider style="margin-bottom: 12px;"></mat-divider>

        <div *ngIf="loading" class="loading-msg">Loading UI template...</div>

        <div class="properties-container metadata-section" *ngIf="!loading">
          <!-- Subclass-specific properties slot (Projected) -->
          <ng-content></ng-content>

          <!-- 1. Array of BibliographicReferenceLink (dataset:bibliographicreferencelink) -->
          <mat-card class="summary-section-card" *ngIf="hasProperty('dataset:bibliographicreferencelink')">
            <mat-card-header class="summary-section-card-header">
              <mat-icon color="primary">menu_book</mat-icon>
              <mat-card-title class="summary-section-card-title">Bibliographic References</mat-card-title>
              <div class="spacer"></div>
              <button mat-icon-button color="primary" (click)="addBibliographicReferenceLinkItem()" matTooltip="Add Bibliographic Reference" type="button">
                <mat-icon>add_circle</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content class="summary-section-card-content">
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
            </mat-card-content>
          </mat-card>

          <!-- 2. Array of ObjectSiteReference (foaf:page) -->
          <mat-card class="summary-section-card" *ngIf="hasProperty('foaf:page')">
            <mat-card-header class="summary-section-card-header">
              <mat-icon color="primary">link</mat-icon>
              <mat-card-title class="summary-section-card-title">Web References / Site Links</mat-card-title>
              <div class="spacer"></div>
              <button mat-icon-button color="primary" (click)="addObjectSiteReferenceItem()" matTooltip="Add Web Reference" type="button">
                <mat-icon>add_circle</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content class="summary-section-card-content">
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
            </mat-card-content>
          </mat-card>

          <!-- 3. Array of DataObjectLink (skos:mappingRelation) -->
          <mat-card class="summary-section-card" *ngIf="hasProperty('skos:mappingRelation')">
            <mat-card-header class="summary-section-card-header">
              <mat-icon color="primary">hub</mat-icon>
              <mat-card-title class="summary-section-card-title">Data Object Links</mat-card-title>
              <div class="spacer"></div>
              <button mat-icon-button color="primary" (click)="addMappingRelationItem()" matTooltip="Add Data Object Link" type="button">
                <mat-icon>add_circle</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content class="summary-section-card-content">
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
            </mat-card-content>
          </mat-card>

          <!-- 4. FirestoreCatalogID (dataset:firestorecatalog) 
          <div class="section-block" *ngIf="hasProperty('dataset:firestorecatalog')">
            <div class="section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <mat-icon color="primary" style="font-size: 20px; width: 20px; height: 20px;">receipt_long</mat-icon>
              <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #3730a3; text-transform: uppercase; letter-spacing: 0.05em;">Firestore Catalog ID</h4>
            </div>
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:firestorecatalog')"
              [value]="value?.['dataset:firestorecatalog']"
              (valueChange)="updateProperty('dataset:firestorecatalog', $event)">
            </app-dynamic-primitive>
          </div>
-->
          <!-- 4b. FirestoreCatalogIDForTransaction (dataset:transactionforobject) -->
          <div class="section-block" *ngIf="hasProperty('dataset:transactionforobject')">
            <div class="section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <mat-icon color="primary" style="font-size: 20px; width: 20px; height: 20px;">receipt_long</mat-icon>
              <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #3730a3; text-transform: uppercase; letter-spacing: 0.05em;">Firestore Transaction Catalog ID</h4>
            </div>
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dataset:transactionforobject')"
              [value]="value?.['dataset:transactionforobject']"
              (valueChange)="updateProperty('dataset:transactionforobject', $event)">
            </app-dynamic-primitive>
          </div>

          <!-- 5. MinimumDatabaseObject component -->
          <div class="metadata-block">
            <mat-divider class="section-divider" style="margin: 16px 0;"></mat-divider>
            <app-minimum-database-object-structure
              [structure]="structure!"
              [value]="value"
              (valueChange)="updateValue($event)">
            </app-minimum-database-object-structure>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1;
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
    :host {
      display: block;
      width: 100% !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    ::ng-deep .metadata-section .mat-mdc-form-field {
      margin-bottom: 0px !important;
    }
  `]
})
export class BaseMinimumDatabaseObjectStructureComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  protected override isLayoutComponent(): boolean {
    return true;
  }

  loading = false;
  expanded = false;

  override ngOnInit(): void {
    super.ngOnInit();

    this.loading = true;
    this.ontologyService.getUITemplate('dataset:ChemConnectDataStructure').subscribe({
      next: (res) => {
        this.structure = res['dataobject'];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ChemConnectDataStructure] Failed loading ontology template', err);
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
    if (this.structure?.label) {
      return this.structure.label;
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
    return !!(this.structure?.properties?.[key] || this.value?.[key]);
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
      'dataset:httpinformationtype': 'dataset:UniversityHomepage',
      'dataset:httpdescriptiontitle': 'Title of Object Site Reference',
      'dataset:HttpAddress': 'http://address/reference'
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
      'dataset:bibliographiclinktype': 'dataset:DataDOILink',
      'dataset:bibliographiclink': 'DOI, ISBN or URL for reference',
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
