import { Directive, Input, Output, EventEmitter } from '@angular/core';
import { CatalogItem } from '../../../services/react-cloud-api.service';
import { MoleculeSection } from '../../../models/task-list.models';

@Directive()
export abstract class BaseCatalogDetailComponent {
  @Input({ required: true }) item!: CatalogItem;
  @Input() rawOutput: string | null = null;
  @Input() sections: MoleculeSection[] = [];

  @Output() toggleAll = new EventEmitter<boolean>();
  @Output() copyOutput = new EventEmitter<string>();
  @Output() backToList = new EventEmitter<void>();

  public onToggleAll(expand: boolean): void {
    this.sections.forEach(sec => sec.isExpanded = expand);
    this.toggleAll.emit(expand);
  }

  public onCopyOutput(): void {
    if (this.rawOutput) {
      this.copyOutput.emit(this.rawOutput);
    }
  }

  public onBackToList(): void {
    this.backToList.emit();
  }
}
