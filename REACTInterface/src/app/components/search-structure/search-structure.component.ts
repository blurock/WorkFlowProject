import { Component, ViewChild, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';
import { ExistenceCheckService, ExistenceCheckItem } from '../../services/existence-check.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { CatalogServiceRegistry } from '../../services/catalog/catalog-service-registry.service';
import { TargetMoleculeService } from '../../services/target-molecule.service';
import { TaskDashboardComponent } from '../task-dashboard/task-dashboard.component';

export type SearchStructureType = 'substructure' | 'molecule';

@Component({
  selector: 'app-search-structure',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    KetcherViewerComponent
  ],
  templateUrl: './search-structure.component.html',
  styleUrls: ['./search-structure.component.scss']
})
export class SearchStructureComponent {
  @ViewChild('ketcherCanvas') public ketcherCanvas?: KetcherViewerComponent;

  // Search parameters
  public searchType: SearchStructureType = 'substructure';
  public structureName: string = 'QueryStructure';

  // State management
  public isSearching: boolean = false;
  public searchCompleted: boolean = false;
  public foundInDatabase: boolean = false;
  public matchedDatabaseId: string | null = null;
  public matchedDatabaseName: string | null = null;
  public statusMessage: string = '';
  public errorMessage: string = '';

  // Data artifacts
  public exportedMolfile: string = '';
  public translatedSdfPreview: string = '';
  public rawExecutionOutput: string = '';
  public isRawOutputExpanded: boolean = false;

  constructor(
    private existenceCheckService: ExistenceCheckService,
    private chemParser: ChemStructureParserService,
    private catalogRegistry: CatalogServiceRegistry,
    private targetMoleculeService: TargetMoleculeService,
    private snackBar: MatSnackBar,
    @Optional() private dashboard?: TaskDashboardComponent
  ) {}

  public onSearchTypeChange(): void {
    this.searchCompleted = false;
    this.foundInDatabase = false;
    this.matchedDatabaseId = null;
    this.matchedDatabaseName = null;
    this.errorMessage = '';
    this.statusMessage = '';
  }

