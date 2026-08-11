import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { AtomElectronicRow } from '../../../models/task-list.models';

@Component({
  selector: 'app-electronic-properties-card',
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
            <ng-container matColumnDef="atomicNumber">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Atomic # </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center">
                <strong>{{ row.atomicNumber }}</strong>
              </td>
            </ng-container>
            <ng-container matColumnDef="charge">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Net Charge </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono" [class.negative-val]="row.charge.startsWith('-')" [class.positive-val]="!row.charge.startsWith('-') && row.charge !== '0.000'">
                <code>{{ row.charge }}</code>
              </td>
            </ng-container>
            <ng-container matColumnDef="nElectrons">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> # of Electrons </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center font-mono">
                <code>{{ row.nElectrons }}</code>
              </td>
            </ng-container>
            <ng-container matColumnDef="shells">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell"> Occupied Shells </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell">
                <div class="shell-chips-container">
                  <span *ngFor="let shell of row.shells" class="shell-badge">{{ shell }}</span>
                </div>
              </td>
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
export class ElectronicPropertiesCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['atomIndex', 'atomicNumber', 'charge', 'nElectrons', 'shells'];

  public get tableData(): AtomElectronicRow[] {
    if (this.section?.electronicTableData && this.section.electronicTableData.length > 0) {
      return this.section.electronicTableData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return ElectronicPropertiesCardComponent.parseElectronicTable(lines);
    }
    return [];
  }

  public static parseElectronicTable(lines: string[]): AtomElectronicRow[] {
    const rows: AtomElectronicRow[] = [];
    let atomIdx = 0;

    for (const line of lines) {
      if (!line.includes(':')) continue;
      const parts = line.split(':');
      if (parts.length < 4) continue;

      const atomicStr = parts[1].trim();
      const chargeStr = parts[2].trim();
      const nElecStr = parts[3].trim();

      if (!/^\d+$/.test(atomicStr)) continue;

      const atomicNumber = parseInt(atomicStr, 10);
      const remainder = parts.slice(4).join(':').trim();
      const tokens = remainder.split(/\s+/).filter(t => t.length > 0);

      let nOccupied = 0;
      let shells: string[] = [];

      if (tokens.length > 0) {
        if (/^\d+$/.test(tokens[0])) {
          nOccupied = parseInt(tokens[0], 10);
          shells = tokens.slice(1);
        } else {
          const firstToken = tokens[0];
          nOccupied = parseInt(firstToken.charAt(0), 10);
          const firstShell = firstToken.substring(1);
          shells = [firstShell, ...tokens.slice(1)];
        }
      }

      rows.push({
        atomIndex: atomIdx++,
        atomicNumber: atomicNumber,
        charge: chargeStr,
        nElectrons: nElecStr,
        nOccupied: nOccupied,
        shells: shells
      });
    }

    return rows;
  }
}
