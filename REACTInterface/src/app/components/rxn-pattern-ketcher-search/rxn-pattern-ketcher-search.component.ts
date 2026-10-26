import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';
import { ReactiveCenterService, ReactiveCenterResult } from '../../services/reactive-center.service';
import { ReactCloudApiService } from '../../services/react-cloud-api.service';

export interface MatchingPatternItem {
  id: string | number;
  name: string;
  reactants: string[];
  products: string[];
  reactionBrokenBonds?: string[];
  reactionFormedBonds?: string[];
  reactionCenterKey?: string;
  sourceFile?: string;
  isSelected?: boolean;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-rxn-pattern-ketcher-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    KetcherViewerComponent
  ],
  templateUrl: './rxn-pattern-ketcher-search.component.html',
  styleUrls: ['./rxn-pattern-ketcher-search.component.scss']
})
export class RxnPatternKetcherSearchComponent {
  @ViewChild('ketcherCanvas') public ketcherCanvas?: KetcherViewerComponent;

  @Input() public preselectedPatterns: string[] = [];
  @Input() public showAddButton: boolean = true;
  @Output() public patternsSelected = new EventEmitter<string[]>();
  @Output() public selectionChange = new EventEmitter<string[]>();

  public isSearching: boolean = false;
  public searchPerformed: boolean = false;
  public centerResult?: ReactiveCenterResult;
  public matchingPatterns: MatchingPatternItem[] = [];
  public selectedPatternNames: Set<string> = new Set<string>();
  public errorMessage: string = '';
  public activePreviewPattern?: MatchingPatternItem;

  // Preset quick reactions to test/populate Ketcher
  public readonly PRESET_QUICK_PATTERNS = [
    {
      label: 'C–H Abstraction (CH + OH -> C. + H2O)',
      rxn: '$RXN\n\n  Ketcher\n\n  2  2\n$MOL\n\n  Ketcher\n\n  5  4  0  0  0  0  0  0  0  0999 V2000\n    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  1  0  0\n    1.0000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  2  0  0\n    0.0000    1.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n   -1.0000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    0.0000   -1.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  1  0  0  0  0\n  1  3  1  0  0  0  0\n  1  4  1  0  0  0  0\n  1  5  1  0  0  0  0\nM  END\n$MOL\n\n  Ketcher\n\n  2  1  0  0  0  0  0  0  0  0999 V2000\n    3.0000    0.0000    0.0000 O   0  4  0  0  0  0  0  0  0  3  0  0\n    4.0000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  1  0  0  0  0\nM  RAD  1   1   2\nM  END\n$MOL\n\n  Ketcher\n\n  4  3  0  0  0  0  0  0  0  0999 V2000\n    0.0000    0.0000    0.0000 C   0  4  0  0  0  0  0  0  0  1  0  0\n    0.0000    1.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n   -1.0000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    0.0000   -1.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  1  0  0  0  0\n  1  3  1  0  0  0  0\n  1  4  1  0  0  0  0\nM  RAD  1   1   2\nM  END\n$MOL\n\n  Ketcher\n\n  3  2  0  0  0  0  0  0  0  0999 V2000\n    3.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  3  0  0\n    4.0000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    3.0000    1.0000    0.0000 H   0  0  0  0  0  0  0  0  0  2  0  0\n  1  2  1  0  0  0  0\n  1  3  1  0  0  0  0\nM  END\n'
    },
    {
      label: 'Radical Addition (C=C + H. -> .C-C-H)',
      rxn: '$RXN\n\n  Ketcher\n\n  2  1\n$MOL\n\n  Ketcher\n\n  2  1  0  0  0  0  0  0  0  0999 V2000\n    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  1  0  0\n    1.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  2  0  0\n  1  2  2  0  0  0  0\nM  END\n$MOL\n\n  Ketcher\n\n  1  0  0  0  0  0  0  0  0  0999 V2000\n    2.5000    0.0000    0.0000 H   0  4  0  0  0  0  0  0  0  3  0  0\nM  RAD  1   1   2\nM  END\n$MOL\n\n  Ketcher\n\n  3  2  0  0  0  0  0  0  0  0999 V2000\n    0.0000    0.0000    0.0000 C   0  4  0  0  0  0  0  0  0  1  0  0\n    1.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  2  0  0\n    2.0000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  3  0  0\n  1  2  1  0  0  0  0\n  2  3  1  0  0  0  0\nM  RAD  1   1   2\nM  END\n'
    }
  ];

