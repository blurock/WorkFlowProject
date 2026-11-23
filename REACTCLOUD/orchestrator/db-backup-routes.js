/**
 * Database Dump, Recovery & Molecule Bundle Import Routes
 *
 * Implements:
 * 1. POST /api/molecules/validate-bundle  - Validates Single Enriched SDF or 3-file (.sdf + -names.lst + .thm) bundle
 * 2. POST /api/molecules/store-bundle     - Atomically stores SDF + AlternativeNames + CHEMKIN Thermo via chemdb (auto-generating .mol lists)
 * 3. POST /api/admin/db-dump              - Dumps database to Canonical JSON or Scientific ASCII (isomer-grouped molecules + input-mirroring directories),
 *                                           supporting Download ZIP and/or Firebase/GCS Storage backup
 * 4. GET  /api/admin/db-backups           - Lists saved Firebase/GCS Storage backups for the user (and system for admin)
 * 5. POST /api/admin/db-recover/preview   - Dry-run preview (new vs existing counts per collection)
 * 6. POST /api/admin/db-recover/execute   - Executes Merge/Upsert or Clean Replace recovery into target scope
 */

const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const {
  validateMoleculeBundle,
  computeMolecularFormulaFromRecord,
  extractAltNamesFromMolRecord,
  buildV2000SdfBlock
} = require('./molecule-bundle-utils');

const DUMP_COLLECTIONS = [
  { key: 'Molecules', label: 'Molecules', type: 'database', dbKey: 'Molecules' },
  { key: 'Substructures', label: 'Substructures', type: 'database', dbKey: 'Substructures' },
  { key: 'ReactionPatterns', label: 'Reaction Patterns', type: 'database', dbKey: 'ReactionPatterns' },
  { key: 'Reactions', label: 'Reactions', type: 'database', dbKey: 'Reactions' },
  { key: 'Thermodynamics', label: 'Thermodynamics', type: 'database', dbKey: 'Thermodynamics' },
  { key: 'BensonTables', label: 'Benson Tables', type: 'database', dbKey: 'BensonTables' },
  { key: 'MechanismPathway', label: 'Mechanism Pathways', type: 'database', dbKey: 'MechanismPathway' },
  { key: 'MechanismPathSet', label: 'Mechanism Path Sets', type: 'database', dbKey: 'MechanismPathSet' },
  { key: 'RxnMechanism', label: 'Generated Mechanisms', type: 'custom', collectionName: 'mechanisms' }
];

