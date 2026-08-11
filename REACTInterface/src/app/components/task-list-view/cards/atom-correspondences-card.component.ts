import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { MatchedAtomRow, BondChangeRow } from '../../../models/task-list.models';

@Component({
  selector: 'app-atom-correspondences-card',
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
        <!-- Matched Atoms Correspondence Table -->
        <div class="table-subtitle mb-2" *ngIf="matchedAtoms && matchedAtoms.length > 0">
          Matched Atom Correspondences (MatTable)
        </div>
        <div class="table-responsive-wrapper mb-4" *ngIf="matchedAtoms && matchedAtoms.length > 0">
          <table mat-table [dataSource]="matchedAtoms" class="electronic-properties-table mat-elevation-z1">
            <ng-container matColumnDef="reactantMolecule">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Reactant Mol </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center"> <code>{{ row.reactantMolecule }}</code> </td>
            </ng-container>

            <ng-container matColumnDef="reactantIndex">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Reactant Atom Index </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center atom-idx-cell">
                <span class="atom-badge">#{{ row.reactantIndex }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="productMolecule">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Product Mol </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center"> <code>{{ row.productMolecule }}</code> </td>
            </ng-container>

            <ng-container matColumnDef="productIndex">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Product Atom Index </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center atom-idx-cell">
                <span class="atom-badge">#{{ row.productIndex }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="matchedAtomsColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: matchedAtomsColumns;"></tr>
          </table>
        </div>

        <!-- Bond Changes Table -->
        <div class="table-subtitle margin-top-sub mb-2" *ngIf="bondChanges && bondChanges.length > 0">
          Reaction Bond Changes
        </div>
        <div class="table-responsive-wrapper mb-3" *ngIf="bondChanges && bondChanges.length > 0">
          <table mat-table [dataSource]="bondChanges" class="electronic-properties-table mat-elevation-z1">
            <ng-container matColumnDef="reactantAtom1">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Reactant Atom 1 </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center atom-idx-cell">
                <span class="atom-badge" *ngIf="row.reactantAtom1 !== '.'">#{{ row.reactantAtom1 }}</span>
                <span *ngIf="row.reactantAtom1 === '.'">.</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="reactantAtom2">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Reactant Atom 2 </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center atom-idx-cell">
                <span class="atom-badge" *ngIf="row.reactantAtom2 !== '.'">#{{ row.reactantAtom2 }}</span>
                <span *ngIf="row.reactantAtom2 === '.'">.</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="productAtom1">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Product Atom 1 </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center atom-idx-cell">
                <span class="atom-badge" *ngIf="row.productAtom1 !== '.'">#{{ row.productAtom1 }}</span>
                <span *ngIf="row.productAtom1 === '.'">.</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="productAtom2">
              <th mat-header-cell *matHeaderCellDef class="table-header-cell text-center"> Product Atom 2 </th>
              <td mat-cell *matCellDef="let row" class="table-body-cell text-center atom-idx-cell">
                <span class="atom-badge" *ngIf="row.productAtom2 !== '.'">#{{ row.productAtom2 }}</span>
                <span *ngIf="row.productAtom2 === '.'">.</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="bondChangesColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: bondChangesColumns;"></tr>
          </table>
        </div>

        <ng-container *ngIf="(!matchedAtoms || matchedAtoms.length === 0) && (!bondChanges || bondChanges.length === 0)">
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class AtomCorrespondencesCardComponent extends BaseSectionCardComponent {
  public readonly matchedAtomsColumns: string[] = ['reactantMolecule', 'reactantIndex', 'productMolecule', 'productIndex'];
  public readonly bondChangesColumns: string[] = ['reactantAtom1', 'reactantAtom2', 'productAtom1', 'productAtom2'];

  public get matchedAtoms(): MatchedAtomRow[] {
    if (this.section?.matchedAtomsData && this.section.matchedAtomsData.length > 0) {
      return this.section.matchedAtomsData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return AtomCorrespondencesCardComponent.parseMatchedAtomsTable(lines);
    }
    return [];
  }

  public get bondChanges(): BondChangeRow[] {
    if (this.section?.bondChangesData && this.section.bondChangesData.length > 0) {
      return this.section.bondChangesData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return AtomCorrespondencesCardComponent.parseBondChangesTable(lines);
    }
    return [];
  }

  public static parseMatchedAtomsTable(lines: string[]): MatchedAtomRow[] {
    const rows: MatchedAtomRow[] = [];
    let inMatTableMode = false;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;

      if (clean.includes('MatTable') || clean.includes('Matched Atoms') || clean.includes('Reaction Correspondences')) {
        inMatTableMode = true;
        continue;
      }
      if (clean.includes('Unmatched Atoms') || clean.includes('Reaction Bond Changes') || clean.includes('Reactant Bond')) {
        inMatTableMode = false;
      }

      if (clean.includes('Reactant Molecule') || clean.includes('Product Molecule')) continue;

      const content = clean.includes(':') ? clean.substring(clean.lastIndexOf(':') + 1).trim() : clean;
      const tokens = content.split(/\s+/).filter(t => /^-?\d+$/.test(t));

      if (tokens.length >= 4 && (inMatTableMode || lines.length <= 15)) {
        rows.push({
          reactantMolecule: parseInt(tokens[0], 10),
          reactantIndex: parseInt(tokens[1], 10),
          productMolecule: parseInt(tokens[2], 10),
          productIndex: parseInt(tokens[3], 10)
        });
      }
    }

    return rows;
  }

  public static parseBondChangesTable(lines: string[]): BondChangeRow[] {
    const rows: BondChangeRow[] = [];
    let inBondChangesMode = false;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;

      if (clean.includes('Reaction Bond Changes') || clean.includes('Reactant Bond')) {
        inBondChangesMode = true;
        continue;
      }

      if (clean.includes('Reactant Bond') || clean.includes('Product Bond') || clean.includes('Atom 1') || clean.includes('Atom 2')) {
        continue;
      }

      const content = clean.includes(':') ? clean.substring(clean.lastIndexOf(':') + 1).trim() : clean;
      const tokens = content.split(/\s+/).filter(t => /^-?\d+$/.test(t) || t === '.');

      if (tokens.length >= 4 && inBondChangesMode) {
        rows.push({
          reactantAtom1: tokens[0],
          reactantAtom2: tokens[1],
          productAtom1: tokens[2],
          productAtom2: tokens[3]
        });
      }
    }

    return rows;
  }
}
