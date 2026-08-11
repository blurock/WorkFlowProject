import { Injectable } from '@angular/core';
import { BaseTaskOutputParser } from './base-task-output-parser';
import { MoleculeSection } from '../../models/task-list.models';

@Injectable({
  providedIn: 'root'
})
export class MoleculeOutputParser extends BaseTaskOutputParser {

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
          trimmed = trimmed + '\n~\n' + nextChunk;
          lines = [...lines, ...nextLines];
          i++;
        }
      }

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

      if (title.includes('Chemkin Database Thermodynamics')) {
        const chunkLines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (chunkLines.length >= 4) {
          const last4 = chunkLines.slice(-4);
          last4[0] = last4[0].replace(/^\s+/, '');
          trimmed = last4.join('\n');
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

    const secElectronic = findAndRemove(s => s.title.includes('Electronic Properties'));
    const secRadii = findAndRemove(s => s.title.includes('Atomic Radii'));
    const secThermo = findAndRemove(s => s.title.includes('Chemkin Database Thermodynamics'));
    const secAltNames = findAndRemove(s => s.title.includes('Alternative Chemical Names'));
    const secSdf = findAndRemove(s => s.title.includes('Molecule in SDF form') || s.content.includes('M  END'));
    const secLog = findAndRemove(s => s.title.includes('Execution Log') || s.id === 1);

    const orderedSections: MoleculeSection[] = [];

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
