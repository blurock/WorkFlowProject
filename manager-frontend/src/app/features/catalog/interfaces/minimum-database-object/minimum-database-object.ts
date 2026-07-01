import { Component, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatIconModule } from '@angular/material/icon';
import { forwardRef } from '@angular/core';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { SimpleCatalogObjectComponent } from '../simple-catalog-object/simple-catalog-object';

@Component({
  selector: 'app-minimum-database-object-structure',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    forwardRef(() => DynamicPrimitiveComponent),
    SimpleCatalogObjectComponent
  ],
  templateUrl: './minimum-database-object.html',
  styleUrl: './minimum-database-object.css'
})
export class MinimumDatabaseObjectStructureComponent extends BasePrimitiveComponent implements OnInit, OnChanges {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  protected override isLayoutComponent(): boolean {
    return true;
  }

  isExpanded = false;
  loading = false;


  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.structure || !this.structure.properties) {
      this.loading = true;
      this.ontologyService.getUITemplate('dataset:MinimumDatabaseObjectStructure').subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[MinimumDatabaseObjectStructureComponent] Failed to load UI template', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.structure = this.structure;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['structure']) {
      if (this.structure && this.structure.properties) {
        this.structure = this.structure;
        this.cdr.detectChanges();
      }
    }
  }

  toggleExpand(event: Event) {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }

  get shortDescription(): string {
    if (this.value) {
      return this.value['dataset:shortdescription'] || 'not assigned';
    }
    return 'not assigned';
  }

  readonly FILTERED_KEYS = [
    'dataset:catalogkey',
    'dcterms:creator',
    'dcterms:created',
    'dataset:objectype',
    'dataset:readaccess',
    'dataset:accessmodify',
    'transaction',
    'skos:inScheme',
    'dataset:bibliographicreferencelink',
    'foaf:page',
    'skos:mappingRelation',
    'dataset:firestorecatalog',
    'dataset:transactionforobject',
    'dcterms:identifier'
  ];

  override get propertyKeys(): string[] {
    if (this.structure?.properties) {
      return Object.keys(this.structure.properties).filter(
        key => !this.FILTERED_KEYS.includes(key)
      );
    }
    return [];
  }

  hasProperty(key: string): boolean {
    return !!(this.structure?.properties?.[key] || this.value?.[key]);
  }

  getBibliographicKey(): string {
    if (this.structure?.properties?.['dataset:bibliographicreferencelink'] || this.value?.['dataset:bibliographicreferencelink']) {
      return 'dataset:bibliographicreferencelink';
    }
    return 'dcterms:BibliographicResource';
  }

  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      this.value[key] = newValue;
      this.updateValue(this.value);
      this.cdr.detectChanges();
    }
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

  getData() {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
    this.cdr.detectChanges();
  }
}
