import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { BensonGroupRow, BensonGroupTableData } from '../../../models/task-list.models';

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
        <ng-container *ngIf="tableData && tableData.rows && tableData.rows.length > 0">
          <div class="benson-meta-header mb-3" *ngIf="tableData.tableName">
            <div class="benson-meta-item">
              <span class="benson-meta-label">Table:</span>
              <span class="benson-meta-value">{{ tableData.tableName }}</span>
            </div>
            <div class="benson-meta-item" *ngIf="tableData.reference">
              <span class="benson-meta-label">Reference:</span>
              <span class="benson-meta-value">{{ tableData.reference }}</span>
            </div>
            <div class="benson-meta-item" *ngIf="tableData.pattern">
              <span class="benson-meta-label">Pattern:</span>
              <span class="benson-meta-value"><code>{{ tableData.pattern }}</code></span>
            </div>
          </div>

          <div class="table-responsive mb-3">
            <table mat-table [dataSource]="tableData.rows" class="custom-mat-table benson-group-table mat-elevation-z2">
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

        <!-- Fallback Raw Code Block -->
        <ng-container *ngIf="!tableData || !tableData.rows || tableData.rows.length === 0">
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class BensonGroupCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['name', 'heatOfFormation', 'entropy', 'cp300', 'cp400', 'cp500', 'cp600', 'cp800', 'cp1000', 'cp1500'];

  public get tableData(): BensonGroupTableData | undefined {
    if (this.section?.bensonGroupTableData) {
      return this.section.bensonGroupTableData;
    }
    if (this.section?.content) {
      return BensonGroupCardComponent.parseBensonGroupTable(this.section.content);
    }
    return undefined;
  }

  public static parseBensonGroupTable(content: string): BensonGroupTableData | undefined {
    if (!content) return undefined;

    let cleanContent = content;
    if (cleanContent.includes('--- Output File')) {
      cleanContent = cleanContent.replace(/^[\s\S]*?--- Output File \([^)]+\) ---\r?\n?/, '');
    }

    const lines = cleanContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) return undefined;

    const tableName = lines[0];
    const reference = lines[1];
    const pattern = lines[2];

    const rows: BensonGroupRow[] = [];
    let currentGroup: Partial<BensonGroupRow> | null = null;

    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];

      if (line.endsWith('<>')) {
        const groupName = line.replace(/<>\s*$/, '').trim();
        currentGroup = {
          name: groupName,
          heatOfFormation: '-',
          entropy: '-',
          cp300: '-',
          cp400: '-',
          cp500: '-',
          cp600: '-',
          cp800: '-',
          cp1000: '-',
          cp1500: '-'
        };
      } else if (currentGroup && line.includes('<HeatOfFormation>')) {
        const match = line.match(/<HeatOfFormation>\s*([\d\.\-]+)\s*<\/HeatOfFormation>/i);
        if (match) {
          currentGroup.heatOfFormation = match[1];
        }
      } else if (currentGroup && line.includes('<Entropy>')) {
        const match = line.match(/<Entropy>\s*([\d\.\-]+)\s*<\/Entropy>/i);
        if (match) {
          currentGroup.entropy = match[1];
        }
      } else if (currentGroup && line.includes('<Cp>')) {
        if (i + 1 < lines.length) {
          const cpLine = lines[i + 1];
          const tokens = cpLine.split(/\s+/).filter(t => t.length > 0 && !isNaN(parseFloat(t)));
          if (tokens.length >= 7) {
            currentGroup.cp300 = tokens[0];
            currentGroup.cp400 = tokens[1];
            currentGroup.cp500 = tokens[2];
            currentGroup.cp600 = tokens[3];
            currentGroup.cp800 = tokens[4];
            currentGroup.cp1000 = tokens[5];
            currentGroup.cp1500 = tokens[6];
          }
          i++;
        }
      } else if (line.includes('</>')) {
        if (currentGroup && currentGroup.name) {
          rows.push(currentGroup as BensonGroupRow);
        }
        currentGroup = null;
      }
    }

    if (rows.length === 0) {
      return undefined;
    }

    return {
      tableName,
      reference,
      pattern,
      rows
    };
  }
}
