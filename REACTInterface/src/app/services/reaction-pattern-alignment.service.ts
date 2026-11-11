import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface SubstructureAtom {
  id: number; // 0-based
  atomicNumber: number;
  symbol: string;
  isRadical: boolean;
  charge: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface SubstructureBond {
  id: number;
  i: number; // atom 1 (0-based)
  j: number; // atom 2 (0-based)
  order: number; // 1 = Single, 2 = Double, 3 = Triple, 4 = Aromatic
}

export interface MoleculeSubstructureData {
  id: number;
  name: string;
  nAtoms: number;
  nBonds: number;
  atoms: SubstructureAtom[];
  bonds: SubstructureBond[];
}

export interface ParsedLstPattern {
  name: string;
  id: number;
  reactants: string[];
  products: string[];
  corrLines: string[];
  rawBlock: string;
}

export interface AtomCorrespondencePair {
  productMolIndex: number;
  productAtomIndex: number; // 0-based
  productSymbol: string;
  globalReactantAtomId: number; // 1-based as written in .lst
  reactantMolIndex: number;
  reactantAtomIndex: number; // 0-based
  reactantSymbol: string;
  isMatched: boolean;
}

export interface PatternAlignmentResult {
  patternName: string;
  patternId: number;
  reactants: string[];
  products: string[];
  alignmentStatus: 'matched' | 'adjusted' | 'mismatched';
  statusMessage: string;
  pairs: AtomCorrespondencePair[];
  brokenBondsCount: number;
  madeBondsCount: number;
  bondChangesText: string;
  dbMatchStatus: 'matched' | 'mismatched' | 'not-in-db';
  dbBrokenCount?: number;
  dbMadeCount?: number;
  adjustedCorrLines?: string[];
  adjustedLstBlock?: string;
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReactionPatternAlignmentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8085';

  // In-memory cache for substructures and DB reaction patterns to prevent repeated network calls
  private substructureCache = new Map<string, MoleculeSubstructureData>();
  private dbPatternCache = new Map<string, any>();

  /**
   * Translates an atomic number to a standard chemical symbol.
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
      case 0: return 'R';
      default: return 'R';
    }
  }

  /**
   * Fetches a substructure definition strictly from the user's Firestore database.
   */
  public async fetchSubstructureFromFirestore(nameOrId: string | number): Promise<MoleculeSubstructureData | null> {
    const keyStr = String(nameOrId).trim();
    if (this.substructureCache.has(keyStr)) {
      return this.substructureCache.get(keyStr)!;
    }

    try {
      const isNum = !isNaN(Number(keyStr)) && Number.isInteger(Number(keyStr));
      const response = await firstValueFrom(
        this.http.post<{ found: boolean; data: any }>(`${this.baseUrl}/api/db/fetch`, {
          dbName: 'Substructures',
          type: isNum ? 'int' : 'string',
          key: isNum ? Number(keyStr) : keyStr
        }).pipe(
          catchError(() => of({ found: false, data: null }))
        )
      );

      if (response && response.found && response.data) {
        const raw = response.data;
        const molfile = raw.Molfile || {};
        const rawAtoms = molfile.Atoms || [];
        const rawBonds = molfile.Bonds || [];

        const atoms: SubstructureAtom[] = rawAtoms.map((a: any, idx: number) => {
          const atomicNum = a.AtomicNumber !== undefined ? a.AtomicNumber : 6;
          return {
            id: a.ID !== undefined ? a.ID : idx,
            atomicNumber: atomicNum,
            symbol: this.atomicNumberToSymbol(atomicNum),
            isRadical: a.Radical > 0,
            charge: a.Charge || 0,
            x: a.X || 0,
            y: a.Y || 0,
            z: a.Z || 0
          };
        });

        const bonds: SubstructureBond[] = rawBonds.map((b: any, idx: number) => ({
          id: b.ID !== undefined ? b.ID : idx,
          i: b.I !== undefined ? b.I : 0,
          j: b.J !== undefined ? b.J : 0,
          order: b.Order !== undefined ? b.Order : 1
        }));

        const subData: MoleculeSubstructureData = {
          id: raw.keyId || raw.ID || 0,
          name: raw.Name || keyStr,
          nAtoms: molfile.NAtoms || atoms.length,
          nBonds: molfile.NBonds || bonds.length,
          atoms,
          bonds
        };

        this.substructureCache.set(keyStr, subData);
        if (subData.name) this.substructureCache.set(subData.name, subData);
        if (subData.id) this.substructureCache.set(String(subData.id), subData);

        return subData;
      }
    } catch (err) {
      console.warn(`[ReactionPatternAlignmentService] Error fetching substructure '${keyStr}':`, err);
    }

    return null;
  }

  /**
   * Fetches an existing Reaction Pattern from Firestore to compare bond changes.
   */
  public async fetchDbReactionPattern(patternNameOrId: string | number): Promise<any | null> {
    const keyStr = String(patternNameOrId).trim();
    if (this.dbPatternCache.has(keyStr)) {
      return this.dbPatternCache.get(keyStr);
    }

    try {
      const isNum = !isNaN(Number(keyStr)) && Number.isInteger(Number(keyStr));
      const response = await firstValueFrom(
        this.http.post<{ found: boolean; data: any }>(`${this.baseUrl}/api/db/fetch`, {
          dbName: 'ReactionPatterns',
          type: isNum ? 'int' : 'string',
          key: isNum ? Number(keyStr) : keyStr
        }).pipe(
          catchError(() => of({ found: false, data: null }))
        )
      );

      if (response && response.found && response.data) {
        const data = response.data;
        this.dbPatternCache.set(keyStr, data);
        if (data.Name) this.dbPatternCache.set(data.Name, data);
        if (data.ID) this.dbPatternCache.set(String(data.ID), data);
        return data;
      }
    } catch (err) {
      console.warn(`[ReactionPatternAlignmentService] Error fetching DB reaction pattern '${keyStr}':`, err);
    }

    return null;
  }

  /**
   * Parses an individual reaction pattern text block into structured parts.
   */
  public parseLstPatternBlock(blockStr: string): ParsedLstPattern | null {
    const lines = blockStr.trim().split(/\r?\n/);
    let name = '';
    let reactants: string[] = [];
    let products: string[] = [];
    let id = 0;
    let inCorrespondences = false;
    const corrLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const l = rawLine.trim();
      if (!l || l.startsWith('%')) continue;

      if (!name && !l.startsWith('-') && !l.startsWith('>')) {
        const clean = l.replace(/\\$/, '').trim();
        const parts = clean.split(/\s+/);
        name = parts[0];
        if (clean.includes('=')) {
          const eq = clean.substring(name.length).trim();
          const [left, right] = eq.split('=').map(s => s.trim());
          if (left) reactants = left.split(/\s+/).filter(Boolean);
          if (right) products = right.split(/\s+/).filter(Boolean);
        }
        continue;
      }

      if (!reactants.length && l.includes('=')) {
        const [left, right] = l.replace(/\\$/, '').trim().split('=').map(s => s.trim());
        if (left) reactants = left.split(/\s+/).filter(Boolean);
        if (right) products = right.split(/\s+/).filter(Boolean);
        continue;
      }

      if (l.startsWith('- ID')) {
        const m = l.match(/- ID\s+(\d+)/);
        if (m) id = parseInt(m[1], 10);
        continue;
      }

      if (l.startsWith('- Correspondences')) {
        inCorrespondences = true;
        continue;
      }

      if (inCorrespondences) {
        if (l.startsWith('>') || l.startsWith('$$$$') || l.startsWith('%%%') || l.startsWith('- ID')) {
          inCorrespondences = false;
        } else {
          corrLines.push(rawLine.trim());
        }
      }
    }

    if (!name) return null;
    return { name, id, reactants, products, corrLines, rawBlock: blockStr };
  }

  /**
   * Splits a .lst file content into multiple parsed reaction patterns.
   */
  public parseLstFile(lstContent: string): ParsedLstPattern[] {
    const blocks = lstContent.split('$$$$');
    const results: ParsedLstPattern[] = [];
    for (const b of blocks) {
      if (!b.trim()) continue;
      const parsed = this.parseLstPatternBlock(b);
      if (parsed) results.push(parsed);
    }
    return results;
  }

  /**
   * Generates all symmetry automorphisms (topological symmetry permutations) of a molecule.
   * An automorphism is a permutation sigma of [0..n-1] that preserves atom element symbols,
   * degrees, and bond connectivity.
   */
  public getMoleculeAutomorphisms(mol: MoleculeSubstructureData): number[][] {
    const n = mol.atoms.length;
    if (n <= 1) return [[0]];

    // Build adjacency matrix and bond orders
    const adj = Array.from({ length: n }, () => new Map<number, number>());
    mol.bonds.forEach(b => {
      adj[b.i].set(b.j, b.order);
      adj[b.j].set(b.i, b.order);
    });

    const symbols = mol.atoms.map(a => a.symbol.toUpperCase());
    const degrees = mol.atoms.map((_, i) => adj[i].size);

    const automorphisms: number[][] = [];
    const used = new Array<boolean>(n).fill(false);
    const currentMapping = new Array<number>(n).fill(-1);

    const backtrack = (currAtom: number) => {
      if (currAtom === n) {
        automorphisms.push([...currentMapping]);
        return;
      }

      const currSym = symbols[currAtom];
      const currDeg = degrees[currAtom];

      for (let cand = 0; cand < n; cand++) {
        if (used[cand]) continue;
        if (symbols[cand] !== currSym || degrees[cand] !== currDeg) continue;

        // Check bond consistency with all already-mapped atoms
        let consistent = true;
        for (let prev = 0; prev < currAtom; prev++) {
          const mappedPrev = currentMapping[prev];
          const hasBondBefore = adj[currAtom].has(prev);
          const hasBondAfter = adj[cand].has(mappedPrev);

          if (hasBondBefore !== hasBondAfter) {
            consistent = false;
            break;
          }
          if (hasBondBefore && adj[currAtom].get(prev) !== adj[cand].get(mappedPrev)) {
            consistent = false;
            break;
          }
        }

        if (consistent) {
          used[cand] = true;
          currentMapping[currAtom] = cand;
          backtrack(currAtom + 1);
          used[cand] = false;
          currentMapping[currAtom] = -1;
        }
      }
    };

    backtrack(0);
    return automorphisms.length > 0 ? automorphisms : [Array.from({ length: n }, (_, i) => i)];
  }

  /**
   * Performs atom alignment check, symmetry rematching, bond changes count,
   * and database element comparison for a reaction pattern.
   */
  public async checkPattern(
    pattern: ParsedLstPattern,
    dbCheckItem?: { inDatabase: boolean; dbId?: string; exactMatch?: string }
  ): Promise<PatternAlignmentResult> {
    const warnings: string[] = [];

    // 1. Fetch substructures from Firestore
    const rMols: (MoleculeSubstructureData | null)[] = await Promise.all(
      pattern.reactants.map(rName => this.fetchSubstructureFromFirestore(rName))
    );
    const pMols: (MoleculeSubstructureData | null)[] = await Promise.all(
      pattern.products.map(pName => this.fetchSubstructureFromFirestore(pName))
    );

    const missingReactant = pattern.reactants.find((_, i) => !rMols[i]);
    const missingProduct = pattern.products.find((_, i) => !pMols[i]);

    if (missingReactant || missingProduct) {
      const missingName = missingReactant || missingProduct;
      return {
        patternName: pattern.name,
        patternId: pattern.id,
        reactants: pattern.reactants,
        products: pattern.products,
        alignmentStatus: 'mismatched',
        statusMessage: `Substructure '${missingName}' could not be loaded from Firestore.`,
        pairs: [],
        brokenBondsCount: 0,
        madeBondsCount: 0,
        bondChangesText: '0 broken, 0 made',
        dbMatchStatus: 'not-in-db',
        warnings: [`Missing Firestore substructure: ${missingName}`]
      };
    }

    const validRMols = rMols as MoleculeSubstructureData[];
    const validPMols = pMols as MoleculeSubstructureData[];

    // 2. Parse correspondences from corrLines
    // Reactant lines correspond to reactants, Product lines correspond to products
    const numRLines = validRMols.length;
    const numPLines = validPMols.length;

    // Build global reactant atom map: globalReactantId (1-based) -> { molIndex, atomIndex, symbol }
    const globalReactantAtoms = new Map<number, { molIndex: number; atomIndex: number; symbol: string }>();
    let currentGlobalId = 1;

    validRMols.forEach((rMol, mIdx) => {
      for (let aIdx = 0; aIdx < rMol.atoms.length; aIdx++) {
        globalReactantAtoms.set(currentGlobalId, {
          molIndex: mIdx,
          atomIndex: aIdx,
          symbol: rMol.atoms[aIdx].symbol.toUpperCase()
        });
        currentGlobalId++;
      }
    });

    // Parse product correspondence lines to see which reactant atoms they map to
    const initialPairs: AtomCorrespondencePair[] = [];
    let allDirectlyMatched = true;

    for (let pIdx = 0; pIdx < numPLines && (numRLines + pIdx) < pattern.corrLines.length; pIdx++) {
      const pMol = validPMols[pIdx];
      const line = pattern.corrLines[numRLines + pIdx].trim();
      if (!line) continue;

      const tokens = line.split(/\s+/).filter(Boolean);
      const atomTokens = tokens.slice(0, pMol.atoms.length);

      atomTokens.forEach((tok, aIdx) => {
        const globalRId = parseInt(tok, 10);
        const rInfo = globalReactantAtoms.get(globalRId);
        const pSym = pMol.atoms[aIdx].symbol.toUpperCase();
        const rSym = rInfo ? rInfo.symbol : '?';

        const isMatch = rInfo !== undefined && (
          rSym === pSym ||
          (rSym === 'R' && (pSym === 'R' || pSym === 'Q')) ||
          (pSym === 'R' && (rSym === 'R' || rSym === 'Q'))
        );

        if (!isMatch) {
          allDirectlyMatched = false;
        }

        initialPairs.push({
          productMolIndex: pIdx,
          productAtomIndex: aIdx,
          productSymbol: pSym,
          globalReactantAtomId: globalRId,
          reactantMolIndex: rInfo ? rInfo.molIndex : -1,
          reactantAtomIndex: rInfo ? rInfo.atomIndex : -1,
          reactantSymbol: rSym,
          isMatched: isMatch
        });
      });
    }

    // 3. Count broken and made bonds from corrLines
    let brokenCount = 0;
    let madeCount = 0;

    // Reactant lines (broken bonds indicated by flag 4)
    for (let rIdx = 0; rIdx < numRLines && rIdx < pattern.corrLines.length; rIdx++) {
      const rMol = validRMols[rIdx];
      const line = pattern.corrLines[rIdx].trim();
      const tokens = line.split(/\s+/).filter(Boolean);
      const bondTokens = tokens.slice(rMol.atoms.length, rMol.atoms.length + rMol.bonds.length);
      bondTokens.forEach(t => {
        const val = parseInt(t, 10);
        if (val === 4) brokenCount++;
      });
    }

    // Product lines (made bonds indicated by flag 4 or 104)
    for (let pIdx = 0; pIdx < numPLines && (numRLines + pIdx) < pattern.corrLines.length; pIdx++) {
      const pMol = validPMols[pIdx];
      const line = pattern.corrLines[numRLines + pIdx].trim();
      const tokens = line.split(/\s+/).filter(Boolean);
      const bondTokens = tokens.slice(pMol.atoms.length, pMol.atoms.length + pMol.bonds.length);
      bondTokens.forEach(t => {
        const val = parseInt(t, 10);
        if (val === 4 || val === 104) madeCount++;
      });
    }

    let finalPairs = initialPairs;
    let alignmentStatus: 'matched' | 'adjusted' | 'mismatched' = 'matched';
    let statusMessage = 'All reactant and product atom types matched directly.';
    let adjustedCorrLines: string[] | undefined = undefined;
    let adjustedLstBlock: string | undefined = undefined;

    // 4. If not all matched directly, apply the Symmetry Rematching Algorithm
    if (!allDirectlyMatched) {
      const rematched = this.rematchEquivalentAtoms(validRMols, validPMols, pattern);

      if (rematched.success) {
        alignmentStatus = 'adjusted';
        statusMessage = 'Atom ordering adjusted using molecular symmetry automorphisms.';
        finalPairs = rematched.pairs;
        adjustedCorrLines = rematched.adjustedCorrLines;
        adjustedLstBlock = this.generateAdjustedLstBlock(pattern, rematched.adjustedCorrLines);
      } else {
        alignmentStatus = 'mismatched';
        statusMessage = 'Atom types cannot be aligned even after checking molecular symmetry.';
      }
    }

    // 5. Compare with Database Element
    let dbMatchStatus: 'matched' | 'mismatched' | 'not-in-db' = 'not-in-db';
    let dbBrokenCount: number | undefined = undefined;
    let dbMadeCount: number | undefined = undefined;

    const lookupKey = dbCheckItem?.exactMatch || (dbCheckItem?.inDatabase ? pattern.name : undefined);
    if (lookupKey && lookupKey !== 'NONE' && lookupKey !== 'NOT_FOUND') {
      const dbPat = await this.fetchDbReactionPattern(lookupKey);
      if (dbPat) {
        // Parse bond changes from DB record
        const bondChanges = dbPat.TotalCorr?.BondChanges?.Changes || dbPat.BondChanges?.Changes || [];
        dbBrokenCount = bondChanges.filter((c: any) => c.Type === 4).length;
        dbMadeCount = bondChanges.filter((c: any) => c.Type === 104).length;

        // If not in BondChanges array, check reactionBrokenBonds/reactionFormedBonds fields
        if (bondChanges.length === 0) {
          if (Array.isArray(dbPat.reactionBrokenBonds)) dbBrokenCount = dbPat.reactionBrokenBonds.length;
          if (Array.isArray(dbPat.reactionFormedBonds)) dbMadeCount = dbPat.reactionFormedBonds.length;
        }

        if (dbBrokenCount !== undefined && dbMadeCount !== undefined) {
          if (dbBrokenCount === brokenCount && dbMadeCount === madeCount) {
            dbMatchStatus = 'matched';
          } else {
            dbMatchStatus = 'mismatched';
          }
        }
      }
    }

    return {
      patternName: pattern.name,
      patternId: pattern.id,
      reactants: pattern.reactants,
      products: pattern.products,
      alignmentStatus,
      statusMessage,
      pairs: finalPairs,
      brokenBondsCount: brokenCount,
      madeBondsCount: madeCount,
      bondChangesText: `${brokenCount} broken, ${madeCount} made`,
      dbMatchStatus,
      dbBrokenCount,
      dbMadeCount,
      adjustedCorrLines,
      adjustedLstBlock,
      warnings
    };
  }

  /**
   * Rematching algorithm: Matches product atoms to reactant atoms of matching element type
   * when database substructure atom order differs from expected. Preserves direct matches
   * and finds a valid bijection for misaligned atoms.
   */
  public rematchEquivalentAtoms(
    rMols: MoleculeSubstructureData[],
    pMols: MoleculeSubstructureData[],
    pattern: ParsedLstPattern
  ): { success: boolean; pairs: AtomCorrespondencePair[]; adjustedCorrLines: string[] } {
    // 1. Build map of global reactant atoms
    const globalReactantAtoms = new Map<number, { molIndex: number; atomIndex: number; symbol: string }>();
    let currentGlobalId = 1;
    rMols.forEach((rMol, mIdx) => {
      for (let aIdx = 0; aIdx < rMol.atoms.length; aIdx++) {
        globalReactantAtoms.set(currentGlobalId, {
          molIndex: mIdx,
          atomIndex: aIdx,
          symbol: rMol.atoms[aIdx].symbol.toUpperCase()
        });
        currentGlobalId++;
      }
    });

    const isSymbolCompatible = (rSym: string, pSym: string): boolean => {
      return (
        rSym === pSym ||
        (rSym === 'R' && (pSym === 'R' || pSym === 'Q')) ||
        (pSym === 'R' && (rSym === 'R' || rSym === 'Q'))
      );
    };

    const usedReactantIds = new Set<number>();
    const productAssignments: { pIdx: number; aIdx: number; pSym: string; assignedRId: number | null }[] = [];

    // Parse product correspondence lines
    for (let pIdx = 0; pIdx < pMols.length; pIdx++) {
      const pMol = pMols[pIdx];
      const lineIdx = rMols.length + pIdx;
      if (lineIdx >= pattern.corrLines.length) break;

      const rawLine = pattern.corrLines[lineIdx];
      const tokens = rawLine.split(/\s+/).filter(Boolean);
      const origAtomTokens = tokens.slice(0, pMol.atoms.length);

      for (let aIdx = 0; aIdx < pMol.atoms.length; aIdx++) {
        const pSym = pMol.atoms[aIdx].symbol.toUpperCase();
        const origTok = origAtomTokens[aIdx];
        const origRId = origTok ? parseInt(origTok, 10) : -1;
        const rInfo = globalReactantAtoms.get(origRId);

        if (rInfo && isSymbolCompatible(rInfo.symbol, pSym) && !usedReactantIds.has(origRId)) {
          // Direct match can be retained
          usedReactantIds.add(origRId);
          productAssignments.push({ pIdx, aIdx, pSym, assignedRId: origRId });
        } else {
          // Needs rematching
          productAssignments.push({ pIdx, aIdx, pSym, assignedRId: null });
        }
      }
    }

    // Second pass: assign remaining unassigned product slots to available matching reactant atoms
    for (const assignment of productAssignments) {
      if (assignment.assignedRId !== null) continue;

      let foundRId: number | null = null;
      for (const [rId, rInfo] of globalReactantAtoms.entries()) {
        if (!usedReactantIds.has(rId) && isSymbolCompatible(rInfo.symbol, assignment.pSym)) {
          foundRId = rId;
          break;
        }
      }

      if (foundRId === null) {
        // Cannot be aligned: missing required element type in reactants
        return {
          success: false,
          pairs: [],
          adjustedCorrLines: []
        };
      }

      assignment.assignedRId = foundRId;
      usedReactantIds.add(foundRId);
    }

    // Build candidate pairs and new product lines
    const candidatePairs: AtomCorrespondencePair[] = [];
    const newProductLines: string[] = [];

    for (let pIdx = 0; pIdx < pMols.length; pIdx++) {
      const pMol = pMols[pIdx];
      const lineIdx = rMols.length + pIdx;
      const rawLine = pattern.corrLines[lineIdx];
      const tokens = rawLine ? rawLine.split(/\s+/).filter(Boolean) : [];
      const bondTokens = tokens.slice(pMol.atoms.length);

      const assignedTokens: string[] = [];
      for (let aIdx = 0; aIdx < pMol.atoms.length; aIdx++) {
        const item = productAssignments.find(a => a.pIdx === pIdx && a.aIdx === aIdx);
        const assignedRId = item?.assignedRId ?? (aIdx + 1);
        assignedTokens.push(String(assignedRId));

        const rInfo = globalReactantAtoms.get(assignedRId);
        candidatePairs.push({
          productMolIndex: pIdx,
          productAtomIndex: aIdx,
          productSymbol: pMol.atoms[aIdx].symbol.toUpperCase(),
          globalReactantAtomId: assignedRId,
          reactantMolIndex: rInfo ? rInfo.molIndex : -1,
          reactantAtomIndex: rInfo ? rInfo.atomIndex : -1,
          reactantSymbol: rInfo ? rInfo.symbol : '?',
          isMatched: true
        });
      }

      const atomsPart = assignedTokens.join(' ');
      const bondPart = bondTokens.length > 0 ? `   ${bondTokens.join(' ')}` : '';
      newProductLines.push(`${atomsPart}${bondPart}`);
    }

    const adjustedCorrLines = [
      ...pattern.corrLines.slice(0, rMols.length),
      ...newProductLines
    ];

    return {
      success: true,
      pairs: candidatePairs,
      adjustedCorrLines
    };
  }

  private cartesianProductSize(arrays: any[][]): number {
    return arrays.reduce((acc, curr) => acc * Math.max(1, curr.length), 1);
  }

  private getCartesianElement<T>(arrays: T[][], index: number): T[] {
    const result: T[] = [];
    let rem = index;
    for (let i = arrays.length - 1; i >= 0; i--) {
      const len = Math.max(1, arrays[i].length);
      const idx = rem % len;
      result.unshift(arrays[i][idx]);
      rem = Math.floor(rem / len);
    }
    return result;
  }

  /**
   * Generates a fully formatted .lst block with adjusted correspondence lines.
   */
  public generateAdjustedLstBlock(pattern: ParsedLstPattern, adjustedCorrLines: string[]): string {
    const lines = pattern.rawBlock.split(/\r?\n/);
    const newLines: string[] = [];
    let inCorr = false;
    let corrInserted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('- Correspondences')) {
        inCorr = true;
        newLines.push(line);
        if (!corrInserted) {
          adjustedCorrLines.forEach(cl => newLines.push(cl));
          corrInserted = true;
        }
        continue;
      }

      if (inCorr) {
        if (trimmed.startsWith('>') || trimmed.startsWith('$$$$') || trimmed.startsWith('%%%') || trimmed.startsWith('- ID')) {
          inCorr = false;
          newLines.push(line);
        }
        // Skip old correspondence lines
        continue;
      }

      newLines.push(line);
    }

    return newLines.join('\n');
  }

  /**
   * Batch checks all reaction patterns found in a .lst file against Firestore substructures
   * and database elements.
   */
  public async checkReactionPatternsFromLst(
    lstContent: string,
    existenceItems: { name: string; inDatabase: boolean; dbId?: string; exactMatch?: string }[] = []
  ): Promise<Map<string, PatternAlignmentResult>> {
    const resultMap = new Map<string, PatternAlignmentResult>();
    const parsedPatterns = this.parseLstFile(lstContent);

    for (const pat of parsedPatterns) {
      const dbItem = existenceItems.find(item => item.name === pat.name);
      const res = await this.checkPattern(pat, dbItem);
      resultMap.set(pat.name, res);

      if (dbItem) {
        const itemAny = dbItem as any;
        itemAny.alignmentStatus = res.alignmentStatus;
        itemAny.alignmentMessage = res.statusMessage;
        itemAny.bondChangesText = res.bondChangesText;
        itemAny.dbMatchStatus = res.dbMatchStatus;
        itemAny.dbBrokenCount = res.dbBrokenCount;
        itemAny.dbMadeCount = res.dbMadeCount;
        itemAny.brokenBondsCount = res.brokenBondsCount;
        itemAny.madeBondsCount = res.madeBondsCount;
        itemAny.adjustedCorrLines = res.adjustedCorrLines;
        itemAny.adjustedLstBlock = res.adjustedLstBlock;
        itemAny.alignmentPairs = res.pairs;
      }
    }

    return resultMap;
  }
}
