import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { MechFileData, MechCoefficientRow } from '../../../models/task-list.models';

@Component({
  selector: 'app-mech-reactions-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule],
  template: `
    <mat-card class="section-card" [class.collapsed]="!section.isExpanded">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">account_tree</mat-icon>
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
        <!-- Class Coefficients MatTable -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.coefficients && section.mechFileData.coefficients.length > 0">
          <div class="table-subtitle mb-2">Class Coefficients (Forward & Reverse)</div>
          <div class="table-responsive-wrapper mb-4">
            <table mat-table [dataSource]="section.mechFileData.coefficients" class="electronic-properties-table mech-coefficients-table mat-elevation-z1">
              
              <!-- Group Header Row Definition -->
              <ng-container matColumnDef="header-rxn-class">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell header-group-title text-center" [attr.rowspan]="2"> Reaction Class </th>
              </ng-container>

              <ng-container matColumnDef="header-fwd-group">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell header-group-fwd text-center" [attr.colspan]="3"> Forward </th>
              </ng-container>

              <ng-container matColumnDef="header-rev-group">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell header-group-rev text-center" [attr.colspan]="3"> Reverse </th>
              </ng-container>

              <!-- Column Definitions -->
              <ng-container matColumnDef="rxnClass">
                <!-- Spanned by header-rxn-class in Row 1 -->
                <td mat-cell *matCellDef="let row" class="table-body-cell group-name-cell">
                  <code>{{ row.rxnClass }}</code>
                </td>
              </ng-container>

              <ng-container matColumnDef="fwdA">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> A </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.fwdA }}</code> </td>
              </ng-container>

              <ng-container matColumnDef="fwdN">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> n </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.fwdN }}</code> </td>
              </ng-container>

              <ng-container matColumnDef="fwdEa">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> Ea </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.fwdEa }}</code> </td>
              </ng-container>

              <ng-container matColumnDef="revA">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> A </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.revA }}</code> </td>
              </ng-container>

              <ng-container matColumnDef="revN">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> n </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.revN }}</code> </td>
              </ng-container>

              <ng-container matColumnDef="revEa">
                <th mat-header-cell *matHeaderCellDef class="table-header-cell text-end"> Ea </th>
                <td mat-cell *matCellDef="let row" class="table-body-cell text-end font-mono"> <code>{{ row.revEa }}</code> </td>
              </ng-container>

              <!-- Header Rows -->
              <tr mat-header-row *matHeaderRowDef="headerGroupColumns"></tr>
              <tr mat-header-row *matHeaderRowDef="subHeaderColumns"></tr>

              <!-- Data Row -->
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </ng-container>

        <!-- Class Equivalents Text Block -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.classEquivalentsText">
          <div class="table-subtitle mb-1 mt-3">Class Equivalents (CLASSEQUIVALENT)</div>
          <pre class="section-code-block mb-3">{{ section.mechFileData.classEquivalentsText }}</pre>
        </ng-container>

        <!-- Reaction Classes Text Block -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.reactionClassesText">
          <div class="table-subtitle mb-1 mt-3">Reaction Classes (REACTIONCLASS)</div>
          <pre class="section-code-block">{{ section.mechFileData.reactionClassesText }}</pre>
        </ng-container>

        <!-- Fallback Raw Text Block -->
        <ng-container *ngIf="!section.mechFileData || (!section.mechFileData.coefficients?.length && !section.mechFileData.classEquivalentsText && !section.mechFileData.reactionClassesText)">
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class MechReactionsCardComponent extends BaseSectionCardComponent {
  public readonly headerGroupColumns: string[] = ['header-rxn-class', 'header-fwd-group', 'header-rev-group'];
  public readonly subHeaderColumns: string[] = ['fwdA', 'fwdN', 'fwdEa', 'revA', 'revN', 'revEa'];
  public readonly displayedColumns: string[] = ['rxnClass', 'fwdA', 'fwdN', 'fwdEa', 'revA', 'revN', 'revEa'];

  public static parseMechFileContent(content: string): MechFileData {
    const coefficients: MechCoefficientRow[] = [];
    let classEquivalentsText = '';
    let reactionClassesText = '';

    if (!content) {
      return { coefficients, classEquivalentsText, reactionClassesText };
    }

    const lines = content.split(/\r?\n/);
    let currentMode: 'NONE' | 'COEFFS' | 'EQUIV' | 'RXNCLASS' = 'NONE';
    const equivLines: string[] = [];
    const rxnClassLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('CLASSCOEFFICIENTS')) {
        currentMode = 'COEFFS';
        continue;
      } else if (trimmed.startsWith('CLASSEQUIVALENT')) {
        currentMode = 'EQUIV';
        equivLines.push(line);
        continue;
      } else if (trimmed.startsWith('REACTIONCLASS')) {
        currentMode = 'RXNCLASS';
        rxnClassLines.push(line);
        continue;
      } else if (trimmed === 'END') {
        if (currentMode === 'EQUIV') {
          equivLines.push(line);
        } else if (currentMode === 'RXNCLASS') {
          rxnClassLines.push(line);
        }
        if (currentMode !== 'RXNCLASS') {
          currentMode = 'NONE';
        }
        continue;
      }

      if (currentMode === 'COEFFS') {
        if (trimmed.includes('=')) {
          const parts = trimmed.split('=');
          if (parts.length === 2) {
            const rxnClass = parts[0].trim();
            const nums = parts[1].trim().split(/\s+/).filter(n => n.length > 0);
            if (nums.length >= 6) {
              coefficients.push({
                rxnClass: rxnClass,
                fwdA: nums[0],
                fwdN: nums[1],
                fwdEa: nums[2],
                revA: nums[3],
                revN: nums[4],
                revEa: nums[5]
              });
            }
          }
        }
      } else if (currentMode === 'EQUIV') {
        equivLines.push(line);
      } else if (currentMode === 'RXNCLASS') {
        rxnClassLines.push(line);
      }
    }

    classEquivalentsText = equivLines.join('\n').trim();
    reactionClassesText = rxnClassLines.join('\n').trim();

    return { coefficients, classEquivalentsText, reactionClassesText };
  }
}
