import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { environment } from '../../../environments/environment';

import {
  AtomElectronicRow,
  AtomChargeRow,
  AltNameRow,
  MatchedAtomRow,
  BondChangeRow,
  ReactionRateRow,
  BensonGroupRow,
  BensonGroupTableData,
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
    BensonGroupCardComponent
  ],
  templateUrl: './task-list-view.component.html',
  styleUrls: ['./task-list-view.component.scss']
})
export class TaskListViewComponent implements OnChanges {
  @Input({ required: true }) task!: CatalogTask;
  @ViewChild('ketcherIframe') ketcherIframe!: ElementRef<HTMLIFrameElement>;

  public items: CatalogItem[] = [];
  public isLoading: boolean = false;
  public isDetailLoading: boolean = false;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;
  public selectedItem: CatalogItem | null = null;
  public itemDetailOutput: string | null = null;
  public moleculeSections: MoleculeSection[] = [];
  public selectedTabIndex: number = 0;

  public ketcherSafeUrl: SafeResourceUrl;
  public currentSdfContent: string | null = null;
  public isKetcherLoaded: boolean = false;

  public readonly electronicDisplayedColumns: string[] = ['atomIndex', 'atomicNumber', 'charge', 'nElectrons', 'shells'];
  public readonly chargeDisplayedColumns: string[] = ['atomIndex', 'radius', 'electronegativity', 'screening', 'effectiveCharge', 'residualCharge', 'beta'];
  public readonly matchedAtomsDisplayedColumns: string[] = ['reactantMolecule', 'reactantIndex', 'productMolecule', 'productIndex'];
  public readonly bondChangesDisplayedColumns: string[] = ['reactantAtom1', 'reactantAtom2', 'productAtom1', 'productAtom2'];
  public readonly reactionRateDisplayedColumns: string[] = ['direction', 'aConstant', 'nExponent', 'energy', 'type', 'reference'];
  public readonly bensonGroupDisplayedColumns: string[] = ['name', 'heatOfFormation', 'entropy', 'cp300', 'cp400', 'cp500', 'cp600', 'cp800', 'cp1000', 'cp1500'];

