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

  resolvedStructure?: OntologyStructure;
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
        this.resolvedStructure = res['dataobject'];
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
    if (this.resolvedStructure?.properties) {
      this.specificSubclassKeys = Object.keys(this.resolvedStructure.properties).filter(
        key => !this.MDO_KEYS.includes(key)
      );
    }
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
