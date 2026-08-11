import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';

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
        <div class="table-responsive-wrapper mb-3" *ngIf="section.chargeTableData && section.chargeTableData.length > 0">
          <table mat-table [dataSource]="section.chargeTableData" class="electronic-properties-table mat-elevation-z1">
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
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class AtomicRadiiCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['atomIndex', 'radius', 'electronegativity', 'screening', 'effectiveCharge', 'residualCharge', 'beta'];
}
