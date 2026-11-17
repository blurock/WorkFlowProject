/**
 * Administration, Integrity Verification, and Hierarchical List Generation Module
 * For REACTCLOUD Node.js Orchestrator.
 */

const DATABASE_INDEX_MAP = {
  Substructures: {
    dbName: 'Substructures',
    classIndex: 'DB-Index-SubStructureIDs',
    label: 'Substructures'
  },
  Molecules: {
    dbName: 'Molecules',
    classIndex: 'DB-Index-MoleculeIDs',
    label: 'Molecules'
  },
  ReactionPatterns: {
    dbName: 'ReactionPatterns',
    classIndex: 'DB-Index-PatternIDs',
    label: 'Reaction Patterns'
  },
  BensonTables: {
    dbName: 'BensonTables',
    classIndex: 'DB-Index-BensonIDs',
    label: 'Benson Tables'
  }
};

/**
 * Replace specific substituents (h), (r), (q) with wildcard (X) to determine functional family
 */
function getSubstructureFamily(name) {
  if (!name) return 'Other';
  return name.replace(/\([hrq]+\)/gi, '(X)')
             .replace(/\([hrq]{2}\)/gi, '(XX)')
             .replace(/\([hrq]{3}\)/gi, '(XXX)');
}

/**
 * Parse base name and version for mechanism pathway
 */
function parsePathwayVersion(name) {
  if (!name) return { baseName: 'Other', versionNum: 1.0, versionLabel: 'V1.0' };
  const match = name.match(/^(.*?)(?:[Vv](\d+(?:\.\d+)?))?$/);
  if (match) {
    const baseName = (match[1] || name).replace(/[-_]$/, '');
    const versionNum = match[2] ? parseFloat(match[2]) : 1.0;
    const versionLabel = match[2] ? `V${match[2]}` : 'V1.0';
    return { baseName, versionNum, versionLabel };
  }
  return { baseName: name, versionNum: 1.0, versionLabel: 'V1.0' };
}

/**
 * Runs integrity audit for a specific database collection against its classification index
 */
