import { Injectable } from '@angular/core';
import {
  MoleculeSection,
  AtomElectronicRow,
  AtomChargeRow,
  AltNameRow,
  MatchedAtomRow,
  BondChangeRow,
  ReactionRateRow,
  BensonGroupTableData,
  MechFileData
} from '../models/task-list.models';

import { MechReactionsCardComponent } from '../components/task-list-view/cards/mech-reactions-card.component';
import { ElectronicPropertiesCardComponent } from '../components/task-list-view/cards/electronic-properties-card.component';
import { AtomicRadiiCardComponent } from '../components/task-list-view/cards/atomic-radii-card.component';
import { AltNamesCardComponent } from '../components/task-list-view/cards/alt-names-card.component';
import { AtomCorrespondencesCardComponent } from '../components/task-list-view/cards/atom-correspondences-card.component';
import { ReactionRateCardComponent } from '../components/task-list-view/cards/reaction-rate-card.component';
import { BensonGroupCardComponent } from '../components/task-list-view/cards/benson-group-card.component';
import { ChemStructureParserService } from './chem-structure-parser.service';

@Injectable({
  providedIn: 'root'
})
export class TaskOutputParserService {

  constructor(private chemParser: ChemStructureParserService) {}

  /**
   * Parses raw task output string into structured, ordered MoleculeSection[] cards.
   */
  public parseSectionsFromOutput(rawOutput: string, taskId: string, currentSdfContent?: string | null): MoleculeSection[] {
    if (!rawOutput) return [];

    if (taskId === 'mechanisms' || rawOutput.includes('--- Mechanism Reactions ---')) {
      const mechSections: MoleculeSection[] = [];
      const mechHeaders = [
        { title: 'Mechanism Reactions', icon: 'account_tree' },
        { title: 'Molecule Structures', icon: 'hub' },
        { title: 'Molecule Thermodynamics', icon: 'thermostat' },
        { title: 'Name Correspondences', icon: 'badge' },
        { title: 'Execution Log', icon: 'terminal' }
      ];

      for (let idx = 0; idx < mechHeaders.length; idx++) {
        const headerInfo = mechHeaders[idx];
        const marker = `--- ${headerInfo.title} ---`;
        const startPos = rawOutput.indexOf(marker);
        if (startPos !== -1) {
          const contentStart = startPos + marker.length;
          let endPos = rawOutput.length;
          for (let j = 0; j < mechHeaders.length; j++) {
            if (j !== idx) {
              const nextMarker = `--- ${mechHeaders[j].title} ---`;
              const pos = rawOutput.indexOf(nextMarker, contentStart);
              if (pos !== -1 && pos < endPos) {
                endPos = pos;
              }
            }
          }
          const content = rawOutput.substring(contentStart, endPos).trim();
          let mechFileData: MechFileData | undefined = undefined;
          if (headerInfo.title === 'Mechanism Reactions' || content.includes('CLASSCOEFFICIENTS')) {
            mechFileData = MechReactionsCardComponent.parseMechFileContent(content);
          }
          mechSections.push({
            id: idx + 1,
            title: headerInfo.title,
            icon: headerInfo.icon,
            content: content,
            isExpanded: true,
            mechFileData: mechFileData
          });
        }
      }

      if (mechSections.length > 0) {
        return mechSections;
      }
    }

    let processedOutput = rawOutput;
    if (processedOutput.includes('--- Output File (BensonStandard.out) ---')) {
      processedOutput = processedOutput.replace(/\r?\n--- Output File \(BensonStandard\.out\) ---\r?\n/, '\n~\n--- Output File (BensonStandard.out) ---\n');
    }
    if (processedOutput.includes('--- ')) {
      processedOutput = processedOutput.replace(/(^|\r?\n)--- /g, '$1~\n--- ');
    }

    const isReactionTask = taskId === 'rxn-patterns';
    const isMechanismTask = taskId === 'mechanisms';
    const rawChunks = processedOutput.split(/\r?\n\s*~\s*\r?\n/);
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

        if (cleanLine.includes('--- Mechanism Reactions')) {
          title = cleanLine.replace(/---/g, '').trim();
          icon = 'account_tree';
          break;
        } else if (cleanLine.includes('--- Molecule Structures')) {
          title = cleanLine.replace(/---/g, '').trim();
          icon = 'hub';
          break;
        } else if (cleanLine.includes('--- Molecule Thermodynamics')) {
          title = cleanLine.replace(/---/g, '').trim();
          icon = 'thermostat';
          break;
        } else if (cleanLine.includes('--- Name Correspondences')) {
          title = cleanLine.replace(/---/g, '').trim();
          icon = 'badge';
          break;
        } else if (cleanLine.includes('--- Execution Log') || cleanLine.includes('--- Output File')) {
          title = cleanLine.replace(/---/g, '').trim();
          icon = 'terminal';
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
          reactionRateData = ReactionRateCardComponent.parseReactionRateTable(lines);
        } else if (currentId === 5 || title.includes('Correspondences')) {
          title = 'Section 5: Atom Correspondences & Bond Changes';
          icon = 'compare_arrows';
          matchedAtomsData = AtomCorrespondencesCardComponent.parseMatchedAtomsTable(lines);
          bondChangesData = AtomCorrespondencesCardComponent.parseBondChangesTable(lines);
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
      const isExpanded = isMechanismTask ? true : !collapsedIds.includes(currentId);

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
      let rxnContent = currentSdfContent && currentSdfContent.startsWith('$RXN') ? currentSdfContent : null;

      if (!rxnContent) {
        const rxnHeader = this.chemParser.parseReactionHeader(rawOutput);
        if (rxnHeader) {
          const sdfMap = this.chemParser.extractSdfBlockMap(rawOutput);
          const reactantSdfs = rxnHeader.reactantIds.map(id => sdfMap.get(id)!).filter(Boolean);
          const productSdfs = rxnHeader.productIds.map(id => sdfMap.get(id)!).filter(Boolean);
          if (reactantSdfs.length > 0 || productSdfs.length > 0) {
            rxnContent = this.chemParser.buildRxnFileFromSdfBlocks(reactantSdfs, productSdfs);
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

      const isBensonTask = taskId === 'benson-groups';
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
          secBensonThermo.bensonGroupTableData = BensonGroupCardComponent.parseBensonGroupTable(secBensonThermo.content);
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
}