  constructor(
    private reactiveCenterService: ReactiveCenterService,
    private apiService: ReactCloudApiService,
    private snackBar: MatSnackBar
  ) {
    if (this.preselectedPatterns && this.preselectedPatterns.length > 0) {
      this.preselectedPatterns.forEach(p => this.selectedPatternNames.add(p.trim()));
    }
  }

  public async loadPreset(rxn: string): Promise<void> {
    if (this.ketcherCanvas) {
      this.ketcherCanvas.sendSdfToKetcher(rxn, true, true);
      this.snackBar.open('Preset loaded into Ketcher window.', 'Close', { duration: 2500 });
    }
  }

  public async findReactionPatterns(): Promise<void> {
    if (!this.ketcherCanvas) return;

    this.isSearching = true;
    this.errorMessage = '';
    this.matchingPatterns = [];
    this.centerResult = undefined;

    try {
      const rxnContent = await this.ketcherCanvas.exportStructureFromKetcher('rxn');
      if (!rxnContent || !rxnContent.trim()) {
        this.errorMessage = 'Please draw a reaction template or load a preset in Ketcher first.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
        this.isSearching = false;
        return;
      }

      // 1. Analyze reaction and extract reactive center
      const analysis = this.reactiveCenterService.analyzeReaction(rxnContent);
      this.centerResult = analysis;

      if (!analysis.hasChanges) {
        this.errorMessage = 'No bond breaking or bond forming changes detected in the drawing. Verify reaction arrow and atom connectivity.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
        this.isSearching = false;
        return;
      }

      // 2. Query Firestore by reactive center
      this.apiService.searchRxnPatternsByCenter({
        reactionCenterKey: analysis.reactionCenterKey,
        reactionBrokenBonds: analysis.reactionBrokenBonds,
        reactionFormedBonds: analysis.reactionFormedBonds
      }).subscribe({
        next: (resp) => {
          this.searchPerformed = true;
          this.isSearching = false;
          if (resp && resp.records) {
            this.matchingPatterns = resp.records.map(rec => {
              const patName = rec.Name || rec.key || (rec.id !== undefined ? String(rec.id) : '');
              return {
                id: rec.ID || rec.keyId || rec.key,
                name: patName,
                reactants: rec.reactants || [],
                products: rec.products || [],
                reactionBrokenBonds: rec.reactionBrokenBonds || [],
                reactionFormedBonds: rec.reactionFormedBonds || [],
                reactionCenterKey: rec.reactionCenterKey || '',
                sourceFile: rec.sourceFile || '',
                isSelected: this.selectedPatternNames.has(patName),
                isExpanded: false
              };
            });

            if (this.matchingPatterns.length > 0) {
              this.snackBar.open(`Found ${this.matchingPatterns.length} matching reaction pattern(s)!`, 'Close', { duration: 3000 });
            } else {
              this.snackBar.open('No reaction patterns matched this reactive center.', 'Close', { duration: 3000 });
            }
          }
        },
        error: (err) => {
          console.error('[RxnPatternKetcherSearch] Search error:', err);
          this.errorMessage = err?.message || 'Error querying database for matching reaction patterns.';
          this.isSearching = false;
          this.searchPerformed = true;
        }
      });
    } catch (err: any) {
      console.error('[RxnPatternKetcherSearch] Export error:', err);
      this.errorMessage = err?.message || 'Failed to export reaction structure from Ketcher.';
      this.isSearching = false;
    }
  }

  public togglePatternSelection(pattern: MatchingPatternItem): void {
    pattern.isSelected = !pattern.isSelected;
    if (pattern.isSelected) {
      this.selectedPatternNames.add(pattern.name);
    } else {
      this.selectedPatternNames.delete(pattern.name);
    }
    this.selectionChange.emit(Array.from(this.selectedPatternNames));
  }

  public toggleExpand(pattern: MatchingPatternItem): void {
    pattern.isExpanded = !pattern.isExpanded;
    this.activePreviewPattern = pattern.isExpanded ? pattern : undefined;
  }

  public selectAllMatches(): void {
    this.matchingPatterns.forEach(p => {
      p.isSelected = true;
      this.selectedPatternNames.add(p.name);
    });
    this.selectionChange.emit(Array.from(this.selectedPatternNames));
  }

  public clearSelection(): void {
    this.matchingPatterns.forEach(p => {
      p.isSelected = false;
    });
    this.selectedPatternNames.clear();
    this.selectionChange.emit([]);
  }

  public emitAddSelected(): void {
    const list = Array.from(this.selectedPatternNames);
    this.patternsSelected.emit(list);
  }
}
