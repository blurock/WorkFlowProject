/**
 * Molecule Bundle & Scientific ASCII Serialization Utilities
 *
 * Supports:
 * 1. Enriched single-file SDF parsing (> <AlternativeNames> and > <NASA_THERMO> blocks)
 * 2. Multi-file molecule bundle validation (.sdf + -names.lst + .thm) with auto-generated .mol lists
 * 3. Hill-system molecular formula computation for isomer grouping
 * 4. Scientific ASCII export helpers (MDL V2000 SDF, -names.lst, .thm, .lsr, .lst)
 */

const ATOMIC_NUMBER_TO_SYMBOL = {
  1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca', 35: 'Br', 53: 'I', 221: 'Q', 320: 'R', 382: 'X'
};

function extractMoleculeNameFromSdfRecord(rawRecord, fallbackIndex = 1) {
  const lines = rawRecord.replace(/^\r?\n+/, '').split(/\r?\n/);
  if (lines.length >= 3) {
    const line3 = (lines[2] || '').trim();
    if (
      line3 &&
      !line3.includes('V2000') &&
      !line3.includes('V3000') &&
      !line3.includes('M  END') &&
      !/^\s*\d+\s+\d+/.test(line3)
    ) {
      return line3;
    }
  }
  if (lines.length >= 1) {
    const line1 = (lines[0] || '').trim();
    if (line1 && !line1.includes('V2000') && !/^\s*\d+\s+\d+/.test(line1)) {
      return line1;
    }
  }
  return `Molecule_${fallbackIndex}`;
}

/**
 * Parses a single-file SDF (plain or enriched with > <AlternativeNames> and > <NASA_THERMO>).
 * Returns clean SDF (stripped of data blocks for chemdb), extracted alt names, thermo blocks,
 * and auto-generated .mol / -names.lst / .thm payloads.
 */
