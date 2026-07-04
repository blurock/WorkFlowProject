import { Component, OnInit, inject, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure, CatalogObjectNavigationService } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { CollectionDocumentIDPairAddressComponent } from '../collection-document-id-pair-address/collection-document-id-pair-address';
import { forwardRef } from '@angular/core';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';

// main firestore catalog id component
@Component({
  selector: 'app-firestore-catalog-id',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    CollectionDocumentIDPairAddressComponent,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  templateUrl: './firestore-catalog-id.html',
  styleUrl: './firestore-catalog-id.css'
})
export class FirestoreCatalogIDComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  private navService = inject(CatalogObjectNavigationService);

  isExpanded = false;
  showFullDetails = false;
  loading = false;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.structure || !this.structure.properties) {
      this.loading = true;
      this.ontologyService.getUITemplate('dataset:FirestoreCatalogID').subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[FirestoreCatalogIDComponent] Failed to load UI template', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleExpand(event: Event) {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }

  toggleDetails(event: Event) {
    event.stopPropagation();
    this.showFullDetails = !this.showFullDetails;
    if (this.showFullDetails) {
      this.isExpanded = true;
    }
    this.cdr.detectChanges();
  }

  get rdfsLabel(): string {
    return this.structure?.label || 'Firestore Catalog ID';
  }

  get rdfsComment(): string {
    return this.structure?.comment || 'The catalog ID associated with the Google Firestore database.';
  }

  get simpleCatalogName(): string {
    return this.value?.['qb:DataSet'] || 'not assigned';
  }

  isFullWidthKey(key: string): boolean {
    const struct = this.getPropertyStructure(key);
    if (!struct) return false;
    return key === 'dataset:firestorecatalog' ||
      key === 'dataset:transactionforobject' ||
      struct.classname === 'dataset:FirestoreCatalogID' ||
      struct.classname === 'dataset:CollectionDocumentIDPairAddress' ||
      (!!struct.classname && (struct.classname.endsWith('CatalogID') || struct.classname.includes('CatalogID')));
  }

  get firestorePath(): string {
    const address = this.value?.['dataset:addressidpairs'];
    if (!address) return '';
    const pairs = address['dataset:collectiondocpair'];
    if (!Array.isArray(pairs)) return '';

    // Sort pairs by level to construct hierarchical address
    const sortedPairs = [...pairs].sort((a, b) => {
      const levelA = parseInt(a['dataset:idlevel']) || 0;
      const levelB = parseInt(b['dataset:idlevel']) || 0;
      return levelA - levelB;
    });

    const segments = sortedPairs.map(p => {
      const coll = p['dataset:collectionid'];
      const docId = p['dataset:documentid'];
      if (coll && docId && coll !== 'not assigned' && docId !== 'not assigned') {
        return `${coll}/${docId}`;
      }
      return '';
    }).filter(s => s !== '');

    if (segments.length === 0) return '';

    let path = '/' + segments.join('/');

    // Append skos:inScheme and qb:DataSet if present and assigned
    const scheme = this.value?.['skos:inScheme'];
    const dataset = this.value?.['qb:DataSet'];

    if (scheme && scheme !== 'not assigned') {
      path += '/' + scheme;
    }
    if (dataset && dataset !== 'not assigned') {
      path += '/' + dataset;
    }

    return path;
  }

  onFetchObject(event: Event) {
    event.stopPropagation();
    const path = this.firestorePath;
    if (path) {
      this.navService.navigateToPath(path);
    }
  }

  override getPropertyStructure(key: string): OntologyStructure {
    if (this.structure?.properties?.[key]) {
      return this.structure.properties[key];
    }
    return {
      identifier: key,
      classname: 'dataset:OneLine',
      isOneLine: true,
      isObject: false,
      isArray: false
    } as OntologyStructure;
  }

  override get propertyKeys(): string[] {
    const keys = super.propertyKeys;
    const exclude = [
      'dataset:addressidpairs',
      'skos:inScheme',
      'qb:DataSet',
      'dataset:objectype'
    ];
    return keys.filter(k => !exclude.includes(k));
  }

  getData() {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
    this.cdr.detectChanges();
  }
}
