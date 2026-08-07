import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';

import { ReactCloudApiService, CatalogItem, CatalogTask } from '../../services/react-cloud-api.service';

export interface AtomElectronicRow {
  atomIndex: number;
  atomicNumber: number;
  charge: string;
  nElectrons: string;
  nOccupied: number;
  shells: string[];
}

export interface AtomChargeRow {
  atomIndex: number;
  radius: string;
  electronegativity: string;
  screening: string;
  effectiveCharge: string;
  residualCharge: string;
  beta: string;
}

export interface MoleculeSection {
  id: number;
  title: string;
  icon: string;
  content: string;
  isExpanded: boolean;
  electronicTableData?: AtomElectronicRow[];
  chargeTableData?: AtomChargeRow[];
}

@Component({
  selector: 'app-task-list-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    MatTableModule
  ],
  templateUrl: './task-list-view.component.html',
  styleUrls: ['./task-list-view.component.scss']
})
export class TaskListViewComponent implements OnChanges {
  @Input({ required: true }) task!: CatalogTask;

  public items: CatalogItem[] = [];
  public isLoading: boolean = false;
  public isDetailLoading: boolean = false;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;
  public selectedItem: CatalogItem | null = null;
  public itemDetailOutput: string | null = null;
  public moleculeSections: MoleculeSection[] = [];
  public selectedTabIndex: number = 0;

  public readonly electronicDisplayedColumns: string[] = ['atomIndex', 'atomicNumber', 'charge', 'nElectrons', 'shells'];
  public readonly chargeDisplayedColumns: string[] = ['atomIndex', 'radius', 'electronegativity', 'screening', 'effectiveCharge', 'residualCharge', 'beta'];