function parseEnrichedSdf(sdfText, rootName = 'molecules') {
  const raw = String(sdfText || '').trim();
  const warnings = [];
  const errors = [];

  if (!raw) {
    return {
      valid: false,
      cleanSdf: '',
      moleculeNames: [],
      altNamesByMol: {},
      thermoBlocksByMol: {},
      generatedNamesLst: '',
      generatedNamesMol: '',
      generatedThm: '',
      generatedMol: '',
      summary: { moleculeCount: 0, altNameEntriesCount: 0, thermoEntriesCount: 0 },
      warnings,
      errors: ['SDF content is empty.']
    };
  }

  const rawRecords = raw.split(/\r?\n\s*\$\$\$\$\s*(?:\r?\n|$)/).map(r => r.trimEnd()).filter(r => r.trim().length > 0);
  const cleanRecords = [];
  const moleculeNames = [];
  const altNamesByMol = {};
  const thermoBlocksByMol = {};
  let altNameEntriesCount = 0;
  let thermoEntriesCount = 0;

  rawRecords.forEach((rec, idx) => {
    const molName = extractMoleculeNameFromSdfRecord(rec, idx + 1);
    moleculeNames.push(molName);

    const lines = rec.split(/\r?\n/);
    const mEndIdx = lines.findIndex(l => l.trim().startsWith('M  END') || l.trim().startsWith('M END'));
    if (mEndIdx === -1) {
      errors.push(`Record #${idx + 1} (${molName}): Missing 'M  END' terminator.`);
      cleanRecords.push(rec);
      return;
    }

    const coreLines = lines.slice(0, mEndIdx + 1);
    cleanRecords.push(coreLines.join('\n'));

    // Parse SDF data items after M  END
    const propLines = lines.slice(mEndIdx + 1);
    let currentHeader = null;
    let currentValues = [];

    const flushBlock = () => {
      if (!currentHeader) return;
      const key = currentHeader.toLowerCase();
      const nonEmpty = currentValues.filter(v => v.trim().length > 0);
      if (key === 'alternativenames' || key === 'alternative_names' || key === 'altnames') {
        if (!altNamesByMol[molName]) altNamesByMol[molName] = [];
        for (const valLine of nonEmpty) {
          const parts = valLine.trim().split(/\s+/);
          if (parts.length >= 2) {
            altNamesByMol[molName].push({ type: parts[0], value: parts.slice(1).join(' ') });
            altNameEntriesCount++;
          } else {
            warnings.push(`${molName}: Ignored malformed AlternativeNames line "${valLine.trim()}" (expected "<TYPE> <NAME>").`);
          }
        }
      } else if (key === 'nasa_thermo' || key === 'chemkin_thermo' || key === 'thermo' || key === 'thm') {
        if (nonEmpty.length > 0) {
          thermoBlocksByMol[molName] = nonEmpty.join('\n');
          thermoEntriesCount++;
        }
      }
      currentHeader = null;
      currentValues = [];
    };

    for (const line of propLines) {
      const headerMatch = line.match(/^\s*>\s*<([^>]+)>/);
      if (headerMatch) {
        flushBlock();
        currentHeader = headerMatch[1].trim();
        currentValues = [];
      } else if (currentHeader) {
        if (line.trim() === '') {
          flushBlock();
        } else {
          currentValues.push(line);
        }
      }
    }
    flushBlock();
  });

  const cleanSdf = cleanRecords.map(r => `${r}\n$$$$`).join('\n') + '\n';

  // Build -names.lst and auto-generated -names.mol if alternative names exist
  const namesMolList = Object.keys(altNamesByMol).filter(k => altNamesByMol[k].length > 0);
  let generatedNamesLst = '';
  let generatedNamesMol = '';
  if (namesMolList.length > 0) {
    const lstLines = [`1 ${rootName}`];
    for (const mName of namesMolList) {
      lstLines.push(mName);
      for (const entry of altNamesByMol[mName]) {
        lstLines.push(`- AlternativeNames ${entry.type} ${entry.value}`);
      }
    }
    generatedNamesLst = lstLines.join('\n') + '\n';
    generatedNamesMol = namesMolList.join('\n') + '\n';
  }

  // Build .thm and auto-generated .mol if thermo blocks exist
  const thermoMolList = Object.keys(thermoBlocksByMol);
  let generatedThm = '';
  let generatedMol = '';
  if (thermoMolList.length > 0) {
    const thmLines = ['THERMO', '   300.000  1000.000  5000.000'];
    for (const mName of thermoMolList) {
      thmLines.push(thermoBlocksByMol[mName]);
    }
    thmLines.push('END');
    generatedThm = thmLines.join('\n') + '\n';
    generatedMol = thermoMolList.join('\n') + '\n';
  }

  return {
    valid: errors.length === 0,
    cleanSdf,
    moleculeNames,
    altNamesByMol,
    thermoBlocksByMol,
    generatedNamesLst,
    generatedNamesMol,
    generatedThm,
    generatedMol,
    summary: {
      moleculeCount: moleculeNames.length,
      altNameEntriesCount,
      thermoEntriesCount
    },
    warnings,
    errors
  };
}

/**
 * Parses a legacy -names.lst file and auto-generates the corresponding -names.mol index list.
 */
function parseNamesLst(namesLstText) {
  const warnings = [];
  const errors = [];
  const altNamesByMol = {};
  const moleculeOrder = [];
  let entryCount = 0;

  const lines = String(namesLstText || '').split(/\r?\n/);
  let currentMol = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('#')) continue;

    // First non-empty line is typically "<count> <datasetName>" e.g. "1 alkeneC5-C10"
    if (i === 0 && /^\d+\s+\S+/.test(trimmed)) {
      continue;
    }

    if (trimmed.startsWith('-')) {
      if (!currentMol) {
        errors.push(`-names.lst line ${i + 1}: Property line "${trimmed}" appeared before any molecule name.`);
        continue;
      }
      const match = trimmed.match(/^-\s*AlternativeNames\s+(\S+)\s+(.+)$/i);
      if (match) {
        altNamesByMol[currentMol].push({ type: match[1].trim(), value: match[2].trim() });
        entryCount++;
      } else {
        warnings.push(`-names.lst line ${i + 1}: Unrecognized property directive "${trimmed}".`);
      }
    } else {
      currentMol = trimmed;
      if (!altNamesByMol[currentMol]) {
        altNamesByMol[currentMol] = [];
        moleculeOrder.push(currentMol);
      }
    }
  }

  return {
    valid: errors.length === 0,
    moleculeOrder,
    altNamesByMol,
    entryCount,
    generatedNamesMol: moleculeOrder.length > 0 ? moleculeOrder.join('\n') + '\n' : '',
    warnings,
    errors
  };
}