async function auditDatabase(firestore, uid, dbKey) {
  const cfg = DATABASE_INDEX_MAP[dbKey];
  if (!cfg) {
    throw new Error(`Unknown database key: ${dbKey}. Valid choices: ${Object.keys(DATABASE_INDEX_MAP).join(', ')}`);
  }

  const recordsCol = firestore.collection(`users/${uid}/databases/${cfg.dbName}/records`);
  const classCol = firestore.collection(`users/${uid}/classifications/database/${cfg.classIndex}`);

  const [recordsSnap, classSnap] = await Promise.all([
    recordsCol.get(),
    classCol.get()
  ]);

  const recordsById = new Map();
  const recordsByName = new Map();
  const duplicateRecordIds = [];
  const duplicateRecordNames = [];
  const missingIdDocs = [];
  const missingNameDocs = [];

  recordsSnap.forEach(doc => {
    const data = doc.data();
    const id = data.ID ?? data.keyId ?? (data.key ? parseInt(data.key, 10) : null);
    const name = (data.Name ?? data.name ?? '').trim();

    if (!id && id !== 0) missingIdDocs.push(doc.id);
    if (!name) missingNameDocs.push(doc.id);

    // Track duplicate IDs in records
    if (recordsById.has(id)) {
      const existing = recordsById.get(id);
      duplicateRecordIds.push({
        id,
        docs: [existing.docId, doc.id],
        names: [existing.name, name]
      });
    } else {
      recordsById.set(id, { docId: doc.id, id, name, data });
    }

    // Track duplicate Names in records
    if (recordsByName.has(name)) {
      const existing = recordsByName.get(name);
      duplicateRecordNames.push({
        name,
        docs: [existing.docId, doc.id],
        ids: [existing.id, id]
      });
    } else {
      recordsByName.set(name, { docId: doc.id, id, name, data });
    }
  });

  // Traverse classification keys
  const classKeysById = new Map();
  const classKeysByName = new Map();
  const duplicateClassIds = [];
  const duplicateClassNames = [];
  let totalClassKeys = 0;

  classSnap.forEach(doc => {
    const data = doc.data();
    const keys = data.Keys || data.keys || [];
    totalClassKeys += keys.length;

    keys.forEach(k => {
      const id = k.ID;
      const name = (k.Name || '').trim();

      if (classKeysById.has(id)) {
        const existing = classKeysById.get(id);
        duplicateClassIds.push({
          id,
          name,
          docs: [existing.docId, doc.id]
        });
      } else {
        classKeysById.set(id, { id, name, docId: doc.id, keyObj: k });
      }

      if (classKeysByName.has(name)) {
        const existing = classKeysByName.get(name);
        duplicateClassNames.push({
          name,
          id,
          docs: [existing.docId, doc.id]
        });
      } else {
        classKeysByName.set(name, { id, name, docId: doc.id, keyObj: k });
      }
    });
  });

  // Cross-reconciliation:
  // 1. Orphan records (exist in DB records, missing from classification keys)
  const orphans = [];
  recordsById.forEach((rec, id) => {
    if (!classKeysById.has(id)) {
      orphans.push({
        id,
        name: rec.name,
        docId: rec.docId,
        suggestedFix: 'sync_to_classification'
      });
    }
  });

  // 2. Ghost index keys (exist in classification keys, missing DB record)
  const ghosts = [];
  classKeysById.forEach((k, id) => {
    if (!recordsById.has(id)) {
      ghosts.push({
        id,
        name: k.name,
        classDocId: k.docId,
        suggestedFix: 'prune_ghost_key'
      });
    }
  });

  // 3. Name mismatches
  const nameMismatches = [];
  recordsById.forEach((rec, id) => {
    if (classKeysById.has(id)) {
      const c = classKeysById.get(id);
      if (c.name !== rec.name) {
        nameMismatches.push({
          id,
          recordName: rec.name,
          className: c.name,
          recordDocId: rec.docId,
          classDocId: c.docId,
          suggestedFix: 'sync_name_to_classification'
        });
      }
    }
  });

  // Assemble complete issues list
  const issues = [];

  duplicateRecordNames.forEach(dup => {
    issues.push({
      type: 'DUPLICATE_RECORD_NAME',
      severity: 'warn',
      message: `Duplicate Name in database records: '${dup.name}' appears in ${dup.docs.length} documents (${dup.docs.join(', ')}) with IDs [${dup.ids.join(', ')}]`,
      name: dup.name,
      docs: dup.docs,
      ids: dup.ids,
      suggestedFix: 'delete_or_rename'
    });
  });

  duplicateRecordIds.forEach(dup => {
    issues.push({
      type: 'DUPLICATE_RECORD_ID',
      severity: 'error',
      message: `Duplicate ID in database records: ID ${dup.id} shared by documents (${dup.docs.join(', ')})`,
      id: dup.id,
      docs: dup.docs,
      names: dup.names,
      suggestedFix: 'delete_or_reassign'
    });
  });

  orphans.forEach(orp => {
    issues.push({
      type: 'ORPHAN_RECORD',
      severity: 'warn',
      message: `Record '${orp.name}' (ID: ${orp.id}, Doc: ${orp.docId}) exists in DB but is missing from classification index '${cfg.classIndex}'`,
      id: orp.id,
      name: orp.name,
      docId: orp.docId,
      suggestedFix: 'sync_to_classification'
    });
  });

  ghosts.forEach(gh => {
    issues.push({
      type: 'GHOST_INDEX_KEY',
      severity: 'warn',
      message: `Classification index doc '${gh.classDocId}' has Key for ID ${gh.id} ('${gh.name}'), but no record document exists in '${cfg.dbName}'`,
      id: gh.id,
      name: gh.name,
      classDocId: gh.classDocId,
      suggestedFix: 'prune_ghost_key'
    });
  });

  nameMismatches.forEach(mis => {
    issues.push({
      type: 'NAME_MISMATCH',
      severity: 'info',
      message: `Name mismatch for ID ${mis.id}: Record doc has '${mis.recordName}', but classification key has '${mis.className}'`,
      id: mis.id,
      recordName: mis.recordName,
      className: mis.className,
      recordDocId: mis.recordDocId,
      classDocId: mis.classDocId,
      suggestedFix: 'sync_name_to_classification'
    });
  });

  // Side-by-side reconciliation list
  const allIds = new Set([...recordsById.keys(), ...classKeysById.keys()]);
  const reconciliation = [];
  allIds.forEach(id => {
    if (id === null || id === undefined) return;
    const r = recordsById.get(id);
    const c = classKeysById.get(id);
    let status = 'MATCH';
    if (r && !c) status = 'MISSING_IN_INDEX';
    else if (!r && c) status = 'MISSING_IN_RECORDS';
    else if (r && c && r.name !== c.name) status = 'NAME_MISMATCH';

    reconciliation.push({
      id,
      recordDocId: r?.docId || null,
      recordName: r?.name || null,
      classDocId: c?.docId || null,
      className: c?.name || null,
      status
    });
  });

  reconciliation.sort((a, b) => {
    if (typeof a.id === 'number' && typeof b.id === 'number') return a.id - b.id;
    return String(a.id).localeCompare(String(b.id));
  });

  return {
    database: dbKey,
    dbName: cfg.dbName,
    classIndex: cfg.classIndex,
    label: cfg.label,
    auditedAt: new Date().toISOString(),
    summary: {
      totalRecords: recordsSnap.size,
      totalClassificationKeys: totalClassKeys,
      totalClassificationDocs: classSnap.size,
      duplicateRecordNamesCount: duplicateRecordNames.length,
      duplicateRecordIdsCount: duplicateRecordIds.length,
      duplicateClassNamesCount: duplicateClassNames.length,
      duplicateClassIdsCount: duplicateClassIds.length,
      orphanRecordsCount: orphans.length,
      ghostIndexKeysCount: ghosts.length,
      nameMismatchesCount: nameMismatches.length,
      totalIssuesCount: issues.length
    },
    issues,
    reconciliation
  };
}

