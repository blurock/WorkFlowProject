import { Injectable } from '@angular/core';

export interface ReactionAtom {
  atomNumber: number;
  symbol: string;
  moleculeIndex: number;
  isReactant: boolean;
  isRadical: boolean;
  atomMapNumber?: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface ReactionBond {
  moleculeIndex: number;
  isReactant: boolean;
  atom1Number: number;
  atom2Number: number;
  bondType: number; // 1 = Single, 2 = Double, 3 = Triple, 4 = Aromatic
}

export interface BondChangeInfo {
  atom1Number: number;
  atom2Number: number;
  atom1Symbol: string;
  atom2Symbol: string;
  isBreaking: boolean; // true = Broken (Reactant), false = Formed (Product)
  atom1Encoding: string;
  atom2Encoding: string;
  bondEncoding: string;
}

export interface ReactiveCenterResult {
  reactionBrokenBonds: string[];
  reactionFormedBonds: string[];
  reactionCenterKey: string;
  brokenDetails: BondChangeInfo[];
  formedDetails: BondChangeInfo[];
  reactantAtoms: ReactionAtom[];
  productAtoms: ReactionAtom[];
  hasChanges: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReactiveCenterService {

  /**
   * Translates an integer bond type to a canonical character code.
   * 1 = S (Single), 2 = D (Double), 3 = T (Triple), 4 = A (Aromatic)
   */
  public bondTypeToChar(type: number): string {
    switch (type) {
      case 1: return 'S';
      case 2: return 'D';
      case 3: return 'T';
      case 4: return 'A';
      default: return 'S';
    }
  }

  /**
   * Generates a canonical atom encoding token: T:V:BBB
   * T: Atom Symbol (C, H, O, N, etc.)
   * V: Valence/Radical State (R = Radical, N = Non-radical)
   * BBB: Lexicographically sorted spectator bonds (e.g. 'DSS', 'SSS', '')
   */
  public encodeAtom(symbol: string, isRadical: boolean, spectatorBondTypes: number[]): string {
    const v = isRadical ? 'R' : 'N';
    const bbb = spectatorBondTypes
      .map(b => this.bondTypeToChar(b))
      .sort()
      .join('');
    return `${symbol.trim()}:${v}:${bbb}`;
  }

  /**
   * Generates a canonical bond encoding token from two atom encodings:
   * Sorts atom1 and atom2 lexicographically: min(atom1, atom2)_max(atom1, atom2)
   */
  public encodeBond(atom1Encoding: string, atom2Encoding: string): string {
    return [atom1Encoding, atom2Encoding].sort().join('_');
  }

  /**
   * Analyzes an exported Ketcher RXN block or reaction string and computes
   * its canonical reactive center encoding.
   */
  public analyzeReaction(rxnContent: string): ReactiveCenterResult {
    if (!rxnContent || !rxnContent.trim()) {
      return {
        reactionBrokenBonds: [],
        reactionFormedBonds: [],
        reactionCenterKey: '',
        brokenDetails: [],
        formedDetails: [],
        reactantAtoms: [],
        productAtoms: [],
        hasChanges: false,
        error: 'Reaction content is empty.'
      };
    }

    try {
      const parsed = this.parseRxnContent(rxnContent);
      return this.computeReactiveCenter(parsed.reactantAtoms, parsed.productAtoms, parsed.reactantBonds, parsed.productBonds);
    } catch (err: any) {
      return {
        reactionBrokenBonds: [],
        reactionFormedBonds: [],
        reactionCenterKey: '',
        brokenDetails: [],
        formedDetails: [],
        reactantAtoms: [],
        productAtoms: [],
        hasChanges: false,
        error: err?.message || 'Failed to parse reaction.'
      };
    }
  }

  /**
   * Computes reactive center encodings directly from structured atoms and bonds.
   */
  public computeReactiveCenter(
    reactantAtoms: ReactionAtom[],
    productAtoms: ReactionAtom[],
    reactantBonds: ReactionBond[],
    productBonds: ReactionBond[]
  ): ReactiveCenterResult {
    const { rToPMap, pToRMap } = this.deriveCorrespondences(reactantAtoms, productAtoms);

    const brokenDetails: BondChangeInfo[] = [];
    const formedDetails: BondChangeInfo[] = [];

    // 1. Detect Broken Bonds in Reactants
    for (const rBond of reactantBonds) {
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
        const a1 = reactantAtoms.find(a => a.atomNumber === rBond.atom1Number);
        const a2 = reactantAtoms.find(a => a.atomNumber === rBond.atom2Number);
        if (a1 && a2) {
          // Spectator bonds for atom 1 (excluding rBond)
          const a1Spectators = reactantBonds
            .filter(b => b !== rBond && (b.atom1Number === a1.atomNumber || b.atom2Number === a1.atomNumber))
            .map(b => b.bondType);

          // Spectator bonds for atom 2 (excluding rBond)
          const a2Spectators = reactantBonds
            .filter(b => b !== rBond && (b.atom1Number === a2.atomNumber || b.atom2Number === a2.atomNumber))
            .map(b => b.bondType);

          const a1Enc = this.encodeAtom(a1.symbol, a1.isRadical, a1Spectators);
          const a2Enc = this.encodeAtom(a2.symbol, a2.isRadical, a2Spectators);
          const bondEnc = this.encodeBond(a1Enc, a2Enc);

          brokenDetails.push({
            atom1Number: a1.atomNumber,
            atom2Number: a2.atomNumber,
            atom1Symbol: a1.symbol,
            atom2Symbol: a2.symbol,
            isBreaking: true,
            atom1Encoding: a1Enc,
            atom2Encoding: a2Enc,
            bondEncoding: bondEnc
          });
        }
      }
    }

    // 2. Detect Formed Bonds in Products
    for (const pBond of productBonds) {
      const rAtom1 = pToRMap.get(pBond.atom1Number);
      const rAtom2 = pToRMap.get(pBond.atom2Number);

      let bondExistsInReactant = false;
      if (rAtom1 !== undefined && rAtom2 !== undefined) {
        bondExistsInReactant = reactantBonds.some(rBond =>
          (rBond.atom1Number === rAtom1 && rBond.atom2Number === rAtom2) ||
          (rBond.atom1Number === rAtom2 && rBond.atom2Number === rAtom1)
        );
      }

      if (!bondExistsInReactant || pBond.bondType === 4) {
        const a1 = productAtoms.find(a => a.atomNumber === pBond.atom1Number);
        const a2 = productAtoms.find(a => a.atomNumber === pBond.atom2Number);
        if (a1 && a2) {
          // Spectator bonds for product atom 1 (excluding pBond)
          const a1Spectators = productBonds
            .filter(b => b !== pBond && (b.atom1Number === a1.atomNumber || b.atom2Number === a1.atomNumber))
            .map(b => b.bondType);

          // Spectator bonds for product atom 2 (excluding pBond)
          const a2Spectators = productBonds
            .filter(b => b !== pBond && (b.atom1Number === a2.atomNumber || b.atom2Number === a2.atomNumber))
            .map(b => b.bondType);

          const a1Enc = this.encodeAtom(a1.symbol, a1.isRadical, a1Spectators);
          const a2Enc = this.encodeAtom(a2.symbol, a2.isRadical, a2Spectators);
          const bondEnc = this.encodeBond(a1Enc, a2Enc);

          formedDetails.push({
            atom1Number: a1.atomNumber,
            atom2Number: a2.atomNumber,
            atom1Symbol: a1.symbol,
            atom2Symbol: a2.symbol,
            isBreaking: false,
            atom1Encoding: a1Enc,
            atom2Encoding: a2Enc,
            bondEncoding: bondEnc
          });
        }
      }
    }

    // Canonical array encodings
    const reactionBrokenBonds = Array.from(new Set(brokenDetails.map(d => d.bondEncoding))).sort();
    const reactionFormedBonds = Array.from(new Set(formedDetails.map(d => d.bondEncoding))).sort();

    // Composite key
    const parts: string[] = [];
    if (reactionBrokenBonds.length > 0) {
      parts.push(`B:${reactionBrokenBonds.join(';')}`);
    }
    if (reactionFormedBonds.length > 0) {
      parts.push(`F:${reactionFormedBonds.join(';')}`);
    }
    const reactionCenterKey = parts.join('_');

    return {
      reactionBrokenBonds,
      reactionFormedBonds,
      reactionCenterKey,
      brokenDetails,
      formedDetails,
      reactantAtoms,
      productAtoms,
      hasChanges: reactionBrokenBonds.length > 0 || reactionFormedBonds.length > 0
    };
  }