/**
 * Validates a CHEMKIN / NASA .thm file and extracts species names.
 */
function parseChemkinThm(thmText) {
  const warnings = [];
  const errors = [];
  const species = [];
  const lines = String(thmText || '').split(/\r?\n/);

  let inThermo = false;
  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('!')) {
      i++;
      continue;
    }
    if (/^THERMO/i.test(trimmed)) {
      inThermo = true;
      i++;
      // Skip optional global temperature range line (3 floats)
      if (i < lines.length && /^\s*[\d.]+\s+[\d.]+\s+[\d.]+/.test(lines[i])) {
        i++;
      }
      continue;
    }
    if (/^END/i.test(trimmed)) {
      break;
    }

    // Standard NASA 4-line record: line 1 ends with '1', line 2 with '2', line 3 with '3', line 4 with '4'
    const endsWith1 = rawLine.trimEnd().endsWith('1');
    if (endsWith1) {
      const spName = trimmed.split(/\s+/)[0];
      if (i + 3 >= lines.length) {
        errors.push(`.thm line ${i + 1} (${spName}): Incomplete 4-line NASA polynomial block.`);
        break;
      }
      const l2 = lines[i + 1].trimEnd();
      const l3 = lines[i + 2].trimEnd();
      const l4 = lines[i + 3].trimEnd();
      if (!l2.endsWith('2') || !l3.endsWith('3') || !l4.endsWith('4')) {
        warnings.push(`.thm line ${i + 1} (${spName}): NASA continuation lines do not end with standard markers 2, 3, 4.`);
      }
      species.push(spName);
      i += 4;
    } else {
      if (inThermo) {
        warnings.push(`.thm line ${i + 1}: Skipped non-standard line "${trimmed.slice(0, 60)}".`);
      }
      i++;
    }
  }

  if (species.length === 0) {
    errors.push('.thm file contains no valid 4-line CHEMKIN/NASA polynomial entries.');
  }

  return {
    valid: errors.length === 0,
    species,
    entryCount: species.length,
    warnings,
    errors
  };
}

/**
 * Validates either Single Enriched SDF mode or All Three Files (.sdf + -names.lst + .thm) mode.
 */
