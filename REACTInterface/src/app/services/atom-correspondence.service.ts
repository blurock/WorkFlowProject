import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AtomInfo {
  atomNumber: number;        // Global 1-based index (across all reactants or all products)
  molAtomIndex: number;      // 1-based index within its parent molecule
  symbol: string;
  isGeneric: boolean;
  moleculeIndex: number;     // 1-based molecule index
  isReactant: boolean;
  atomMapNumber?: number;
  x?: number;
  y?: number;
  z?: number;
  radical?: number;
}

export const RESERVED_ATOM_SYMBOLS = new Set([
  'GENERATED', 'CPSS', 'REACTCLOUD', 'V2000', 'V3000', 'END', 'MOL', 'RXN', 'ROOT', 'ISO', 'RAD', 'CHRG'
]);

export const PERIODIC_TABLE = new Set([
  'H', 'HE', 'LI', 'BE', 'B', 'C', 'N', 'O', 'F', 'NE',
  'NA', 'MG', 'AL', 'SI', 'P', 'S', 'CL', 'AR', 'K', 'CA',
  'SC', 'TI', 'V', 'CR', 'MN', 'FE', 'CO', 'NI', 'CU', 'ZN',
  'GA', 'GE', 'AS', 'SE', 'BR', 'KR', 'RB', 'SR', 'Y', 'ZR',
  'NB', 'MO', 'TC', 'RU', 'RH', 'PD', 'AG', 'CD', 'IN', 'SN',
  'SB', 'TE', 'I', 'XE', 'CS', 'BA', 'LA', 'CE', 'PR', 'ND',
  'PM', 'SM', 'EU', 'GD', 'TB', 'DY', 'HO', 'ER', 'TM', 'YB',
  'LU', 'HF', 'TA', 'W', 'RE', 'OS', 'IR', 'PT', 'AU', 'HG',
  'TL', 'PB', 'BI', 'PO', 'AT', 'RN', 'FR', 'RA', 'AC', 'TH',
  'PA', 'U', 'NP', 'PU', 'AM', 'CM', 'BK', 'CF', 'ES', 'FM'
]);

export function isGenericAtomSymbol(sym: string): boolean {
  if (!sym) return false;
  const upper = sym.toUpperCase().trim();
  return /^R#?\d*#?$/i.test(upper) ||
         /^M#?\d*#?$/i.test(upper) ||
         /^Q#?\d*#?$/i.test(upper) ||
         /^X#?\d*#?$/i.test(upper) ||
         upper === 'A' || upper === 'A#' || upper === '*';
}

export function isValidAtomSymbol(sym: string): boolean {
  if (!sym) return false;
  const upper = sym.toUpperCase().trim();
  if (RESERVED_ATOM_SYMBOLS.has(upper)) return false;
  if (PERIODIC_TABLE.has(upper)) return true;
  if (isGenericAtomSymbol(upper)) return true;
  return false;
}

export function normalizeAtomSymbol(sym: string): string {
  if (!sym) return '';
  const trimmed = sym.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'R#' || upper.startsWith('R#')) return 'R';
  if (upper === 'M#' || upper.startsWith('M#')) return 'M';
  if (upper === 'Q#' || upper.startsWith('Q#')) return 'Q';
  if (upper === 'X#' || upper.startsWith('X#')) return 'X';
  return trimmed;
}

export interface BondInfo {
  moleculeIndex: number;     // 1-based molecule index
  isReactant: boolean;
  atom1MolIndex: number;     // 1-based atom index within molecule
  atom2MolIndex: number;     // 1-based atom index within molecule
  atom1Number: number;       // Global 1-based atom number
  atom2Number: number;       // Global 1-based atom number
  bondType: number;          // 1=single, 2=double, 3=triple, 4=broken
}

export interface CandidateProductAtom {
  atomNumber: number;        // Global 1-based product atom number
  label: string;             // Display label in dropdown
  symbol: string;
  moleculeIndex: number;
}

export interface AtomCorrespondenceRow {
  reactantAtomNumber: number;
  reactantSymbol: string;
  reactantMoleculeIndex?: number;
  molAtomIndex?: number;
  productAtomNumber: number | null;
  candidateProductAtoms: CandidateProductAtom[];
}

export interface BondChangeRow {
  moleculeIndex: number;
  atom1Number: number;
  atom2Number: number;
  type: number;              // 4 = broken, 104 = formed
}

export interface ParsedRxnStructure {
  reactantAtoms: AtomInfo[];
  productAtoms: AtomInfo[];
  reactantBonds: BondInfo[];
  productBonds: BondInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class AtomCorrespondenceService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8085';

