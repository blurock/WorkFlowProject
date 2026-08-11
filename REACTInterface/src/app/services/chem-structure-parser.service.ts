import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChemStructureParserService {

  /**
   * Extracts single molecule SDF or MDL $RXN structure block from raw output.
   */
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
   * Parses Reactants and Products IDs from raw reaction pattern output.
   */
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

  /**
   * Formats a raw text chunk into a valid MDL V2000 MOL block string with 3-line preamble.
   */
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

  /**
   * Extracts a map of ID -> SDF block from raw output string.
   */
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

  /**
   * Builds an MDL $RXN file string from lists of reactant and product SDF blocks.
   */
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
}
