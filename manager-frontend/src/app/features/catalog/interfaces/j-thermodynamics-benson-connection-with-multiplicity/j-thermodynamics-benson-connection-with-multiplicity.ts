import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent } from '../../primitives/base-primitive';

@Component({
  selector: 'app-j-thermodynamics-benson-connection-with-multiplicity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="matrix-container">
      <div class="matrix-header">
        <span class="matrix-title">Benson Connecting Atoms</span>
        <button mat-flat-button color="primary" class="add-btn" (click)="addRow()" type="button" matTooltip="Add connection to Benson rule">
          <mat-icon>add</mat-icon> Add Connection
        </button>
      </div>
      
      <div class="table-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Connecting Atom</th>
              <th>Multiplicity</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let connection of connections; let i = index" class="matrix-row">
              <td>
                <input 
                  type="text" 
                  class="cell-input" 
                  [(ngModel)]="connection['dataset:bensonconnectingatom']" 
                  (ngModelChange)="onCellChange()"
                  placeholder="e.g., C, H, O, N"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  class="cell-input" 
                  [(ngModel)]="connection['dataset:bensonmultiplicity']" 
                  (ngModelChange)="onCellChange()"
                  placeholder="e.g., 1, 2, 3"
                />
              </td>
              <td class="actions-col">
                <button mat-icon-button color="warn" (click)="deleteRow(i)" type="button" matTooltip="Remove this connection">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="connections.length === 0">
              <td colspan="3" class="empty-matrix-msg">
                No connections defined. Click "Add Connection" to start.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .matrix-container {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .matrix-title {
      font-weight: 600;
      color: #334155;
      font-size: 0.95rem;
    }
    .add-btn {
      font-size: 0.85rem;
      border-radius: 6px;
      padding: 0 12px;
      background-color: #3b82f6 !important;
      color: #ffffff !important;
    }
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .matrix-table th {
      padding: 10px 14px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #e2e8f0;
    }
    .matrix-table td {
      padding: 8px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .matrix-row {
      transition: background-color 0.2s ease;
    }
    .matrix-row:hover {
      background-color: #f8fafc;
    }
    .cell-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #1e293b;
      background-color: #fff;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .cell-input:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .actions-col {
      width: 50px;
      text-align: center;
      padding: 4px !important;
    }
    .empty-matrix-msg {
      text-align: center;
      color: #64748b;
      font-style: italic;
      font-size: 0.85rem;
      padding: 24px !important;
    }
    :host {
      display: block;
      width: 100% !important;
    }
  `]
})
export class JThermodynamicsBensonConnectionWithMultiplicityComponent extends BasePrimitiveComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  connections: any[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    this.extractConnections();
  }

  override get value(): any {
    return this._value;
  }

  override set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.extractConnections();
    }
  }

  private extractConnections(): void {
    if (Array.isArray(this.value)) {
      this.connections = this.value;
    } else {
      this.connections = [];
      this._value = this.connections;
    }
    this.cdr.detectChanges();
  }

  addRow(): void {
    this.connections.push({
      'dataset:bensonconnectingatom': '',
      'dataset:bensonmultiplicity': '1',
      '<http://purl.org/dc/elements/1.1/identifier>': 'dataset:connectmult'
    });
    this.onCellChange();
  }

  deleteRow(index: number): void {
    this.connections.splice(index, 1);
    this.onCellChange();
  }

  onCellChange(): void {
    this.updateValue(this.connections);
    this.cdr.detectChanges();
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || [];
  }
}