  public async findStructure(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = '';
    this.searchCompleted = false;
    this.foundInDatabase = false;
    this.matchedDatabaseId = null;
    this.matchedDatabaseName = null;
    this.rawExecutionOutput = '';

    if (!this.ketcherCanvas) {
      this.errorMessage = 'Ketcher canvas is initializing. Please wait a moment and try again.';
      return;
    }

    const cleanName = (this.structureName || '').trim() || 'QueryStructure';
    this.isSearching = true;
    this.statusMessage = 'Exporting chemical drawing from Ketcher...';

    try {
      // 1. Export molfile from Ketcher canvas
      const molfile = await this.ketcherCanvas.exportStructureFromKetcher('mol');
      if (!molfile || !molfile.trim()) {
        throw new Error('No chemical structure detected in the Ketcher canvas. Please draw a molecule or substructure first.');
      }
      this.exportedMolfile = molfile;

      // 2. Translate Ketcher molfile to canonical REACT SDF format
      this.statusMessage = 'Translating Ketcher molfile to canonical REACT SDF block...';
      const structureKind = this.searchType === 'substructure' ? 'Substructure' : 'Molecule';
      const translatedSdf = this.chemParser.translateKetcherToSdf(molfile, cleanName, structureKind);
      if (!translatedSdf) {
        throw new Error('Failed to parse and translate Ketcher structure into SDF format. Please verify drawing.');
      }
      this.translatedSdfPreview = translatedSdf;

      // 3. Prepare payload and execute database existence check
      this.statusMessage = `Querying REACT ${structureKind} database for exact match...`;
      const filesToUpload = [
        { filename: `${cleanName}.sdf`, content: translatedSdf }
      ];

      const result = await this.existenceCheckService.checkDatabaseExistence(
        this.searchType,
        'sdf',
        cleanName,
        `${cleanName}_search_out`,
        filesToUpload
      );

      this.rawExecutionOutput = result.rawOutput || result.executionLogText || '';

      // 4. Parse results for match
      let isFound = false;
      let matchedId: string | null = null;
      let matchedName: string | null = null;

      if (result.items && result.items.length > 0) {
        for (const item of result.items) {
          if (
            item.inDatabase ||
            (item.dbId && /^\d+$/.test(item.dbId) && item.dbId !== '---') ||
            (item.status && item.status.toUpperCase().includes('EXISTS'))
          ) {
            isFound = true;
            matchedId = item.dbId || null;
            matchedName = item.matchedName || item.exactMatch || null;
            break;
          }
        }
      }

      // If matched ID exists but name is not yet resolved, lookup from catalog list
      if (isFound && matchedId) {
        try {
          const catalogService = this.catalogRegistry.getServiceForTask(
            this.searchType === 'substructure' ? 'substructures' : 'molecules'
          );
          const catalogItems = await firstValueFrom(catalogService.getCatalogList());
          if (catalogItems && catalogItems.length > 0) {
            const foundItem = catalogItems.find(c => String(c.id).trim() === String(matchedId).trim());
            if (foundItem && foundItem.name) {
              matchedName = foundItem.name;
            }
          }
        } catch (catErr) {
          console.warn('[SearchStructureComponent] Could not fetch catalog list to resolve name:', catErr);
        }
      }

      this.foundInDatabase = isFound;
      this.matchedDatabaseId = matchedId;
      this.matchedDatabaseName = matchedName || (isFound ? `ID #${matchedId}` : null);
      this.searchCompleted = true;

      if (isFound) {
        this.statusMessage = `Exact match confirmed in ${structureKind} database!`;
        this.snackBar.open(
          `Structure found in database: ${this.matchedDatabaseName} (ID: ${this.matchedDatabaseId})`,
          'Great',
          { duration: 4500 }
        );
      } else {
        this.statusMessage = `Structure does not exist in ${structureKind} database.`;
        this.snackBar.open(
          `Structure not found in ${structureKind} database. You can register it in Molecule Creator & Editor.`,
          'Dismiss',
          { duration: 4000 }
        );
      }

    } catch (err: any) {
      console.error('[SearchStructureComponent] Search error:', err);
      this.errorMessage = err?.message || 'Error occurred during structure search in database.';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
    } finally {
      this.isSearching = false;
    }
  }

  public openInMoleculeCreator(): void {
    if (!this.exportedMolfile && this.ketcherCanvas) {
      // Quick async export if not already cached
      this.ketcherCanvas.exportStructureFromKetcher('mol').then(mol => {
        this.proceedToMoleculeCreator(mol || '');
      });
      return;
    }
    this.proceedToMoleculeCreator(this.exportedMolfile);
  }

  private proceedToMoleculeCreator(molfile: string): void {
    this.targetMoleculeService.pendingMolfileForEditor = molfile;
    this.targetMoleculeService.pendingStructureTypeForEditor = this.searchType === 'substructure' ? 'Substructure' : 'Molecule';
    this.targetMoleculeService.pendingStructureNameForEditor = this.structureName || 'NewStructure';

    if (this.dashboard) {
      this.dashboard.selectTaskById('create-molecule');
      this.snackBar.open('Navigated to Molecule Creator & Editor with your drawn structure pre-loaded.', 'OK', { duration: 3500 });
    } else {
      this.snackBar.open('Structure saved for editor. Select "Molecule Creator & Editor" in sidebar.', 'OK', { duration: 4000 });
    }
  }

  public copyDbIdToClipboard(): void {
    if (!this.matchedDatabaseId) return;
    navigator.clipboard.writeText(this.matchedDatabaseId).then(() => {
      this.snackBar.open(`Copied Database ID ${this.matchedDatabaseId} to clipboard!`, 'Close', { duration: 2500 });
    });
  }

  public toggleRawOutput(): void {
    this.isRawOutputExpanded = !this.isRawOutputExpanded;
  }
}