  constructor(
    private apiService: ReactCloudApiService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.ketcherSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.ketcherUrl);
  }

  @HostListener('window:message', ['$event'])
  onWindowMessage(event: MessageEvent): void {
    if (event.data?.eventType === 'init' || event.data === 'ketcher-ready') {
      this.isKetcherLoaded = true;
      if (this.currentSdfContent) {
        this.sendSdfToKetcher(this.currentSdfContent);
      }
    }
  }

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

    this.apiService.runCatalogTaskWithRegistry(this.task.id).subscribe({
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

    this.apiService.fetchItemDetails(this.task.id, item.name).subscribe({
      next: (detailOutput) => {
        this.itemDetailOutput = detailOutput;
        this.currentSdfContent = this.extractSdfContent(detailOutput);
        this.moleculeSections = this.parseSectionsFromOutput(detailOutput);
        this.isDetailLoading = false;

        const rxnHeader = this.parseReactionHeader(detailOutput);
        if (rxnHeader && (!this.currentSdfContent || !this.currentSdfContent.includes('$RXN')) && (rxnHeader.reactantIds.length > 0 || rxnHeader.productIds.length > 0)) {
          this.loadReactionMoleculeSdfs(rxnHeader, item.name);
        } else if (this.currentSdfContent) {
          setTimeout(() => this.sendSdfToKetcher(this.currentSdfContent!), 200);
          setTimeout(() => this.sendSdfToKetcher(this.currentSdfContent!), 600);
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

  public onKetcherIframeLoad(): void {
    this.isKetcherLoaded = true;
    if (this.currentSdfContent) {
      this.sendSdfToKetcher(this.currentSdfContent);
    }
  }

  public reloadKetcherStructure(): void {
    if (this.currentSdfContent) {
      this.sendSdfToKetcher(this.currentSdfContent);
      this.snackBar.open('Reloading structure in Ketcher panel...', 'Dismiss', { duration: 1500 });
    }
  }

  public triggerKetcherLayout(): void {
    if (this.ketcherIframe?.nativeElement?.contentWindow) {
      this.ketcherIframe.nativeElement.contentWindow.postMessage({
        eventType: 'LAYOUT_STRUCTURE'
      }, '*');
      this.snackBar.open('Auto-arranging 2D chemical structure layout...', 'Dismiss', { duration: 1500 });
    }
  }

  public sendSdfToKetcher(sdfContent: string): void {
    if (!sdfContent) return;
    if (this.ketcherIframe?.nativeElement?.contentWindow) {
      this.ketcherIframe.nativeElement.contentWindow.postMessage({
        eventType: 'SET_STRUCTURE',
        molfile: sdfContent
      }, '*');
    }
  }

  public loadReactionMoleculeSdfs(rxnHeader: { reactantIds: string[]; productIds: string[] }, patternName: string): void {
    const sdfMap = this.extractSdfBlockMap(this.itemDetailOutput || '');

    const reactantRequests = rxnHeader.reactantIds.map(id => {
      if (sdfMap.has(id)) {
        return of(sdfMap.get(id)!);
      }
      return this.apiService.fetchItemDetails('molecules', id).pipe(
        map(output => this.extractSdfContent(output) || ''),
        catchError(() => of(''))
      );
    });

    const productRequests = rxnHeader.productIds.map(id => {
      if (sdfMap.has(id)) {
        return of(sdfMap.get(id)!);
      }
      return this.apiService.fetchItemDetails('molecules', id).pipe(
        map(output => this.extractSdfContent(output) || ''),
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
        const rxnFile = this.buildRxnFileFromSdfBlocks(validReactants, validProducts, patternName);
        this.currentSdfContent = rxnFile;
        this.moleculeSections = this.parseSectionsFromOutput(this.itemDetailOutput || '');

        if (this.currentSdfContent) {
          setTimeout(() => this.sendSdfToKetcher(this.currentSdfContent!), 200);
          setTimeout(() => this.sendSdfToKetcher(this.currentSdfContent!), 600);
        }
      }
    });
  }

  public parseReactionHeader(rawOutput: string): { reactantIds: string[]; productIds: string[] } | null {
    if (!rawOutput) return null;

    const lines = rawOutput.split(/\r?\n/);
    let reactantIds: string[] = [];
    let productIds: string[] = [];

    for (const line of lines) {
      const cleanLine = line.trim();
      
      if (/:\s*Reactants\s*:/i.test(cleanLine)) {
        const afterColon = cleanLine.split(/:\s*Reactants\s*:/i)[1];
        if (afterColon) {
          reactantIds = afterColon.replace(/[^\d\s]/g, '').trim().split(/\s+/).filter(id => id.length > 0);
        }
      }
      
      if (/:\s*Products\s*:/i.test(cleanLine)) {
        const afterColon = cleanLine.split(/:\s*Products\s*:/i)[1];
        if (afterColon) {
          productIds = afterColon.replace(/[^\d\s]/g, '').trim().split(/\s+/).filter(id => id.length > 0);
        }
      }
    }

    if (reactantIds.length > 0 || productIds.length > 0) {
      return { reactantIds, productIds };
    }

    return null;
  }

  public formatMolBlockForRxn(chunk: string): { molIds: string[]; molBlock: string } | null {
    const trimmed = chunk.trim();
    if (!trimmed.includes('M  END')) return null;

    const lines = trimmed.split(/\r?\n/);
    const countsLineIdx = lines.findIndex(l => /^\s*\d+\s+\d+/.test(l));
    if (countsLineIdx < 0) return null;

    const preambleLines = lines.slice(0, countsLineIdx);
    const preambleText = preambleLines.join(' ');
    const idMatches = preambleText.match(/\b(\d{4,})\b/g) || [];

    // Format preamble to exactly 3 lines required by MDL $MOL / $RXN spec
    let preamble = lines.slice(0, countsLineIdx);
    if (preamble.length === 0) {
      preamble = ['Molecule', '  -REACTCLOUD-', ''];
    } else if (preamble.length === 1) {
      preamble = [preamble[0], '  -REACTCLOUD-', ''];
    } else if (preamble.length === 2) {
      preamble = [preamble[0], preamble[1], ''];
    } else if (preamble.length > 3) {
      preamble = preamble.slice(preamble.length - 3);
    }

    const body = lines.slice(countsLineIdx);

    if (!body[0].includes('V2000')) {
      const countsMatch = body[0].match(/^\s*(\d+)\s+(\d+)/);
      if (countsMatch) {
        const nAtoms = parseInt(countsMatch[1], 10);
        const nBonds = parseInt(countsMatch[2], 10);
        const formattedAtoms = nAtoms.toString().padStart(3, ' ');
        const formattedBonds = nBonds.toString().padStart(3, ' ');
        body[0] = `${formattedAtoms}${formattedBonds}  0  0  0  0  0  0  0  0999 V2000`;
      }
    }

    const molBlock = [...preamble, ...body].join('\n');
    return { molIds: idMatches, molBlock };
  }

  public extractSdfBlockMap(rawOutput: string): Map<string, string> {
    const map = new Map<string, string>();
    if (!rawOutput) return map;

    const rawChunks = rawOutput.split(/\r?\n\s*~\s*\r?\n/);
    for (const chunk of rawChunks) {
      const res = this.formatMolBlockForRxn(chunk);
      if (res) {
        for (const idStr of res.molIds) {
          map.set(idStr, res.molBlock);
        }
      }
    }
    return map;
  }

  public buildRxnFileFromSdfBlocks(reactantSdfs: string[], productSdfs: string[], title: string = 'Reaction Pattern'): string {
    const rCount = reactantSdfs.length.toString().padStart(3, ' ');
    const pCount = productSdfs.length.toString().padStart(3, ' ');

    let rxn = `$RXN\n$MDL\n${title}\n  REACTCLOUD\n\n${rCount}${pCount}\n`;

    for (const sdf of reactantSdfs) {
      rxn += `$MOL\n${sdf}\n`;
    }
    for (const sdf of productSdfs) {
      rxn += `$MOL\n${sdf}\n`;
    }

    return rxn;
  }

  public extractSdfContent(rawOutput: string): string | null {
    if (!rawOutput) return null;

    // Check if rawOutput contains an MDL $RXN reaction block
    if (rawOutput.includes('$RXN')) {
      const rxnIdx = rawOutput.indexOf('$RXN');
      const sub = rawOutput.substring(rxnIdx);
      const lastMEnd = sub.lastIndexOf('M  END');
      if (lastMEnd !== -1) {
        return sub.substring(0, lastMEnd + 6).trim();
      }
      return sub.trim();
    }

    // Check if this output represents a Reaction Pattern with Reactants & Products
    const rxnHeader = this.parseReactionHeader(rawOutput);
    if (rxnHeader) {
      const sdfMap = this.extractSdfBlockMap(rawOutput);
      const reactantSdfs: string[] = [];
      const productSdfs: string[] = [];

      for (const rId of rxnHeader.reactantIds) {
        if (sdfMap.has(rId)) {
          reactantSdfs.push(sdfMap.get(rId)!);
        }
      }
      for (const pId of rxnHeader.productIds) {
        if (sdfMap.has(pId)) {
          productSdfs.push(sdfMap.get(pId)!);
        }
      }

      if (reactantSdfs.length > 0 || productSdfs.length > 0) {
        return this.buildRxnFileFromSdfBlocks(reactantSdfs, productSdfs);
      }
    }

    // Fallback to single molecule SDF extraction
    const rawChunks = rawOutput.split(/\r?\n\s*~\s*\r?\n/);
    for (const chunk of rawChunks) {
      let trimmed = chunk.trim();
      if (trimmed.includes('M  END')) {
        const lines = trimmed.split(/\r?\n/);
        const countsLineIdx = lines.findIndex(l => /^\s*\d+\s+\d+/.test(l));

        if (countsLineIdx >= 3) {
          const preamble = lines.slice(countsLineIdx - 3, countsLineIdx);
          const body = lines.slice(countsLineIdx);

          if (!body[0].includes('V2000')) {
            const countsMatch = body[0].match(/^\s*(\d+)\s+(\d+)/);
            if (countsMatch) {
              const nAtoms = parseInt(countsMatch[1], 10);
              const nBonds = parseInt(countsMatch[2], 10);
              const formattedAtoms = nAtoms.toString().padStart(3, ' ');
              const formattedBonds = nBonds.toString().padStart(3, ' ');
              body[0] = `${formattedAtoms}${formattedBonds}  0  0  0  0  0  0  0  0999 V2000`;
            }
          }

          return [...preamble, ...body].join('\n');
        }

        return trimmed;
      }
    }
    return null;
  }

  /**
   * Parses raw output into distinct section cards based on '~' delimiters.
   */
  public parseSectionsFromOutput(rawOutput: string): MoleculeSection[] {
    if (!rawOutput) return [];

    if (rawOutput.includes('--- Output File (BensonStandard.out) ---')) {
      rawOutput = rawOutput.replace(/\r?\n--- Output File \(BensonStandard\.out\) ---\r?\n/, '\n~\n--- Output File (BensonStandard.out) ---\n');
    }

    const isReactionTask = this.task?.id === 'rxn-patterns';
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
          if (cleanLine.includes('BensonStandard.out')) {
            title = 'Benson Thermodynamics Table (BensonStandard.out)';
            icon = 'thermostat';
          } else {
            title = 'Output File Header';
            icon = 'file_present';
          }
          break;
        } else if (cleanLine.startsWith('$RXN') || cleanLine.includes('$RXN')) {
          title = 'Molecule / Reaction in $RXN form';
          icon = 'hub';
          break;
        } else if (cleanLine.startsWith(':MolFile') || cleanLine.includes(':MolFile') || cleanLine.includes('M  END')) {
          title = isReactionTask ? 'Molecule / Reaction in $RXN form' : 'Molecule in SDF form';
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
        } else if (cleanLine.includes('Benson Thermodynamics') || cleanLine.includes('Calculated Benson') || cleanLine.includes('CC - A1N1') || cleanLine.includes('Thermochemical Kinetics')) {
          title = 'Benson Thermodynamics Table (BensonStandard.out)';
          icon = 'thermostat';
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
        } else if (cleanLine.includes('Correspondences') || cleanLine.includes('Matched Atoms') || cleanLine.includes('Bond Changes') || cleanLine.includes('Reactant Bond')) {
          title = 'Section 5: Atom Correspondences & Bond Changes';
          icon = 'compare_arrows';
          break;
        } else if (cleanLine.includes('ForwardRxn') || cleanLine.includes('ReverseRxn') || cleanLine.startsWith('Forward:') || cleanLine.startsWith('Reverse:')) {
          title = 'Reaction Rate Parameters';
          icon = 'functions';
          break;
        } else if (cleanLine.startsWith('Chemistry Database') || cleanLine.startsWith('main>>')) {
          title = 'Execution Log & Command Stream';
          icon = 'terminal';
          break;
        }
      }

      let electronicTableData: AtomElectronicRow[] | undefined = undefined;
      let chargeTableData: AtomChargeRow[] | undefined = undefined;
      let altNamesData: AltNameRow[] | undefined = undefined;
      let matchedAtomsData: MatchedAtomRow[] | undefined = undefined;
      let bondChangesData: BondChangeRow[] | undefined = undefined;
      let reactionRateData: ReactionRateRow[] | undefined = undefined;
      let bensonGroupTableData: BensonGroupTableData | undefined = undefined;

      if (title.includes('Electronic Properties')) {
        electronicTableData = this.parseElectronicTable(lines);
      } else if (title.includes('Atomic Radii')) {
        chargeTableData = this.parseChargeTable(lines);
      } else if (title.includes('Alternative Chemical Names')) {
        altNamesData = this.parseAltNames(lines);
      } else if (title.includes('Correspondences') || title.includes('Section 5')) {
        matchedAtomsData = this.parseMatchedAtomsTable(lines);
        bondChangesData = this.parseBondChangesTable(lines);
      } else if (title.includes('Reaction Rate') || title.includes('ForwardRxn') || title.includes('ReverseRxn') || title.includes('Section 2') || title.includes('Section 3')) {
        reactionRateData = this.parseReactionRateTable(lines);
      } else if (title.includes('Benson') || title.includes('TableA.1') || title.includes('job1.out') || trimmed.includes('CC - A1N1')) {
        bensonGroupTableData = this.parseBensonGroupTable(trimmed);
      } else if (title.includes('Chemkin Database Thermodynamics')) {
        const chunkLines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (chunkLines.length >= 4) {
          const last4 = chunkLines.slice(-4);
          last4[0] = last4[0].replace(/^\s+/, '');
          trimmed = last4.join('\n');
        }
      }

      const currentId = sectionId++;

      if (isReactionTask) {
        if (currentId === 2 || currentId === 3 || title.includes('ForwardRxn') || title.includes('ReverseRxn') || title.includes('Section 2') || title.includes('Section 3')) {
          title = 'Section 2 & 3: Reaction Rate Parameters';
          icon = 'functions';
          reactionRateData = this.parseReactionRateTable(lines);
        } else if (currentId === 5 || title.includes('Correspondences')) {
          title = 'Section 5: Atom Correspondences & Bond Changes';
          icon = 'compare_arrows';
          matchedAtomsData = this.parseMatchedAtomsTable(lines);
          bondChangesData = this.parseBondChangesTable(lines);
        } else if (currentId === 10 || title === 'Section 10') {
          title = 'Thermodynamic Values';
          icon = 'thermostat';
        } else if (currentId === 11 || title === 'Section 11') {
          title = 'Misc. Reaction Properties';
          icon = 'tune';
        } else if (currentId === 12 || title === 'Section 12') {
          title = 'Exponential (Arrhenius Form) Constants';
          icon = 'functions';
        }
      }

      const collapsedIds = [1, 5, 7, 8, 10, 11, 12];
      const isExpanded = !collapsedIds.includes(currentId);

      sections.push({
        id: currentId,
        title: title,
        icon: icon,
        content: trimmed,
        isExpanded: isExpanded,
        electronicTableData: electronicTableData,
        chargeTableData: chargeTableData,
        altNamesData: altNamesData,
        matchedAtomsData: matchedAtomsData,
        bondChangesData: bondChangesData,
        reactionRateData: reactionRateData,
        bensonGroupTableData: bensonGroupTableData
      });
    }

    if (isReactionTask) {
      // Reaction Pattern Ordering & Section Composition
      let rxnContent = this.currentSdfContent && this.currentSdfContent.startsWith('$RXN') ? this.currentSdfContent : null;

      if (!rxnContent) {
        const rxnHeader = this.parseReactionHeader(rawOutput);
        if (rxnHeader) {
          const sdfMap = this.extractSdfBlockMap(rawOutput);
          const reactantSdfs = rxnHeader.reactantIds.map(id => sdfMap.get(id)!).filter(Boolean);
          const productSdfs = rxnHeader.productIds.map(id => sdfMap.get(id)!).filter(Boolean);
          if (reactantSdfs.length > 0 || productSdfs.length > 0) {
            rxnContent = this.buildRxnFileFromSdfBlocks(reactantSdfs, productSdfs);
          }
        }
      }

      const findAndRemove = (predicate: (s: MoleculeSection) => boolean): MoleculeSection | undefined => {
        const idx = sections.findIndex(predicate);
        if (idx !== -1) {
          return sections.splice(idx, 1)[0];
        }
        return undefined;
      };

      // 1. Eliminate Section 4 completely
      for (let j = sections.length - 1; j >= 0; j--) {
        if (sections[j].id === 4 || sections[j].title.includes('Section 4')) {
          sections.splice(j, 1);
        }
      }

      // 2. Extract Execution Log (unexpanded)
      const secLog = findAndRemove(s => s.title.includes('Execution Log'));
      if (secLog) {
        secLog.isExpanded = false;
      }

      // 3. Extract Section 1 ($RXN form) (unexpanded)
      const secRxnFromChunks = findAndRemove(s => s.title.includes('$RXN') || s.content.startsWith('$RXN') || s.title.includes('Section 1') || s.id === 1);
      let secSection1: MoleculeSection | undefined = undefined;

      if (rxnContent || secRxnFromChunks) {
        secSection1 = {
          id: 1,
          title: 'Section 1: Molecule / Reaction in $RXN form',
          icon: 'hub',
          content: rxnContent || secRxnFromChunks?.content || '',
          isExpanded: false
        };
      }

      // 4. Extract Section 5 (expanded)
      const secSection5 = findAndRemove(s => s.title.includes('Section 5') || s.id === 5 || s.title.includes('Correspondences'));
      if (secSection5) {
        secSection5.isExpanded = true;
      }

      // 5. Collect and merge all reaction rate rows (Sections 2 and 3) into a single card (expanded)
      const rateSections = sections.filter(s => (s.reactionRateData && s.reactionRateData.length > 0) || s.title.includes('Reaction Rate'));
      let combinedRateCard: MoleculeSection | undefined = undefined;

      if (rateSections.length > 0) {
        const combinedRows: ReactionRateRow[] = [];
        const combinedContentLines: string[] = [];

        rateSections.forEach(sec => {
          if (sec.reactionRateData) {
            combinedRows.push(...sec.reactionRateData);
          }
          if (sec.content) {
            combinedContentLines.push(sec.content);
          }
        });

        // Remove individual rate sections from sections list
        for (let j = sections.length - 1; j >= 0; j--) {
          const secItem = sections[j];
          if (secItem && ((secItem.reactionRateData && secItem.reactionRateData.length > 0) || secItem.title.includes('Reaction Rate'))) {
            sections.splice(j, 1);
          }
        }

        combinedRateCard = {
          id: 2,
          title: 'Section 2 & 3: Reaction Rate Parameters',
          icon: 'functions',
          content: combinedContentLines.join('\n\n'),
          isExpanded: true,
          reactionRateData: combinedRows
        };
      }

      const orderedSections: MoleculeSection[] = [];

      // 1st: Show Section 2 & 3 first (expanded)
      if (combinedRateCard) {
        orderedSections.push(combinedRateCard);
      }

      // 2nd: Followed by Section 5 (expanded)
      if (secSection5) {
        orderedSections.push(secSection5);
      }

      // 3rd: Add any other remaining sections (excluding Section 4)
      orderedSections.push(...sections);

      // 4th: Add Section 1 (unexpanded) just before Execution Log
      if (secSection1) {
        orderedSections.push(secSection1);
      }

      // 5th: Lastly Execution Log & Command Stream (unexpanded)
      if (secLog) {
        orderedSections.push(secLog);
      }

      return orderedSections;
    } else {
      // Molecule / Substructure / Benson Group Ordering
      const findAndRemove = (predicate: (s: MoleculeSection) => boolean): MoleculeSection | undefined => {
        const idx = sections.findIndex(predicate);
        if (idx !== -1) {
          return sections.splice(idx, 1)[0];
        }
        return undefined;
      };

      const isBensonTask = this.task?.id === 'benson-groups';
      const secBensonThermo = findAndRemove(s => s.title.includes('Benson') || s.content.includes('CC - A1N1') || s.content.includes('Thermochemical Kinetics') || s.content.includes('Output File (job1.out)') || s.content.includes('Output File (BensonStandard.out)'));
      const secElectronic = findAndRemove(s => s.title.includes('Electronic Properties'));
      const secRadii = findAndRemove(s => s.title.includes('Atomic Radii'));
      const secThermo = findAndRemove(s => s.title.includes('Chemkin Database Thermodynamics'));
      const secAltNames = findAndRemove(s => s.title.includes('Alternative Chemical Names'));
      const secSdf = findAndRemove(s => s.title.includes('Molecule in SDF form') || s.content.includes('M  END'));
      const secLog = findAndRemove(s => s.title.includes('Execution Log') || s.id === 1);

      const orderedSections: MoleculeSection[] = [];

      if (secBensonThermo) {
        secBensonThermo.title = 'Benson Thermodynamics Table';
        secBensonThermo.icon = 'thermostat';
        secBensonThermo.isExpanded = true;
        if (secBensonThermo.content.includes('--- Output File (job1.out) ---')) {
          secBensonThermo.content = secBensonThermo.content.replace(/^--- Output File \(job1\.out\) ---\r?\n?/, '');
        } else if (secBensonThermo.content.includes('--- Output File (BensonStandard.out) ---')) {
          secBensonThermo.content = secBensonThermo.content.replace(/^--- Output File \(BensonStandard\.out\) ---\r?\n?/, '');
        }
        if (!secBensonThermo.bensonGroupTableData) {
          secBensonThermo.bensonGroupTableData = this.parseBensonGroupTable(secBensonThermo.content);
        }
        orderedSections.push(secBensonThermo);
      }

      if (isBensonTask) {
        return orderedSections;
      }

      if (secElectronic) orderedSections.push(secElectronic);
      if (secRadii) orderedSections.push(secRadii);
      if (secThermo) orderedSections.push(secThermo);
      if (secAltNames) orderedSections.push(secAltNames);
      if (secSdf) orderedSections.push(secSdf);

      orderedSections.push(...sections);
      if (secLog) {
        secLog.isExpanded = false;
        orderedSections.push(secLog);
      }

      return orderedSections;
    }
  }

  /**
   * Parses Benson Thermodynamic Group Table output from job1.out into structured BensonGroupTableData
   */
  public parseBensonGroupTable(content: string): BensonGroupTableData | undefined {
    if (!content) return undefined;

    let cleanContent = content;
    if (cleanContent.includes('--- Output File')) {
      cleanContent = cleanContent.replace(/^[\s\S]*?--- Output File \([^)]+\) ---\r?\n?/, '');
    }

    const lines = cleanContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) return undefined;

    const tableName = lines[0];
    const reference = lines[1];
    const pattern = lines[2];

    const rows: BensonGroupRow[] = [];
    let currentGroup: Partial<BensonGroupRow> | null = null;

    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];

      if (line.endsWith('<>')) {
        const groupName = line.replace(/<>\s*$/, '').trim();
        currentGroup = {
          name: groupName,
          heatOfFormation: '-',
          entropy: '-',
          cp300: '-',
          cp400: '-',
          cp500: '-',
          cp600: '-',
          cp800: '-',
          cp1000: '-',
          cp1500: '-'
        };
      } else if (currentGroup && line.includes('<HeatOfFormation>')) {
        const match = line.match(/<HeatOfFormation>\s*([\d\.\-]+)\s*<\/HeatOfFormation>/i);
        if (match) {
          currentGroup.heatOfFormation = match[1];
        }
      } else if (currentGroup && line.includes('<Entropy>')) {
        const match = line.match(/<Entropy>\s*([\d\.\-]+)\s*<\/Entropy>/i);
        if (match) {
          currentGroup.entropy = match[1];
        }
      } else if (currentGroup && line.includes('<Cp>')) {
        if (i + 1 < lines.length) {
          const cpLine = lines[i + 1];
          const tokens = cpLine.split(/\s+/).filter(t => t.length > 0 && !isNaN(parseFloat(t)));
          if (tokens.length >= 7) {
            currentGroup.cp300 = tokens[0];
            currentGroup.cp400 = tokens[1];
            currentGroup.cp500 = tokens[2];
            currentGroup.cp600 = tokens[3];
            currentGroup.cp800 = tokens[4];
            currentGroup.cp1000 = tokens[5];
            currentGroup.cp1500 = tokens[6];
          }
          i++;
        }
      } else if (line.includes('</>')) {
        if (currentGroup && currentGroup.name) {
          rows.push(currentGroup as BensonGroupRow);
        }
        currentGroup = null;
      }
    }

    if (rows.length === 0) {
      return undefined;
    }

    return {
      tableName,
      reference,
      pattern,
      rows
    };
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

  public parseAltNames(lines: string[]): AltNameRow[] {
    const results: AltNameRow[] = [];
    let currentType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.includes('Alternative Names')) continue;

      if (line.includes(';')) {
        const parts = line.split(';')[0].trim().split(/\s+/);
        if (parts.length >= 2) {
          currentType = parts.slice(1).join(' ').toUpperCase();
        } else if (parts.length === 1) {
          currentType = parts[0].toUpperCase();
        }
      } else if (currentType && line.length > 0) {
        results.push({
          name: line.trim(),
          type: currentType
        });
        currentType = '';
      }
    }

    return results;
  }

  public parseMatchedAtomsTable(lines: string[]): MatchedAtomRow[] {
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

  public parseBondChangesTable(lines: string[]): BondChangeRow[] {
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

  public parseReactionRateTable(lines: string[], defaultDirection: string = 'Forward'): ReactionRateRow[] {
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