  /**
   * Maps reactant atoms to product atoms using either explicit Ketcher
   * atom map numbers (AAM) or topological correspondence.
   */
  public deriveCorrespondences(
    reactantAtoms: ReactionAtom[],
    productAtoms: ReactionAtom[]
  ): { rToPMap: Map<number, number>; pToRMap: Map<number, number> } {
    const rToPMap = new Map<number, number>();
    const pToRMap = new Map<number, number>();

    // 1. Check if explicit atom mapping numbers (AAM) are present
    const rMapped = reactantAtoms.filter(a => a.atomMapNumber && a.atomMapNumber > 0);
    const pMapped = productAtoms.filter(a => a.atomMapNumber && a.atomMapNumber > 0);

    if (rMapped.length > 0 && pMapped.length > 0) {
      const pByMap = new Map<number, ReactionAtom>();
      pMapped.forEach(a => pByMap.set(a.atomMapNumber!, a));

      rMapped.forEach(r => {
        const p = pByMap.get(r.atomMapNumber!);
        if (p) {
          rToPMap.set(r.atomNumber, p.atomNumber);
          pToRMap.set(p.atomNumber, r.atomNumber);
        }
      });
    }

    // 2. Hybrid fallback: Match unmapped atoms by symbol and topology/order
    const unmappedReactants = reactantAtoms.filter(a => !rToPMap.has(a.atomNumber));
    const matchedPNums = new Set<number>(pToRMap.keys());
    const unmappedProducts = productAtoms.filter(a => !matchedPNums.has(a.atomNumber));

    // Group available products by symbol
    const pBySymbol = new Map<string, ReactionAtom[]>();
    for (const p of unmappedProducts) {
      const sym = p.symbol.toUpperCase();
      if (!pBySymbol.has(sym)) pBySymbol.set(sym, []);
      pBySymbol.get(sym)!.push(p);
    }

    for (const r of unmappedReactants) {
      const sym = r.symbol.toUpperCase();
      const candidates = pBySymbol.get(sym);
      if (candidates && candidates.length > 0) {
        // Pick the closest candidate (order-based heuristic)
        const chosen = candidates.shift()!;
        rToPMap.set(r.atomNumber, chosen.atomNumber);
        pToRMap.set(chosen.atomNumber, r.atomNumber);
      }
    }

    return { rToPMap, pToRMap };
  }

