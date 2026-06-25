import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent } from '../../primitives/base-primitive';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-collection-document-id-pair-address',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  template: `
    <div class="address-matrix-container" *ngIf="pairs && pairs.length > 0">
      <table mat-table [dataSource]="pairs" class="mat-elevation-z1 address-table">
        <!-- DatasetLabel Column -->
        <ng-container matColumnDef="datasetLabel">
          <th mat-header-cell *matHeaderCellDef class="table-header">DatasetLabel</th>
          <td mat-cell *matCellDef="let element" class="table-cell label-cell">
            {{ element['dataset:idlevel'] }}
          </td>
        </ng-container>

        <!-- DatasetCollectionID Column -->
        <ng-container matColumnDef="datasetCollectionID">
          <th mat-header-cell *matHeaderCellDef class="table-header">DatasetCollectionID</th>
          <td mat-cell *matCellDef="let element" class="table-cell collection-cell">
            {{ element['dataset:collectionid'] }}
          </td>
        </ng-container>

        <!-- DatasetDocumentID Column -->
        <ng-container matColumnDef="datasetDocumentID">
          <th mat-header-cell *matHeaderCellDef class="table-header">DatasetDocumentID</th>
          <td mat-cell *matCellDef="let element" class="table-cell doc-cell">
            {{ element['dataset:documentid'] }}
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
    <div *ngIf="!pairs || pairs.length === 0" class="no-pairs-msg">
      No collection document ID pairs assigned.
    </div>
  `,
  styles: [`
    .address-matrix-container {
      width: 100%;
      margin: 8px 0;
      overflow-x: auto;
    }
    .address-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 6px;
      overflow: hidden;
    }
    .table-header {
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #475569;
      background-color: #f1f5f9;
      letter-spacing: 0.05em;
      padding: 12px 16px;
    }
    .table-cell {
      font-size: 0.85rem;
      color: #334155;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .label-cell {
      font-weight: 600;
      color: #0f172a;
    }
    .collection-cell {
      font-family: monospace;
      color: #2563eb;
    }
    .doc-cell {
      font-family: monospace;
      color: #0369a1;
    }
    .no-pairs-msg {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
      padding: 8px 0;
    }
  `]
})
export class CollectionDocumentIDPairAddressComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  displayedColumns: string[] = ['datasetLabel', 'datasetCollectionID', 'datasetDocumentID'];
  pairs: any[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    this.extractPairs();
  }

  override set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.extractPairs();
    }
  }

  override get value() {
    return this._value;
  }

  private extractPairs() {
    const rawPairs = this.value?.['dataset:collectiondocpair'];
    if (Array.isArray(rawPairs)) {
      // Sort ascending by level
      this.pairs = [...rawPairs].sort((a, b) => {
        const valA = parseInt(a['dataset:idlevel']) || 0;
        const valB = parseInt(b['dataset:idlevel']) || 0;
        return valA - valB;
      });
    } else {
      this.pairs = [];
    }
    this.cdr.detectChanges();
  }

  getData() {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
  }
}
