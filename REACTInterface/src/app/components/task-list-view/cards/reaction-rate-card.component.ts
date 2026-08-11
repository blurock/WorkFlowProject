import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { ReactionRateRow } from '../../../models/task-list.models';

@Component({
  selector: 'app-reaction-rate-card',
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
        <div class="table-responsive-wrapper mb-3" *ngIf="reactionRates && reactionRates.length > 0">
          <table mat-table [dataSource]="reactionRates" class="electronic-properties-table mat-elevation-z1">
            <ng-container matColumnDef="direction">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Direction </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center">
                <span class="atom-badge" [class.positive-val]="row.direction === 'Forward'" [class.negative-val]="row.direction === 'Reverse'">{{ row.direction }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="aConstant">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> A </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.aConstant }}</code> </td>
            </ng-container>

            <ng-container matColumnDef="nExponent">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> n </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.nExponent }}</code> </td>
            </ng-container>

            <ng-container matColumnDef="energy">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> Ea </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.energy }}</code> </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell"> Type </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell"> <strong>{{ row.type }}</strong> </td>
            </ng-container>

            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell"> Reference </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell"> <span>{{ row.reference }}</span> </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <ng-container *ngIf="!reactionRates || reactionRates.length === 0">
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class ReactionRateCardComponent extends BaseSectionCardComponent {
  public readonly displayedColumns: string[] = ['direction', 'aConstant', 'nExponent', 'energy', 'type', 'reference'];

  public get reactionRates(): ReactionRateRow[] {
    if (this.section?.reactionRateData && this.section.reactionRateData.length > 0) {
      return this.section.reactionRateData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return ReactionRateCardComponent.parseReactionRateTable(lines);
    }
    return [];
  }

  public static parseReactionRateTable(lines: string[], defaultDirection: string = 'Forward'): ReactionRateRow[] {
    const rows: ReactionRateRow[] = [];
    let currentDirection = defaultDirection;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean.startsWith('%%%') || clean.startsWith('$$$$')) continue;

      if (clean.includes('ForwardRxn') || clean.includes('<ForwardRxn>')) {
        currentDirection = 'Forward';
        continue;
      } else if (clean.includes('ReverseRxn') || clean.includes('<ReverseRxn>')) {
        currentDirection = 'Reverse';
        continue;
      }

      if (clean.includes('Forward:') || clean.includes('Reverse:') || clean.includes('Standard') || /[-+]?\d+\.\d+(?:[eE][-+]?\d+)?/.test(clean)) {
        let dir = currentDirection;
        let text = clean;

        if (clean.includes('Forward:')) {
          dir = 'Forward';
          text = clean.substring(clean.indexOf('Forward:') + 'Forward:'.length).trim();
        } else if (clean.includes('Reverse:')) {
          dir = 'Reverse';
          text = clean.substring(clean.indexOf('Reverse:') + 'Reverse:'.length).trim();
        } else if (clean.startsWith(':')) {
          text = clean.substring(1).trim();
        }

        let typeVal = 'Standard';
        if (text.includes('Standard')) {
          typeVal = 'Standard';
          const stdIdx = text.indexOf('Standard');
          text = text.substring(stdIdx + 'Standard'.length).trim();
        }

        let refPart = '';
        if (text.includes(';')) {
          const semicolonIdx = text.indexOf(';');
          refPart = text.substring(semicolonIdx + 1).trim();
          text = text.substring(0, semicolonIdx).trim();
        }

        const tokens = text.split(/\s+/).filter(t => /^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(t));

        if (tokens.length >= 3) {
          const aVal = tokens[0];
          const nVal = tokens[1];
          const eaVal = tokens[2];

          const extraTokens = tokens.slice(3);
          if (extraTokens.length > 0 && !refPart) {
            refPart = extraTokens.join(' ');
          }

          rows.push({
            direction: dir,
            aConstant: aVal,
            nExponent: nVal,
            energy: eaVal,
            type: typeVal,
            reference: refPart || 'N/A'
          });
        }
      }
    }

    return rows;
  }
}