  /**
   * Translates atomic number to standard chemical symbol.
   */
  public atomicNumberToSymbol(atomicNumber: number): string {
    switch (atomicNumber) {
      case 1: return 'H';
      case 2: return 'He';
      case 3: return 'Li';
      case 4: return 'Be';
      case 5: return 'B';
      case 6: return 'C';
      case 7: return 'N';
      case 8: return 'O';
      case 9: return 'F';
      case 10: return 'Ne';
      case 11: return 'Na';
      case 12: return 'Mg';
      case 13: return 'Al';
      case 14: return 'Si';
      case 15: return 'P';
      case 16: return 'S';
      case 17: return 'Cl';
      case 18: return 'Ar';
      case 35: return 'Br';
      case 53: return 'I';
      case 221: return 'Q';
      case 320: return 'R';
      case 382: return 'X';
      case 0: return 'R';
      default: return 'R';
    }
  }

  /**
   * Parses an MDL reaction ($RXN), concatenated SDF blocks, or single molfiles
   * into structured arrays of reactant/product atoms and bonds.
   */
  public parseRxnStructure(rxnContent: string): ParsedRxnStructure {
    const reactantAtoms: AtomInfo[] = [];
    const productAtoms: AtomInfo[] = [];
    const reactantBonds: BondInfo[] = [];
    const productBonds: BondInfo[] = [];

    if (!rxnContent || !rxnContent.trim()) {
      return { reactantAtoms, productAtoms, reactantBonds, productBonds };
    }

    let rCounter = 1;
    let pCounter = 1;

    // Check if $RXN format
    if (rxnContent.includes('$RXN')) {
      const molBlocks = rxnContent.split('$MOL');
      let numReactants = 0;
      let numProducts = 0;

      if (molBlocks.length > 0) {
        const headerLines = molBlocks[0].split(/\r?\n/);
        for (const line of headerLines) {
          const countMatch = line.match(/^\s*(\d{1,3})\s+(\d{1,3})\s*$/);
          if (countMatch && !line.includes('$RXN')) {
            numReactants = parseInt(countMatch[1], 10);
            numProducts = parseInt(countMatch[2], 10);
            break;
          }
        }
      }

      const actualBlocks = molBlocks.slice(1);
      const totalCount = actualBlocks.length;
      if (numReactants === 0 && numProducts === 0) {
        numReactants = Math.max(1, Math.floor(totalCount / 2));
        numProducts = totalCount - numReactants;
      }

      actualBlocks.forEach((block, idx) => {
        const isReactant = idx < numReactants;
        const molIdx = isReactant ? (idx + 1) : (idx - numReactants + 1);
        const parsed = this.parseMolBlock(block.split(/\r?\n/), molIdx, isReactant, rCounter, pCounter);
        if (isReactant) {
          rCounter = parsed.nextReactantCounter;
          reactantAtoms.push(...parsed.atoms);
          reactantBonds.push(...parsed.bonds);
        } else {
          pCounter = parsed.nextProductCounter;
          productAtoms.push(...parsed.atoms);
          productBonds.push(...parsed.bonds);
        }
      });
    } else {
      // Split on $$$$ if multiple molfiles, or single block
      const blocks = rxnContent.split('$$$$').filter(b => b.trim().length > 0);
      const half = Math.max(1, Math.floor(blocks.length / 2));
      blocks.forEach((block, idx) => {
        const isReactant = idx < half;
        const molIdx = isReactant ? (idx + 1) : (idx - half + 1);
        const parsed = this.parseMolBlock(block.split(/\r?\n/), molIdx, isReactant, rCounter, pCounter);
        if (isReactant) {
          rCounter = parsed.nextReactantCounter;
          reactantAtoms.push(...parsed.atoms);
          reactantBonds.push(...parsed.bonds);
        } else {
          pCounter = parsed.nextProductCounter;
          productAtoms.push(...parsed.atoms);
          productBonds.push(...parsed.bonds);
        }
      });
    }

    return { reactantAtoms, productAtoms, reactantBonds, productBonds };
  }

