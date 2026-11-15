import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { BaseSectionCardComponent } from './base-section-card.component';
import { MatchedAtomRow, BondChangeRow as LegacyBondChangeRow } from '../../../models/task-list.models';
import { AtomCorrespondenceTableComponent } from '../../shared/atom-correspondence-table/atom-correspondence-table.component';
import {
  AtomCorrespondenceService,
  AtomCorrespondenceRow,
  BondChangeRow,
  AtomInfo,
  BondInfo,
  isGenericAtomSymbol,
  normalizeAtomSymbol
} from '../../../services/atom-correspondence.service';
import { ReactCloudApiService } from '../../../services/react-cloud-api.service';
import { ReactionPatternAlignmentService } from '../../../services/reaction-pattern-alignment.service';

@Component({
  selector: 'app-atom-correspondences-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AtomCorrespondenceTableComponent
  ],
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
        <!-- Reusable Interactive Atom Correspondence Table with Store Change button -->
        <app-atom-correspondence-table
          [correspondenceRows]="correspondenceRows"
          [bondChangeRows]="bondChangeRows"
          [showStoreButton]="true"
          [isSaving]="isSaving"
          (correspondenceChange)="onCorrespondenceChanged($event)"
          (storeChange)="onStoreChange($event)">
        </app-atom-correspondence-table>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class AtomCorrespondencesCardComponent extends BaseSectionCardComponent implements OnInit, OnChanges {
  @Input() patternName?: string;
  @Input() patternId?: number | string;
  @Input() sdfContent?: string | null;

  public correspondenceRows: AtomCorrespondenceRow[] = [];
  public bondChangeRows: BondChangeRow[] = [];
  public reactantAtoms: AtomInfo[] = [];
  public productAtoms: AtomInfo[] = [];
  public reactantBonds: BondInfo[] = [];
  public productBonds: BondInfo[] = [];
  public isSaving: boolean = false;

  private atomCorrService = inject(AtomCorrespondenceService);
  private apiService = inject(ReactCloudApiService);
  private alignmentService = inject(ReactionPatternAlignmentService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.initializeCorrespondences();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] || changes['sdfContent'] || changes['patternName'] || changes['patternId']) {
      this.initializeCorrespondences();
    }
  }

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

  public get bondChanges(): LegacyBondChangeRow[] {
    if (this.section?.bondChangesData && this.section.bondChangesData.length > 0) {
      return this.section.bondChangesData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return AtomCorrespondencesCardComponent.parseBondChangesTable(lines);
    }
    return [];
  }

  /**
   * Initializes correspondence rows, candidate options, and bond changes.
   */
  public async initializeCorrespondences(): Promise<void> {
    const rawSdf = this.sdfContent;

    // 1. If sdfContent is available, parse structure
    if (rawSdf && rawSdf.trim()) {
      const parsed = this.atomCorrService.parseRxnStructure(rawSdf);
      this.reactantAtoms = parsed.reactantAtoms;
      this.productAtoms = parsed.productAtoms;
      this.reactantBonds = parsed.reactantBonds;
      this.productBonds = parsed.productBonds;
    }

    // 2. If structure not parsed from sdfContent, try fetching reaction pattern and substructures from DB
    if (this.reactantAtoms.length === 0 && (this.patternName || this.patternId)) {
      try {
        const lookup = this.patternName || this.patternId!;
        const dbPattern = await this.alignmentService.fetchDbReactionPattern(lookup);
        if (dbPattern && (dbPattern.Reactants || dbPattern.Products)) {
          const rKeys = Array.isArray(dbPattern.Reactants) ? dbPattern.Reactants : [];
          const pKeys = Array.isArray(dbPattern.Products) ? dbPattern.Products : [];

          const rSubs = await Promise.all(rKeys.map((k: any) => this.alignmentService.fetchSubstructureFromFirestore(k)));
          const pSubs = await Promise.all(pKeys.map((k: any) => this.alignmentService.fetchSubstructureFromFirestore(k)));

          let rCount = 1;
          let pCount = 1;

          this.reactantAtoms = [];
          this.reactantBonds = [];
          rSubs.forEach((sub, sIdx) => {
            if (!sub) return;
            const molIdx = sIdx + 1;
            const atomMap = new Map<number, number>();
            sub.atoms.forEach((a: any, aIdx: number) => {
              const num = rCount++;
              atomMap.set(a.id !== undefined ? a.id : aIdx, num);
              this.reactantAtoms.push({
                atomNumber: num,
                molAtomIndex: aIdx + 1,
                symbol: normalizeAtomSymbol(a.symbol),
                isGeneric: isGenericAtomSymbol(a.symbol),
                moleculeIndex: molIdx,
                isReactant: true,
                x: a.x,
                y: a.y,
                z: a.z,
                radical: a.isRadical ? 2 : 0
              });
            });

            sub.bonds.forEach((b: any) => {
              const a1 = atomMap.get(b.i);
              const a2 = atomMap.get(b.j);
              if (a1 && a2) {
                this.reactantBonds.push({
                  moleculeIndex: molIdx,
                  isReactant: true,
                  atom1MolIndex: (b.i || 0) + 1,
                  atom2MolIndex: (b.j || 0) + 1,
                  atom1Number: a1,
                  atom2Number: a2,
                  bondType: b.order || 1
                });
              }
            });
          });

          this.productAtoms = [];
          this.productBonds = [];
          pSubs.forEach((sub, sIdx) => {
            if (!sub) return;
            const molIdx = sIdx + 1;
            const atomMap = new Map<number, number>();
            sub.atoms.forEach((a: any, aIdx: number) => {
              const num = pCount++;
              atomMap.set(a.id !== undefined ? a.id : aIdx, num);
              this.productAtoms.push({
                atomNumber: num,
                molAtomIndex: aIdx + 1,
                symbol: normalizeAtomSymbol(a.symbol),
                isGeneric: isGenericAtomSymbol(a.symbol),
                moleculeIndex: molIdx,
                isReactant: false,
                x: a.x,
                y: a.y,
                z: a.z,
                radical: a.isRadical ? 2 : 0
              });
            });

            sub.bonds.forEach((b: any) => {
              const a1 = atomMap.get(b.i);
              const a2 = atomMap.get(b.j);
              if (a1 && a2) {
                this.productBonds.push({
                  moleculeIndex: molIdx,
                  isReactant: false,
                  atom1MolIndex: (b.i || 0) + 1,
                  atom2MolIndex: (b.j || 0) + 1,
                  atom1Number: a1,
                  atom2Number: a2,
                  bondType: b.order || 1
                });
              }
            });
          });
        }
      } catch (err) {
        console.warn('[AtomCorrespondencesCard] Error loading DB pattern for correspondences:', err);
      }
    }

    // 3. Extract explicit mappings from matchedAtoms (Section 5 table data)
    const explicitMap = new Map<number, number>();
    const matched = this.matchedAtoms;
    if (matched && matched.length > 0) {
      const isZeroBased = matched.some(m => m.reactantMolecule === 0 || m.reactantIndex === 0 || m.productMolecule === 0);

      matched.forEach(m => {
        const rMolIdx = isZeroBased ? (m.reactantMolecule + 1) : m.reactantMolecule;
        const rAtomIdx = isZeroBased ? (m.reactantIndex + 1) : m.reactantIndex;

        let rAtom = this.reactantAtoms.find(a => a.moleculeIndex === rMolIdx && a.molAtomIndex === rAtomIdx);
        if (!rAtom) {
          rAtom = this.reactantAtoms.find(a => a.atomNumber === rAtomIdx);
        }
        if (!rAtom && m.reactantIndex < this.reactantAtoms.length) {
          rAtom = this.reactantAtoms[m.reactantIndex];
        }

        let effectivePIndex = m.productIndex;
        if (effectivePIndex >= this.reactantAtoms.length && this.reactantAtoms.length > 0) {
          effectivePIndex = effectivePIndex - this.reactantAtoms.length;
        }
        const pMolIdx = isZeroBased ? (m.productMolecule + 1) : m.productMolecule;
        const pAtomIdx = isZeroBased ? (effectivePIndex + 1) : effectivePIndex;

        let pAtom = this.productAtoms.find(a => a.moleculeIndex === pMolIdx && a.molAtomIndex === pAtomIdx);
        if (!pAtom) {
          pAtom = this.productAtoms.find(a => a.atomNumber === pAtomIdx);
        }
        if (!pAtom && effectivePIndex < this.productAtoms.length) {
          pAtom = this.productAtoms[effectivePIndex];
        }

        if (rAtom && pAtom) {
          explicitMap.set(rAtom.atomNumber, pAtom.atomNumber);
        } else if (m.reactantIndex > 0 && m.productIndex > 0) {
          explicitMap.set(m.reactantIndex, m.productIndex);
        }
      });
    }

    // 4. Fallback if no atoms parsed: create placeholder atoms based on matched table
    if (this.reactantAtoms.length === 0 && matched.length > 0) {
      const isZeroBased = matched.some(m => m.reactantMolecule === 0 || m.reactantIndex === 0 || m.productMolecule === 0);
      matched.forEach((m, idx) => {
        const rNum = isZeroBased ? (m.reactantIndex + 1) : (m.reactantIndex || (idx + 1));
        const pNum = isZeroBased ? (m.productIndex + 1) : (m.productIndex || (idx + 1));
        this.reactantAtoms.push({
          atomNumber: rNum,
          molAtomIndex: rNum,
          symbol: 'C',
          isGeneric: false,
          moleculeIndex: isZeroBased ? (m.reactantMolecule + 1) : (m.reactantMolecule || 1),
          isReactant: true
        });

        this.productAtoms.push({
          atomNumber: pNum,
          molAtomIndex: pNum,
          symbol: 'C',
          isGeneric: false,
          moleculeIndex: isZeroBased ? (m.productMolecule + 1) : (m.productMolecule || 1),
          isReactant: false
        });
        explicitMap.set(rNum, pNum);
      });
    }

    // 5. Build correspondences with candidate dropdown options
    this.correspondenceRows = this.atomCorrService.buildInitialCorrespondences(
      this.reactantAtoms,
      this.productAtoms,
      this.reactantBonds,
      this.productBonds,
      explicitMap
    );

    // 6. Build initial bond changes
    this.bondChangeRows = this.atomCorrService.buildBondChanges(
      this.reactantBonds,
      this.productBonds,
      this.correspondenceRows
    );

    // Fallback bond changes from section if bondChangeRows is empty
    if (this.bondChangeRows.length === 0 && this.bondChanges.length > 0) {
      this.bondChangeRows = this.bondChanges.map(b => ({
        moleculeIndex: 1,
        atom1Number: parseInt(b.reactantAtom1, 10) || 1,
        atom2Number: parseInt(b.reactantAtom2, 10) || 2,
        type: 4
      }));
    }
  }

  public onCorrespondenceChanged(rows: AtomCorrespondenceRow[]): void {
    this.correspondenceRows = rows;
    this.bondChangeRows = this.atomCorrService.buildBondChanges(
      this.reactantBonds,
      this.productBonds,
      this.correspondenceRows
    );
  }

  public async onStoreChange(_event: { correspondences: AtomCorrespondenceRow[]; bondChanges: BondChangeRow[] }): Promise<void> {
    const patternKey = this.patternName || (this.section?.title ? this.section.title.replace(/.*for\s+/i, '').trim() : '') || String(this.patternId || '');
    if (!patternKey) {
      this.snackBar.open('Cannot save: Unknown reaction pattern name.', 'Dismiss', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    try {
      // 1. Fetch current DB record if exists
      let dbRecord = await this.alignmentService.fetchDbReactionPattern(patternKey);
      if (!dbRecord && this.patternId) {
        dbRecord = await this.alignmentService.fetchDbReactionPattern(this.patternId);
      }
      if (!dbRecord) {
        dbRecord = {
          Name: patternKey,
          ID: Number(this.patternId || 0)
        };
      }

      // 2. Update TotalCorr and bond changes in document
      const updatedDoc = this.atomCorrService.updateReactionPatternDocument(
        dbRecord,
        patternKey,
        this.correspondenceRows,
        this.bondChangeRows,
        this.reactantAtoms,
        this.productAtoms
      );

      // 3. Store in Firestore via orchestrator API
      const primaryKey = String(patternKey);
      await firstValueFrom(this.apiService.storeDatabaseRecord('ReactionPatterns', primaryKey, updatedDoc, Number(this.patternId || dbRecord.ID || 0)));

      // If an ID key exists and is different from the pattern name, update the alias record too
      const recordId = Number(this.patternId || dbRecord.ID || 0);
      if (recordId > 0 && String(recordId) !== primaryKey) {
        await firstValueFrom(this.apiService.storeDatabaseRecord('ReactionPatterns', String(recordId), updatedDoc, recordId));
      }

      // 4. Invalidate caches
      this.alignmentService.clearCache(patternKey);
      if (recordId > 0) this.alignmentService.clearCache(String(recordId));

      this.snackBar.open(`Reaction pattern '${patternKey}' correspondences saved successfully!`, 'OK', { duration: 4000 });
    } catch (err: any) {
      console.error('[AtomCorrespondencesCard] Error storing correspondences:', err);
      this.snackBar.open(`Error storing correspondences: ${err?.message || err}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isSaving = false;
    }
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

  public static parseBondChangesTable(lines: string[]): LegacyBondChangeRow[] {
    const rows: LegacyBondChangeRow[] = [];
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
