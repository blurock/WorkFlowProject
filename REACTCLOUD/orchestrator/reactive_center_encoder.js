/**
 * Reactive Center Encoder
 * Utility module to parse reaction patterns, atom correspondences, and compute
 * canonical reactive center encodings for Firestore indexing and search.
 */

function bondTypeToChar(type) {
  switch (Number(type)) {
    case 1: return 'S';
    case 2: return 'D';
    case 3: return 'T';
    case 4: return 'A';
    default: return 'S';
  }
}

function encodeAtom(symbol, isRadical, spectatorBondTypes) {
  const v = isRadical ? 'R' : 'N';
  const bbb = (spectatorBondTypes || [])
    .map(b => bondTypeToChar(b))
    .sort()
    .join('');
  return `${String(symbol || 'C').trim()}:${v}:${bbb}`;
}

function encodeBond(atom1Encoding, atom2Encoding) {
  return [atom1Encoding, atom2Encoding].sort().join('_');
}

function getMolName(lines) {
  if (lines.length > 2 && lines[2].trim() && isNaN(Number(lines[2].trim()))) {
    return lines[2].trim();
  }
  if (lines.length > 0 && lines[0].trim() && isNaN(Number(lines[0].trim()))) {
    return lines[0].trim();
  }
  return '';
}

/**
 * Parses an individual SDF block into atoms and bonds.
 */
function parseSdfMolecule(sdfBlock) {
  const lines = sdfBlock.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 4) return null;
  const name = getMolName(lines);
  if (!name) return null;

  let countsIdx = -1;
  let numAtoms = 0;
  let numBonds = 0;

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    if (l.includes('V2000') || i === 3 || i === 4) {
      const m = l.match(/^\s*(\d+)\s+(\d+)/);
      if (m) {
        numAtoms = parseInt(m[1], 10);
        numBonds = parseInt(m[2], 10);
        countsIdx = i;
        break;
      }
    }
  }

  if (countsIdx < 0) return null;

  const atoms = [];
  for (let i = 1; i <= numAtoms; i++) {
    const line = lines[countsIdx + i] || '';
    const symbol = line.substring(30, 34).trim() || 'C';
    const chgRad = parseInt(line.substring(36, 39).trim() || '0', 10);
    const isRadical = (chgRad === 4 || chgRad === 2 || chgRad === 1);
    atoms.push({
      index: i,
      symbol: symbol,
      isRadical: isRadical
    });
  }

  const bonds = [];
  const bondsStart = countsIdx + numAtoms + 1;
  for (let i = 0; i < numBonds; i++) {
    const line = lines[bondsStart + i] || '';
    const a1 = parseInt(line.substring(0, 3).trim(), 10);
    const a2 = parseInt(line.substring(3, 6).trim(), 10);
    const bType = parseInt(line.substring(6, 9).trim(), 10) || 1;
    bonds.push({ a1, a2, bondType: bType });
  }

  // Check M  RAD blocks
  for (let i = bondsStart + numBonds; i < lines.length; i++) {
    const line = lines[i] || '';
    if (line.startsWith('M  RAD')) {
      const parts = line.trim().split(/\s+/);
      const count = parseInt(parts[2], 10);
      for (let c = 0; c < count; c++) {
        const atomIdx = parseInt(parts[3 + c * 2], 10);
        const radType = parseInt(parts[4 + c * 2], 10);
        if (atomIdx >= 1 && atomIdx <= atoms.length && radType > 0) {
          atoms[atomIdx - 1].isRadical = true;
        }
      }
    }
  }

  return { name, atoms, bonds };
}

/**
 * Parses a directory or file of SDF substructures into a Map<name, Molecule>.
 */
function parseSdfCollection(sdfContent) {
  const map = new Map();
  const blocks = sdfContent.split('$$$$');
  for (const block of blocks) {
    if (!block.trim()) continue;
    const mol = parseSdfMolecule(block);
    if (mol && mol.name) {
      map.set(mol.name.trim(), mol);
      // Also store lowercase variant for robust lookup
      map.set(mol.name.trim().toLowerCase(), mol);
    }
  }
  return map;
}

/**
 * Parses a single ReactionPattern block from a .lst file.
 */
function parseLstPatternBlock(blockStr) {
  const lines = blockStr.trim().split(/\r?\n/);
  let name = '';
  let reactants = [];
  let products = [];
  let id = 0;
  let inCorrespondences = false;
  let corrLines = [];

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
        reactants = left.split(/\s+/).filter(Boolean);
        products = right.split(/\s+/).filter(Boolean);
      }
      continue;
    }

    if (!reactants.length && l.includes('=')) {
      const [left, right] = l.replace(/\\$/, '').trim().split('=').map(s => s.trim());
      reactants = left.split(/\s+/).filter(Boolean);
      products = right.split(/\s+/).filter(Boolean);
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
        corrLines.push(rawLine);
      }
    }
  }

  return { name, id, reactants, products, corrLines };
}

