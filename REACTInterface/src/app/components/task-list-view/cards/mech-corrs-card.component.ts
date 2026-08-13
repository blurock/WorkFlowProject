import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { NameCorrespondence } from '../../../models/task-list.models';

@Component({
  selector: 'app-mech-corrs-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule],
  template: `
    <mat-card class="section-card" [class.collapsed]="!section.isExpanded">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">badge</mat-icon>
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
        <!-- MatTable Correspondences Matrix -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.correspondences && section.mechFileData.correspondences.length > 0; else rawFallback">
          <div class="table-subtitle mb-2">Name Correspondences Matrix ({{ section.mechFileData.correspondences.length }} entries)</div>
          <div class="table-responsive-wrapper">
            <table mat-table [dataSource]="section.mechFileData.correspondences" class="electronic-properties-table corrs-matrix-table mat-elevation-z1">
              
              <!-- Long Name Column -->
              <ng-container matColumnDef="longName">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell"> Full / Descriptive Name </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell font-mono">
                  <code>{{ row.longName }}</code>
                </td>
              </ng-container>

              <!-- Short Name Column -->
              <ng-container matColumnDef="shortName">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell"> CHEMKIN / Short Name </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell font-mono font-bold">
                  <code>{{ row.shortName }}</code>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </ng-container>

        <!-- Fallback Raw Text Block -->
        <ng-template #rawFallback>
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [`
    :host { display: block; width: 100%; }
    .corrs-matrix-table {
      width: 100%;
      border-collapse: collapse;
    }
    .font-bold { font-weight: 600; }
  `]
})
export class MechCorrsCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['longName', 'shortName'];
}
