import { Component, OnInit } from '@angular/core';
import { BasePrimitiveComponent } from '../../primitives/base-primitive';
import { BaseCatalogObjectComponent } from '../base-catalog-object.component';

@Component({
  selector: 'app-dataset-collection-object-set-write-transaction',
  standalone: true,
  imports: [BaseCatalogObjectComponent],
  template: `
    <app-base-catalog-object
      [structure]="structure"
      [value]="value"
      [classname]="'dataset:DatasetCollectionObjectSetWriteTransaction'"
      [isTransaction]="true"
      (valueChange)="updateValue($event)">
    </app-base-catalog-object>
  `
})
export class DatasetCollectionObjectSetWriteTransactionComponent extends BasePrimitiveComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }

  override getData(): any {
    return this.value;
  }

  override setData(data: any): void {
    this.value = data;
  }
}
