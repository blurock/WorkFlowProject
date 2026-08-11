import {
  MoleculeSection,
  AtomElectronicRow,
  AtomChargeRow,
  AltNameRow,
  MatchedAtomRow,
  BondChangeRow,
  ReactionRateRow,
  BensonGroupTableData
} from '../../models/task-list.models';

import { ElectronicPropertiesCardComponent } from '../../components/task-list-view/cards/electronic-properties-card.component';
import { AtomicRadiiCardComponent } from '../../components/task-list-view/cards/atomic-radii-card.component';
import { AltNamesCardComponent } from '../../components/task-list-view/cards/alt-names-card.component';
import { AtomCorrespondencesCardComponent } from '../../components/task-list-view/cards/atom-correspondences-card.component';
import { ReactionRateCardComponent } from '../../components/task-list-view/cards/reaction-rate-card.component';
import { BensonGroupCardComponent } from '../../components/task-list-view/cards/benson-group-card.component';

export abstract class BaseTaskOutputParser {

  public abstract parse(rawOutput: string, currentSdfContent?: string | null): MoleculeSection[];

  /**
   * Normalizes raw output by separating --- headers with ~ delimiters and splitting into raw text chunks.
   */
  protected splitRawChunks(rawOutput: string): string[] {
    if (!rawOutput) return [];

    let processedOutput = rawOutput;
    if (processedOutput.includes('--- Output File (BensonStandard.out) ---')) {
      processedOutput = processedOutput.replace(/\r?\n--- Output File \(BensonStandard\.out\) ---\r?\n/, '\n~\n--- Output File (BensonStandard.out) ---\n');
    }
    if (processedOutput.includes('--- ')) {
      processedOutput = processedOutput.replace(/(^|\r?\n)--- /g, '$1~\n--- ');
    }

    return processedOutput.split(/\r?\n\s*~\s*\r?\n/);
  }

  /**
   * Determines section title and icon from line content.
   */
  protected detectTitleAndIcon(cleanLine: string, isReactionTask: boolean = false): { title: string; icon: string } | null {
    if (cleanLine.includes('--- Mechanism Reactions')) {
      return { title: cleanLine.replace(/---/g, '').trim(), icon: 'account_tree' };
    } else if (cleanLine.includes('--- Molecule Structures')) {
      return { title: cleanLine.replace(/---/g, '').trim(), icon: 'hub' };
    } else if (cleanLine.includes('--- Molecule Thermodynamics')) {
      return { title: cleanLine.replace(/---/g, '').trim(), icon: 'thermostat' };
    } else if (cleanLine.includes('--- Name Correspondences')) {
      return { title: cleanLine.replace(/---/g, '').trim(), icon: 'badge' };
    } else if (cleanLine.includes('--- Execution Log') || cleanLine.includes('--- Output File')) {
      return { title: cleanLine.replace(/---/g, '').trim(), icon: 'terminal' };
    } else if (cleanLine.startsWith('$RXN') || cleanLine.includes('$RXN')) {
      return { title: 'Molecule / Reaction in $RXN form', icon: 'hub' };
    } else if (cleanLine.startsWith(':MolFile') || cleanLine.includes(':MolFile') || cleanLine.includes('M  END')) {
      return { title: isReactionTask ? 'Molecule / Reaction in $RXN form' : 'Molecule in SDF form', icon: 'hub' };
    } else if (cleanLine.includes('Electronic') || cleanLine.includes('----- Electronic')) {
      return { title: 'Electronic Properties & Shells', icon: 'bolt' };
    } else if (cleanLine.includes('Radius') || cleanLine.includes('Electro-')) {
      return { title: 'Atomic Radii, Electronegativity & Charge Factors', icon: 'analytics' };
    } else if (cleanLine.includes('Resonance') || cleanLine.includes('----- Resonances')) {
      return { title: 'Resonance Structures', icon: 'alt_route' };
    } else if (cleanLine.includes('Alternative Names')) {
      return { title: 'Alternative Chemical Names', icon: 'badge' };
    } else if (cleanLine.includes('Chemkin Database Thermodynamic')) {
      return { title: 'Chemkin Database Thermodynamics', icon: 'thermostat' };
    } else if (cleanLine.includes('Benson Thermodynamics') || cleanLine.includes('Calculated Benson') || cleanLine.includes('CC - A1N1') || cleanLine.includes('Thermochemical Kinetics')) {
      return { title: 'Benson Thermodynamics Table (BensonStandard.out)', icon: 'thermostat' };
    } else if (cleanLine.includes('Graph')) {
      return { title: 'Molecular Graph Representation', icon: 'schema' };
    } else if (cleanLine.includes('Single Bond') || cleanLine.includes('Double Bond')) {
      return { title: 'Bonds & Connectivity', icon: 'link' };
    } else if (cleanLine.startsWith(':Atom') || cleanLine.includes(':Atom')) {
      return { title: 'Atomic Coordinates & Elements', icon: 'bubble_chart' };
    } else if (cleanLine.includes('Correspondences') || cleanLine.includes('Matched Atoms') || cleanLine.includes('Bond Changes') || cleanLine.includes('Reactant Bond')) {
      return { title: 'Section 5: Atom Correspondences & Bond Changes', icon: 'compare_arrows' };
    } else if (cleanLine.includes('ForwardRxn') || cleanLine.includes('ReverseRxn') || cleanLine.startsWith('Forward:') || cleanLine.startsWith('Reverse:')) {
      return { title: 'Reaction Rate Parameters', icon: 'functions' };
    } else if (cleanLine.startsWith('Chemistry Database') || cleanLine.startsWith('main>>')) {
      return { title: 'Execution Log & Command Stream', icon: 'terminal' };
    }
    return null;
  }

