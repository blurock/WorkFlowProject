import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';

export interface ParsedSdfMolecule {
  index: number;
  moleculeName: string;
  atomCount?: number;
  bondCount?: number;
  sdfContent: string;
  isExpanded: boolean;
}

@Component({
  selector: 'app-sdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    KetcherViewerComponent
  ],
  templateUrl: './sdf-viewer.component.html',
  styleUrls: ['./sdf-viewer.component.scss']
})
export class SdfViewerComponent implements OnChanges {
  @Input() public sdfContent: string = '';
  @Input() public filename: string = 'structures.sdf';

  public parsedMolecules: ParsedSdfMolecule[] = [];
  public isRawSdfExpanded: boolean = false;
  public isAllExpanded: boolean = false;
  public isLineWrapEnabled: boolean = false;

  constructor(private snackBar: MatSnackBar) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sdfContent']) {
      this.parseSdfContent(this.sdfContent);
    }
  }

  public parseSdfContent(content: string): void {
    this.parsedMolecules = [];
    if (!content || !content.trim()) return;

    let rawBlocks: string[] = [];

    if (content.includes('$$$$')) {
      // Standard SDF or $$$$ delimited format
      rawBlocks = content.split('$$$$');
    } else if (content.includes('M  END') || content.includes('M END')) {
      // Chemdb SDF without $$$$, delimited by M  END
      rawBlocks = content.split(/M\s+END/);
    } else {
      // Single structure fallback
      rawBlocks = [content];
    }

    let molIndex = 1;
    for (const rawBlock of rawBlocks) {
      const trimmed = rawBlock.trim();
      if (!trimmed) continue;

      const lines = trimmed.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l !== '$$$$');
      if (lines.length === 0) continue;

      // Extract molecule name
      let moleculeName = `Molecule ${molIndex}`;

      // Check if Chemdb format (line 0 is pure digits like database ID, line 2 is name)
      if (lines.length >= 3 && /^\s*\d+\s*$/.test(lines[0]) && lines[2].trim().length > 0 && !lines[2].includes('V2000') && !/^\s*\d+\s+\d+/.test(lines[2])) {
        moleculeName = lines[2].trim();
      }
      // Standard format: line 0 is name
      else if (lines.length >= 1 && lines[0].trim().length > 0 && !lines[0].includes('V2000') && !/^\s*\d+\s+\d+/.test(lines[0])) {
        moleculeName = lines[0].trim();
      }
      // Fallback line 2
      else if (lines.length >= 3 && lines[2].trim().length > 0 && !lines[2].includes('V2000') && !/^\s*\d+\s+\d+/.test(lines[2])) {
        moleculeName = lines[2].trim();
      }

      // Extract atom & bond counts
      let atomCount: number | undefined;
      let bondCount: number | undefined;
      const countsLine = lines.find(l => l.includes('V2000'));
      if (countsLine) {
        const m = countsLine.match(/^\s*(\d+)\s+(\d+)/);
        if (m) {
          atomCount = parseInt(m[1], 10);
          bondCount = parseInt(m[2], 10);
        }
      } else {
        // Fallback for chemdb 2-number count line (e.g. "  2  1")
        const altCounts = lines.find((l, idx) => idx >= 2 && /^\s*(\d+)\s+(\d+)\s*$/.test(l));
        if (altCounts) {
          const m = altCounts.match(/^\s*(\d+)\s+(\d+)\s*$/);
          if (m) {
            atomCount = parseInt(m[1], 10);
            bondCount = parseInt(m[2], 10);
          }
        }
      }

      // Ensure block ends with M  END for Ketcher parsing
      let molfile = trimmed;
      if (!molfile.includes('M  END') && !molfile.includes('M END')) {
        molfile = `${molfile}\nM  END`;
      }

      this.parsedMolecules.push({
        index: molIndex,
        moleculeName: moleculeName,
        atomCount: atomCount,
        bondCount: bondCount,
        sdfContent: molfile,
        isExpanded: false
      });

      molIndex++;
    }
  }

  public toggleMolecule(mol: ParsedSdfMolecule): void {
    mol.isExpanded = !mol.isExpanded;
    this.updateAllExpandedState();
  }

  public toggleRawSdf(): void {
    this.isRawSdfExpanded = !this.isRawSdfExpanded;
  }

  public toggleAll(): void {
    this.isAllExpanded = !this.isAllExpanded;
    for (const mol of this.parsedMolecules) {
      mol.isExpanded = this.isAllExpanded;
    }
  }

  private updateAllExpandedState(): void {
    if (this.parsedMolecules.length === 0) {
      this.isAllExpanded = false;
      return;
    }
    this.isAllExpanded = this.parsedMolecules.every(m => m.isExpanded);
  }

  public copyMoleculeSdf(mol: ParsedSdfMolecule): void {
    if (!mol.sdfContent) return;
    navigator.clipboard.writeText(mol.sdfContent).then(() => {
      this.snackBar.open(`Copied ${mol.moleculeName} SDF to clipboard!`, 'OK', { duration: 2500 });
    });
  }

  public copyRawSdf(): void {
    if (!this.sdfContent) return;
    navigator.clipboard.writeText(this.sdfContent).then(() => {
      this.snackBar.open(`Copied ${this.filename} to clipboard!`, 'OK', { duration: 2500 });
    });
  }

  public toggleLineWrap(): void {
    this.isLineWrapEnabled = !this.isLineWrapEnabled;
  }

  public getLineCount(text: string): number {
    if (!text) return 0;
    return text.split('\n').length;
  }
}