function validateMoleculeBundle({ mode = 'single_sdf', rootName = 'molecules', sdfText = '', namesLstText = '', thmText = '' }) {
  const sdfParsed = parseEnrichedSdf(sdfText, rootName);
  const warnings = [...sdfParsed.warnings];
  const errors = [...sdfParsed.errors];

  const sdfNameSet = new Set(sdfParsed.moleculeNames.map(n => n.toLowerCase()));

  let finalNamesLst = sdfParsed.generatedNamesLst;
  let finalNamesMol = sdfParsed.generatedNamesMol;
  let altNamesCount = sdfParsed.summary.altNameEntriesCount;
  let altNamesByMol = { ...sdfParsed.altNamesByMol };

  let finalThm = sdfParsed.generatedThm;
  let finalMol = sdfParsed.generatedMol;
  let thermoSpecies = Object.keys(sdfParsed.thermoBlocksByMol);
  let thermoCount = sdfParsed.summary.thermoEntriesCount;

  if (mode === 'three_files') {
    if (!namesLstText || !namesLstText.trim()) {
      errors.push('Alternative Names (-names.lst) file is required when "All Three Files" mode is selected.');
    } else {
      const namesParsed = parseNamesLst(namesLstText);
      warnings.push(...namesParsed.warnings);
      errors.push(...namesParsed.errors);
      finalNamesLst = namesLstText;
      finalNamesMol = namesParsed.generatedNamesMol;
      altNamesCount = namesParsed.entryCount;
      altNamesByMol = namesParsed.altNamesByMol;

      for (const mName of namesParsed.moleculeOrder) {
        if (!sdfNameSet.has(mName.toLowerCase())) {
          warnings.push(`-names.lst references molecule "${mName}" which was not found in the .sdf file.`);
        }
      }
    }

    if (!thmText || !thmText.trim()) {
      errors.push('Thermodynamics (.thm) file is required when "All Three Files" mode is selected.');
    } else {
      const thmParsed = parseChemkinThm(thmText);
      warnings.push(...thmParsed.warnings);
      errors.push(...thmParsed.errors);
      finalThm = thmText;
      thermoSpecies = thmParsed.species;
      thermoCount = thmParsed.entryCount;

      // Auto-generate .mol list from SDF molecule names (eliminates manual .mol file)
      finalMol = sdfParsed.moleculeNames.join('\n') + '\n';

      // Cross-check thermo species against SDF names & CHEMKIN alt names
      const knownChemkinNames = new Set(sdfNameSet);
      for (const entries of Object.values(altNamesByMol)) {
        for (const e of entries) {
          knownChemkinNames.add(String(e.value || '').toLowerCase());
        }
      }
      for (const sp of thmParsed.species) {
        if (!knownChemkinNames.has(sp.toLowerCase())) {
          warnings.push(`.thm species "${sp}" did not match any molecule name or CHEMKIN alternative name in this bundle.`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    mode,
    rootName,
    cleanSdf: sdfParsed.cleanSdf,
    moleculeNames: sdfParsed.moleculeNames,
    namesLst: finalNamesLst,
    namesMol: finalNamesMol,
    thm: finalThm,
    molList: finalMol,
    summary: {
      moleculeCount: sdfParsed.moleculeNames.length,
      altNameEntriesCount: altNamesCount,
      thermoEntriesCount: thermoCount,
      thermoSpeciesCount: thermoSpecies.length
    },
    warnings,
    errors
  };
}

/**
 * Computes canonical Hill-system molecular formula (e.g., C4H10, C5H10, H2O, O2)
 * for grouping molecules by isomers during Scientific ASCII database dump.
 */
function computeMolecularFormulaFromRecord(molRecord) {
  const molfile = molRecord?.Molfile || molRecord?.molfile || molRecord || {};
  const atoms = molfile.Atoms || molRecord?.atoms || [];
  if (!Array.isArray(atoms) || atoms.length === 0) {
    return 'UnknownFormula';
  }

  const counts = {};
  for (const atom of atoms) {
    const atNum = atom.AtomicNumber !== undefined ? atom.AtomicNumber : atom.atomicNumber;
    const sym = atom.symbol || ATOMIC_NUMBER_TO_SYMBOL[atNum] || (atNum ? `E${atNum}` : 'X');
    counts[sym] = (counts[sym] || 0) + 1;
  }

  // Hill system: C first, then H (if C present), then all other elements alphabetically
  const parts = [];
  const hasC = Boolean(counts.C);
  if (hasC) {
    parts.push(counts.C === 1 ? 'C' : `C${counts.C}`);
    if (counts.H) {
      parts.push(counts.H === 1 ? 'H' : `H${counts.H}`);
    }
  }
  const restKeys = Object.keys(counts)
    .filter(k => !(hasC && (k === 'C' || k === 'H')))
    .sort();
  for (const k of restKeys) {
    parts.push(counts[k] === 1 ? k : `${k}${counts[k]}`);
  }
  return parts.join('') || 'UnknownFormula';
}

/**
 * Extracts AlternativeNames array [{ type, value }] from a Firestore Molecule JSON document.
 */
function extractAltNamesFromMolRecord(molRecord) {
  const results = [];
  const propSet = molRecord?.Properties?.Properties || molRecord?.Properties || [];
  const propsArray = Array.isArray(propSet) ? propSet : [];

  for (const prop of propsArray) {
    const pName = String(prop?.Name || prop?.Type || '').toLowerCase();
    if (pName.includes('alternativename') || pName === 'chemkin' || pName === 'short') {
      const val = prop?.Value || prop?.Property || prop?.Data;
      if (typeof val === 'string' && val.trim()) {
        const parts = val.trim().split(/\s+/);
        if (parts.length >= 2) {
          results.push({ type: parts[0], value: parts.slice(1).join(' ') });
        } else {
          results.push({ type: prop?.Name || 'ALT', value: val.trim() });
        }
      } else if (val && typeof val === 'object') {
        const altType = val.Type || val.Name || 'CHEMKIN';
        const altVal = val.Value || val.NameString || val.String || '';
        if (altVal) results.push({ type: String(altType), value: String(altVal) });
      }
    }
  }

  // Also check top-level AlternativeNames if present
  if (Array.isArray(molRecord?.AlternativeNames)) {
    for (const alt of molRecord.AlternativeNames) {
      if (alt?.type && alt?.name) {
        results.push({ type: String(alt.type), value: String(alt.name) });
      } else if (alt?.Type && alt?.Name) {
        results.push({ type: String(alt.Type), value: String(alt.Name) });
      }
    }
  }
  return results;
}

/**
 * Builds standard MDL V2000 SDF block from a Firestore Molecule or Substructure record.
 */
function buildV2000SdfBlock(name, id, rawData, options = {}) {
  let coreBlock = '';
  if (rawData?.sdfContent && typeof rawData.sdfContent === 'string' && rawData.sdfContent.includes('M  END')) {
    const mEndPos = rawData.sdfContent.indexOf('M  END');
    coreBlock = rawData.sdfContent.slice(0, mEndPos + 6).trimEnd();
  } else {
    const molfile = rawData?.Molfile || rawData?.molfile || rawData || {};
    const atoms = molfile.Atoms || rawData?.atoms || [];
    const bonds = molfile.Bonds || rawData?.bonds || [];
    const nAtoms = molfile.NAtoms !== undefined ? molfile.NAtoms : atoms.length;
    const nBonds = molfile.NBonds !== undefined ? molfile.NBonds : bonds.length;

    const lines = [
      String(id || name),
      '  -REACTCLOUD-  Exported',
      String(name || id),
      `${String(nAtoms).padStart(3, ' ')}${String(nBonds).padStart(3, ' ')}  0  0  0  0  0  0  0  0999 V2000`
    ];

    atoms.forEach((a) => {
      const x = (typeof a.X === 'number' ? a.X : parseFloat(a.x || a.X || 0)).toFixed(4).padStart(10, ' ');
      const y = (typeof a.Y === 'number' ? a.Y : parseFloat(a.y || a.Y || 0)).toFixed(4).padStart(10, ' ');
      const z = (typeof a.Z === 'number' ? a.Z : parseFloat(a.z || a.Z || 0)).toFixed(4).padStart(10, ' ');
      const atNum = a.AtomicNumber !== undefined ? a.AtomicNumber : (a.atomicNumber !== undefined ? a.atomicNumber : 6);
      const sym = String(a.symbol || ATOMIC_NUMBER_TO_SYMBOL[atNum] || 'R').padEnd(3, ' ');
      lines.push(`${x}${y}${z} ${sym} 0  0  0  0  0  0  0  0  0  0  0  0`);
    });

    bonds.forEach((b) => {
      const i = String((b.I !== undefined ? b.I : (b.i !== undefined ? b.i : 0)) + 1).padStart(3, ' ');
      const j = String((b.J !== undefined ? b.J : (b.j !== undefined ? b.j : 0)) + 1).padStart(3, ' ');
      const order = String(b.Order !== undefined ? b.Order : (b.order !== undefined ? b.order : 1)).padStart(3, ' ');
      lines.push(`${i}${j}${order}  0  0  0  0`);
    });

    const radicalAtoms = [];
    atoms.forEach((a, idx) => {
      const r = a.Radical !== undefined ? a.Radical : (a.isRadical ? 2 : 0);
      if (r > 0) radicalAtoms.push({ idx: idx + 1, rad: r });
    });
    if (radicalAtoms.length > 0) {
      let radLine = `M  RAD${String(radicalAtoms.length).padStart(3, ' ')}`;
      radicalAtoms.forEach(r => {
        radLine += `${String(r.idx).padStart(4, ' ')}${String(r.rad).padStart(4, ' ')}`;
      });
      lines.push(radLine);
    }

    lines.push('M  END');
    coreBlock = lines.join('\n');
  }

  const extraBlocks = [];
  if (options.includeEnrichedBlocks) {
    const alts = extractAltNamesFromMolRecord(rawData);
    for (const alt of alts) {
      extraBlocks.push(`>  <AlternativeNames>\n${alt.type} ${alt.value}\n`);
    }
  }

  return [coreBlock, ...extraBlocks, '$$$$'].join('\n');
}

module.exports = {
  parseEnrichedSdf,
  parseNamesLst,
  parseChemkinThm,
  validateMoleculeBundle,
  computeMolecularFormulaFromRecord,
  extractAltNamesFromMolRecord,
  buildV2000SdfBlock
};
