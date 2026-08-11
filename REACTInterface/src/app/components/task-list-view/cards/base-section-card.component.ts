import { Directive, Input, Output, EventEmitter } from '@angular/core';
import { MoleculeSection } from '../../../models/task-list.models';

@Directive()
export abstract class BaseSectionCardComponent {
  @Input({ required: true }) section!: MoleculeSection;
  @Output() toggle = new EventEmitter<MoleculeSection>();
  @Output() copy = new EventEmitter<MoleculeSection>();

  public onToggle(): void {
    this.section.isExpanded = !this.section.isExpanded;
    this.toggle.emit(this.section);
  }

  public onCopy(): void {
    this.copy.emit(this.section);
  }
}
