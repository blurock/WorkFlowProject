import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AtomCorrespondenceRow,
  BondChangeRow,
  CandidateProductAtom
} from '../../../services/atom-correspondence.service';

@Component({
  selector: 'app-atom-correspondence-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './atom-correspondence-table.component.html',
  styleUrls: ['./atom-correspondence-table.component.scss']
})
export class AtomCorrespondenceTableComponent {
  @Input() correspondenceRows: AtomCorrespondenceRow[] = [];
  @Input() bondChangeRows: BondChangeRow[] = [];
  @Input() showStoreButton: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() title: string = 'Reactant to Product Atom Mapping';
  @Input() storeButtonLabel: string = 'Store Change';

  @Output() correspondenceChange = new EventEmitter<AtomCorrespondenceRow[]>();
  @Output() storeChange = new EventEmitter<{
    correspondences: AtomCorrespondenceRow[];
    bondChanges: BondChangeRow[];
  }>();

  public readonly correspondenceColumns: string[] = ['reactantAtom', 'atomType', 'productAtomDropdown'];
  public readonly bondChangesColumns: string[] = ['molecule', 'atomX', 'atomY', 'changeType'];

  public get unmatchedAtomsCount(): number {
    return this.correspondenceRows.filter(r => r.productAtomNumber === null).length;
  }

  public onCorrespondenceSelectChange(): void {
    this.correspondenceChange.emit(this.correspondenceRows);
  }

  public onStore(): void {
    this.storeChange.emit({
      correspondences: this.correspondenceRows,
      bondChanges: this.bondChangeRows
    });
  }
}

