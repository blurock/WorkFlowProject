import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChemStructureParserService {

  /**
   * Extracts single molecule SDF or MDL $RXN structure block from raw output.
   */
  public extractSdfContent(rawOutput: string, targetName?: string): string | null {
    if (!rawOutput) {
      console.log('[ChemStructureParser][extractSdfContent] rawOutput is null or empty');
      return null;
    }
    console.log(`[ChemStructureParser][extractSdfContent] Processing rawOutput (length=${rawOutput.length}, hasRxn=${rawOutput.includes('$RXN')}, hasMEnd=${rawOutput.includes('M  END')})`);

    // Check if rawOutput contains an MDL $RXN reaction block
    if (rawOutput.includes('$RXN')) {
      const rxnIdx = rawOutput.indexOf('$RXN');
      const sub = rawOutput.substring(rxnIdx);
      const lastMEnd = sub.lastIndexOf('M  END');
      if (lastMEnd !== -1) {
        const res = sub.substring(0, lastMEnd + 6).trim();
        console.log(`[ChemStructureParser][extractSdfContent] Extracted $RXN content (length=${res.length})`);
        return res;
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
        const res = this.buildRxnFileFromSdfBlocks(reactantSdfs, productSdfs);
        console.log(`[ChemStructureParser][extractSdfContent] Built $RXN from reaction header (length=${res.length})`);
        return res;
      }
    }

    // Fallback to single molecule SDF extraction
    const rawChunks = rawOutput.split(/\r?\n\s*~\s*\r?\n/);
    console.log(`[ChemStructureParser][extractSdfContent] Splitting chunks by '~': found ${rawChunks.length} chunk(s) (targetName: '${targetName || ''}')`);

    let candidateChunks = rawChunks;
    if (targetName && targetName.trim()) {
      const cleanTarget = targetName.trim();
      const targetMatches = rawChunks.filter(c => c.includes(cleanTarget) && c.includes('M  END'));
      if (targetMatches.length > 0) {
        candidateChunks = targetMatches;
        console.log(`[ChemStructureParser][extractSdfContent] Found ${targetMatches.length} candidate chunk(s) matching targetName '${cleanTarget}'`);
      }
    }

    for (const chunk of candidateChunks) {
      let trimmed = chunk.trim();
      if (trimmed.includes('M  END')) {
        const lines = trimmed.split(/\r?\n/);
        const countsLineIdx = lines.findIndex(l => /^\s*\d+\s+\d+/.test(l));

        if (countsLineIdx !== -1) {
          let preamble: string[] = [];
          if (countsLineIdx >= 3) {
            preamble = lines.slice(countsLineIdx - 3, countsLineIdx);
          } else if (countsLineIdx === 0) {
            preamble = [targetName || 'Molecule', '  REACTCLOUD Generated', ''];
          } else if (countsLineIdx === 1) {
            preamble = [targetName || 'Molecule', lines[0], ''];
          } else if (countsLineIdx === 2) {
            preamble = [lines[0], lines[1], ''];
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

          // Truncate at the first M  END line to isolate the single molfile block
          const mEndIdx = body.findIndex(l => l.trim().startsWith('M  END'));
          const cleanBody = mEndIdx !== -1 ? body.slice(0, mEndIdx + 1) : body;

          const res = [...preamble, ...cleanBody].join('\n');
          console.log(`[ChemStructureParser][extractSdfContent] Extracted single MOL block (length=${res.length}, preamble='${preamble.join(' / ')}')`);
          return res;
        }

        const mEndLineIdx = lines.findIndex(l => l.trim().startsWith('M  END'));
        const cleanLines = mEndLineIdx !== -1 ? lines.slice(0, mEndLineIdx + 1) : lines;
        const res = cleanLines.join('\n').trim();
        console.log(`[ChemStructureParser][extractSdfContent] Extracted trimmed chunk with M END (length=${res.length})`);
        return res;
      }
    }
    console.warn('[ChemStructureParser][extractSdfContent] No valid MOL/RXN block found in rawOutput.');
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
   * Extracts a map of ID / Name -> SDF block from raw output string.
   * Handles both standard MDL chunks (with M END) and chemdb PrintPrettyMolFile blocks.
   */
  public extractSdfBlockMap(rawOutput: string): Map<string, string> {
    const map = new Map<string, string>();
    if (!rawOutput) return map;

    // 1. Process standard MDL SDF chunks
    const rawChunks = rawOutput.split(/\r?\n\s*~\s*\r?\n/);
    for (const chunk of rawChunks) {
      const res = this.formatMolBlockForRxn(chunk);
      if (res) {
        for (const idStr of res.molIds) {
          map.set(idStr, res.molBlock);
        }
      }
    }

    // 2. Process chemdb PrintPrettyMolFile blocks
    const prettyMap = this.parsePrettyMolfileMap(rawOutput);
    for (const [key, item] of prettyMap.entries()) {
      if (!map.has(key)) {
        map.set(key, item.molBlock);
      }
      if (item.molId && !map.has(item.molId)) {
        map.set(item.molId, item.molBlock);
      }
      if (item.molName && !map.has(item.molName)) {
        map.set(item.molName, item.molBlock);
      }
    }

    return map;
  }

  /**
   * Parses chemdb PrintPrettyMolFile output sections (e.g. from ReadInRxnPatternsMolsFromDB)
   * into valid MDL V2000 MOL block strings.
   */
  public parsePrettyMolfileMap(rawOutput: string): Map<string, { molId: string; molName: string; role: string; molBlock: string }> {
    const result = new Map<string, { molId: string; molName: string; role: string; molBlock: string }>();
    if (!rawOutput) return result;

    const atomicSymbols: { [atNum: number]: string } = {
      1: 'H',
      6: 'C',
      7: 'N',
      8: 'O',
      9: 'F',
      15: 'P',
      16: 'S',
      17: 'Cl',
      35: 'Br',
      53: 'I',
      221: 'Q',
      320: 'R#',
      382: 'X'
    };

    const molPattern = /(Reactant|Product)\s+Molfile:\s*:MolFile\s+(\d+)\s*:\s*(\d+)\s+Atoms\s*:\s*(\d+)\s+Bonds\s*:\s*([^\n\r]+)/g;
    let match: RegExpExecArray | null;

    while ((match = molPattern.exec(rawOutput)) !== null) {
      const role = match[1];
      const molId = match[2];
      const nAtoms = parseInt(match[3], 10);
      const nBonds = parseInt(match[4], 10);
      const molName = match[5].trim();

      const startIdx = match.index;
      const following = rawOutput.substring(startIdx);
      const chunks = following.split(/\r?\n\s*~\s*\r?\n/);
      if (chunks.length < 3) continue;

      const atomLines = chunks[1].split(/\r?\n/).filter(l => l.includes(':Atom'));
      const bondLines = chunks[2].split(/\r?\n/).filter(l => l.includes('Bond :'));

      let molBlock = `${molName || molId}\n  -REACTCLOUD- 2D\n\n`;
      molBlock += `${nAtoms.toString().padStart(3, ' ')}${nBonds.toString().padStart(3, ' ')}  0  0  0  0  0  0  0  0999 V2000\n`;

      const rgpAtoms: number[] = [];

      atomLines.forEach((aline, idx) => {
        const parts = aline.split(':').map(p => p.trim());
        const xVal = parts.length > 2 ? parseFloat(parts[2]) : 0;
        const yVal = parts.length > 3 ? parseFloat(parts[3]) : 0;
        const zVal = parts.length > 4 ? parseFloat(parts[4]) : 0;
        const atNum = parts.length > 5 ? parseInt(parts[5], 10) : 6;

        const x = xVal.toFixed(4).padStart(10, ' ');
        const y = yVal.toFixed(4).padStart(10, ' ');
        const z = zVal.toFixed(4).padStart(10, ' ');
        const sym = atomicSymbols[atNum] || 'C';

        if (sym === 'R#' || sym === 'Q') {
          rgpAtoms.push(idx + 1);
        }

        molBlock += `${x}${y}${z} ${sym.padEnd(3, ' ')} 0  0  0  0  0  0  0  0  0  0  0  0\n`;
      });

      bondLines.forEach(bline => {
        const bparts = bline.split(':').map(p => p.trim());
        const a1 = (parseInt(bparts[2], 10) + 1).toString().padStart(3, ' ');
        const a2 = (parseInt(bparts[3], 10) + 1).toString().padStart(3, ' ');
        let chemBondType = 1;
        const bdesc = (bparts.length > 1 ? bparts[1] : '').toLowerCase();
        if (bdesc.includes('double')) {
          chemBondType = 2;
        } else if (bdesc.includes('triple')) {
          chemBondType = 3;
        } else if (bdesc.includes('aromatic')) {
          chemBondType = 4;
        } else {
          const btypeNum = parseInt(bparts[4], 10);
          chemBondType = (!isNaN(btypeNum) && btypeNum >= 1 && btypeNum <= 3) ? btypeNum : 1;
        }
        const btype = chemBondType.toString().padStart(3, ' ');
        molBlock += `${a1}${a2}${btype}  0  0  0  0\n`;
      });

      if (rgpAtoms.length > 0) {
        rgpAtoms.forEach((aNum, rIdx) => {
          molBlock += `M  RGP  1${aNum.toString().padStart(4, ' ')}${(rIdx + 1).toString().padStart(4, ' ')}\n`;
        });
      }
      molBlock += 'M  END\n';

      const item = { molId, molName, role, molBlock };
      if (!result.has(molId)) result.set(molId, item);
      if (molName && !result.has(molName)) result.set(molName, item);
    }

    return result;
  }

  /**
   * Builds an MDL $RXN file string from lists of reactant and product SDF blocks.
   */
  public buildRxnFileFromSdfBlocks(reactantSdfs: string[], productSdfs: string[], title: string = 'Reaction Pattern'): string {
    const rCount = reactantSdfs.length.toString().padStart(3, ' ');
    const pCount = productSdfs.length.toString().padStart(3, ' ');

    let rxn = `$RXN\n$MDL\n${title}\n  REACTCLOUD\n\n${rCount}${pCount}\n`;

    for (const sdf of reactantSdfs) {
      rxn += `$MOL\n${sdf.trim()}\n`;
    }
    for (const sdf of productSdfs) {
      rxn += `$MOL\n${sdf.trim()}\n`;
    }

    return rxn;
  }
}