/**
 * Computes canonical reactive center encoding for a reaction pattern
 * given its parsed .lst data and substructure definitions.
 */
function computeReactiveCenterForPattern(pattern, substructureMap) {
  const { name, reactants, products, corrLines } = pattern;
  if (!reactants.length || !products.length || !corrLines.length) {
    return {
      reactionBrokenBonds: [],
      reactionFormedBonds: [],
      reactionCenterKey: ''
    };
  }

  // Reactant substructures
  const rMols = reactants.map(rName => substructureMap.get(rName) || substructureMap.get(rName.toLowerCase()) || null);
  // Product substructures
  const pMols = products.map(pName => substructureMap.get(pName) || substructureMap.get(pName.toLowerCase()) || null);

  const brokenBonds = [];
  const formedBonds = [];

  // Parse corrLines: reactant lines correspond to rMols, product lines correspond to pMols
  const numRLines = reactants.length;
  const numPLines = products.length;

  // Reactant lines (broken bonds)
  for (let rIdx = 0; rIdx < numRLines && rIdx < corrLines.length; rIdx++) {
    const rMol = rMols[rIdx];
    if (!rMol) continue;

    const line = corrLines[rIdx].trim();
    if (!line) continue;
    const tokens = line.split(/\s+/).filter(Boolean);

    // Tokens consist of: [atom1Corr, atom2Corr, ... (numAtoms)], followed by [bond1Flag, bond2Flag, ... (numBonds)]
    const nAtoms = rMol.atoms.length;
    const nBonds = rMol.bonds.length;
    const bondFlags = tokens.slice(nAtoms, nAtoms + nBonds).map(t => parseInt(t, 10));

    rMol.bonds.forEach((b, bIdx) => {
      const flag = bondFlags[bIdx];
      if (flag === 4) { // Broken bond in reactant
        const a1 = rMol.atoms[b.a1 - 1];
        const a2 = rMol.atoms[b.a2 - 1];
        if (a1 && a2) {
          const a1Spectators = rMol.bonds
            .filter((_, idx) => idx !== bIdx && (rMol.bonds[idx].a1 === b.a1 || rMol.bonds[idx].a2 === b.a1))
            .map(x => x.bondType);
          const a2Spectators = rMol.bonds
            .filter((_, idx) => idx !== bIdx && (rMol.bonds[idx].a1 === b.a2 || rMol.bonds[idx].a2 === b.a2))
            .map(x => x.bondType);

          const a1Enc = encodeAtom(a1.symbol, a1.isRadical, a1Spectators);
          const a2Enc = encodeAtom(a2.symbol, a2.isRadical, a2Spectators);
          brokenBonds.push(encodeBond(a1Enc, a2Enc));
        }
      }
    });
  }

  // Product lines (formed bonds)
  for (let pIdx = 0; pIdx < numPLines && (numRLines + pIdx) < corrLines.length; pIdx++) {
    const pMol = pMols[pIdx];
    if (!pMol) continue;

    const line = corrLines[numRLines + pIdx].trim();
    if (!line) continue;
    const tokens = line.split(/\s+/).filter(Boolean);

    const nAtoms = pMol.atoms.length;
    const nBonds = pMol.bonds.length;
    const bondFlags = tokens.slice(nAtoms, nAtoms + nBonds).map(t => parseInt(t, 10));

    pMol.bonds.forEach((b, bIdx) => {
      const flag = bondFlags[bIdx];
      if (flag === 4) { // Formed bond in product
        const a1 = pMol.atoms[b.a1 - 1];
        const a2 = pMol.atoms[b.a2 - 1];
        if (a1 && a2) {
          const a1Spectators = pMol.bonds
            .filter((_, idx) => idx !== bIdx && (pMol.bonds[idx].a1 === b.a1 || pMol.bonds[idx].a2 === b.a1))
            .map(x => x.bondType);
          const a2Spectators = pMol.bonds
            .filter((_, idx) => idx !== bIdx && (pMol.bonds[idx].a1 === b.a2 || pMol.bonds[idx].a2 === b.a2))
            .map(x => x.bondType);

          const a1Enc = encodeAtom(a1.symbol, a1.isRadical, a1Spectators);
          const a2Enc = encodeAtom(a2.symbol, a2.isRadical, a2Spectators);
          formedBonds.push(encodeBond(a1Enc, a2Enc));
        }
      }
    });
  }

  const reactionBrokenBonds = Array.from(new Set(brokenBonds)).sort();
  const reactionFormedBonds = Array.from(new Set(formedBonds)).sort();

  const parts = [];
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
    reactionCenterKey
  };
}

module.exports = {
  bondTypeToChar,
  encodeAtom,
  encodeBond,
  parseSdfMolecule,
  parseSdfCollection,
  parseLstPatternBlock,
  computeReactiveCenterForPattern
};