  /**
   * Parses an MDL $RXN format string into structured atoms and bonds.
   */
  public parseRxnContent(rxnStr: string): {
    reactantAtoms: ReactionAtom[];
    productAtoms: ReactionAtom[];
    reactantBonds: ReactionBond[];
    productBonds: ReactionBond[];
  } {
    const reactantAtoms: ReactionAtom[] = [];
    const productAtoms: ReactionAtom[] = [];
    const reactantBonds: ReactionBond[] = [];
    const productBonds: ReactionBond[] = [];

    const lines = rxnStr.split(/\r?\n/);
    const rxnHeaderIdx = lines.findIndex(l => l.trim().startsWith('$RXN'));
    let numReactants = 1;
    let numProducts = 1;

    if (rxnHeaderIdx >= 0) {
      for (let i = rxnHeaderIdx + 1; i < Math.min(lines.length, rxnHeaderIdx + 8); i++) {
        const countsMatch = lines[i].match(/^\s*(\d+)\s+(\d+)\s*$/);
        if (countsMatch) {
          numReactants = parseInt(countsMatch[1], 10);
          numProducts = parseInt(countsMatch[2], 10);
          break;
        }
      }
    }

    // Split by $MOL blocks
    const molBlockStrings: string[] = [];
    let currentBlockLines: string[] = [];
    let insideMol = false;

    for (const line of lines) {
      if (line.trim().startsWith('$MOL')) {
        if (insideMol && currentBlockLines.length > 0) {
          molBlockStrings.push(currentBlockLines.join('\n'));
        }
        currentBlockLines = [];
        insideMol = true;
      } else if (insideMol) {
        currentBlockLines.push(line);
      }
    }
    if (insideMol && currentBlockLines.length > 0) {
      molBlockStrings.push(currentBlockLines.join('\n'));
    }

    if (molBlockStrings.length === 0) {
      molBlockStrings.push(rxnStr);
    }

    let globalAtomCounter = 1;

    molBlockStrings.forEach((blockStr, molIdx) => {
      const moleculeIndex = molIdx + 1;
      const isReactant = molIdx < numReactants;

      const molLines = blockStr.split(/\r?\n/);
      let countsLineIdx = -1;
      let numAtoms = 0;
      let numBonds = 0;

      for (let i = 0; i < molLines.length; i++) {
        const l = molLines[i];
        if (l.includes('V2000') || /^\s*\d+\s+\d+\s+/.test(l)) {
          const m = l.match(/^\s*(\d+)\s+(\d+)/);
          if (m) {
            numAtoms = parseInt(m[1], 10);
            numBonds = parseInt(m[2], 10);
            countsLineIdx = i;
            break;
          }
        }
      }

      if (countsLineIdx < 0) return;

      const molAtomMap = new Map<number, number>(); // mol index (1-based) -> global atomNumber

      // Parse Atoms
      for (let i = 1; i <= numAtoms; i++) {
        const lineIdx = countsLineIdx + i;
        if (lineIdx >= molLines.length) break;
        const line = molLines[lineIdx];

        const x = parseFloat(line.substring(0, 10).trim()) || 0;
        const y = parseFloat(line.substring(10, 20).trim()) || 0;
        const z = parseFloat(line.substring(20, 30).trim()) || 0;
        const symbol = line.substring(30, 34).trim() || 'C';

        let atomMapNumber: number | undefined;
        if (line.length >= 63) {
          const mapStr = line.substring(60, 63).trim();
          if (mapStr && !isNaN(Number(mapStr))) {
            const parsedMap = parseInt(mapStr, 10);
            if (parsedMap > 0) atomMapNumber = parsedMap;
          }
        }

        const atomNumber = globalAtomCounter++;
        molAtomMap.set(i, atomNumber);

        const atomObj: ReactionAtom = {
          atomNumber,
          symbol,
          moleculeIndex,
          isReactant,
          isRadical: false,
          atomMapNumber,
          x,
          y,
          z
        };

        if (isReactant) {
          reactantAtoms.push(atomObj);
        } else {
          productAtoms.push(atomObj);
        }
      }

      // Parse Bonds
      const bondsStart = countsLineIdx + numAtoms + 1;
      for (let i = 0; i < numBonds; i++) {
        const lineIdx = bondsStart + i;
        if (lineIdx >= molLines.length) break;
        const line = molLines[lineIdx];

        const a1 = parseInt(line.substring(0, 3).trim(), 10);
        const a2 = parseInt(line.substring(3, 6).trim(), 10);
        const bType = parseInt(line.substring(6, 9).trim(), 10) || 1;

        const atom1Number = molAtomMap.get(a1);
        const atom2Number = molAtomMap.get(a2);

        if (atom1Number !== undefined && atom2Number !== undefined) {
          const bondObj: ReactionBond = {
            moleculeIndex,
            isReactant,
            atom1Number,
            atom2Number,
            bondType: bType
          };

          if (isReactant) {
            reactantBonds.push(bondObj);
          } else {
            productBonds.push(bondObj);
          }
        }
      }

      // Parse Radicals (M  RAD block)
      for (let i = bondsStart + numBonds; i < molLines.length; i++) {
        const line = molLines[i];
        if (line.startsWith('M  RAD')) {
          const parts = line.trim().split(/\s+/);
          const count = parseInt(parts[2], 10);
          for (let c = 0; c < count; c++) {
            const atomIdxInMol = parseInt(parts[3 + c * 2], 10);
            const radType = parseInt(parts[4 + c * 2], 10);
            const globalNum = molAtomMap.get(atomIdxInMol);
            if (globalNum !== undefined && radType > 0) {
              const targetList = isReactant ? reactantAtoms : productAtoms;
              const atm = targetList.find(a => a.atomNumber === globalNum);
              if (atm) {
                atm.isRadical = true;
              }
            }
          }
        }
      }
    });

    return { reactantAtoms, productAtoms, reactantBonds, productBonds };
  }
}