/**
 * Executes an individual remediation action
 */
async function remediateIssue(firestore, uid, action, params = {}) {
  const { dbKey, recordDocId, classDocId, id, name, newName } = params;
  const cfg = DATABASE_INDEX_MAP[dbKey];
  if (!cfg) throw new Error(`Invalid dbKey: ${dbKey}`);

  switch (action) {
    case 'delete_record': {
      if (!recordDocId) throw new Error('recordDocId required for delete_record');
      const docRef = firestore.collection(`users/${uid}/databases/${cfg.dbName}/records`).doc(recordDocId);
      await docRef.delete();

      // If pruneIndexKey requested or present
      if (params.pruneIndexKey && id !== undefined) {
        await pruneIndexKey(firestore, uid, cfg.classIndex, id, classDocId);
      }
      return { success: true, message: `Deleted record doc '${recordDocId}' from ${cfg.dbName}` };
    }

    case 'rename_record': {
      if (!recordDocId || !newName) throw new Error('recordDocId and newName required for rename_record');
      const cleanNewName = newName.trim();
      const docRef = firestore.collection(`users/${uid}/databases/${cfg.dbName}/records`).doc(recordDocId);
      await docRef.set({ Name: cleanNewName, name: cleanNewName, updatedAt: new Date().toISOString() }, { merge: true });

      // Also sync to classification key
      if (id !== undefined) {
        await syncNameToClassification(firestore, uid, cfg.classIndex, id, cleanNewName, classDocId);
      }
      return { success: true, message: `Renamed record '${recordDocId}' to '${cleanNewName}' and synced index` };
    }

    case 'prune_ghost_key': {
      if (id === undefined) throw new Error('id required for prune_ghost_key');
      const pruned = await pruneIndexKey(firestore, uid, cfg.classIndex, id, classDocId);
      return { success: true, message: `Pruned ghost key ${id} from classification '${cfg.classIndex}' (${pruned} doc(s) updated)` };
    }

    case 'sync_name_to_classification': {
      if (id === undefined || !name) throw new Error('id and name required for sync_name_to_classification');
      const updated = await syncNameToClassification(firestore, uid, cfg.classIndex, id, name.trim(), classDocId);
      return { success: true, message: `Updated classification key ${id} to '${name.trim()}' in index '${cfg.classIndex}'` };
    }

    case 'sync_to_classification': {
      if (id === undefined || !name) throw new Error('id and name required for sync_to_classification');
      // Add key to classification index
      const synced = await addKeyToClassification(firestore, uid, cfg.classIndex, id, name.trim(), classDocId);
      return { success: true, message: `Added key ${id} ('${name.trim()}') to classification index '${cfg.classIndex}' (doc: ${synced.classDocId})` };
    }

    default:
      throw new Error(`Unknown remediation action: ${action}`);
  }
}

