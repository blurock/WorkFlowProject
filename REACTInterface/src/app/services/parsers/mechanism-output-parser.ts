import { Injectable } from '@angular/core';
import { BaseTaskOutputParser } from './base-task-output-parser';
import { MoleculeSection, MechFileData } from '../../models/task-list.models';
import { MechReactionsCardComponent } from '../../components/task-list-view/cards/mech-reactions-card.component';

@Injectable({
  providedIn: 'root'
})
export class MechanismOutputParser extends BaseTaskOutputParser {

  public parse(rawOutput: string): MoleculeSection[] {
    if (!rawOutput) return [];

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

    return mechSections;
  }
}
