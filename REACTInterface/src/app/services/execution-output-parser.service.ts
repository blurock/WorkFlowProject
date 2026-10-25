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

export interface PathwayItemStatus {
  index: number;
  name: string;
  status: 'EXISTS' | 'NOT_FOUND' | string;
  inDatabase: boolean;
}

export interface MechanismPathwayReport {
  title: string;
  pathwayName: string;
  numberOfSteps: number;
  auxiliaryMolecules: number;
  headerSummaryLines: string[];
  summaryBlockLines: string[];
  molecules: PathwayItemStatus[];
  reactionPatterns: PathwayItemStatus[];
  moleculesChecked: number;
  moleculesMissing: number;
  patternsChecked: number;
  patternsMissing: number;
  resultSuccess: boolean;
  resultMessage: string;
  logText: string;
  logLines: { text: string; isError: boolean }[];
}

export interface ExecutionOutputSections {
  inputDataText: string;               // Section 1: Raw SDF / Input File Information
  parsedDataStructures: ParsedMoleculeItem[]; // Section 2: Array of parsed Molecule items
  executionLogText: string;            // Section 3: Raw Execution Log stdout
  dataType: string;                    // molecule | substructure | rxn-pattern | thermo | reaction | mechanism-pathway
  pathwayReport?: MechanismPathwayReport | null; // Dedicated report for mechanism-pathway
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
        dataType,
        pathwayReport: null
      };
    }

    // Check if this is a mechanism pathway check report
    if (
      dataType === 'mechanism-pathway' ||
      rawOutput.includes('Mechanism Pathway Definition Check Report') ||
      (rawOutput.includes('Molecule Existence Check') && rawOutput.includes('Reaction Pattern Existence Check'))
    ) {
      const pathwayReport = this.parseMechanismPathwayReport(rawOutput);
      if (pathwayReport) {
        return {
          inputDataText: '',
          parsedDataStructures: [],
          executionLogText: pathwayReport.logText,
          dataType,
          pathwayReport
        };
      }
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
      dataType,
      pathwayReport: null
    };
  }

  /**
   * Parse Mechanism Pathway Definition Check Report output into 4 structured sections:
   * 1. Summary of what was read in (header blocks and last block 'Summary for Pathway')
   * 2. Table of Molecules and their database existence status
   * 3. Table of Reaction Patterns and their database existence status
   * 4. Execution log information after closing delimiter
   */
  public parseMechanismPathwayReport(rawText: string): MechanismPathwayReport | null {
    if (!rawText) return null;
    if (
      !rawText.includes('Mechanism Pathway Definition Check Report') &&
      !rawText.includes('[1] Molecule Existence Check') &&
      !rawText.includes('Summary for Pathway')
    ) {
      return null;
    }

    const lines = rawText.split(/\r?\n/);
    let title = 'Mechanism Pathway Definition Check Report';
    let pathwayName = '';
    let numberOfSteps = 0;
    let auxiliaryMolecules = 0;
    const headerSummaryLines: string[] = [];
    const summaryBlockLines: string[] = [];
    const molecules: PathwayItemStatus[] = [];
    const reactionPatterns: PathwayItemStatus[] = [];
    let moleculesChecked = 0;
    let moleculesMissing = 0;
    let patternsChecked = 0;
    let patternsMissing = 0;
    let resultMessage = '';
    let resultSuccess = false;

    type SectionState = 'INIT' | 'HEADER_BLOCK' | 'MOLS' | 'PATTERNS' | 'SUMMARY' | 'LOG';
    let state: SectionState = 'INIT';
    const logLinesArr: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect closing boundary line of Summary block (delimiter before log)
      if (state === 'SUMMARY' && trimmed.startsWith('====')) {
        state = 'LOG';
        continue;
      }

      if (state === 'LOG') {
        logLinesArr.push(line);
        continue;
      }

      // Capture format error lines anywhere in the report
      if (trimmed.includes('FORMAT ERROR') || trimmed.includes('Format error:')) {
        headerSummaryLines.push(trimmed);
        summaryBlockLines.push(trimmed);
        if (!resultMessage) {
          resultMessage = trimmed;
        }
      }

      // Detect start of sections
      if (trimmed.includes('[1] Molecule Existence Check') || trimmed.includes('Molecule Existence Check')) {
        state = 'MOLS';
        continue;
      }

      if (trimmed.includes('[2] Reaction Pattern Existence Check') || trimmed.includes('Reaction Pattern Existence Check')) {
        state = 'PATTERNS';
        continue;
      }

      if (trimmed.startsWith('Summary for Pathway')) {
        state = 'SUMMARY';
        summaryBlockLines.push(trimmed);
        const nameMatch = trimmed.match(/Summary for Pathway ['"]?([^'":]+)/i);
        if (nameMatch && !pathwayName) {
          pathwayName = nameMatch[1].trim();
        }
        continue;
      }

      // Process line based on current state
      if (state === 'INIT') {
        if (trimmed.includes('Mechanism Pathway Definition Check Report')) {
          title = trimmed;
          state = 'HEADER_BLOCK';
          headerSummaryLines.push(trimmed);
          continue;
        }
        if (trimmed.startsWith('Pathway Name:')) {
          state = 'HEADER_BLOCK';
        }
      }

      if (state === 'HEADER_BLOCK') {
        if (trimmed.startsWith('----') || trimmed.startsWith('====')) {
          continue;
        }
        if (trimmed.startsWith('Pathway Name:')) {
          pathwayName = trimmed.replace(/^Pathway Name:\s*/i, '').replace(/[:\s]+$/, '').trim();
          headerSummaryLines.push(trimmed);
        } else if (trimmed.startsWith('Number of Steps:')) {
          const numMatch = trimmed.match(/\d+/);
          if (numMatch) numberOfSteps = parseInt(numMatch[0], 10);
          headerSummaryLines.push(trimmed);
        } else if (trimmed.includes('Auxiliary Molecules')) {
          const numMatch = trimmed.match(/\d+/);
          if (numMatch) auxiliaryMolecules = parseInt(numMatch[0], 10);
          headerSummaryLines.push(trimmed);
        } else if (trimmed) {
          headerSummaryLines.push(trimmed);
        }
        continue;
      }

      if (state === 'MOLS') {
        if (trimmed.startsWith('----') || trimmed.startsWith('====') || trimmed.startsWith('Molecule_Name')) {
          continue;
        }
        if (!trimmed) continue;
        if (trimmed.startsWith('No molecules') || trimmed.includes('No molecules defined')) {
          continue;
        }
        if (trimmed.startsWith('[2]')) {
          state = 'PATTERNS';
          continue;
        }
        if (trimmed.startsWith('Summary for Pathway') || trimmed.startsWith('RESULT:')) {
          state = 'SUMMARY';
          summaryBlockLines.push(trimmed);
          continue;
        }
        // Table row e.g. "hydroxyl-radical                         NOT_FOUND"
        const tokens = trimmed.split(/\s+/);
        if (tokens.length >= 2) {
          const mName = tokens[0];
          const mStatus = tokens[tokens.length - 1];
          const upperStatus = mStatus.toUpperCase();
          if (upperStatus === 'EXISTS' || upperStatus === 'NOT_FOUND') {
            const isExists = upperStatus === 'EXISTS';
            molecules.push({
              index: molecules.length + 1,
              name: mName,
              status: mStatus,
              inDatabase: isExists
            });
          }
        }
        continue;
      }

      if (state === 'PATTERNS') {
        if (trimmed.startsWith('----') || trimmed.startsWith('====') || trimmed.startsWith('Reaction_Pattern_Name')) {
          continue;
        }
        if (!trimmed) continue;
        if (trimmed.startsWith('No reaction') || trimmed.includes('No reaction patterns defined')) {
          continue;
        }
        if (trimmed.startsWith('Summary for Pathway') || trimmed.startsWith('RESULT:')) {
          state = 'SUMMARY';
          summaryBlockLines.push(trimmed);
          continue;
        }
        // Table row e.g. "H-Abstraction-Oxygen-Primary             NOT_FOUND"
        const tokens = trimmed.split(/\s+/);
        if (tokens.length >= 2) {
          const pName = tokens[0];
          const pStatus = tokens[tokens.length - 1];
          const upperStatus = pStatus.toUpperCase();
          if (upperStatus === 'EXISTS' || upperStatus === 'NOT_FOUND') {
            const isExists = upperStatus === 'EXISTS';
            reactionPatterns.push({
              index: reactionPatterns.length + 1,
              name: pName,
              status: pStatus,
              inDatabase: isExists
            });
          }
        }
        continue;
      }

      if (state === 'SUMMARY') {
        if (trimmed.startsWith('----')) continue;
        summaryBlockLines.push(trimmed);

        if (trimmed.includes('Molecules Checked:')) {
          const chkMatch = trimmed.match(/Molecules Checked:\s*(\d+)/i);
          if (chkMatch) moleculesChecked = parseInt(chkMatch[1], 10);
          const misMatch = trimmed.match(/Missing:\s*(\d+)/i);
          if (misMatch) moleculesMissing = parseInt(misMatch[1], 10);
        } else if (trimmed.includes('Reaction Patterns Checked:')) {
          const chkMatch = trimmed.match(/Reaction Patterns Checked:\s*(\d+)/i);
          if (chkMatch) patternsChecked = parseInt(chkMatch[1], 10);
          const misMatch = trimmed.match(/Missing:\s*(\d+)/i);
          if (misMatch) patternsMissing = parseInt(misMatch[1], 10);
        } else if (trimmed.startsWith('RESULT:')) {
          resultMessage = trimmed.replace(/^RESULT:\s*/i, '').trim();
          resultSuccess = resultMessage.toUpperCase().includes('SUCCESS');
        }
        continue;
      }
    }

    // Default counts if not captured in summary block
    if (moleculesChecked === 0 && molecules.length > 0) {
      moleculesChecked = molecules.length;
      moleculesMissing = molecules.filter(m => !m.inDatabase).length;
    }
    if (patternsChecked === 0 && reactionPatterns.length > 0) {
      patternsChecked = reactionPatterns.length;
      patternsMissing = reactionPatterns.filter(p => !p.inDatabase).length;
    }

    const logText = logLinesArr.join('\n').trim();
    const logLines = logText ? logText.split(/\r?\n/).map(l => {
      const lower = l.toLowerCase();
      const isError = lower.includes('error') || lower.includes('fail') || lower.includes('cannot open');
      return { text: l, isError };
    }) : [];

    return {
      title,
      pathwayName: pathwayName || 'Mechanism Pathway',
      numberOfSteps,
      auxiliaryMolecules,
      headerSummaryLines,
      summaryBlockLines,
      molecules,
      reactionPatterns,
      moleculesChecked,
      moleculesMissing,
      patternsChecked,
      patternsMissing,
      resultSuccess,
      resultMessage: resultMessage || (moleculesMissing === 0 && patternsMissing === 0 ? 'SUCCESS' : 'FAILED'),
      logText,
      logLines
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
