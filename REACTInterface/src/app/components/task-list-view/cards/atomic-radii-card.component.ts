import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { AtomChargeRow } from '../../../models/task-list.models';

@Component({
  selector: 'app-atomic-radii-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule],
  template: `
    <mat-card class="section-card" [class.collapsed]="!section.isExpanded">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">{{ section.icon }}</mat-icon>
        <mat-card-title class="section-card-title">{{ section.title }}</mat-card-title>
        <div class="section-header-actions">
          <button mat-icon-button (click)="onCopy()" matTooltip="Copy section content">
            <mat-icon>content_copy</mat-icon>
          </button>
          <button mat-icon-button (click)="onToggle()" [matTooltip]="section.isExpanded ? 'Collapse section' : 'Expand section'">
            <mat-icon>{{ section.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
      </mat-card-header>
      <mat-card-content *ngIf="section.isExpanded" class="section-card-content">
        <div class="table-responsive-wrapper mb-3" *ngIf="tableData && tableData.length > 0">
          <table mat-table [dataSource]="tableData" class="electronic-properties-table mat-elevation-z1">
            <ng-container matColumnDef="atomIndex">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Atom # </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono bold">
                <span class="atom-badge">#{{ row.atomIndex }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="radius">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Radius </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono"> <code>{{ row.radius }}</code> </td>
            </ng-container>
            <ng-container matColumnDef="electronegativity">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Electronegativity </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono"> <code>{{ row.electronegativity }}</code> </td>
            </ng-container>
            <ng-container matColumnDef="screening">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Screening Factor </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono"> <code>{{ row.screening }}</code> </td>
            </ng-container>
            <ng-container matColumnDef="effectiveCharge">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Effective Charge </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono"> <code>{{ row.effectiveCharge }}</code> </td>
            </ng-container>
            <ng-container matColumnDef="residualCharge">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Residual Charge </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono"> <code>{{ row.residualCharge }}</code> </td>
            </ng-container>
            <ng-container matColumnDef="beta">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Beta </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono"> <code>{{ row.beta }}</code> </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <ng-container *ngIf="!tableData || tableData.length === 0">
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class AtomicRadiiCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['atomIndex', 'radius', 'electronegativity', 'screening', 'effectiveCharge', 'residualCharge', 'beta'];

  public get tableData(): AtomChargeRow[] {
    if (this.section?.chargeTableData && this.section.chargeTableData.length > 0) {
      return this.section.chargeTableData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return AtomicRadiiCardComponent.parseChargeTable(lines);
    }
    return [];
  }

  public static parseChargeTable(lines: string[]): AtomChargeRow[] {
    const rows: AtomChargeRow[] = [];
    let atomIdx = 0;

    for (const line of lines) {
      if (!line.includes(':')) continue;
      const colonIdx = line.indexOf(':');
      const valStr = line.substring(colonIdx + 1).trim();
      const tokens = valStr.split(/\s+/).filter(t => t.length > 0);

      if (tokens.length >= 6 && !isNaN(parseFloat(tokens[0])) && !isNaN(parseFloat(tokens[1]))) {
        rows.push({
          atomIndex: atomIdx++,
          radius: tokens[0] || '0.000000',
          electronegativity: tokens[1] || '0.000000',
          screening: tokens[2] || '0.000000',
          effectiveCharge: tokens[3] || '0.000000',
          residualCharge: tokens[4] || '0.000000',
          beta: tokens[5] || '0.000000'
        });
      }
    }

    return rows;
  }
}