/**
 * Helper to remove a key from a classification doc's Keys array
 */
async function pruneIndexKey(firestore, uid, classIndex, id, classDocId) {
  const classCol = firestore.collection(`users/${uid}/classifications/database/${classIndex}`);
  let count = 0;

  if (classDocId) {
    const docRef = classCol.doc(classDocId);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      const keys = data.Keys || data.keys || [];
      const filtered = keys.filter(k => k.ID !== id);
      if (filtered.length !== keys.length) {
        await docRef.update({ Keys: filtered, keys: filtered });
        count++;
      }
    }
  } else {
    // Search all docs in classification collection
    const snap = await classCol.get();
    for (const d of snap.docs) {
      const data = d.data();
      const keys = data.Keys || data.keys || [];
      const filtered = keys.filter(k => k.ID !== id);
      if (filtered.length !== keys.length) {
        await d.ref.update({ Keys: filtered, keys: filtered });
        count++;
      }
    }
  }
  return count;
}

/**
 * Helper to update key name in classification document
 */
async function syncNameToClassification(firestore, uid, classIndex, id, newName, classDocId) {
  const classCol = firestore.collection(`users/${uid}/classifications/database/${classIndex}`);
  let updated = false;

  const updateDocKeys = (d) => {
    const data = d.data();
    const keys = data.Keys || data.keys || [];
    let changed = false;
    for (const k of keys) {
      if (k.ID === id) {
        k.Name = newName;
        changed = true;
      }
    }
    if (changed) {
      return d.ref.update({ Keys: keys, keys: keys });
    }
    return Promise.resolve();
  };

  if (classDocId) {
    const docRef = classCol.doc(classDocId);
    const snap = await docRef.get();
    if (snap.exists) {
      await updateDocKeys(snap);
      updated = true;
    }
  } else {
    const snap = await classCol.get();
    for (const d of snap.docs) {
      await updateDocKeys(d);
    }
    updated = true;
  }
  return updated;
}

/**
 * Helper to add a missing key to classification index
 */
async function addKeyToClassification(firestore, uid, classIndex, id, name, preferredClassDocId) {
  const classCol = firestore.collection(`users/${uid}/classifications/database/${classIndex}`);
  let targetDocRef = null;
  let targetDocId = preferredClassDocId;

  if (targetDocId) {
    targetDocRef = classCol.doc(targetDocId);
  } else {
    // Find first existing classification doc or create a default root one
    const snap = await classCol.limit(1).get();
    if (!snap.empty) {
      targetDocRef = snap.docs[0].ref;
      targetDocId = snap.docs[0].id;
    } else {
      targetDocId = 'doc_0_0_0_1';
      targetDocRef = classCol.doc(targetDocId);
    }
  }

  const snap = await targetDocRef.get();
  let keys = [];
  if (snap.exists) {
    const data = snap.data();
    keys = data.Keys || data.keys || [];
  }

  // Check if key already exists
  if (!keys.some(k => k.ID === id)) {
    keys.push({
      ID: id,
      Name: name,
      Size: 4,
      KeyWord: id
    });
    await targetDocRef.set({ Keys: keys, keys: keys }, { merge: true });
  }

  return { classDocId: targetDocId };
}

