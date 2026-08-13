import { Injectable } from '@angular/core';
import { BaseTaskOutputParser } from './base-task-output-parser';
import { MoleculeSection, MechFileData, NameCorrespondence, MechThermoBlock, MechSdfBlock } from '../../models/task-list.models';
import { MechReactionsCardComponent } from '../../components/task-list-view/cards/mech-reactions-card.component';

@Injectable({
  providedIn: 'root'
})
export class MechanismOutputParser extends BaseTaskOutputParser {

  public parse(rawOutput: string): MoleculeSection[] {
    if (!rawOutput) return [];

    const mechSections: MoleculeSection[] = [];
    const mechHeaders = [
      { title: 'Mechanism Reactions', icon: 'account_tree', isExpanded: true },
      { title: 'Molecule Thermodynamics', icon: 'thermostat', isExpanded: true },
      { title: 'Molecule Structures', icon: 'hub', isExpanded: false },
      { title: 'Name Correspondences', icon: 'badge', isExpanded: false },
      { title: 'Execution Log', icon: 'terminal', isExpanded: false }
    ];

    // First, extract Name Correspondences content if present to build lookup map
    let correspondences: NameCorrespondence[] = [];
    const corrsMarker = '--- Name Correspondences ---';
    const corrsStart = rawOutput.indexOf(corrsMarker);
    if (corrsStart !== -1) {
      const contentStart = corrsStart + corrsMarker.length;
      let endPos = rawOutput.length;
      for (const h of mechHeaders) {
        if (h.title !== 'Name Correspondences') {
          const nextMarker = `--- ${h.title} ---`;
          const pos = rawOutput.indexOf(nextMarker, contentStart);
          if (pos !== -1 && pos < endPos) {
            endPos = pos;
          }
        }
      }
      const corrsText = rawOutput.substring(contentStart, endPos).trim();
      correspondences = this.parseNameCorrespondences(corrsText);
    }

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
          mechFileData = MechReactionsCardComponent.parseMechFileContent(content, correspondences);
        } else if (headerInfo.title === 'Molecule Thermodynamics') {
          const thermoBlocks = this.parseThermoBlocks(content, correspondences);
          mechFileData = {
            coefficients: [],
            classEquivalentsText: '',
            reactionClassesText: '',
            correspondences: correspondences,
            thermoBlocks: thermoBlocks
          };
        } else if (headerInfo.title === 'Molecule Structures') {
          const sdfBlocks = this.parseSdfBlocks(content);
          mechFileData = {
            coefficients: [],
            classEquivalentsText: '',
            reactionClassesText: '',
            sdfBlocks: sdfBlocks
          };
        } else if (headerInfo.title === 'Name Correspondences') {
          mechFileData = {
            coefficients: [],
            classEquivalentsText: '',
            reactionClassesText: '',
            correspondences: correspondences
          };
        }

        mechSections.push({
          id: idx + 1,
          title: headerInfo.title,
          icon: headerInfo.icon,
          content: content,
          isExpanded: headerInfo.isExpanded,
          mechFileData: mechFileData
        });
      }
    }

    return mechSections;
  }

  public parseNameCorrespondences(content: string): NameCorrespondence[] {
    const correspondences: NameCorrespondence[] = [];
    if (!content) return correspondences;

    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const tokens = trimmed.split(/\s+/);
      if (tokens.length >= 2) {
        correspondences.push({
          longName: tokens[0].trim(),
          shortName: tokens[1].trim()
        });
      }
    }
    return correspondences;
  }

  public parseThermoBlocks(content: string, correspondences: NameCorrespondence[]): MechThermoBlock[] {
    const blocks: MechThermoBlock[] = [];
    if (!content) return blocks;

    const shortToLong = new Map<string, string>();
    for (const corr of correspondences) {
      shortToLong.set(corr.shortName.toLowerCase(), corr.longName);
      shortToLong.set(corr.longName.toLowerCase(), corr.longName);
    }

    const lines = content.split(/\r?\n/);
    let currentBlockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() && currentBlockLines.length === 0) continue;

      currentBlockLines.push(line);

      if (currentBlockLines.length === 4 || line.trim().endsWith('4')) {
        const rawBlock = currentBlockLines.join('\n');
        const line1 = currentBlockLines[0].trim();
        const shortName = line1.split(/\s+/)[0] || 'Molecule';
        const longName = shortToLong.get(shortName.toLowerCase()) || shortName;

        blocks.push({
          shortName: shortName,
          longName: longName,
          rawBlock: rawBlock,
          isExpanded: false
        });

        currentBlockLines = [];
      }
    }

    if (currentBlockLines.length > 0) {
      const rawBlock = currentBlockLines.join('\n');
      const line1 = currentBlockLines[0].trim();
      const shortName = line1.split(/\s+/)[0] || 'Molecule';
      const longName = shortToLong.get(shortName.toLowerCase()) || shortName;

      blocks.push({
        shortName: shortName,
        longName: longName,
        rawBlock: rawBlock,
        isExpanded: false
      });
    }

    return blocks;
  }

  public parseSdfBlocks(content: string): MechSdfBlock[] {
    const blocks: MechSdfBlock[] = [];
    if (!content) return blocks;

    const rawChunks = content.split(/M\s+END/);
    for (const rawChunk of rawChunks) {
      const trimmed = rawChunk.trim();
      if (!trimmed) continue;

      const lines = trimmed.split(/\r?\n/);
      let moleculeName = 'Molecule';
      if (lines.length >= 3) {
        const line3 = lines[2].trim();
        if (line3.length > 0) {
          moleculeName = line3;
        }
      }

      const sdfContent = `${trimmed}\nM  END`;
      blocks.push({
        moleculeName: moleculeName,
        sdfContent: sdfContent,
        isExpanded: false
      });
    }

    return blocks;
  }
}
