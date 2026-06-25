import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../primitives/base-primitive';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DynamicPrimitiveComponent } from '../primitives/dynamic-primitive/dynamic-primitive';
import { MinimumDatabaseObjectStructureComponent } from './minimum-database-object/minimum-database-object';
import { SimpleCatalogObjectComponent } from './simple-catalog-object/simple-catalog-object';
import { OntologyService } from '../../../core/services/ontology.service';

@Component({
  selector: 'app-base-catalog-object',
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
    SimpleCatalogObjectComponent
  ],
  template: `
    <mat-card class="catalog-card mat-elevation-z3" [class.expanded-card]="expanded" [class.transaction-card]="isTransaction">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">{{ isTransaction ? 'account_balance_wallet' : 'inventory_2' }}</mat-icon>
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
          <!-- 1. Array of BibliographicReferenceLink (dcterms:BibliographicResource) -->
          <div class="section-block" *ngIf="hasProperty('dcterms:BibliographicResource')">
            <div class="section-title">
              <mat-icon color="primary">menu_book</mat-icon>
              <h4>Bibliographic References</h4>
            </div>
            <app-dynamic-primitive
              [structure]="getPropertyStructure('dcterms:BibliographicResource')"
              [value]="value?.['dcterms:BibliographicResource']"
              (valueChange)="updateProperty('dcterms:BibliographicResource', $event)">
            </app-dynamic-primitive>
          </div>

          <!-- 2. Array of ObjectSiteReference (foaf:page) -->
          <div class="section-block" *ngIf="hasProperty('foaf:page')">
            <div class="section-title">
              <mat-icon color="primary">link</mat-icon>
              <h4>Web References / Site Links</h4>
            </div>
            <app-dynamic-primitive
              [structure]="getPropertyStructure('foaf:page')"
              [value]="value?.['foaf:page']"
              (valueChange)="updateProperty('foaf:page', $event)">
            </app-dynamic-primitive>
          </div>

          <!-- 3. Array of DataObjectLink (skos:mappingRelation) -->
          <div class="section-block" *ngIf="hasProperty('skos:mappingRelation')">
            <div class="section-title">
              <mat-icon color="primary">hub</mat-icon>
              <h4>Data Object Links</h4>
            </div>
            <app-dynamic-primitive
              [structure]="getPropertyStructure('skos:mappingRelation')"
              [value]="value?.['skos:mappingRelation']"
              (valueChange)="updateProperty('skos:mappingRelation', $event)">
            </app-dynamic-primitive>
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

          <!-- 5. Specific properties of the subclass (excluding common metadata) -->
          <div class="section-block" *ngIf="specificKeys.length > 0">
            <div class="section-title">
              <mat-icon color="accent">tune</mat-icon>
              <h4>Specific Properties</h4>
            </div>
            <div class="specific-props-grid">
              <div *ngFor="let key of specificKeys" class="prop-row">
                <app-dynamic-primitive
                  [structure]="getPropertyStructure(key)"
                  [value]="value ? value[key] : null"
                  (valueChange)="updateProperty(key, $event)">
                </app-dynamic-primitive>
              </div>
            </div>
          </div>

          <!-- 6. Metadata / Base Catalog Object -->
          <div class="metadata-block">
            <mat-divider class="section-divider"></mat-divider>
            <div class="section-title">
              <mat-icon color="primary">dns</mat-icon>
              <h4>Catalog Metadata</h4>
            </div>
            <ng-container *ngIf="!isTransaction; else transactionMetadata">
              <app-minimum-database-object-structure
                [value]="value"
                (valueChange)="updateValue($event)">
              </app-minimum-database-object-structure>
            </ng-container>
            <ng-template #transactionMetadata>
              <app-simple-catalog-object
                [value]="value"
                (valueChange)="updateValue($event)">
              </app-simple-catalog-object>
            </ng-template>
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
    .transaction-card {
      border-left-color: #6366f1;
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
    .specific-props-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .prop-row {
      width: 100%;
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
export class BaseCatalogObjectComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  protected override isLayoutComponent(): boolean {
    return true;
  }

  @Input() isTransaction = false;

  resolvedStructure?: OntologyStructure;
  loading = false;
  expanded = false;

  override ngOnInit(): void {
    super.ngOnInit();
    
    // Attempt loading the UI template from the ontology service if not present
    if (!this.structure || !this.structure.properties) {
      this.loading = true;
      this.ontologyService.getUITemplate(this.classname).subscribe({
        next: (res) => {
          this.resolvedStructure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[BaseCatalogObjectComponent] Failed loading ontology template', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.resolvedStructure = this.structure;
    }
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
    if (this.isTransaction) {
      return 'Transaction';
    }
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

    if (this.isTransaction) {
      // Transaction format: TransactionEventType, ShortDescription, and TransactionKey
      const eventType = this.value['prov:activity'] || 'Unknown Event';
      const shortDesc = this.value['dataset:activityinfo']?.['dataset:descrfilestaging']?.['dataset:titlestaging'] || 
                        this.value['dataset:shortdescription'] || 
                        '';
      const transKey = this.value['dataset:catalogkey'] || this.value['transaction'] || '';
      return `[${eventType.split(':').pop() || eventType}] ${shortDesc} (${transKey})`;
    } else {
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
  }

  hasProperty(key: string): boolean {
    return !!(this.resolvedStructure?.properties?.[key] || this.value?.[key]);
  }

  getPropertyStructure(key: string): OntologyStructure {
    if (this.resolvedStructure?.properties?.[key]) {
      return this.resolvedStructure.properties[key];
    }
    // Fallback template
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

  get specificKeys(): string[] {
    const metaKeys = [
      'dcterms:BibliographicResource',
      'dataset:bibliographicreferencelink',
      'foaf:page',
      'skos:mappingRelation',
      'dataset:firestorecatalog',
      // properties handled by MDO / SCO component at bottom
      'dataset:shortdescription',
      'dataset:catobjid',
      'dataset:transactionid',
      'dataset:catalogkey',
      'dcterms:creator',
      'dcterms:created',
      'dataset:objectype',
      'dataset:readaccess',
      'dataset:accessmodify',
      'transaction',
      'skos:inScheme',
      'dcterms:identifier'
    ];

    let allKeys: string[] = [];
    if (this.resolvedStructure?.properties) {
      allKeys = Object.keys(this.resolvedStructure.properties);
    } else if (this.value) {
      allKeys = Object.keys(this.value);
    }

    return allKeys.filter(key => !metaKeys.includes(key));
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

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data || {};
  }
}