/**
 * Executes Auto-Sync Safe Inconsistencies (Option 2B):
 * 1. Prunes ghost keys (where record doc is gone)
 * 2. Syncs mismatched names (updates index key name to record name)
 * 3. Syncs orphan records into classification index
 */
async function autoSyncSafe(firestore, uid, dbKey) {
  const audit = await auditDatabase(firestore, uid, dbKey);
  let prunedGhosts = 0;
  let syncedNames = 0;
  let syncedOrphans = 0;

  // 1. Prune ghosts
  for (const gh of audit.issues.filter(i => i.type === 'GHOST_INDEX_KEY')) {
    await pruneIndexKey(firestore, uid, audit.classIndex, gh.id, gh.classDocId);
    prunedGhosts++;
  }

  // 2. Sync name mismatches
  for (const mis of audit.issues.filter(i => i.type === 'NAME_MISMATCH')) {
    await syncNameToClassification(firestore, uid, audit.classIndex, mis.id, mis.recordName, mis.classDocId);
    syncedNames++;
  }

  // 3. Sync orphans
  for (const orp of audit.issues.filter(i => i.type === 'ORPHAN_RECORD')) {
    await addKeyToClassification(firestore, uid, audit.classIndex, orp.id, orp.name);
    syncedOrphans++;
  }

  return {
    database: dbKey,
    prunedGhosts,
    syncedNames,
    syncedOrphans,
    totalFixed: prunedGhosts + syncedNames + syncedOrphans,
    remainingIssues: audit.issues.length - (prunedGhosts + syncedNames + syncedOrphans)
  };
}

/**
 * Generates all structured catalog lists and hierarchies as specified in AdministrationPanel.md
 */
