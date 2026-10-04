import { Injectable } from '@angular/core';

export interface MoleculeSubSection {
  title: string;
  icon: string;
  content: string;
}

export interface ParsedMoleculeItem {
  id: number | string;
  index: number;
  name: string;
  sdfContent: string;
  rawBlock: string;
  rawString: string;
  subSections: MoleculeSubSection[];
}

export interface ExecutionOutputSections {
  inputDataText: string;               // Section 1: Raw SDF / Input File Information
  parsedDataStructures: ParsedMoleculeItem[]; // Section 2: Array of parsed Molecule items
  executionLogText: string;            // Section 3: Raw Execution Log stdout
  dataType: string;                    // molecule | substructure | rxn-pattern | thermo | reaction
}

@Injectable({
  providedIn: 'root'
})
export class ExecutionOutputParserService {

  public parseExecutionOutput(rawOutput: string, dataType: string = 'molecule'): ExecutionOutputSections {
    if (!rawOutput) {
      return {
        inputDataText: '',
        parsedDataStructures: [],
        executionLogText: '',
        dataType
      };
    }

    let inputDataText = '';
    let parsedDataStructures: ParsedMoleculeItem[] = [];
    let executionLogText = '';
    let remainingText = rawOutput;

    // 1. Isolate Section 3: '--- Execution Log ---'
    const execLogIdx = remainingText.indexOf('--- Execution Log ---');
    if (execLogIdx !== -1) {
      executionLogText = remainingText.substring(execLogIdx + '--- Execution Log ---'.length).trim();
      remainingText = remainingText.substring(0, execLogIdx).trim();
    }

    // 2. Search for Section 2 (PRINT Header / Data Structures block)
    const printHeaderRegex = /(\:\s*\d+\s+(Molecules|Substructures|ReactionPatterns|Mechanisms|Benson|RxnPattern)|---\s*(Molecule Structures|Mechanism Reactions|Molecule Thermodynamics|Name Correspondences)\s*---)/i;
    const match = printHeaderRegex.exec(remainingText);

    if (match) {
      // Everything before the header is Section 1 (Input Data / SDF)
      inputDataText = remainingText.substring(0, match.index).trim();
      const printSectionText = remainingText.substring(match.index).trim();
      parsedDataStructures = this.parseMoleculesFromText(printSectionText, dataType);
    } else {
      if (remainingText.includes('V2000') || remainingText.includes('M  END') || remainingText.includes('$$$$') || remainingText.includes(':Mol') || remainingText.includes(':Sub')) {
        inputDataText = remainingText;
        parsedDataStructures = this.parseMoleculesFromText(remainingText, dataType);
      } else {
        if (!executionLogText) {
          executionLogText = remainingText;
        } else {
          executionLogText = remainingText + '\n\n' + executionLogText;
        }
      }
    }

    // Fallback: If inputDataText exists and parsedDataStructures is empty, try parsing inputDataText
    if (parsedDataStructures.length === 0 && inputDataText) {
      parsedDataStructures = this.parseMoleculesFromText(inputDataText, dataType);
    }

    return {
      inputDataText,
      parsedDataStructures,
      executionLogText,
      dataType
    };
  }

  public parseMoleculesFromText(text: string, dataType: string = 'molecule'): ParsedMoleculeItem[] {
    if (!text) return [];

    const items: ParsedMoleculeItem[] = [];
    const hasMolHeaders = /:\s*(?:Mol|Sub)\s+\d+/i.test(text);

    if (hasMolHeaders) {
      const blocks = text.split(/(?=^\s*:(?:Mol|Sub)\s+\d+)/m);
      let indexCounter = 1;

      for (const rawBlock of blocks) {
        const trimmed = rawBlock.trim();
        if (!trimmed || !/^\s*:(?:Mol|Sub)\s+\d+/i.test(trimmed)) continue;

        const lines = trimmed.split(/\r?\n/);
        const headerLine = lines[0].trim();
        const idMatch = headerLine.match(/\d+/);
        const molId = idMatch ? parseInt(idMatch[0], 10) : indexCounter;

        const { sdfContent, name } = this.extractSdfAndNameFromBlockLines(lines, indexCounter, dataType);
        const subSections = this.extractSubSectionsFromBlockLines(lines);

        items.push({
          id: molId,
          index: indexCounter++,
          name: name,
          sdfContent: sdfContent,
          rawBlock: trimmed,
          rawString: trimmed,
          subSections: subSections
        });
      }
    } else if (text.includes('$$$$') || text.includes('M  END')) {
      const sdfBlocks = text.split(/\$\$\$\$/);
      let indexCounter = 1;

      for (const block of sdfBlocks) {
        const trimmed = block.trim();
        if (!trimmed || (!trimmed.includes('M  END') && !trimmed.includes('V2000'))) continue;

        const lines = trimmed.split(/\r?\n/);
        const { sdfContent, name } = this.extractSdfAndNameFromBlockLines(lines, indexCounter, dataType);
        const finalSdf = sdfContent || (trimmed.endsWith('$$$$') ? trimmed : `${trimmed}\n$$$$`);

        items.push({
          id: indexCounter,
          index: indexCounter,
          name: name,
          sdfContent: finalSdf,
          rawBlock: trimmed,
          rawString: trimmed,
          subSections: []
        });
        indexCounter++;
      }
    }

    return items;
  }