function sanitizeDirToken(name, fallback = 'reactcloud_backup') {
  const cleaned = String(name || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return cleaned || fallback;
}

function deriveCategoryGroup(name, fallback = 'General') {
  const s = String(name || '').trim();
  if (!s) return fallback;
  // Group by prefix before '-', '_', or CamelCase boundary, or version suffix
  const strippedVersion = s.replace(/[_\-\s]?[vV]\d+(\.\d+)*$/, '');
  const dashIdx = strippedVersion.indexOf('-');
  if (dashIdx > 1) return sanitizeDirToken(strippedVersion.slice(0, dashIdx), fallback);
  const underIdx = strippedVersion.indexOf('_');
  if (underIdx > 1) return sanitizeDirToken(strippedVersion.slice(0, underIdx), fallback);
  return sanitizeDirToken(strippedVersion, fallback);
}

function setupDbBackupAndMoleculeBundleRoutes(app, deps) {
  const {
    firestore,
    storage,
    BUCKET_NAME,
    authenticateUser,
    scopedResolver,
    resolveScopeContext,
    setActiveJobScope,
    hydrateUserWorkspace,
    cleanupWorkspace,
    persistUserWorkspace,
    getSignedDownloadUrl,
    buildLogContentUrl,
    CHEMDB_BIN,
    REACTROOT,
    PORT
  } = deps;

  /**
   * Helper to run a single chemdb command sequence inside an existing workspaceDir
   */
  function runChemdbPass(workspaceDir, commandsArray, { uid, ipcSecret }) {
    return new Promise((resolve) => {
      const commandText = commandsArray.join('\n') + '\n';
      const args = ['read', '0', path.join(REACTROOT, 'command'), path.join(REACTROOT, 'data', 'stat-inf.dat')];
      const child = spawn(CHEMDB_BIN, args, {
        cwd: workspaceDir,
        env: {
          ...process.env,
          REACTROOT,
          CCROOT: REACTROOT,
          REACT_ORCHESTRATOR_PORT: String(PORT),
          REACT_IPC_SECRET: ipcSecret || '',
          REACT_USER_ID: uid,
          REACT_USER_UID: uid
        }
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });
      child.on('error', err => resolve({ exitCode: 1, stdout, stderr: `${stderr}\n${err.message}` }));
      child.on('close', (code, signal) => {
        const effectiveExitCode = code !== null ? code : (signal ? 128 : 0);
        resolve({ exitCode: effectiveExitCode, signal, stdout, stderr });
      });

      child.stdin.write(commandText);
      child.stdin.end();
    });
  }

  /**
   * 1. POST /api/molecules/validate-bundle
   * Validates either Single Enriched SDF or All Three Files (.sdf + -names.lst + .thm).
   */
  app.post('/api/molecules/validate-bundle', authenticateUser, (req, res) => {
    try {
      const { mode = 'single_sdf', rootName = 'molecules', sdfContent = '', namesLstContent = '', thmContent = '' } = req.body || {};
      const result = validateMoleculeBundle({
        mode,
        rootName,
        sdfText: sdfContent,
        namesLstText: namesLstContent,
        thmText: thmContent
      });
      return res.json({
        success: result.valid,
        mode: result.mode,
        rootName: result.rootName,
        moleculeNames: result.moleculeNames,
        summary: result.summary,
        warnings: result.warnings,
        errors: result.errors,
        hasAltNames: Boolean(result.namesLst && result.namesLst.trim()),
        hasThermo: Boolean(result.thm && result.thm.trim())
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 2. POST /api/molecules/store-bundle
   * Atomically executes:
   *   Pass 1: Read SDF -> SemiEmpirical -> Store Molecules
   *   Pass 2 (if alt names present): Write -names.lst & auto-generated -names.mol -> ASCII -> Store
   *   Pass 3 (if thermo present): Write .thm & auto-generated .mol -> Chemkin Read -> Store/Fill -> Store Molecules
   */
  app.post('/api/molecules/store-bundle', authenticateUser, async (req, res) => {
    const uid = req.user.uid;
    const isAdmin = Boolean(req.user.isAdmin);
    const {
      mode = 'single_sdf',
      rootName: rawRoot = 'molecules',
      sdfContent = '',
      namesLstContent = '',
      thmContent = '',
      sessionId = 'default_session'
    } = req.body || {};

    const rootName = sanitizeDirToken(rawRoot, 'molecules');
    const validated = validateMoleculeBundle({
      mode,
      rootName,
      sdfText: sdfContent,
      namesLstText: namesLstContent,
      thmText: thmContent
    });

    if (!validated.valid) {
      return res.status(400).json({
        success: false,
        error: validated.errors.join('; '),
        errors: validated.errors,
        warnings: validated.warnings
      });
    }

    const scopeCtx = resolveScopeContext(req);
    setActiveJobScope(uid, {
      viewScope: scopeCtx.viewScope,
      writeScope: scopeCtx.writeScope,
      isAdmin
    });

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);
    await hydrateUserWorkspace(uid, workspaceDir);
    const initialFiles = new Set(fs.readdirSync(workspaceDir));
    const logs = [];
    const passResults = {};

    try {
      const ipcSecret = process.env.REACT_IPC_SECRET || '';

      // Pass 1: Store SDF Molecules
      fs.writeFileSync(path.join(workspaceDir, `${rootName}.sdf`), validated.cleanSdf, 'utf8');
      const sdfCommands = [
        'Mol', 'Parameters', 'RootMolName', 'Input', 'StandardMeta', 'Quit', 'Quit',
        'MetaAtoms', 'Read', 'Quit', 'Quit',
        'CreateOpenClose', 'Initialize', 'Quit',
        'Mol', 'Parameters', 'MolOutName', 'Input', `${rootName}_out`, 'Quit',
        'RootMolName', 'Input', rootName, 'Quit',
        'MolDirectory', 'Input', '.', 'Quit', 'Quit',
        'Read', 'Molecules', 'SDF', 'Quit', 'Quit',
        'Calculations', 'Molecules', 'SemiEmpirical', 'Quit', 'Quit',
        'Output', 'Molecules', 'Print', 'Quit', 'Quit', 'Quit',
        'DbaseOps', 'Molecules', 'Current', 'Store', 'Quit', 'Quit', 'Quit',
        'Quit', 'Quit', 'Quit'
      ];
      const pass1 = await runChemdbPass(workspaceDir, sdfCommands, { uid, ipcSecret });
      passResults.sdf = { exitCode: pass1.exitCode, ok: pass1.exitCode === 0 };
      logs.push('=== PASS 1: STORE SDF MOLECULES ===\n' + pass1.stdout + (pass1.stderr ? `\nSTDERR:\n${pass1.stderr}` : ''));

      if (pass1.exitCode !== 0) {
        fs.writeFileSync(path.join(workspaceDir, 'execution.log'), logs.join('\n\n'), 'utf8');
        await persistUserWorkspace(uid, sessionId, workspaceDir, jobId, {
          accessMode: 'db-modifying',
          jobCategory: 'catalog_store',
          isReadOnly: false,
          status: 'FAILED'
        }, [], { root: rootName, targetItem: rootName, inputFile: `${rootName}.sdf` }, initialFiles).catch(() => {});
        cleanupWorkspace(workspaceDir);
        return res.status(500).json({
          success: false,
          jobId,
          error: 'Pass 1 (SDF Molecule Store) failed.',
          passResults,
          output: logs.join('\n\n')
        });
      }

      // Pass 2: Store Alternative Names (-names.lst + auto-generated -names.mol)
      if (validated.namesLst && validated.namesLst.trim() && validated.namesMol && validated.namesMol.trim()) {
        fs.writeFileSync(path.join(workspaceDir, `${rootName}-names.lst`), validated.namesLst, 'utf8');
        fs.writeFileSync(path.join(workspaceDir, `${rootName}-names.mol`), validated.namesMol, 'utf8');
        const namesCommands = [
          'CreateOpenClose', 'Initialize', 'Quit',
          'DbaseOps', 'Parameters', 'DBDataDirectory', 'Input', '.', 'Quit', 'Quit',
          'Molecules', 'Parameters', 'DBDataMolRoot', 'Input', `${rootName}-names`, 'Quit', 'Quit',
          'Current', 'ASCII', 'Store', 'Quit',
          'Quit', 'Quit', 'Quit'
        ];
        const pass2 = await runChemdbPass(workspaceDir, namesCommands, { uid, ipcSecret });
        passResults.alternativeNames = { exitCode: pass2.exitCode, ok: pass2.exitCode === 0 };
        logs.push('=== PASS 2: STORE ALTERNATIVE NAMES (-names.lst, auto-generated -names.mol) ===\n' + pass2.stdout + (pass2.stderr ? `\nSTDERR:\n${pass2.stderr}` : ''));
      }

      // Pass 3: Store CHEMKIN / NASA Thermodynamics (.thm + auto-generated .mol)
      if (validated.thm && validated.thm.trim() && validated.molList && validated.molList.trim()) {
        fs.writeFileSync(path.join(workspaceDir, `${rootName}.thm`), validated.thm, 'utf8');
        fs.writeFileSync(path.join(workspaceDir, `${rootName}.mol`), validated.molList, 'utf8');
        const thermoCommands = [
          'Mol', 'Parameters', 'RootMolName', 'Input', 'StandardMeta', 'Quit', 'Quit',
          'MetaAtoms', 'Read', 'Quit', 'Quit',
          'CreateOpenClose', 'Initialize', 'Quit',
          'DbaseOps', 'Parameters', 'DBDataDirectory', 'Input', '.', 'Quit', 'Quit',
          'Molecules', 'Parameters', 'DBDataMolRoot', 'Input', rootName, 'Quit', 'Quit',
          'Current', 'ReadInCurrent', 'Quit', 'Quit', 'Quit',
          'Tables', 'Parameters', 'TablesDataDirectory', 'Input', '.', 'Quit',
          'TablesOutputDirectory', 'Input', '.', 'Quit', 'Quit',
          'Chemkin', 'Parameters', 'TablesDataChemkinRoot', 'Input', rootName, 'Quit', 'Quit',
          'Read', 'Quit', 'Quit',
          'DbaseOps', 'Chemkin', 'Store', 'Fill', 'Quit', 'Quit',
          'DbaseOps', 'Molecules', 'Current', 'Store', 'Quit', 'Quit', 'Quit',
          'DbaseOps', 'Chemkin', 'Store', 'Quit', 'Quit',
          'Quit'
        ];
        const pass3 = await runChemdbPass(workspaceDir, thermoCommands, { uid, ipcSecret });
        passResults.thermodynamics = { exitCode: pass3.exitCode, ok: pass3.exitCode === 0 };
        logs.push('=== PASS 3: STORE NASA/CHEMKIN THERMODYNAMICS (.thm, auto-generated .mol) ===\n' + pass3.stdout + (pass3.stderr ? `\nSTDERR:\n${pass3.stderr}` : ''));
      }

      const fullOutput = logs.join('\n\n');
      fs.writeFileSync(path.join(workspaceDir, 'execution.log'), fullOutput, 'utf8');

      const allOk = Object.values(passResults).every(p => p.ok);
      await persistUserWorkspace(uid, sessionId, workspaceDir, jobId, {
        accessMode: 'db-modifying',
        jobCategory: 'catalog_store',
        isReadOnly: false,
        status: allOk ? 'SUCCESS' : 'FAILED'
      }, [], { root: rootName, targetItem: rootName, inputFile: `${rootName}.sdf` }, initialFiles).catch(() => {});

      cleanupWorkspace(workspaceDir);

      return res.json({
        success: allOk,
        jobId,
        exitCode: allOk ? 0 : 1,
        rootName,
        mode,
        summary: validated.summary,
        warnings: validated.warnings,
        passResults,
        output: fullOutput
      });
    } catch (err) {
      cleanupWorkspace(workspaceDir);
      return res.status(500).json({ success: false, jobId, error: err.message });
    }
  });

  /**
   * Helper: Read all collections + indices for a single namespace UID
   */
  async function readNamespaceSnapshot(targetUid, requestedCollections) {
    const allowed = Array.isArray(requestedCollections) && requestedCollections.length > 0
      ? DUMP_COLLECTIONS.filter(c => requestedCollections.includes(c.key))
      : DUMP_COLLECTIONS;

    const collections = {};
    const counts = {};

    for (const col of allowed) {
      const records = [];
      let snap;
      if (col.type === 'custom') {
        snap = await firestore.collection('users').doc(targetUid).collection(col.collectionName).get();
      } else {
        snap = await firestore.collection('users').doc(targetUid).collection('databases').doc(col.dbKey).collection('records').get();
      }
      for (const doc of snap.docs) {
        records.push({ _docId: doc.id, ...doc.data() });
      }
      collections[col.key] = records;
      counts[col.key] = records.length;
    }

    // Also capture ObjectIDClasses & SearchKeys for lossless JSON restore
    const objectIDClasses = [];
    try {
      const idxSnap = await firestore.collection('users').doc(targetUid)
        .collection('sessions').doc('default_session').collection('objectIDClasses').get();
      for (const doc of idxSnap.docs) {
        objectIDClasses.push({ _docId: doc.id, ...doc.data() });
      }
    } catch (_) {}

    const searchKeys = {};
    for (const dbKey of ['Molecules', 'Substructures', 'ReactionPatterns', 'Reactions']) {
      try {
        const skSnap = await firestore.collection('users').doc(targetUid)
          .collection('databases').doc(dbKey).collection('searchKeys').get();
        if (!skSnap.empty) {
          searchKeys[dbKey] = skSnap.docs.map(d => ({ _docId: d.id, ...d.data() }));
        }
      } catch (_) {}
    }

    return { collections, counts, objectIDClasses, searchKeys };
  }

  /**
   * Helper: Write a Scientific ASCII dump directory mirroring standard REACT input layout
   * - Molecules grouped by isomers (Hill molecular formula) under mol/molsdf/
   * - Other object types grouped by category under standard subdirectories
   */
  function writeScientificAsciiDump(rootDir, snapshot) {
    const writtenFiles = [];
    const writeRel = (relPath, content) => {
      const fullPath = path.join(rootDir, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
      writtenFiles.push(relPath);
    };

    // 1. Molecules -> mol/molsdf/<formula>.sdf + <formula>-names.lst + <formula>.thm (grouped by isomers)
    const mols = snapshot.collections.Molecules || [];
    const molGroups = new Map();
    for (const m of mols) {
      const formula = computeMolecularFormulaFromRecord(m);
      if (!molGroups.has(formula)) molGroups.set(formula, []);
      molGroups.get(formula).push(m);
    }
    for (const [formula, group] of molGroups.entries()) {
      const sdfBlocks = [];
      const altLstLines = [`1 ${formula}`];
      let hasAlt = false;
      const thmBlocks = [];

      for (const m of group) {
        const name = m.Name || m.name || m._docId;
        const id = m.ID !== undefined ? m.ID : m._docId;
        sdfBlocks.push(buildV2000SdfBlock(name, id, m, { includeEnrichedBlocks: true }));

        const alts = extractAltNamesFromMolRecord(m);
        if (alts.length > 0) {
          hasAlt = true;
          altLstLines.push(name);
          for (const a of alts) {
            altLstLines.push(`- AlternativeNames ${a.type} ${a.value}`);
          }
        }
        if (m.nasaThermo && typeof m.nasaThermo === 'string' && m.nasaThermo.trim()) {
          thmBlocks.push(m.nasaThermo.trim());
        }
      }
      writeRel(path.join('mol', 'molsdf', `${formula}.sdf`), sdfBlocks.join('\n') + '\n');
      if (hasAlt) {
        writeRel(path.join('mol', 'molsdf', `${formula}-names.lst`), altLstLines.join('\n') + '\n');
      }
      if (thmBlocks.length > 0) {
        writeRel(
          path.join('mol', 'molsdf', `${formula}.thm`),
          `THERMO\n   300.000  1000.000  5000.000\n${thmBlocks.join('\n')}\nEND\n`
        );
      }
    }

    // 2. Substructures -> mol/subs/<category>.sdf
    const subs = snapshot.collections.Substructures || [];
    const subGroups = new Map();
    for (const s of subs) {
      const name = s.Name || s.name || s._docId;
      const cat = deriveCategoryGroup(name, 'Substructures');
      if (!subGroups.has(cat)) subGroups.set(cat, []);
      subGroups.get(cat).push(s);
    }
    for (const [cat, group] of subGroups.entries()) {
      const blocks = group.map(s => buildV2000SdfBlock(s.Name || s.name || s._docId, s.ID ?? s._docId, s));
      writeRel(path.join('mol', 'subs', `${cat}.sdf`), blocks.join('\n') + '\n');
    }

    // 3. ReactionPatterns -> rxn/rxnpats/<category>.lst (raw lstContent if present, else canonical JSON)
    const pats = snapshot.collections.ReactionPatterns || [];
    const patGroups = new Map();
    for (const p of pats) {
      const name = p.Name || p.name || p._docId;
      const cat = deriveCategoryGroup(name, 'ReactionPatterns');
      if (!patGroups.has(cat)) patGroups.set(cat, []);
      patGroups.get(cat).push(p);
    }
    for (const [cat, group] of patGroups.entries()) {
      const hasLst = group.some(p => typeof p.lstContent === 'string' && p.lstContent.trim());
      if (hasLst) {
        const content = group.map(p => p.lstContent || JSON.stringify(p, null, 2)).join('\n\n');
        writeRel(path.join('rxn', 'rxnpats', `${cat}.lst`), content + '\n');
      } else {
        writeRel(path.join('rxn', 'rxnpats', `${cat}.json`), JSON.stringify(group, null, 2) + '\n');
      }
    }

    // 4. Reactions -> rxn/rxns/<category>.json
    const rxns = snapshot.collections.Reactions || [];
    if (rxns.length > 0) {
      const rxnGroups = new Map();
      for (const r of rxns) {
        const cat = deriveCategoryGroup(r.Name || r.name || r._docId, 'Reactions');
        if (!rxnGroups.has(cat)) rxnGroups.set(cat, []);
        rxnGroups.get(cat).push(r);
      }
      for (const [cat, group] of rxnGroups.entries()) {
        writeRel(path.join('rxn', 'rxns', `${cat}.json`), JSON.stringify(group, null, 2) + '\n');
      }
    }

    // 5. Thermodynamics / BensonTables -> thermo/benson/<name>.json
    for (const t of [...(snapshot.collections.Thermodynamics || []), ...(snapshot.collections.BensonTables || [])]) {
      const name = sanitizeDirToken(t.Name || t.name || t._docId, 'thermo');
      writeRel(path.join('thermo', 'benson', `${name}.json`), JSON.stringify(t, null, 2) + '\n');
    }

    // 6. MechanismPathway -> mech/pathways/<group>/<name>.lsr
    for (const pw of (snapshot.collections.MechanismPathway || [])) {
      const name = sanitizeDirToken(pw.Name || pw.name || pw._docId, 'pathway');
      const grp = deriveCategoryGroup(name, 'Pathways');
      const content = (typeof pw.lsrContent === 'string' && pw.lsrContent.trim())
        ? pw.lsrContent
        : JSON.stringify(pw, null, 2);
      const ext = (typeof pw.lsrContent === 'string' && pw.lsrContent.trim()) ? '.lsr' : '.json';
      writeRel(path.join('mech', 'pathways', grp, `${name}${ext}`), content + '\n');
    }

    // 7. MechanismPathSet -> mech/pathsets/<name>.json
    for (const ps of (snapshot.collections.MechanismPathSet || [])) {
      const name = sanitizeDirToken(ps.Name || ps.name || ps._docId, 'pathset');
      writeRel(path.join('mech', 'pathsets', `${name}.json`), JSON.stringify(ps, null, 2) + '\n');
    }

    // 8. RxnMechanism -> mech/mechanisms/<molecule>/<name>.json
    for (const mech of (snapshot.collections.RxnMechanism || [])) {
      const name = sanitizeDirToken(mech.Name || mech.mechName || mech._docId, 'mechanism');
      const mol = sanitizeDirToken(mech.molecule || deriveCategoryGroup(name, 'Mechanisms'), 'Mechanisms');
      writeRel(path.join('mech', 'mechanisms', mol, `${name}.json`), JSON.stringify(mech, null, 2) + '\n');
    }

    return writtenFiles;
  }

  /**
   * 3. POST /api/admin/db-dump
   * Regular user: personal scope only.
   * Admin user: system, personal, or both.
   */
  app.post('/api/admin/db-dump', authenticateUser, async (req, res) => {
    const uid = req.user.uid;
    const isAdmin = Boolean(req.user.isAdmin);
    const {
      format = 'json',            // 'json' | 'ascii'
      destination = 'download',   // 'download' | 'firestore_storage' | 'both'
      scope: requestedScope,      // 'personal' | 'system' | 'both'
      topDirectory = '',
      collections: requestedCollections = []
    } = req.body || {};

    // Enforce scope rules: non-admins can ONLY dump personal
    const effectiveScope = isAdmin
      ? (['system', 'personal', 'both'].includes(requestedScope) ? requestedScope : 'both')
      : 'personal';

    const scopeCtx = resolveScopeContext(req);
    const scopesToDump = [];
    if (effectiveScope === 'system' || effectiveScope === 'both') {
      scopesToDump.push({ scopeLabel: 'system', targetUid: scopeCtx.systemUid });
    }
    if (effectiveScope === 'personal' || effectiveScope === 'both') {
      scopesToDump.push({ scopeLabel: 'personal', targetUid: scopeCtx.personalUid });
    }

    const timestampTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const topDirName = sanitizeDirToken(topDirectory || `reactcloud_${format}_${effectiveScope}_${timestampTag}`);
    const tmpBase = path.join('/tmp', 'reactcloud', 'dumps', `${uid}_${Date.now()}`);
    const dumpRoot = path.join(tmpBase, topDirName);
    fs.mkdirSync(dumpRoot, { recursive: true });

    try {
      const manifest = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        createdBy: uid,
        format,
        scope: effectiveScope,
        topDirectory: topDirName,
        scopes: {}
      };

      const allFiles = [];

      for (const sc of scopesToDump) {
        const snapshot = await readNamespaceSnapshot(sc.targetUid, requestedCollections);
        const scopeDir = scopesToDump.length > 1 ? path.join(dumpRoot, sc.scopeLabel) : dumpRoot;
        fs.mkdirSync(scopeDir, { recursive: true });

        manifest.scopes[sc.scopeLabel] = {
          targetUid: sc.targetUid,
          counts: snapshot.counts,
          objectIDClassesCount: snapshot.objectIDClasses.length
        };

        if (format === 'json') {
          for (const [colKey, records] of Object.entries(snapshot.collections)) {
            const rel = path.join(scopesToDump.length > 1 ? sc.scopeLabel : '', `${colKey}.json`);
            fs.writeFileSync(path.join(dumpRoot, rel), JSON.stringify(records, null, 2) + '\n', 'utf8');
            allFiles.push(rel);
          }
          const idxRel = path.join(scopesToDump.length > 1 ? sc.scopeLabel : '', 'ObjectIDClasses.json');
          fs.writeFileSync(path.join(dumpRoot, idxRel), JSON.stringify(snapshot.objectIDClasses, null, 2) + '\n', 'utf8');
          allFiles.push(idxRel);

          const skRel = path.join(scopesToDump.length > 1 ? sc.scopeLabel : '', 'SearchKeys.json');
          fs.writeFileSync(path.join(dumpRoot, skRel), JSON.stringify(snapshot.searchKeys, null, 2) + '\n', 'utf8');
          allFiles.push(skRel);
        } else {
          const asciiFiles = writeScientificAsciiDump(scopeDir, snapshot);
          for (const f of asciiFiles) {
            allFiles.push(scopesToDump.length > 1 ? path.join(sc.scopeLabel, f) : f);
          }
        }
      }

      fs.writeFileSync(path.join(dumpRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      allFiles.push('manifest.json');

      const zipFilename = `${topDirName}.zip`;
      const zipPath = path.join(tmpBase, zipFilename);
      execFileSync('zip', ['-r', '-q', zipPath, topDirName], { cwd: tmpBase });

      let gcsBackupInfo = null;
      if (destination === 'firestore_storage' || destination === 'both') {
        const bucket = storage.bucket(BUCKET_NAME);
        const backupId = `backup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const gcsPrefix = `users/${uid}/backups/${topDirName}`;
        const gcsZipPath = `${gcsPrefix}/${zipFilename}`;
        const gcsManifestPath = `${gcsPrefix}/manifest.json`;

        await bucket.upload(zipPath, { destination: gcsZipPath });
        await bucket.upload(path.join(dumpRoot, 'manifest.json'), { destination: gcsManifestPath });

        // Also upload individual JSON files when format === 'json' for direct cloud recovery
        if (format === 'json') {
          for (const rel of allFiles) {
            if (rel === 'manifest.json') continue;
            await bucket.upload(path.join(dumpRoot, rel), {
              destination: `${gcsPrefix}/${rel.replace(/\\/g, '/')}`
            });
          }
        }

        const downloadUrl = (await getSignedDownloadUrl(BUCKET_NAME, gcsZipPath).catch(() => null))
          || buildLogContentUrl(`gs://${BUCKET_NAME}/${gcsZipPath}`);

        const backupDoc = {
          backupId,
          topDirectory: topDirName,
          format,
          scope: effectiveScope,
          createdAt: manifest.createdAt,
          createdBy: uid,
          gcsPrefix: `gs://${BUCKET_NAME}/${gcsPrefix}`,
          gcsZipPath: `gs://${BUCKET_NAME}/${gcsZipPath}`,
          zipFilename,
          downloadUrl,
          sizeBytes: fs.statSync(zipPath).size,
          fileCount: allFiles.length,
          scopes: manifest.scopes
        };

        await firestore.collection('users').doc(uid).collection('backups').doc(backupId).set(backupDoc);
        gcsBackupInfo = backupDoc;
      }

      if (destination === 'download') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
        const stream = fs.createReadStream(zipPath);
        stream.on('close', () => fs.rmSync(tmpBase, { recursive: true, force: true }));
        return stream.pipe(res);
      }

      fs.rmSync(tmpBase, { recursive: true, force: true });
      return res.json({
        success: true,
        backup: gcsBackupInfo,
        manifest,
        fileCount: allFiles.length
      });
    } catch (err) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
      console.error('[DB Dump Error]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 4. GET /api/admin/db-backups
   * Lists saved backups in Firestore/GCS Storage for the authenticated user.
   */
  app.get('/api/admin/db-backups', authenticateUser, async (req, res) => {
    try {
      const uid = req.user.uid;
      const snap = await firestore.collection('users').doc(uid).collection('backups').get();
      const backups = snap.docs.map(d => ({ backupId: d.id, ...d.data() }));
      backups.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json({ success: true, backups });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Helper: Load JSON snapshot payload either from inline JSON files map or from a saved GCS backupId
   */
  async function loadRecoverySnapshot({ uid, backupId, sourceScope = 'personal', filesPayload }) {
    if (filesPayload && typeof filesPayload === 'object') {
      return filesPayload;
    }
    if (!backupId) {
      throw new Error('Must provide either backupId (from Cloud Storage) or uploaded JSON files.');
    }
    const backupDoc = await firestore.collection('users').doc(uid).collection('backups').doc(backupId).get();
    if (!backupDoc.exists) {
      throw new Error(`Backup '${backupId}' not found.`);
    }
    const meta = backupDoc.data();
    if (meta.format !== 'json') {
      throw new Error('Only Canonical JSON backups can be directly recovered via Firestore restore. Use Read-Check-Store for Scientific ASCII files.');
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const rawPrefix = String(meta.gcsPrefix || '').replace(`gs://${BUCKET_NAME}/`, '').replace(/\/$/, '');
    const multiScope = meta.scope === 'both';
    const subPrefix = multiScope ? `${rawPrefix}/${sourceScope}` : rawPrefix;

    const collections = {};
    for (const col of DUMP_COLLECTIONS) {
      const file = bucket.file(`${subPrefix}/${col.key}.json`);
      const [exists] = await file.exists();
      if (exists) {
        const [buf] = await file.download();
        collections[col.key] = JSON.parse(buf.toString('utf8'));
      }
    }

    let objectIDClasses = [];
    const idxFile = bucket.file(`${subPrefix}/ObjectIDClasses.json`);
    if ((await idxFile.exists())[0]) {
      const [buf] = await idxFile.download();
      objectIDClasses = JSON.parse(buf.toString('utf8'));
    }

    let searchKeys = {};
    const skFile = bucket.file(`${subPrefix}/SearchKeys.json`);
    if ((await skFile.exists())[0]) {
      const [buf] = await skFile.download();
      searchKeys = JSON.parse(buf.toString('utf8'));
    }

    return { collections, objectIDClasses, searchKeys };
  }

  /**
   * 5. POST /api/admin/db-recover/preview
   * Dry-run comparison showing new vs existing/overwritten record counts per collection.
   */
  app.post('/api/admin/db-recover/preview', authenticateUser, async (req, res) => {
    try {
      const uid = req.user.uid;
      const isAdmin = Boolean(req.user.isAdmin);
      const { targetScope = 'personal', sourceScope = 'personal', backupId, filesPayload } = req.body || {};

      if (targetScope === 'system' && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Only administrators can recover into the System database.' });
      }

      const scopeCtx = resolveScopeContext(req);
      const targetUid = targetScope === 'system' ? scopeCtx.systemUid : scopeCtx.personalUid;

      const snapshot = await loadRecoverySnapshot({ uid, backupId, sourceScope, filesPayload });
      const preview = [];

      for (const col of DUMP_COLLECTIONS) {
        const incoming = snapshot.collections?.[col.key];
        if (!Array.isArray(incoming)) continue;

        let existingSnap;
        if (col.type === 'custom') {
          existingSnap = await firestore.collection('users').doc(targetUid).collection(col.collectionName).get();
        } else {
          existingSnap = await firestore.collection('users').doc(targetUid).collection('databases').doc(col.dbKey).collection('records').get();
        }
        const existingIds = new Set(existingSnap.docs.map(d => d.id));

        let newCount = 0;
        let existingCount = 0;
        for (const rec of incoming) {
          const docId = String(rec._docId || rec.ID || rec.Name || rec.name || '');
          if (docId && existingIds.has(docId)) existingCount++;
          else newCount++;
        }

        preview.push({
          collection: col.key,
          label: col.label,
          incomingCount: incoming.length,
          newCount,
          existingCount,
          existingTotalInScope: existingIds.size
        });
      }

      return res.json({
        success: true,
        targetScope,
        targetUid,
        preview,
        objectIDClassesCount: Array.isArray(snapshot.objectIDClasses) ? snapshot.objectIDClasses.length : 0
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 6. POST /api/admin/db-recover/execute
   * Restores collections + indices using 'merge' (upsert) or 'replace' (clean wipe + load).
   */
  app.post('/api/admin/db-recover/execute', authenticateUser, async (req, res) => {
    try {
      const uid = req.user.uid;
      const isAdmin = Boolean(req.user.isAdmin);
      const {
        targetScope = 'personal',
        sourceScope = 'personal',
        restoreMode = 'merge', // 'merge' | 'replace'
        backupId,
        filesPayload,
        selectedCollections = []
      } = req.body || {};

      if (targetScope === 'system' && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Only administrators can recover into the System database.' });
      }

      const scopeCtx = resolveScopeContext(req);
      const targetUid = targetScope === 'system' ? scopeCtx.systemUid : scopeCtx.personalUid;

      const snapshot = await loadRecoverySnapshot({ uid, backupId, sourceScope, filesPayload });
      const results = [];

      for (const col of DUMP_COLLECTIONS) {
        if (selectedCollections.length > 0 && !selectedCollections.includes(col.key)) continue;
        const incoming = snapshot.collections?.[col.key];
        if (!Array.isArray(incoming)) continue;

        const colRef = col.type === 'custom'
          ? firestore.collection('users').doc(targetUid).collection(col.collectionName)
          : firestore.collection('users').doc(targetUid).collection('databases').doc(col.dbKey).collection('records');

        let deletedCount = 0;
        if (restoreMode === 'replace') {
          const existingSnap = await colRef.get();
          for (const d of existingSnap.docs) {
            await d.ref.delete();
            deletedCount++;
          }
        }

        let writtenCount = 0;
        for (const rec of incoming) {
          const docId = String(rec._docId || rec.ID || rec.Name || rec.name || `rec_${Date.now()}_${writtenCount}`);
          const payload = { ...rec };
          delete payload._docId;
          await colRef.doc(docId).set(payload, { merge: restoreMode === 'merge' });
          writtenCount++;
        }

        results.push({ collection: col.key, deletedCount, writtenCount });
      }

      // Restore ObjectIDClasses if present
      let restoredIndices = 0;
      if (Array.isArray(snapshot.objectIDClasses)) {
        const idxCol = firestore.collection('users').doc(targetUid)
          .collection('sessions').doc('default_session').collection('objectIDClasses');
        if (restoreMode === 'replace') {
          const snap = await idxCol.get();
          for (const d of snap.docs) await d.ref.delete();
        }
        for (const idxDoc of snapshot.objectIDClasses) {
          const docId = String(idxDoc._docId || idxDoc.Name || `idx_${restoredIndices}`);
          const payload = { ...idxDoc };
          delete payload._docId;
          await idxCol.doc(docId).set(payload, { merge: restoreMode === 'merge' });
          restoredIndices++;
        }
      }

      // Restore SearchKeys if present
      if (snapshot.searchKeys && typeof snapshot.searchKeys === 'object') {
        for (const [dbKey, skDocs] of Object.entries(snapshot.searchKeys)) {
          if (!Array.isArray(skDocs)) continue;
          const skCol = firestore.collection('users').doc(targetUid)
            .collection('databases').doc(dbKey).collection('searchKeys');
          if (restoreMode === 'replace') {
            const snap = await skCol.get();
            for (const d of snap.docs) await d.ref.delete();
          }
          for (const sk of skDocs) {
            const docId = String(sk._docId || '0');
            const payload = { ...sk };
            delete payload._docId;
            await skCol.doc(docId).set(payload, { merge: restoreMode === 'merge' });
          }
        }
      }

      return res.json({
        success: true,
        targetScope,
        restoreMode,
        results,
        restoredIndices
      });
    } catch (err) {
      console.error('[DB Recover Error]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}

module.exports = { setupDbBackupAndMoleculeBundleRoutes };