async function generateCatalogLists(firestore, uid) {
  const startTime = Date.now();

  const [molSnap, subSnap, rxnSnap, pathSnap, mechMetaSnap] = await Promise.all([
    firestore.collection(`users/${uid}/databases/Molecules/records`).get(),
    firestore.collection(`users/${uid}/databases/Substructures/records`).get(),
    firestore.collection(`users/${uid}/databases/ReactionPatterns/records`).get(),
    firestore.collection(`users/${uid}/databases/MechanismPathway/records`).get(),
    firestore.collection(`users/${uid}/databases/Mechanisms/metadata`).get()
  ]);

  // 1. Molecules Simple List
  const moleculeNamesSet = new Set();
  const moleculesList = [];
  molSnap.forEach(d => {
    const data = d.data();
    const id = data.ID ?? data.keyId ?? d.id;
    const name = (data.Name ?? data.name ?? d.id).trim();
    moleculeNamesSet.add(name.toLowerCase());
    moleculesList.push({ id, name, docId: d.id });
  });
  moleculesList.sort((a, b) => a.name.localeCompare(b.name));

  // 2. Substructures
  // a) Functional group clustering: Option 3A
  const subFamiliesMap = new Map();
  const substructuresMoleculeIntersection = [];
  const substructureMasterMap = {};

  subSnap.forEach(d => {
    const data = d.data();
    const id = data.ID ?? data.keyId ?? d.id;
    const name = (data.Name ?? data.name ?? d.id).trim();
    const family = getSubstructureFamily(name);
    const isMolecule = moleculeNamesSet.has(name.toLowerCase());

    if (isMolecule) {
      substructuresMoleculeIntersection.push({ id, name, family });
    }

    substructureMasterMap[id] = {
      id,
      name,
      family,
      isMolecule,
      atomCount: data.Molfile?.NAtoms,
      bondCount: data.Molfile?.NBonds
    };

    if (!subFamiliesMap.has(family)) {
      subFamiliesMap.set(family, []);
    }
    subFamiliesMap.get(family).push({ id, name, isMolecule });
  });

  const substructureFamilies = [];
  subFamiliesMap.forEach((items, family) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
    substructureFamilies.push({
      family,
      count: items.length,
      items
    });
  });
  substructureFamilies.sort((a, b) => a.family.localeCompare(b.family));
  substructuresMoleculeIntersection.sort((a, b) => a.name.localeCompare(b.name));

  // 3. Reaction Patterns
  // a) Name prefix grouping
  const rxnPrefixMap = new Map();
  // b) Substructure-based grouping (Reactant vs Product -> non-molecule substructure family)
  const rxnSubstructReactantsMap = new Map();
  const rxnSubstructProductsMap = new Map();

  rxnSnap.forEach(d => {
    const data = d.data();
    const id = data.ID ?? data.keyId ?? d.id;
    const name = (data.Name ?? data.name ?? d.id).trim();

    // Prefix group
    const prefix = name.split('-')[0] || 'Other';
    if (!rxnPrefixMap.has(prefix)) rxnPrefixMap.set(prefix, []);
    rxnPrefixMap.get(prefix).push({ id, name });

    // Substructures mapping
    const reactants = data.Reactants || [];
    const products = data.Products || [];

    // Map reactants
    reactants.forEach(rId => {
      const subInfo = substructureMasterMap[rId];
      if (subInfo && !subInfo.isMolecule) {
        const fam = subInfo.family || 'Other';
        if (!rxnSubstructReactantsMap.has(fam)) rxnSubstructReactantsMap.set(fam, []);
        rxnSubstructReactantsMap.get(fam).push({ id, name, substructureName: subInfo.name });
      }
    });

    // Map products
    products.forEach(pId => {
      const subInfo = substructureMasterMap[pId];
      if (subInfo && !subInfo.isMolecule) {
        const fam = subInfo.family || 'Other';
        if (!rxnSubstructProductsMap.has(fam)) rxnSubstructProductsMap.set(fam, []);
        rxnSubstructProductsMap.get(fam).push({ id, name, substructureName: subInfo.name });
      }
    });
  });

  const rxnPatternsByName = [];
  rxnPrefixMap.forEach((patterns, prefix) => {
    patterns.sort((a, b) => a.name.localeCompare(b.name));
    rxnPatternsByName.push({ prefix, count: patterns.length, patterns });
  });
  rxnPatternsByName.sort((a, b) => a.prefix.localeCompare(b.prefix));

  const rxnPatternsBySubstructure = {
    reactants: Array.from(rxnSubstructReactantsMap.entries()).map(([family, patterns]) => ({
      family,
      count: patterns.length,
      patterns
    })).sort((a, b) => a.family.localeCompare(b.family)),
    products: Array.from(rxnSubstructProductsMap.entries()).map(([family, patterns]) => ({
      family,
      count: patterns.length,
      patterns
    })).sort((a, b) => a.family.localeCompare(b.family))
  };

  // 4. Mechanism Pathways Version Clustering
  const pathwayBaseMap = new Map();
  pathSnap.forEach(d => {
    const name = d.id;
    const parsed = parsePathwayVersion(name);
    if (!pathwayBaseMap.has(parsed.baseName)) {
      pathwayBaseMap.set(parsed.baseName, []);
    }
    pathwayBaseMap.get(parsed.baseName).push({
      name,
      versionLabel: parsed.versionLabel,
      versionNum: parsed.versionNum
    });
  });

  const pathwayGroups = [];
  pathwayBaseMap.forEach((versions, baseName) => {
    versions.sort((a, b) => a.versionNum - b.versionNum);
    pathwayGroups.push({
      baseName,
      count: versions.length,
      versions
    });
  });
  pathwayGroups.sort((a, b) => a.baseName.localeCompare(b.baseName));

  // 5. Mechanisms Grouping (by target molecule)
  const mechanismTargetMap = new Map();
  mechMetaSnap.forEach(d => {
    const data = d.data();
    const mechName = data.mechName || d.id;
    const targetMolecule = data.targetMolecule || mechName.split('-')[0] || 'General';
    if (!mechanismTargetMap.has(targetMolecule)) {
      mechanismTargetMap.set(targetMolecule, []);
    }
    mechanismTargetMap.get(targetMolecule).push({
      mechName,
      type: data.type || 'submechanism',
      pathwayName: data.pathwayName || null,
      filesCount: data.files?.length || 0,
      createdAt: data.createdAt || null
    });
  });

  const mechanismGroups = [];
  mechanismTargetMap.forEach((mechanisms, targetMolecule) => {
    mechanisms.sort((a, b) => a.mechName.localeCompare(b.mechName));
    mechanismGroups.push({
      targetMolecule,
      count: mechanisms.length,
      mechanisms
    });
  });
  mechanismGroups.sort((a, b) => a.targetMolecule.localeCompare(b.targetMolecule));

  // Build simple substructure map of ID -> Name
  const simpleSubstructureMap = {};
  Object.keys(substructureMasterMap).forEach(id => {
    simpleSubstructureMap[id] = substructureMasterMap[id].name;
  });

  // Flatten reaction patterns by substructure
  const flattenedRxnBySubstructure = [
    ...rxnPatternsBySubstructure.reactants.map(r => ({
      substructure: r.family,
      count: r.count,
      patterns: r.patterns.map(p => ({ id: p.id, name: p.name, role: 'reactant' }))
    })),
    ...rxnPatternsBySubstructure.products.map(p => ({
      substructure: p.family,
      count: p.count,
      patterns: p.patterns.map(p => ({ id: p.id, name: p.name, role: 'product' }))
    }))
  ];

  // Flatten pathway clusters
  const pathwayClusters = pathwayGroups.map(g => ({
    baseName: g.baseName,
    count: g.count,
    pathways: g.versions.map(v => ({ id: v.name, name: v.name, version: v.versionLabel }))
  }));

  // Flatten mechanism clusters
  const mechanismClusters = mechanismGroups.map(g => ({
    targetMolecule: g.targetMolecule,
    count: g.count,
    mechanisms: g.mechanisms.map(m => ({ id: m.mechName, name: m.mechName }))
  }));

  const generatedPayload = {
    generatedAt: new Date().toISOString(),
    generationTimeMs: Date.now() - startTime,
    targetUid: uid,
    // Top-level direct arrays for frontend
    molecules: moleculesList,
    moleculesTotal: moleculesList.length,
    substructures: {
      total: subSnap.size,
      totalFamilies: substructureFamilies.length,
      families: substructureFamilies,
      moleculesInSubstructures: substructuresMoleculeIntersection.map(m => ({
        id: m.id,
        name: m.name,
        moleculeId: m.id
      })),
      moleculesIntersection: substructuresMoleculeIntersection,
      substructureMap: simpleSubstructureMap,
      masterMap: substructureMasterMap
    },
    reactionPatterns: {
      total: rxnSnap.size,
      byPrefix: rxnPatternsByName,
      byName: rxnPatternsByName,
      bySubstructure: flattenedRxnBySubstructure,
      rawBySubstructure: rxnPatternsBySubstructure
    },
    pathways: {
      total: pathSnap.size,
      totalClusters: pathwayClusters.length,
      clusters: pathwayClusters,
      groups: pathwayGroups
    },
    mechanismPathways: {
      total: pathSnap.size,
      totalGroups: pathwayGroups.length,
      groups: pathwayGroups,
      clusters: pathwayClusters
    },
    mechanisms: {
      total: mechMetaSnap.size,
      totalTargets: mechanismClusters.length,
      clusters: mechanismClusters,
      groups: mechanismGroups
    }
  };

  // Cache to Firestore under users/{uid}/cached_lists/master_catalog_lists
  await firestore.collection(`users/${uid}/cached_lists`).doc('master_catalog_lists').set(generatedPayload);

  return generatedPayload;
}

