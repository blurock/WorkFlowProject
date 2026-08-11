import { Injectable } from '@angular/core';
import { BaseTaskOutputParser } from './base-task-output-parser';
import { MoleculeSection, ReactionRateRow } from '../../models/task-list.models';
import { ChemStructureParserService } from '../chem-structure-parser.service';
import { ReactionRateCardComponent } from '../../components/task-list-view/cards/reaction-rate-card.component';
import { AtomCorrespondencesCardComponent } from '../../components/task-list-view/cards/atom-correspondences-card.component';

@Injectable({
  providedIn: 'root'
})
export class RxnPatternOutputParser extends BaseTaskOutputParser {

  constructor(private chemParser: ChemStructureParserService) {
    super();
  }

  public parse(rawOutput: string, currentSdfContent?: string | null): MoleculeSection[] {
    if (!rawOutput) return [];

    const rawChunks = this.splitRawChunks(rawOutput);
    const sections: MoleculeSection[] = [];
    let sectionId = 1;

    for (let i = 0; i < rawChunks.length; i++) {
      let chunk = rawChunks[i];
      let trimmed = chunk.trim();
      if (!trimmed || trimmed === '~') continue;

      let lines = trimmed.split(/\r?\n/);
      let title = `Section ${sectionId}`;
      let icon = 'description';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;
        const detected = this.detectTitleAndIcon(cleanLine, true);
        if (detected) {
          title = detected.title;
          icon = detected.icon;
          break;
        }
      }

      const parsedData = this.parseSectionData(title, lines, trimmed);
      const currentId = sectionId++;

      let reactionRateData = parsedData.reactionRateData;
      let matchedAtomsData = parsedData.matchedAtomsData;
      let bondChangesData = parsedData.bondChangesData;

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

      sections.push({
        id: currentId,
        title: title,
        icon: icon,
        content: trimmed,
        isExpanded: false,
        reactionRateData: reactionRateData,
        matchedAtomsData: matchedAtomsData,
        bondChangesData: bondChangesData,
        ...parsedData
      });
    }

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
  }
}