  constructor(
    private apiService: ReactCloudApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.selectedItem = null;
      this.itemDetailOutput = null;
      this.moleculeSections = [];
      this.selectedTabIndex = 0;
      this.loadTaskData();
    }
  }

  public loadTaskData(): void {
    if (!this.task) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.runCatalogTaskWithRegistry(this.task.id).subscribe({
      next: (parsedItems) => {
        this.items = parsedItems;
        this.isLoading = false;
        this.hasExecuted = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasExecuted = true;
        this.errorMessage = err?.error?.error || 'Failed to connect to REACTCLOUD server. Is the API server running?';
        this.snackBar.open(`Error executing ${this.task.title}: ${this.errorMessage}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  public onItemClick(item: CatalogItem): void {
    this.selectedItem = item;
    this.itemDetailOutput = null;
    this.moleculeSections = [];
    this.isDetailLoading = true;
    this.selectedTabIndex = 1;

    this.snackBar.open(`Loading detailed section data for ${item.name}...`, 'Dismiss', {
      duration: 2000
    });

    this.apiService.fetchItemDetails(this.task.id, item.name).subscribe({
      next: (detailOutput) => {
        this.itemDetailOutput = detailOutput;
        this.moleculeSections = this.parseSectionsFromOutput(detailOutput);
        this.isDetailLoading = false;
      },
      error: (err) => {
        this.isDetailLoading = false;
        this.itemDetailOutput = `Failed to fetch details for ${item.name}: ${err?.error?.error || err.message}`;
        this.moleculeSections = [
          {
            id: 1,
            title: 'Error Output',
            icon: 'error',
            content: this.itemDetailOutput,
            isExpanded: true
          }
        ];
      }
    });
  }

  /**
   * Parses raw output into distinct section cards based on '~' delimiters.
   */
  public parseSectionsFromOutput(rawOutput: string): MoleculeSection[] {
    if (!rawOutput) return [];

    const rawChunks = rawOutput.split(/\r?\n\s*~\s*\r?\n/);
    const sections: MoleculeSection[] = [];
    let sectionId = 1;

    for (let i = 0; i < rawChunks.length; i++) {
      let chunk = rawChunks[i];
      let trimmed = chunk.trim();
      if (!trimmed || trimmed === '~') continue;

      let lines = trimmed.split(/\r?\n/);
      let title = `Section ${sectionId}`;
      let icon = 'description';

      // Check if this chunk is the headers line for Radius/Electro- and merge with next values chunk
      let isChargeHeaderChunk = lines.some(l => l.includes('Radius') || l.includes('Electro-'));

      if (isChargeHeaderChunk && i + 1 < rawChunks.length) {
        const nextChunk = rawChunks[i + 1].trim();
        const nextLines = nextChunk.split(/\r?\n/);
        const hasValues = nextLines.some(l => {
          if (!l.includes(':')) return false;
          const valStr = l.substring(l.indexOf(':') + 1).trim();
          const tokens = valStr.split(/\s+/).filter(t => t.length > 0);
          return tokens.length >= 6 && !isNaN(parseFloat(tokens[0]));
        });

        if (hasValues) {
          // Merge chunks together into one single section
          trimmed = trimmed + '\n~\n' + nextChunk;
          lines = [...lines, ...nextLines];
          i++; // Skip next chunk since we merged it
        }
      }

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.includes('--- Output File')) {
          title = 'Output File Header';
          icon = 'file_present';
          break;
        } else if (cleanLine.startsWith(':MolFile') || cleanLine.includes(':MolFile')) {
          title = cleanLine.replace(/^:\s*/, '');
          icon = 'hub';
          break;
        } else if (cleanLine.includes('Electronic') || cleanLine.includes('----- Electronic')) {
          title = 'Electronic Properties & Shells';
          icon = 'bolt';
          break;
        } else if (cleanLine.includes('Radius') || cleanLine.includes('Electro-')) {
          title = 'Atomic Radii, Electronegativity & Charge Factors';
          icon = 'analytics';
          break;
        } else if (cleanLine.includes('Resonance') || cleanLine.includes('----- Resonances')) {
          title = 'Resonance Structures';
          icon = 'alt_route';
          break;
        } else if (cleanLine.includes('Alternative Names')) {
          title = 'Alternative Chemical Names';
          icon = 'badge';
          break;
        } else if (cleanLine.includes('Chemkin Database Thermodynamic')) {
          title = 'Chemkin Database Thermodynamics';
          icon = 'thermostat';
          break;
        } else if (cleanLine.includes('Benson Thermodynamics') || cleanLine.includes('Calculated Benson')) {
          title = 'Benson Thermodynamics Contributions';
          icon = 'local_fire_department';
          break;
        } else if (cleanLine.includes('Graph')) {
          title = 'Molecular Graph Representation';
          icon = 'schema';
          break;
        } else if (cleanLine.includes('Single Bond') || cleanLine.includes('Double Bond')) {
          title = 'Bonds & Connectivity';
          icon = 'link';
          break;
        } else if (cleanLine.startsWith(':Atom') || cleanLine.includes(':Atom')) {
          title = 'Atomic Coordinates & Elements';
          icon = 'bubble_chart';
          break;
        } else if (cleanLine.startsWith('Chemistry Database') || cleanLine.startsWith('main>>')) {
          title = 'Execution Log & Command Stream';
          icon = 'terminal';
          break;
        }
      }

      let electronicTableData: AtomElectronicRow[] | undefined = undefined;
      let chargeTableData: AtomChargeRow[] | undefined = undefined;

      if (title.includes('Electronic Properties')) {
        electronicTableData = this.parseElectronicTable(lines);
      } else if (title.includes('Atomic Radii')) {
        chargeTableData = this.parseChargeTable(lines);
      }

      sections.push({
        id: sectionId++,
        title: title,
        icon: icon,
        content: trimmed,
        isExpanded: true,
        electronicTableData: electronicTableData,
        chargeTableData: chargeTableData
      });
    }

    return sections;
  }

  /**
   * Parses Electronic Properties section into structured AtomElectronicRow[] table data.
   */
  public parseElectronicTable(lines: string[]): AtomElectronicRow[] {
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

  /**
   * Parses Charge & Radii section (lines with 6 or 7 float values) into AtomChargeRow[] table data.
   */
  public parseChargeTable(lines: string[]): AtomChargeRow[] {
    const rows: AtomChargeRow[] = [];
    let atomIdx = 0;

    for (const line of lines) {
      if (!line.includes(':')) continue;
      const colonIdx = line.indexOf(':');
      const valStr = line.substring(colonIdx + 1).trim();
      const tokens = valStr.split(/\s+/).filter(t => t.length > 0);

      // Lines contain 6 or 7 floats: Radius, Electronegativity, Screening, EffectiveCharge, ResidualCharge, Beta
      if (tokens.length >= 6 && !isNaN(parseFloat(tokens[0])) && !isNaN(parseFloat(tokens[1]))) {
        rows.push({
          atomIndex: atomIdx++,
          radius: tokens[0] || '0.000000',
          electronegativity: tokens[1] || '0.000000',
          screening: tokens[2] || '0.000000',
          effectiveCharge: tokens[3] || '0.000000',
          residualCharge: tokens[4] || '0.000000',
          beta: tokens[5] || '0.000000'
        });
      }
    }

    return rows;
  }

  public backToCatalogTab(): void {
    this.selectedTabIndex = 0;
  }

  public toggleSection(section: MoleculeSection): void {
    section.isExpanded = !section.isExpanded;
  }

  public toggleAllSections(expanded: boolean): void {
    this.moleculeSections.forEach(sec => sec.isExpanded = expanded);
  }

  public copySectionContent(section: MoleculeSection): void {
    navigator.clipboard.writeText(section.content).then(() => {
      this.snackBar.open(`Copied "${section.title}" section to clipboard!`, 'OK', {
        duration: 3000
      });
    });
  }

  public copyFullOutput(): void {
    if (!this.itemDetailOutput) return;
    navigator.clipboard.writeText(this.itemDetailOutput).then(() => {
      this.snackBar.open('Copied full output to clipboard!', 'OK', {
        duration: 3000
      });
    });
  }
}
