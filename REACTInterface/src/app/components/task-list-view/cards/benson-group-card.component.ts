import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';

@Component({
  selector: 'app-benson-group-card',
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
        <ng-container *ngIf="section.bensonGroupTableData && section.bensonGroupTableData.rows && section.bensonGroupTableData.rows.length > 0">
          <div class="benson-meta-header mb-3" *ngIf="section.bensonGroupTableData.tableName">
            <div class="benson-meta-item">
              <span class="benson-meta-label">Table:</span>
              <span class="benson-meta-value">{{ section.bensonGroupTableData.tableName }}</span>
            </div>
            <div class="benson-meta-item" *ngIf="section.bensonGroupTableData.reference">
              <span class="benson-meta-label">Reference:</span>
              <span class="benson-meta-value">{{ section.bensonGroupTableData.reference }}</span>
            </div>
            <div class="benson-meta-item" *ngIf="section.bensonGroupTableData.pattern">
              <span class="benson-meta-label">Pattern:</span>
              <span class="benson-meta-value"><code>{{ section.bensonGroupTableData.pattern }}</code></span>
            </div>
          </div>

          <div class="table-responsive mb-3">
            <table mat-table [dataSource]="section.bensonGroupTableData.rows" class="custom-mat-table benson-group-table mat-elevation-z2">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell"> Benson Group Name </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell group-name-cell">
                  <code>{{ row.name }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="heatOfFormation">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> ΔH°f (kcal/mol) </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.heatOfFormation }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="entropy">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> S° (cal/mol·K) </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.entropy }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp300">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 300K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp300 }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp400">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 400K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp400 }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp500">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 500K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp500 }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp600">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 600K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp600 }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp800">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 800K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp800 }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp1000">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 1000K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp1000 }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="cp1500">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> 1500K </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end num-cell">
                  <code>{{ row.cp1500 }}</code>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class BensonGroupCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['name', 'heatOfFormation', 'entropy', 'cp300', 'cp400', 'cp500', 'cp600', 'cp800', 'cp1000', 'cp1500'];
}
