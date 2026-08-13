import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { MechFileData, MechCoefficientRow, MechReactionClassGroup, MechReactionItem, NameCorrespondence } from '../../../models/task-list.models';

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

        <!-- Parsed Reaction Class Expandable Cards -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.reactionClasses && section.mechFileData.reactionClasses.length > 0">
          <div class="table-subtitle mb-2 mt-4">Reaction Classes ({{ section.mechFileData.reactionClasses.length }})</div>
          <div class="rxn-classes-list d-flex flex-column gap-3">
            <mat-card
              *ngFor="let classGroup of section.mechFileData.reactionClasses"
              class="rxn-class-subcard mat-elevation-z1">
              <mat-card-header
                class="rxn-class-card-header cursor-pointer select-none"
                (click)="classGroup.isExpanded = !classGroup.isExpanded">
                <mat-icon mat-card-avatar color="primary" class="rxn-class-icon">schema</mat-icon>
                <mat-card-title class="rxn-class-card-title">
                  <code>{{ classGroup.className }}</code>
                </mat-card-title>
                <mat-card-subtitle class="rxn-class-card-subtitle">
                  {{ classGroup.reactions.length }} reaction{{ classGroup.reactions.length === 1 ? '' : 's' }}
                </mat-card-subtitle>
                <div class="rxn-class-header-actions">
                  <button
                    mat-icon-button
                    (click)="$event.stopPropagation(); classGroup.isExpanded = !classGroup.isExpanded"
                    [matTooltip]="classGroup.isExpanded ? 'Collapse reactions' : 'Expand reactions'">
                    <mat-icon>{{ classGroup.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </button>
                </div>
              </mat-card-header>

              <mat-card-content *ngIf="classGroup.isExpanded" class="rxn-class-card-content pt-2">
                <div class="table-responsive-wrapper">
                  <table class="electronic-properties-table rxn-items-table w-100">
                    <thead>
                      <tr>
                        <th class="table-header-cell text-center" style="width: 120px;">Multiplicity</th>
                        <th class="table-header-cell">Reaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let rxn of classGroup.reactions">
                        <td class="table-body-cell text-center font-mono font-bold">{{ rxn.multiplicity }}</td>
                        <td
                          class="table-body-cell font-mono reaction-eq-cell"
                          [matTooltip]="rxn.convertedEquation ? 'Converted: ' + rxn.convertedEquation : ''"
                          matTooltipPosition="above">
                          <code>{{ rxn.equation }}</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </ng-container>

        <!-- Fallback Raw Reaction Classes Text Block -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.reactionClassesText && (!section.mechFileData.reactionClasses || section.mechFileData.reactionClasses.length === 0)">
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
  styles: [`
    :host { display: block; width: 100%; }
    .rxn-class-subcard {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background-color: #ffffff;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }
    .rxn-class-subcard:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .rxn-class-card-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .rxn-class-card-header:hover {
      background-color: #f1f5f9;
    }
    .rxn-class-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .rxn-class-card-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }
    .rxn-class-header-actions {
      margin-left: auto;
    }
    .rxn-class-icon {
      margin-right: 12px;
    }
    .rxn-items-table {
      margin: 0;
      border-collapse: collapse;
      background-color: #ffffff;
    }
    .rxn-items-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }
    .rxn-items-table th, .rxn-items-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .reaction-eq-cell {
      cursor: help;
    }
    .rxn-items-table tr:last-child td {
      border-bottom: none;
    }
    .cursor-pointer { cursor: pointer; }
    .select-none { user-select: none; }
    .font-bold { font-weight: bold; }
  `]
})
export class MechReactionsCardComponent extends BaseSectionCardComponent {
  public readonly headerGroupColumns: string[] = ['header-rxn-class', 'header-fwd-group', 'header-rev-group'];
  public readonly subHeaderColumns: string[] = ['fwdA', 'fwdN', 'fwdEa', 'revA', 'revN', 'revEa'];
  public readonly displayedColumns: string[] = ['rxnClass', 'fwdA', 'fwdN', 'fwdEa', 'revA', 'revN', 'revEa'];

  public static convertEquation(equation: string, correspondences: NameCorrespondence[]): string {
    if (!equation || !correspondences || correspondences.length === 0) {
      return equation;
    }

    const map = new Map<string, string>();
    for (const c of correspondences) {
      map.set(c.longName.toLowerCase(), c.shortName);
      map.set(c.shortName.toLowerCase(), c.longName);
    }

    // Split and convert individual molecule tokens
    return equation.replace(/[\w\-.]+/g, (match) => {
      const lower = match.toLowerCase();
      if (map.has(lower)) {
        return map.get(lower)!;
      }
      return match;
    });
  }

  public static parseMechFileContent(content: string, correspondences?: NameCorrespondence[]): MechFileData {
    const coefficients: MechCoefficientRow[] = [];
    const reactionClasses: MechReactionClassGroup[] = [];
    let classEquivalentsText = '';
    let reactionClassesText = '';

    if (!content) {
      return { coefficients, classEquivalentsText, reactionClassesText, reactionClasses };
    }

    const lines = content.split(/\r?\n/);
    let currentMode: 'NONE' | 'COEFFS' | 'EQUIV' | 'RXNCLASS' = 'NONE';
    const equivLines: string[] = [];
    const rxnClassLines: string[] = [];
    let currentGroup: MechReactionClassGroup | null = null;

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

        let className = 'Reaction Class';
        if (trimmed.includes('=')) {
          className = trimmed.split('=')[1].trim();
        }
        currentGroup = {
          className: className,
          reactions: [],
          isExpanded: false
        };
        reactionClasses.push(currentGroup);
        continue;
      } else if (trimmed === 'END') {
        if (currentMode === 'EQUIV') {
          equivLines.push(line);
        } else if (currentMode === 'RXNCLASS') {
          rxnClassLines.push(line);
          currentGroup = null;
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
        if (currentGroup) {
          const match = trimmed.match(/^\s*(\d+)\s+(.+)$/);
          if (match) {
            const mult = match[1];
            const rawEq = match[2];
            const cleanEq = rawEq.replace(/[{}]/g, '');
            const convertedEq = correspondences ? MechReactionsCardComponent.convertEquation(cleanEq, correspondences) : undefined;
            currentGroup.reactions.push({
              multiplicity: mult,
              equation: cleanEq,
              convertedEquation: convertedEq
            });
          } else {
            const cleanEq = trimmed.replace(/[{}]/g, '');
            const convertedEq = correspondences ? MechReactionsCardComponent.convertEquation(cleanEq, correspondences) : undefined;
            currentGroup.reactions.push({
              multiplicity: '1',
              equation: cleanEq,
              convertedEquation: convertedEq
            });
          }
        }
      }
    }

    const nonHeaderEquivLines = equivLines.filter(l => {
      const t = l.trim();
      return t.length > 0 && t !== 'CLASSEQUIVALENT' && t !== 'END';
    });
    classEquivalentsText = nonHeaderEquivLines.length > 0 ? equivLines.join('\n').trim() : '';
    reactionClassesText = rxnClassLines.join('\n').trim();

    return { coefficients, classEquivalentsText, reactionClassesText, reactionClasses, correspondences };
  }
}
