import { inject, OnInit, Component, ChangeDetectorRef } from '@angular/core';
import { BasePrimitiveComponent, OntologyStructure } from '../primitives/base-primitive';
import { OntologyService } from '../../../core/services/ontology.service';

@Component({
  template: ''
})
export abstract class BaseSubclassComponent extends BasePrimitiveComponent implements OnInit {
  protected ontologyService = inject(OntologyService);
  protected cdr = inject(ChangeDetectorRef);

  protected override isLayoutComponent(): boolean {
    return true;
  }


  specificSubclassKeys: string[] = [];
  loading = false;

  readonly MDO_KEYS = [
    'dcterms:BibliographicResource',
    'dataset:bibliographicreferencelink',
    'foaf:page',
    'skos:mappingRelation',
    'dataset:firestorecatalog',
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

  override ngOnInit(): void {
    super.ngOnInit();

    this.loading = true;
    this.ontologyService.getUITemplate(this.classname).subscribe({
      next: (res) => {
        this.structure = res['dataobject'];
        this.resolveSpecificKeys();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`[BaseSubclassComponent] Failed loading ontology template for ${this.classname}`, err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resolveSpecificKeys() {
    if (this.structure?.properties) {
      this.specificSubclassKeys = Object.keys(this.structure.properties).filter(
        key => !this.MDO_KEYS.includes(key)
      );
    }
  }


  updateProperty(key: string, newValue: any): void {
    if (this.value) {
      this.value[key] = newValue;
      this.updateValue(this.value);
      this.cdr.detectChanges();
    }
  }

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data || {};
    this.resolveSpecificKeys();
    this.cdr.detectChanges();
  }
}