  /**
   * Parses an individual MDL Molfile block lines into atoms and bonds.
   */
  public parseMolBlock(
    blockLines: string[],
    moleculeIndex: number,
    isReactant: boolean,
    rCounter: number,
    pCounter: number
  ): { atoms: AtomInfo[]; bonds: BondInfo[]; nextReactantCounter: number; nextProductCounter: number } {
    const molAtoms: AtomInfo[] = [];
    const molBonds: BondInfo[] = [];

    // Strategy A: Check V3000 format (M  V30)
    const isV3000 = blockLines.some(l => l.includes('V3000') || l.includes('M  V30'));
    if (isV3000) {
      let inAtomBlock = false;
      let inBondBlock = false;
      for (const line of blockLines) {
        const trimmed = line.trim();
        if (trimmed.includes('BEGIN ATOM')) { inAtomBlock = true; continue; }
        if (trimmed.includes('END ATOM')) { inAtomBlock = false; continue; }
        if (trimmed.includes('BEGIN BOND')) { inBondBlock = true; continue; }
        if (trimmed.includes('END BOND')) { inBondBlock = false; continue; }

        if (inAtomBlock && trimmed.startsWith('M  V30')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 7) {
            const localIdx = parseInt(parts[2], 10);
            const symbol = parts[3];
            if (isValidAtomSymbol(symbol)) {
              const xVal = parseFloat(parts[4]);
              const yVal = parseFloat(parts[5]);
              const zVal = parseFloat(parts[6]);
              let atomMapNumber: number | undefined;
              for (let p = 7; p < parts.length; p++) {
                if (parts[p].startsWith('CFG=') || parts[p].startsWith('CHG=')) continue;
                if (parts[p].startsWith('MAP=')) {
                  const mVal = parseInt(parts[p].replace('MAP=', ''), 10);
                  if (!isNaN(mVal) && mVal > 0) atomMapNumber = mVal;
                }
              }
              const cleanSym = normalizeAtomSymbol(symbol);
              const isGeneric = isGenericAtomSymbol(cleanSym);
              const atomNum = isReactant ? rCounter++ : pCounter++;
              molAtoms.push({
                atomNumber: atomNum,
                molAtomIndex: localIdx || (molAtoms.length + 1),
                symbol: cleanSym,
                isGeneric: isGeneric,
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atomMapNumber: atomMapNumber,
                x: !isNaN(xVal) ? xVal : undefined,
                y: !isNaN(yVal) ? yVal : undefined,
                z: !isNaN(zVal) ? zVal : undefined
              });
            }
          }
        }

        if (inBondBlock && trimmed.startsWith('M  V30')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 6) {
            const bType = parseInt(parts[3], 10);
            const a1Local = parseInt(parts[4], 10);
            const a2Local = parseInt(parts[5], 10);
            const a1Obj = molAtoms.find(a => a.molAtomIndex === a1Local);
            const a2Obj = molAtoms.find(a => a.molAtomIndex === a2Local);
            if (a1Obj && a2Obj) {
              molBonds.push({
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atom1MolIndex: a1Local,
                atom2MolIndex: a2Local,
                atom1Number: a1Obj.atomNumber,
                atom2Number: a2Obj.atomNumber,
                bondType: isNaN(bType) ? 1 : bType
              });
            }
          }
        }
      }
      return { atoms: molAtoms, bonds: molBonds, nextReactantCounter: rCounter, nextProductCounter: pCounter };
    }

    // Strategy B: V2000 Counts Line
    let countsLineIdx = -1;
    for (let i = 0; i < Math.min(blockLines.length, 15); i++) {
      const line = blockLines[i];
      if (line.includes('V2000')) {
        countsLineIdx = i;
        break;
      }
      // Check for short counts line without V2000 (must be whitespace-separated numbers followed by coordinate line)
      const shortCountsMatch = line.trim().match(/^(\d{1,3})\s+(\d{1,3})(?:\s+\d+)*$/);
      if (shortCountsMatch && i + 1 < blockLines.length) {
        const nextLine = blockLines[i + 1].trim();
        if (/^[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[A-Za-z*#]/.test(nextLine)) {
          countsLineIdx = i;
          break;
        }
      }
    }

    if (countsLineIdx !== -1) {
      const countsLine = blockLines[countsLineIdx];
      const countsMatch = countsLine.trim().match(/^(\d+)\s+(\d+)/);
      const nAtoms = countsLine.length >= 3 ? (parseInt(countsLine.substring(0, 3).trim(), 10) || (countsMatch ? parseInt(countsMatch[1], 10) : 0)) : (countsMatch ? parseInt(countsMatch[1], 10) : 0);
      const nBonds = countsLine.length >= 6 ? (parseInt(countsLine.substring(3, 6).trim(), 10) || (countsMatch ? parseInt(countsMatch[2], 10) : 0)) : (countsMatch ? parseInt(countsMatch[2], 10) : 0);

      if (!isNaN(nAtoms) && nAtoms > 0) {
        for (let j = 0; j < nAtoms && (countsLineIdx + 1 + j) < blockLines.length; j++) {
          const line = blockLines[countsLineIdx + 1 + j];
          if (!line.trim() || line.startsWith('M  END') || line.startsWith('$$$$')) break;

          let symbol = '';
          let xVal: number | undefined;
          let yVal: number | undefined;
          let zVal: number | undefined;

          // Standard MDL fixed-width format (cols 0-10, 10-20, 20-30, 31-34)
          if (line.length >= 34) {
            const xStr = line.substring(0, 10).trim();
            const yStr = line.substring(10, 20).trim();
            const zStr = line.substring(20, 30).trim();
            const symStr = line.substring(31, 34).trim();
            if (!isNaN(parseFloat(xStr)) && !isNaN(parseFloat(yStr)) && !isNaN(parseFloat(zStr))) {
              xVal = parseFloat(xStr);
              yVal = parseFloat(yStr);
              zVal = parseFloat(zStr);
              symbol = symStr;
            }
          }

          if (!symbol || !isValidAtomSymbol(symbol)) {
            const tokens = line.trim().split(/\s+/);
            if (tokens.length >= 4 && !isNaN(parseFloat(tokens[0])) && !isNaN(parseFloat(tokens[1])) && !isNaN(parseFloat(tokens[2]))) {
              xVal = parseFloat(tokens[0]);
              yVal = parseFloat(tokens[1]);
              zVal = parseFloat(tokens[2]);
              if (isValidAtomSymbol(tokens[3])) {
                symbol = tokens[3];
              }
            }
          }

          if (symbol && isValidAtomSymbol(symbol)) {
            let atomMapNumber: number | undefined = undefined;
            if (line.length >= 63) {
              const mapStr = line.substring(60, 63).trim();
              const mapVal = parseInt(mapStr, 10);
              if (!isNaN(mapVal) && mapVal > 0) atomMapNumber = mapVal;
            }

            let radVal = 0;
            const chrgCol = line.length >= 39 ? line.substring(36, 39).trim() : (line.length >= 38 ? line.substring(36, 38).trim() : '');
            const parsedCharge = parseInt(chrgCol, 10);
            if (!isNaN(parsedCharge)) {
              radVal = (parsedCharge === 4) ? 2 : parsedCharge;
            }

            const cleanSym = normalizeAtomSymbol(symbol);
            const isGeneric = isGenericAtomSymbol(cleanSym);
            const atomNum = isReactant ? rCounter++ : pCounter++;

            molAtoms.push({
              atomNumber: atomNum,
              molAtomIndex: molAtoms.length + 1,
              symbol: cleanSym,
              isGeneric: isGeneric,
              moleculeIndex: moleculeIndex,
              isReactant: isReactant,
              atomMapNumber: atomMapNumber,
              x: xVal,
              y: yVal,
              z: zVal,
              radical: radVal
            });
          }
        }

        // Parse Bond Lines
        const bondStartIdx = countsLineIdx + 1 + nAtoms;
        for (let k = 0; k < nBonds && (bondStartIdx + k) < blockLines.length; k++) {
          const line = blockLines[bondStartIdx + k];
          if (!line.trim() || line.startsWith('M  END') || line.startsWith('$$$$')) break;

          let a1Local = 0;
          let a2Local = 0;
          let bType = 1;

          const tokens = line.trim().split(/\s+/);
          if (tokens.length >= 3) {
            a1Local = parseInt(tokens[0], 10);
            a2Local = parseInt(tokens[1], 10);
            bType = parseInt(tokens[2], 10);
          } else if (line.length >= 6) {
            a1Local = parseInt(line.substring(0, 3).trim(), 10);
            a2Local = parseInt(line.substring(3, 6).trim(), 10);
            bType = line.length >= 9 ? parseInt(line.substring(6, 9).trim(), 10) : 1;
          }

          if (a1Local > 0 && a2Local > 0) {
            const a1Obj = molAtoms.find(a => a.molAtomIndex === a1Local);
            const a2Obj = molAtoms.find(a => a.molAtomIndex === a2Local);

            if (a1Obj && a2Obj) {
              molBonds.push({
                moleculeIndex: moleculeIndex,
                isReactant: isReactant,
                atom1MolIndex: a1Local,
                atom2MolIndex: a2Local,
                atom1Number: a1Obj.atomNumber,
                atom2Number: a2Obj.atomNumber,
                bondType: isNaN(bType) ? 1 : bType
              });
            }
          }
        }

        // Parse Property Lines (M  RAD)
        for (let p = countsLineIdx + 1; p < blockLines.length; p++) {
          const pLine = blockLines[p].trim();
          if (pLine.startsWith('M  RAD') || pLine.startsWith('M RAD')) {
            const tokens = pLine.split(/\s+/);
            if (tokens.length >= 4) {
              const entryCount = parseInt(tokens[2], 10);
              for (let e = 0; e < entryCount && (3 + e * 2 + 1) < tokens.length; e++) {
                const localIdx = parseInt(tokens[3 + e * 2], 10);
                const radType = parseInt(tokens[3 + e * 2 + 1], 10);
                const atomObj = molAtoms.find(a => a.molAtomIndex === localIdx);
                if (atomObj) {
                  atomObj.radical = radType;
                }
              }
            }
          }
        }

        return { atoms: molAtoms, bonds: molBonds, nextReactantCounter: rCounter, nextProductCounter: pCounter };
      }
    }

    // Fallback scanner (if no counts line found, e.g. snippet of atom lines)
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];
      const match = line.match(/^\s*([-+]?\d+\.\d+)\s+([-+]?\d+\.\d+)\s+([-+]?\d+\.\d+)\s+([A-Za-z*#][A-Za-z0-9*#]*)/);
      if (match) {
        const sym = match[4].trim();
        if (!isValidAtomSymbol(sym)) continue;
        const xVal = parseFloat(match[1]);
        const yVal = parseFloat(match[2]);
        const zVal = parseFloat(match[3]);
        const cleanSym = normalizeAtomSymbol(sym);
        const isGeneric = isGenericAtomSymbol(cleanSym);
        const atomNum = isReactant ? rCounter++ : pCounter++;
        molAtoms.push({
          atomNumber: atomNum,
          molAtomIndex: molAtoms.length + 1,
          symbol: cleanSym,
          isGeneric,
          moleculeIndex,
          isReactant,
          x: xVal,
          y: yVal,
          z: zVal
        });
      }
    }

    return { atoms: molAtoms, bonds: molBonds, nextReactantCounter: rCounter, nextProductCounter: pCounter };
  }

  /**
   * Builds candidate dropdown options for each reactant atom.
   * Compares symbols or generic flags to determine valid product candidates.
   */
  public buildCandidateProductAtoms(
    reactantAtom: AtomInfo,
    productAtoms: AtomInfo[],
    numReactants: number = 1
  ): CandidateProductAtom[] {
    const rSym = reactantAtom.symbol.replace(/#/g, '').toUpperCase();
    return productAtoms
      .filter(pAtom => {
        const pSym = pAtom.symbol.replace(/#/g, '').toUpperCase();
        if (pSym === rSym) return true;
        if (reactantAtom.isGeneric && pAtom.isGeneric) {
          return true;
        }
        return false;
      })
      .map(pAtom => {
        return {
          atomNumber: pAtom.atomNumber,
          label: `Atom #${pAtom.atomNumber} (${pAtom.symbol}) - Product #${pAtom.moleculeIndex}`,
          symbol: pAtom.symbol,
          moleculeIndex: pAtom.moleculeIndex
        };
      });
  }

  /**
   * Builds the initial correspondence rows given reactant & product atoms,
   * candidate options, and optional pre-existing mappings.
   */
  public buildInitialCorrespondences(
    reactantAtoms: AtomInfo[],
    productAtoms: AtomInfo[],
    reactantBonds: BondInfo[] = [],
    productBonds: BondInfo[] = [],
    explicitMappings?: Map<number, number>
  ): AtomCorrespondenceRow[] {
    const assignedProductAtomNums = new Set<number>();
    const resultMap = new Map<number, number>();

    // 1. Pre-existing or explicit atom mappings take highest priority
    if (explicitMappings && explicitMappings.size > 0) {
      explicitMappings.forEach((prodNum, reactNum) => {
        resultMap.set(reactNum, prodNum);
        assignedProductAtomNums.add(prodNum);
      });
    }

    // 2. Atom map numbers from Ketcher / MDL CTFile
    reactantAtoms.forEach(rAtom => {
      if (!resultMap.has(rAtom.atomNumber) && rAtom.atomMapNumber !== undefined) {
        const cand = productAtoms.find(p =>
          p.atomMapNumber !== undefined &&
          p.atomMapNumber === rAtom.atomMapNumber &&
          !assignedProductAtomNums.has(p.atomNumber)
        );
        if (cand) {
          resultMap.set(rAtom.atomNumber, cand.atomNumber);
          assignedProductAtomNums.add(cand.atomNumber);
        }
      }
    });

    const getCandidateScore = (rAtom: AtomInfo, cand: AtomInfo): number => {
      let score = 0;
      const rNeighbors = reactantBonds
        .filter(b => b.atom1Number === rAtom.atomNumber || b.atom2Number === rAtom.atomNumber)
        .map(b => (b.atom1Number === rAtom.atomNumber ? b.atom2Number : b.atom1Number));

      const pNeighbors = productBonds
        .filter(b => b.atom1Number === cand.atomNumber || b.atom2Number === cand.atomNumber)
        .map(b => (b.atom1Number === cand.atomNumber ? b.atom2Number : b.atom1Number));

      rNeighbors.forEach(rn => {
        const matchedP = resultMap.get(rn);
        if (matchedP !== undefined && pNeighbors.includes(matchedP)) {
          score += 10;
        }
      });

      if (cand.moleculeIndex === rAtom.moleculeIndex) {
        score += 1;
      }
      return score;
    };

    // 3. Match non-H atoms first
    const nonHAtoms = reactantAtoms.filter(a => a.symbol !== 'H' && !resultMap.has(a.atomNumber));
    nonHAtoms.forEach(rAtom => {
      const rSym = rAtom.symbol.replace(/#/g, '').toUpperCase();
      const allCandidates = productAtoms.filter(pAtom => {
        const pSym = pAtom.symbol.replace(/#/g, '').toUpperCase();
        return pSym === rSym || (rAtom.isGeneric && pAtom.isGeneric);
      });
      let available = allCandidates.filter(p => !assignedProductAtomNums.has(p.atomNumber));
      if (available.length === 0) available = allCandidates;

      let bestCand = available[0];
      let bestScore = -1;
      available.forEach(cand => {
        const s = getCandidateScore(rAtom, cand);
        if (s > bestScore) {
          bestScore = s;
          bestCand = cand;
        }
      });
      if (bestCand) {
        resultMap.set(rAtom.atomNumber, bestCand.atomNumber);
        assignedProductAtomNums.add(bestCand.atomNumber);
      }
    });

    // 4. Match H atoms
    const hAtoms = reactantAtoms.filter(a => a.symbol === 'H' && !resultMap.has(a.atomNumber));
    const hScores = hAtoms.map(rAtom => {
      const allCandidates = productAtoms.filter(p => p.symbol === 'H' && !assignedProductAtomNums.has(p.atomNumber));
      let maxS = 0;
      allCandidates.forEach(cand => {
        const s = getCandidateScore(rAtom, cand);
        if (s > maxS) maxS = s;
      });
      return { rAtom, maxS };
    }).sort((a, b) => b.maxS - a.maxS);

    hScores.forEach(({ rAtom }) => {
      const available = productAtoms.filter(p => p.symbol === 'H' && !assignedProductAtomNums.has(p.atomNumber));
      let bestCand = available[0];
      let bestScore = -1;
      available.forEach(cand => {
        const s = getCandidateScore(rAtom, cand);
        if (s > bestScore) {
          bestScore = s;
          bestCand = cand;
        }
      });
      if (bestCand) {
        resultMap.set(rAtom.atomNumber, bestCand.atomNumber);
        assignedProductAtomNums.add(bestCand.atomNumber);
      }
    });

    // 5. Fallback for any unassigned
    reactantAtoms.forEach(rAtom => {
      if (!resultMap.has(rAtom.atomNumber)) {
        const rSym = rAtom.symbol.replace(/#/g, '').toUpperCase();
        const allCandidates = productAtoms.filter(pAtom => {
          const pSym = pAtom.symbol.replace(/#/g, '').toUpperCase();
          return pSym === rSym || (rAtom.isGeneric && pAtom.isGeneric);
        });
        let available = allCandidates.filter(p => !assignedProductAtomNums.has(p.atomNumber));
        if (available.length === 0) available = allCandidates;
        if (available.length > 0) {
          resultMap.set(rAtom.atomNumber, available[0].atomNumber);
          assignedProductAtomNums.add(available[0].atomNumber);
        }
      }
    });

    const numReactants = new Set(reactantAtoms.map(a => a.moleculeIndex)).size || 1;

    return reactantAtoms.map(rAtom => {
      const candidates = this.buildCandidateProductAtoms(rAtom, productAtoms, numReactants);
      return {
        reactantAtomNumber: rAtom.atomNumber,
        reactantSymbol: rAtom.symbol,
        reactantMoleculeIndex: rAtom.moleculeIndex,
        molAtomIndex: rAtom.molAtomIndex,
        productAtomNumber: resultMap.get(rAtom.atomNumber) || null,
        candidateProductAtoms: candidates
      };
    });
  }

  /**
   * Recalculates bond changes (broken type 4 and formed type 104) based on
   * reactant bonds, product bonds, and current correspondence mappings.
   */
  public buildBondChanges(
    reactantBonds: BondInfo[],
    productBonds: BondInfo[],
    correspondenceRows: AtomCorrespondenceRow[]
  ): BondChangeRow[] {
    const bondChangeRows: BondChangeRow[] = [];
    const rToPMap = new Map<number, number>();
    const pToRMap = new Map<number, number>();

    correspondenceRows.forEach(row => {
      if (row.productAtomNumber !== null) {
        rToPMap.set(row.reactantAtomNumber, row.productAtomNumber);
        pToRMap.set(row.productAtomNumber, row.reactantAtomNumber);
      }
    });

    // 1. Broken Bonds in Reactants (Type 4)
    reactantBonds.forEach(rBond => {
      const pAtom1 = rToPMap.get(rBond.atom1Number);
      const pAtom2 = rToPMap.get(rBond.atom2Number);

      let bondExistsInProduct = false;
      if (pAtom1 !== undefined && pAtom2 !== undefined) {
        bondExistsInProduct = productBonds.some(pBond =>
          (pBond.atom1Number === pAtom1 && pBond.atom2Number === pAtom2) ||
          (pBond.atom1Number === pAtom2 && pBond.atom2Number === pAtom1)
        );
      }

      if (!bondExistsInProduct || rBond.bondType === 4) {
        bondChangeRows.push({
          moleculeIndex: rBond.moleculeIndex,
          atom1Number: rBond.atom1Number,
          atom2Number: rBond.atom2Number,
          type: 4
        });
      }
    });

    // 2. Formed Bonds in Products (Type 104)
    productBonds.forEach(pBond => {
      const rAtom1 = pToRMap.get(pBond.atom1Number);
      const rAtom2 = pToRMap.get(pBond.atom2Number);

      let bondExistsInReactant = false;
      if (rAtom1 !== undefined && rAtom2 !== undefined) {
        bondExistsInReactant = reactantBonds.some(rBond =>
          (rBond.atom1Number === rAtom1 && rBond.atom2Number === rAtom2) ||
          (rBond.atom1Number === rAtom2 && rBond.atom2Number === rAtom1)
        );
      }

      if (!bondExistsInReactant || pBond.bondType === 4 || pBond.bondType === 104) {
        bondChangeRows.push({
          moleculeIndex: pBond.moleculeIndex,
          atom1Number: pBond.atom1Number,
          atom2Number: pBond.atom2Number,
          type: 104
        });
      }
    });

    return bondChangeRows;
  }

  /**
   * Generates the ASCII text block for the `- Correspondences` section in a .lst file.
   */
  public buildLstCorrespondencesBlock(
    reactantAtoms: AtomInfo[],
    productAtoms: AtomInfo[],
    reactantBonds: BondInfo[],
    productBonds: BondInfo[],
    correspondenceRows: AtomCorrespondenceRow[],
    bondChangeRows: BondChangeRow[]
  ): string {
    const lines: string[] = [];

    const isBondChange = (a1: number, a2: number, r1?: number, r2?: number): boolean => {
      return bondChangeRows.some(bc =>
        (bc.atom1Number === a1 && bc.atom2Number === a2) ||
        (bc.atom1Number === a2 && bc.atom2Number === a1) ||
        (r1 !== undefined && r2 !== undefined && (
          (bc.atom1Number === r1 && bc.atom2Number === r2) ||
          (bc.atom1Number === r2 && bc.atom2Number === r1)
        ))
      );
    };

    // 1. Reactant Molecules
    const reactantMolIndices = Array.from(new Set(reactantAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    reactantMolIndices.forEach(mIdx => {
      const molAtoms = reactantAtoms.filter(a => a.moleculeIndex === mIdx);
      const atomNums = molAtoms.map(a => Math.max(1, a.atomNumber));
      const molBonds = reactantBonds.filter(b => b.moleculeIndex === mIdx);

      const atomNumsStr = atomNums.join(' ');
      if (molBonds.length > 0) {
        const bondTypesStr = molBonds.map(b => {
          if (isBondChange(b.atom1Number, b.atom2Number) || b.bondType === 4 || b.bondType === 104) {
            return '4';
          }
          return (b.bondType || 1).toString();
        }).join(' ');
        lines.push(`${atomNumsStr.padEnd(24, ' ')}${bondTypesStr}`);
      } else {
        lines.push(atomNumsStr);
      }
    });

    // 2. Product Molecules
    const productMolIndices = Array.from(new Set(productAtoms.map(a => a.moleculeIndex))).sort((a, b) => a - b);
    productMolIndices.forEach(pIdx => {
      const pAtoms = productAtoms.filter(a => a.moleculeIndex === pIdx);
      const mappedAtomNums = pAtoms.map(pa => {
        const corr = correspondenceRows.find(c => c.productAtomNumber === pa.atomNumber);
        return corr ? Math.max(1, corr.reactantAtomNumber) : Math.max(1, pa.atomNumber);
      });

      const pBonds = productBonds.filter(b => b.moleculeIndex === pIdx);
      const atomNumsStr = mappedAtomNums.join(' ');
      if (pBonds.length > 0) {
        const bondTypesStr = pBonds.map(b => {
          const r1 = correspondenceRows.find(c => c.productAtomNumber === b.atom1Number)?.reactantAtomNumber ?? b.atom1Number;
          const r2 = correspondenceRows.find(c => c.productAtomNumber === b.atom2Number)?.reactantAtomNumber ?? b.atom2Number;
          if (isBondChange(b.atom1Number, b.atom2Number, r1, r2) || b.bondType === 4 || b.bondType === 104) {
            return '4';
          }
          return (b.bondType || 1).toString();
        }).join(' ');
        lines.push(`${atomNumsStr.padEnd(24, ' ')}${bondTypesStr}`);
      } else {
        lines.push(atomNumsStr);
      }
    });

    return lines.join('\n');
  }

  /**
   * Updates or builds the TotalCorr property inside a Firestore ReactionPatterns document.
   */
  public updateReactionPatternDocument(
    existingDoc: any,
    patternName: string,
    correspondenceRows: AtomCorrespondenceRow[],
    bondChangeRows: BondChangeRow[],
    reactantAtoms: AtomInfo[],
    productAtoms: AtomInfo[]
  ): any {
    const updated = { ...existingDoc };
    const pAtomMap = new Map<number, AtomInfo>(productAtoms.map(a => [a.atomNumber, a]));
    const rAtomMap = new Map<number, AtomInfo>(reactantAtoms.map(a => [a.atomNumber, a]));

    const corrs = correspondenceRows
      .filter(row => row.productAtomNumber !== null)
      .map((row, idx) => {
        const rAtom = rAtomMap.get(row.reactantAtomNumber);
        const pAtom = pAtomMap.get(row.productAtomNumber!);
        const rMolIdx = (rAtom?.moleculeIndex ?? row.reactantMoleculeIndex ?? 1) - 1;
        const pMolIdx = (pAtom?.moleculeIndex ?? 1) - 1;
        const rAtomIdx = rAtom?.molAtomIndex !== undefined ? (rAtom.molAtomIndex - 1) : (row.reactantAtomNumber - 1);
        const pAtomIdx = pAtom?.molAtomIndex !== undefined ? (pAtom.molAtomIndex - 1) : ((row.productAtomNumber || 1) - 1);

        return {
          ID: idx,
          Name: null,
          ReactantPosition: 0,
          ProductPosition: 0,
          Reactant: {
            ID: row.reactantAtomNumber - 1,
            Name: null,
            MoleculeNumber: rMolIdx,
            AtomNumber: rAtomIdx
          },
          Product: {
            ID: (row.productAtomNumber || 1) - 1,
            Name: null,
            MoleculeNumber: pMolIdx,
            AtomNumber: pAtomIdx
          }
        };
      });

    const changes = bondChangeRows.map((bc, idx) => {
      const isBroken = bc.type === 4;
      const a1 = isBroken ? rAtomMap.get(bc.atom1Number) : pAtomMap.get(bc.atom1Number);
      const a2 = isBroken ? rAtomMap.get(bc.atom2Number) : pAtomMap.get(bc.atom2Number);
      const molIdx = (bc.moleculeIndex || 1) - 1;

      return {
        ID: idx,
        Name: patternName,
        Type: bc.type,
        Atom1: {
          ID: bc.atom1Number - 1,
          Name: null,
          ReactantPosition: 0,
          ProductPosition: 0,
          [isBroken ? 'Reactant' : 'Product']: {
            ID: bc.atom1Number - 1,
            Name: null,
            MoleculeNumber: molIdx,
            AtomNumber: a1?.molAtomIndex !== undefined ? a1.molAtomIndex - 1 : (bc.atom1Number - 1)
          }
        },
        Atom2: {
          ID: bc.atom2Number - 1,
          Name: null,
          ReactantPosition: 0,
          ProductPosition: 0,
          [isBroken ? 'Reactant' : 'Product']: {
            ID: bc.atom2Number - 1,
            Name: null,
            MoleculeNumber: molIdx,
            AtomNumber: a2?.molAtomIndex !== undefined ? a2.molAtomIndex - 1 : (bc.atom2Number - 1)
          }
        }
      };
    });

    const brokenBonds = bondChangeRows.filter(b => b.type === 4);
    const formedBonds = bondChangeRows.filter(b => b.type === 104);

    updated.TotalCorr = {
      ...(updated.TotalCorr || {}),
      ID: updated.ID || updated.keyId || 0,
      Name: patternName,
      NumberOfCorrs: corrs.length,
      Corrs: corrs,
      BondChanges: {
        ID: updated.ID || updated.keyId || 0,
        Name: patternName,
        NumberBondChanges: changes.length,
        Changes: changes
      }
    };

    updated.reactionBrokenBonds = brokenBonds.map(b => {
      const a1 = rAtomMap.get(b.atom1Number);
      const a2 = rAtomMap.get(b.atom2Number);
      return `${a1?.symbol || 'X'}-${a2?.symbol || 'Y'}`;
    });

    updated.reactionFormedBonds = formedBonds.map(b => {
      const a1 = pAtomMap.get(b.atom1Number);
      const a2 = pAtomMap.get(b.atom2Number);
      return `${a1?.symbol || 'X'}-${a2?.symbol || 'Y'}`;
    });

    updated.updatedAt = new Date().toISOString();

    return updated;
  }
}

