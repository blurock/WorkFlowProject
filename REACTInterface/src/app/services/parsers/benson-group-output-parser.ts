import { Injectable } from '@angular/core';
import { BaseTaskOutputParser } from './base-task-output-parser';
import { MoleculeSection } from '../../models/task-list.models';
import { BensonGroupCardComponent } from '../../components/task-list-view/cards/benson-group-card.component';

@Injectable({
  providedIn: 'root'
})
export class BensonGroupOutputParser extends BaseTaskOutputParser {

  public parse(rawOutput: string): MoleculeSection[] {
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
        const detected = this.detectTitleAndIcon(cleanLine, false);
        if (detected) {
          title = detected.title;
          icon = detected.icon;
          break;
        }
      }

      const parsedData = this.parseSectionData(title, lines, trimmed);
      const currentId = sectionId++;

      sections.push({
        id: currentId,
        title: title,
        icon: icon,
        content: trimmed,
        isExpanded: true,
        ...parsedData
      });
    }

    const findAndRemove = (predicate: (s: MoleculeSection) => boolean): MoleculeSection | undefined => {
      const idx = sections.findIndex(predicate);
      if (idx !== -1) {
        return sections.splice(idx, 1)[0];
      }
      return undefined;
    };

    const secBensonThermo = findAndRemove(s => s.title.includes('Benson') || s.content.includes('CC - A1N1') || s.content.includes('Thermochemical Kinetics') || s.content.includes('Output File (job1.out)') || s.content.includes('Output File (BensonStandard.out)'));
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

    return orderedSections;
  }
}