  /**
   * Delegates parsing of section lines to the appropriate Card Component static parser.
   */
  protected parseSectionData(title: string, lines: string[], trimmed: string): Partial<MoleculeSection> {
    let electronicTableData: AtomElectronicRow[] | undefined = undefined;
    let chargeTableData: AtomChargeRow[] | undefined = undefined;
    let altNamesData: AltNameRow[] | undefined = undefined;
    let matchedAtomsData: MatchedAtomRow[] | undefined = undefined;
    let bondChangesData: BondChangeRow[] | undefined = undefined;
    let reactionRateData: ReactionRateRow[] | undefined = undefined;
    let bensonGroupTableData: BensonGroupTableData | undefined = undefined;

    if (title.includes('Electronic Properties')) {
      electronicTableData = ElectronicPropertiesCardComponent.parseElectronicTable(lines);
    } else if (title.includes('Atomic Radii')) {
      chargeTableData = AtomicRadiiCardComponent.parseChargeTable(lines);
    } else if (title.includes('Alternative Chemical Names')) {
      altNamesData = AltNamesCardComponent.parseAltNames(lines);
    } else if (title.includes('Correspondences') || title.includes('Section 5')) {
      matchedAtomsData = AtomCorrespondencesCardComponent.parseMatchedAtomsTable(lines);
      bondChangesData = AtomCorrespondencesCardComponent.parseBondChangesTable(lines);
    } else if (title.includes('Reaction Rate') || title.includes('ForwardRxn') || title.includes('ReverseRxn') || title.includes('Section 2') || title.includes('Section 3')) {
      reactionRateData = ReactionRateCardComponent.parseReactionRateTable(lines);
    } else if (title.includes('Benson') || title.includes('TableA.1') || title.includes('job1.out') || trimmed.includes('CC - A1N1')) {
      bensonGroupTableData = BensonGroupCardComponent.parseBensonGroupTable(trimmed);
    }

    return {
      electronicTableData,
      chargeTableData,
      altNamesData,
      matchedAtomsData,
      bondChangesData,
      reactionRateData,
      bensonGroupTableData
    };
  }
}