/**
 * Setup Admin & Integrity REST Endpoints on Express App
 */
function setupAdminIntegrityRoutes(app, { firestore, authenticateUser, requireAdmin }) {
  // Helper to resolve target UID according to scope and admin rights
  const resolveTargetUid = (req) => {
    const scope = (req.headers['x-react-data-scope'] || req.body?.scope || req.query?.scope || 'personal').toLowerCase();
    const explicitTarget = req.body?.targetUid || req.query?.targetUid;
    if (explicitTarget && req.user?.isAdmin) {
      return explicitTarget;
    }
    if (scope === 'system' && req.user?.isAdmin) {
      return process.env.SYSTEM_CATALOG_UID || 'UOqk0KtFtaXma5TGsi8Seh9RMbx1';
    }
    return req.user?.uid || 'UOqk0KtFtaXma5TGsi8Seh9RMbx1';
  };

  /**
   * POST /api/admin/integrity/audit
   * Audits specified database ('Substructures', 'Molecules', 'ReactionPatterns', 'BensonTables', or 'all')
   */
  app.post('/api/admin/integrity/audit', authenticateUser, requireAdmin, async (req, res) => {
    try {
      const targetUid = resolveTargetUid(req);
      const rawDb = req.body?.database || req.query?.database || 'Substructures';
      const database = String(rawDb).trim();

      if (database.toLowerCase() === 'all') {
        const resultsArray = await Promise.all(
          Object.keys(DATABASE_INDEX_MAP).map(k => auditDatabase(firestore, targetUid, k))
        );
        const resultsMap = {};
        for (const r of resultsArray) {
          resultsMap[r.database] = r;
        }
        return res.json({ success: true, targetUid, results: resultsMap });
      }

      const result = await auditDatabase(firestore, targetUid, database);
      return res.json({ 
        success: true, 
        targetUid, 
        result, 
        results: { [result.database]: result } 
      });
    } catch (err) {
      console.error('[POST /api/admin/integrity/audit Error]', err);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/integrity/remediate
   * Executes remediation action (delete_record, rename_record, sync_to_classification, prune_ghost_key, auto_sync_safe)
   */
  app.post('/api/admin/integrity/remediate', authenticateUser, requireAdmin, async (req, res) => {
    try {
      const targetUid = resolveTargetUid(req);
      const { action, database, ...params } = req.body || {};

      if (!action) {
        return res.status(400).json({ error: 'Missing remediation action' });
      }

      if (action === 'auto_sync_safe') {
        const result = await autoSyncSafe(firestore, targetUid, database || 'Substructures');
        return res.json({ success: true, targetUid, result });
      }

      const result = await remediateIssue(firestore, targetUid, action, { ...params, dbKey: database });
      return res.json({ success: true, targetUid, result });
    } catch (err) {
      console.error('[POST /api/admin/integrity/remediate Error]', err);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/lists/generate
   * Generates all structured hierarchical lists and caches to Firestore
   */
  app.post('/api/admin/lists/generate', authenticateUser, requireAdmin, async (req, res) => {
    try {
      const targetUid = resolveTargetUid(req);
      const payload = await generateCatalogLists(firestore, targetUid);
      return res.json({ success: true, targetUid, lists: payload });
    } catch (err) {
      console.error('[POST /api/admin/lists/generate Error]', err);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/admin/lists/:listType
   * Retrieves cached lists (or generates if missing)
   */
  app.get('/api/admin/lists/:listType', authenticateUser, async (req, res) => {
    try {
      const targetUid = resolveTargetUid(req);
      const listType = req.params.listType;

      const cacheDoc = await firestore.collection(`users/${targetUid}/cached_lists`).doc('master_catalog_lists').get();
      let payload = null;

      if (cacheDoc.exists) {
        payload = cacheDoc.data();
      } else {
        payload = await generateCatalogLists(firestore, targetUid);
      }

      if (listType === 'all') {
        return res.json({ success: true, lists: payload });
      }

      if (payload[listType]) {
        return res.json({ success: true, listType, data: payload[listType] });
      }

      return res.status(404).json({ error: `List type '${listType}' not found in catalog lists` });
    } catch (err) {
      console.error('[GET /api/admin/lists/:listType Error]', err);
      return res.status(500).json({ error: err.message });
    }
  });
}

module.exports = {
  DATABASE_INDEX_MAP,
  getSubstructureFamily,
  parsePathwayVersion,
  auditDatabase,
  remediateIssue,
  autoSyncSafe,
  generateCatalogLists,
  setupAdminIntegrityRoutes
};