  private extractSdfAndNameFromBlockLines(lines: string[], index: number, dataType: string): { sdfContent: string; name: string } {
    let mEndIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === 'M  END' || lines[i].trim().startsWith('M END')) {
        mEndIdx = i;
        break;
      }
    }

    // Locate counts line (line before atoms matching: \s*\d+\s+\d+... V2000 or numbers)
    let countsLineIdx = -1;
    const searchLimit = mEndIdx !== -1 ? mEndIdx : lines.length - 1;
    for (let i = 0; i <= searchLimit; i++) {
      const l = lines[i].trim();
      if (/^\s*\d+\s+\d+/.test(l) || l.includes('V2000') || l.includes('V3000')) {
        countsLineIdx = i;
        break;
      }
    }

    // If mEndIdx not found, set mEndIdx to end of atom/bond section or end of lines
    if (mEndIdx === -1 && countsLineIdx !== -1) {
      mEndIdx = lines.length - 1;
      for (let i = countsLineIdx + 1; i < lines.length; i++) {
        if (lines[i].trim() === '~' || lines[i].trim().startsWith('-----')) {
          mEndIdx = i - 1;
          break;
        }
      }
    }

    if (countsLineIdx === -1) {
      const fallbackName = `${dataType === 'substructure' ? 'Substructure' : 'Molecule'} #${index}`;
      return { sdfContent: lines.join('\n'), name: fallbackName };
    }

    // Extract preamble lines above countsLineIdx
    const preambleRaw: string[] = [];
    for (let i = 0; i < countsLineIdx; i++) {
      const clean = lines[i].trim();
      if (clean && clean !== '~' && !/^:(?:Mol|Sub)/i.test(clean)) {
        preambleRaw.push(clean);
      }
    }

    // Extract Molecule Name (Line 3 of SDF preamble, or Line 1 fallback)
    let extractedName = '';
    if (preambleRaw.length >= 3) {
      extractedName = preambleRaw[2];
    } else if (preambleRaw.length === 2) {
      extractedName = preambleRaw[1];
    } else if (preambleRaw.length === 1) {
      extractedName = preambleRaw[0];
    }

    // Validate extractedName is a real name (not counts line or ID number)
    if (
      !extractedName ||
      /^\d+$/.test(extractedName) ||
      extractedName.includes('V2000') ||
      extractedName.includes('M  END') ||
      extractedName === '~'
    ) {
      if (preambleRaw.length > 0 && !/^\d+$/.test(preambleRaw[0])) {
        extractedName = preambleRaw[0];
      } else {
        extractedName = `${dataType === 'substructure' ? 'Substructure' : 'Molecule'} #${index}`;
      }
    }

    // Format valid 3-line preamble for MDL MOL V2000 spec
    let formattedPreamble: string[] = [];
    if (preambleRaw.length === 0) {
      formattedPreamble = ['1', '  -CPSS-  Generated', extractedName];
    } else if (preambleRaw.length === 1) {
      formattedPreamble = ['1', '  -CPSS-  Generated', preambleRaw[0]];
    } else if (preambleRaw.length === 2) {
      formattedPreamble = [preambleRaw[0], '  -CPSS-  Generated', preambleRaw[1]];
    } else {
      formattedPreamble = [preambleRaw[0], preambleRaw[1], preambleRaw[2]];
    }

    const bodyLines = lines.slice(countsLineIdx, mEndIdx + 1);
    if (bodyLines.length > 0 && !bodyLines[bodyLines.length - 1].includes('M  END')) {
      bodyLines.push('M  END');
    }

    const sdfContent = [...formattedPreamble, ...bodyLines].join('\n');
    return { sdfContent, name: extractedName };
  }

  private extractSubSectionsFromBlockLines(lines: string[]): MoleculeSubSection[] {
    const subSections: MoleculeSubSection[] = [];
    let mEndIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === 'M  END' || lines[i].trim().startsWith('M END')) {
        mEndIdx = i;
        break;
      }
    }

    if (mEndIdx === -1 || mEndIdx >= lines.length - 1) return subSections;

    const remainingLines = lines.slice(mEndIdx + 1);
    let currentTitle = '';
    let currentLines: string[] = [];

    for (const line of remainingLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '~') continue;

      if (trimmed.startsWith('-----') || trimmed.startsWith('---')) {
        if (currentTitle && currentLines.length > 0) {
          subSections.push({
            title: currentTitle,
            icon: this.getIconForTitle(currentTitle),
            content: currentLines.join('\n').trim()
          });
        }
        currentTitle = trimmed.replace(/^-+|-+$/g, '').trim();
        currentLines = [];
      } else {
        if (!currentTitle) {
          currentTitle = 'Molecule Properties';
        }
        currentLines.push(line);
      }
    }

    if (currentTitle && currentLines.length > 0) {
      subSections.push({
        title: currentTitle,
        icon: this.getIconForTitle(currentTitle),
        content: currentLines.join('\n').trim()
      });
    }

    return subSections;
  }

  private getIconForTitle(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('electronic')) return 'flash_on';
    if (lower.includes('radii')) return 'straighten';
    if (lower.includes('name') || lower.includes('alternative')) return 'label';
    if (lower.includes('thermo')) return 'thermostat';
    return 'description';
  }
}
