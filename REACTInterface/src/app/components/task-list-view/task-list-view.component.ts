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

import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ReactCloudApiService, CatalogItem, CatalogTask } from '../../services/react-cloud-api.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { CatalogServiceRegistry } from '../../services/catalog/catalog-service-registry.service';
import { MoleculesService } from '../../services/catalog/molecules.service';

import type {
  AtomElectronicRow,
  AtomChargeRow,
  AltNameRow,
  MatchedAtomRow,
  BondChangeRow,
  ReactionRateRow,
  BensonGroupRow,
  BensonGroupTableData,
  MechCoefficientRow,
  MechFileData,
  MoleculeSection
} from '../../models/task-list.models';

export type {
  AtomElectronicRow,
  AtomChargeRow,
  AltNameRow,
  MatchedAtomRow,
  BondChangeRow,
  ReactionRateRow,
  BensonGroupRow,
  BensonGroupTableData,
  MechCoefficientRow,
  MechFileData,
  MoleculeSection
};

import { MoleculeDetailComponent } from './details/molecule-detail.component';
import { RxnPatternDetailComponent } from './details/rxn-pattern-detail.component';
import { SubstructureDetailComponent } from './details/substructure-detail.component';
import { BensonGroupDetailComponent } from './details/benson-group-detail.component';
import { TextSectionCardComponent } from './cards/text-section-card.component';
import { ElectronicPropertiesCardComponent } from './cards/electronic-properties-card.component';
import { AtomicRadiiCardComponent } from './cards/atomic-radii-card.component';
import { AltNamesCardComponent } from './cards/alt-names-card.component';
import { AtomCorrespondencesCardComponent } from './cards/atom-correspondences-card.component';
import { ReactionRateCardComponent } from './cards/reaction-rate-card.component';
import { BensonGroupCardComponent } from './cards/benson-group-card.component';
import { MechReactionsCardComponent } from './cards/mech-reactions-card.component';
import { MechThermoCardComponent } from './cards/mech-thermo-card.component';
import { MechStructuresCardComponent } from './cards/mech-structures-card.component';
import { MechCorrsCardComponent } from './cards/mech-corrs-card.component';

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
    MatTableModule,
    MoleculeDetailComponent,
    RxnPatternDetailComponent,
    SubstructureDetailComponent,
    BensonGroupDetailComponent,
    TextSectionCardComponent,
    ElectronicPropertiesCardComponent,
    AtomicRadiiCardComponent,
    AltNamesCardComponent,
    AtomCorrespondencesCardComponent,
    ReactionRateCardComponent,
    BensonGroupCardComponent,
    MechReactionsCardComponent,
    MechThermoCardComponent,
    MechStructuresCardComponent,
    MechCorrsCardComponent
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
  public currentSdfContent: string | null = null;

  constructor(
    private apiService: ReactCloudApiService,
    private catalogServiceRegistry: CatalogServiceRegistry,
    private moleculesService: MoleculesService,
    private taskOutputParser: TaskOutputParserService,
    private chemParser: ChemStructureParserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.selectedItem = null;
      this.itemDetailOutput = null;
      this.moleculeSections = [];
      this.currentSdfContent = null;
      this.selectedTabIndex = 0;
      this.loadTaskData();
    }
  }

  public loadTaskData(): void {
    if (!this.task) return;

    this.isLoading = true;
    this.errorMessage = null;

    const catalogService = this.catalogServiceRegistry.getServiceForTask(this.task.id);
    catalogService.getCatalogList().subscribe({
      next: (parsedItems) => {
        this.items = (parsedItems || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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
    this.currentSdfContent = null;
    this.isDetailLoading = true;
    this.selectedTabIndex = 1;

    this.snackBar.open(`Loading detailed section data for ${item.name}...`, 'Dismiss', {
      duration: 2000
    });

    const catalogService = this.catalogServiceRegistry.getServiceForTask(this.task.id);
    catalogService.getItemDetails(item.name).subscribe({
      next: (detailOutput) => {
        this.itemDetailOutput = detailOutput;
        this.currentSdfContent = this.chemParser.extractSdfContent(detailOutput);
        this.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(detailOutput, this.task.id, this.currentSdfContent);
        this.isDetailLoading = false;

        const rxnHeader = this.chemParser.parseReactionHeader(detailOutput);
        if (rxnHeader && (!this.currentSdfContent || !this.currentSdfContent.includes('$RXN')) && (rxnHeader.reactantIds.length > 0 || rxnHeader.productIds.length > 0)) {
          this.loadReactionMoleculeSdfs(rxnHeader, item.name);
        }
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

  public loadReactionMoleculeSdfs(rxnHeader: { reactantIds: string[]; productIds: string[] }, patternName: string): void {
    const sdfMap = this.chemParser.extractSdfBlockMap(this.itemDetailOutput || '');

    const reactantRequests = rxnHeader.reactantIds.map(id => {
      if (sdfMap.has(id)) {
        return of(sdfMap.get(id)!);
      }
      return this.moleculesService.getItemDetails(id).pipe(
        map(output => this.chemParser.extractSdfContent(output) || ''),
        catchError(() => of(''))
      );
    });

    const productRequests = rxnHeader.productIds.map(id => {
      if (sdfMap.has(id)) {
        return of(sdfMap.get(id)!);
      }
      return this.moleculesService.getItemDetails(id).pipe(
        map(output => this.chemParser.extractSdfContent(output) || ''),
        catchError(() => of(''))
      );
    });

    forkJoin({
      reactants: forkJoin(reactantRequests.length > 0 ? reactantRequests : [of('')]),
      products: forkJoin(productRequests.length > 0 ? productRequests : [of('')])
    }).subscribe(({ reactants, products }) => {
      const validReactants = reactants.filter(s => s && s.includes('M  END'));
      const validProducts = products.filter(s => s && s.includes('M  END'));

      if (validReactants.length > 0 || validProducts.length > 0) {
        const rxnFile = this.chemParser.buildRxnFileFromSdfBlocks(validReactants, validProducts, patternName);
        this.currentSdfContent = rxnFile;
        this.moleculeSections = this.taskOutputParser.parseSectionsFromOutput(this.itemDetailOutput || '', this.task.id, this.currentSdfContent);
      }
    });
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
