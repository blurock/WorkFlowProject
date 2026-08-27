const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');

const PORT = process.env.PORT || 8085;
const PROJECT_ID = process.env.GCP_PROJECT || 'blurock-database';
const BUCKET_NAME = process.env.GCS_BUCKET || `${PROJECT_ID}.appspot.com`;
const REACTROOT = process.env.REACTROOT || path.resolve(__dirname, '..');
const CHEMDB_BIN = process.env.CHEMDB_BIN || path.join(REACTROOT, 'bin', 'chemdb');

// Initialize Firebase Admin SDK if service account or default credentials available
let firebaseInitialized = false;
try {
  admin.initializeApp({
    projectId: PROJECT_ID
  });
  firebaseInitialized = true;
  console.log(`[Orchestrator] Firebase Admin SDK initialized for project: ${PROJECT_ID}`);
} catch (err) {
  console.warn(`[Orchestrator] Firebase Admin initialized in mock/fallback mode: ${err.message}`);
}

const storage = new Storage({ projectId: PROJECT_ID });
const firestore = new Firestore({ projectId: PROJECT_ID });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// GDBM Database Files managed per user
const DB_FILES = [
  'BensonTables.dbf',
  'ChemkinThermo.dbf',
  'Molecules.dbf',
  'ReactionPatterns.dbf',
  'Reactions.dbf',
  'RxnMechanism.dbf',
  'SubStructures.dbf'
];

/**
 * Authentication Middleware
 * Validates Firebase ID Token from Authorization header.
 * Falls back to local dev user if running in development mode.
 */
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    
    // Check for dev token fallback
    if (token.startsWith('reactcloud-bearer-token') || token === 'demo-token') {
      const match = token.match(/reactcloud-bearer-token-(.+)/);
      const rawSlug = match && match[1] ? match[1].replace(/[^a-zA-Z0-9_-]/g, '_') : 'default';
      req.user = {
        uid: rawSlug,
        email: `${rawSlug}@reactcloud.org`,
        name: `REACT User (${rawSlug})`
      };
      return next();
    }

    if (firebaseInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || 'user@reactcloud.org',
          name: decodedToken.name || decodedToken.email || 'REACT User'
        };
        return next();
      } catch (authErr) {
        console.error('[Orchestrator Auth Error]', authErr.message);
        return res.status(401).json({ error: 'Unauthorized: Invalid Firebase Auth Token' });
      }
    }
  }

  // Fallback for unauthenticated requests in local dev
  req.user = {
    uid: 'user_anonymous',
    email: 'anon@reactcloud.org',
    name: 'Anonymous User'
  };
  return next();
}

/**
 * Fast User DB Cache & Parallel Hydration Strategy
 * Uses local user session disk cache (/tmp/reactcloud/users/{uid}/cache/)
 * to achieve sub-second execution speeds.
 */
async function hydrateUserWorkspace(uid, workspaceDir) {
  fs.mkdirSync(workspaceDir, { recursive: true });

  // 1. Symlink system assets (elements.xml, command, data, basis, ffield)
  const systemItems = ['elements.xml', 'command', 'data', 'basis', 'ffield'];
  for (const item of systemItems) {
    const target = path.join(REACTROOT, item);
    const linkPath = path.join(workspaceDir, item);
    if (fs.existsSync(target) && !fs.existsSync(linkPath)) {
      try { fs.symlinkSync(target, linkPath); } catch (e) {}
    }
  }

  // 2. User session cache directory: /tmp/reactcloud/users/{uid}/cache/
  const userCacheDir = path.join('/tmp', 'reactcloud', 'users', uid, 'cache');
  fs.mkdirSync(userCacheDir, { recursive: true });

  const bucket = storage.bucket(BUCKET_NAME);

  // 3. Process DB files in parallel (Promise.all)
  await Promise.all(DB_FILES.map(async (dbFile) => {
    const cachedPath = path.join(userCacheDir, dbFile);
    const localPath = path.join(workspaceDir, dbFile);

    // Cache Hit: If cached locally in session, copy instantly (1ms)
    if (fs.existsSync(cachedPath)) {
      fs.copyFileSync(cachedPath, localPath);
      return;
    }

    // Cache Miss: Parallel download from GCS or copy from system default seed
    const gcsPath = `users/${uid}/databases/${dbFile}`;
    try {
      const file = bucket.file(gcsPath);
      let [exists] = await file.exists();
      const seedPath = path.join(REACTROOT, 'data', 'DB', dbFile);

      if (exists) {
        await file.download({ destination: cachedPath });
        console.log(`[GCS Sync] Downloaded ${dbFile} from ${gcsPath}`);

        // Check if downloaded DB file is uninitialized/empty (< 20KB while seed is > 30KB)
        if (fs.existsSync(cachedPath) && fs.existsSync(seedPath)) {
          const stats = fs.statSync(cachedPath);
          const seedStats = fs.statSync(seedPath);
          if (stats.size < 20000 && seedStats.size > 30000) {
            console.log(`[GCS Re-Seed] DB file ${dbFile} was uninitialized (${stats.size} bytes). Re-seeding from system default (${seedPath})`);
            fs.copyFileSync(seedPath, cachedPath);
            bucket.upload(cachedPath, { destination: gcsPath }).then(() => {
              console.log(`[GCS Re-Seed Uploaded] ${dbFile} uploaded to ${gcsPath}`);
            }).catch((err) => {
              console.warn(`[GCS Upload Warning] ${dbFile}: ${err.message}`);
            });
          }
        }
      } else {
        // Does not exist in GCS yet: Initialize from system default seed and upload to Cloud Storage for this user
        if (fs.existsSync(seedPath)) {
          fs.copyFileSync(seedPath, cachedPath);
          console.log(`[GCS Seed] Initialized ${dbFile} for user ${uid} from system default seed`);
          bucket.upload(cachedPath, { destination: gcsPath }).then(() => {
            console.log(`[GCS Seed Uploaded] ${dbFile} uploaded to ${gcsPath}`);
          }).catch((err) => {
            console.warn(`[GCS Upload Warning] ${dbFile}: ${err.message}`);
          });
        }
      }

      if (fs.existsSync(cachedPath)) {
        fs.copyFileSync(cachedPath, localPath);
      }
    } catch (err) {
      console.warn(`[GCS Sync Warning] Failed to sync ${dbFile}: ${err.message}`);
    }
  }));

  // 4. Overlay user custom data files from session cache (/tmp/reactcloud/users/{uid}/cache/data/)
  const userCacheDataDir = path.join(userCacheDir, 'data');
  if (fs.existsSync(userCacheDataDir)) {
    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
          copyRecursive(path.join(src, child), path.join(dest, child));
        }
      } else {
        if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    };
    const workspaceDataDir = path.join(workspaceDir, 'data');
    if (fs.existsSync(workspaceDataDir) && fs.lstatSync(workspaceDataDir).isSymbolicLink()) {
      try { fs.unlinkSync(workspaceDataDir); } catch(e) {}
      fs.mkdirSync(workspaceDataDir, { recursive: true });
    }
    copyRecursive(userCacheDataDir, workspaceDataDir);
  }
}

/**
 * Fast Parallel Persistence Sync
 * Skip DB re-upload if job is read-only (e.g. printing catalogs/lists)
 */
async function persistUserWorkspace(uid, workspaceDir, jobId, isReadOnly = true) {
  const userCacheDir = path.join('/tmp', 'reactcloud', 'users', uid, 'cache');
  const bucket = storage.bucket(BUCKET_NAME);

  // 1. If database files were modified (write job), sync to cache and GCS in parallel
  if (!isReadOnly) {
    await Promise.all(DB_FILES.map(async (dbFile) => {
      const localPath = path.join(workspaceDir, dbFile);
      if (fs.existsSync(localPath)) {
        const cachedPath = path.join(userCacheDir, dbFile);
        fs.copyFileSync(localPath, cachedPath);

        const gcsPath = `users/${uid}/databases/${dbFile}`;
        try {
          await bucket.upload(localPath, { destination: gcsPath });
          console.log(`[GCS Upload] Synced ${dbFile} back to ${gcsPath}`);
        } catch (err) {
          console.warn(`[GCS Upload Error] ${dbFile}: ${err.message}`);
        }
      }
    }));
  }

  // 2. Upload job output artifacts in parallel
  const outputFiles = fs.readdirSync(workspaceDir).filter(f => !DB_FILES.includes(f) && !['elements.xml', 'command', 'data', 'basis', 'ffield'].includes(f));
  const artifactPaths = [];

  await Promise.all(outputFiles.map(async (file) => {
    const filePath = path.join(workspaceDir, file);
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const gcsPath = `users/${uid}/jobs/${jobId}/artifacts/${file}`;
        await bucket.upload(filePath, { destination: gcsPath });
        artifactPaths.push(`gs://${BUCKET_NAME}/${gcsPath}`);
      }
    } catch (err) {
      console.warn(`[GCS Artifact Upload Error] ${file}: ${err.message}`);
    }
  }));

  // 3. Record Firestore Job Document
  try {
    const jobDoc = firestore.collection('users').doc(uid).collection('jobs').doc(jobId);
    await jobDoc.set({
      jobId,
      userId: uid,
      timestamp: new Date().toISOString(),
      artifacts: artifactPaths
    }, { merge: true });
  } catch (err) {}
}

/**
 * Cleanup Ephemeral Workspace
 */
function cleanupWorkspace(workspaceDir) {
  try {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
    console.log(`[Teardown] Purged ephemeral workspace: ${workspaceDir}`);
  } catch (err) {
    console.warn(`[Teardown Warning] Failed to clean ${workspaceDir}: ${err.message}`);
  }
}

// Root API Overview and Status Page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>REACTCLOUD API Service</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
          .container { max-width: 650px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
          h1 { color: #38bdf8; font-size: 1.8rem; margin-top: 0; }
          .badge { display: inline-block; background: #22c55e; color: #000; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; }
          code { background: #0f172a; padding: 3px 8px; border-radius: 4px; color: #38bdf8; }
          ul { line-height: 1.8; }
          a { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>REACTCLOUD Orchestrator API <span class="badge">ONLINE</span></h1>
          <p>Cloud-native Chemistry Engine & Session Manager for REACTInterface.</p>
          <ul>
            <li><strong>Project:</strong> <code>${PROJECT_ID}</code></li>
            <li><strong>Storage Bucket:</strong> <code>${BUCKET_NAME}</code></li>
            <li><strong>Health Endpoint:</strong> <a href="/api/health"><code>GET /api/health</code></a></li>
            <li><strong>Input Runner:</strong> <code>POST /api/run-input</code></li>
            <li><strong>Command Stream Runner:</strong> <code>POST /api/run-commands</code></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Quiet handle favicon.ico request
app.get('/favicon.ico', (req, res) => res.status(204).end());

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    backend: 'REACTCLOUD Orchestrator',
    project: PROJECT_ID,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/upload-data-files', authenticateUser, async (req, res) => {
  const { targetDir, files } = req.body;
  const uid = req.user.uid;

  if (!targetDir || !files || !Array.isArray(files)) {
    return res.status(400).json({ error: 'Invalid payload: targetDir and files array required' });
  }

  const userCacheDir = path.join('/tmp', 'reactcloud', 'users', uid, 'cache');
  const userCacheTargetDir = path.join(userCacheDir, 'data', targetDir);
  fs.mkdirSync(userCacheTargetDir, { recursive: true });

  const bucket = storage.bucket(BUCKET_NAME);
  const uploadedResults = [];

  for (const f of files) {
    if (!f.filename || f.content === undefined) continue;

    const localPath = path.join(userCacheTargetDir, f.filename);
    fs.writeFileSync(localPath, f.content);

    const relGcsPath = `users/${uid}/data/${targetDir}/${f.filename}`;
    try {
      await bucket.upload(localPath, { destination: relGcsPath });
      console.log(`[Data Upload] Saved ${f.filename} to Cloud Storage: ${relGcsPath}`);
      uploadedResults.push({ filename: f.filename, gcsPath: `gs://${BUCKET_NAME}/${relGcsPath}` });
    } catch (err) {
      console.warn(`[GCS Data Upload Warning] ${f.filename}: ${err.message}`);
      uploadedResults.push({ filename: f.filename, localOnly: true, warning: err.message });
    }

    // Auto-create matching companion .mol and .sdf files if missing to prevent chemdb RECOVER file missing errors
    if (f.filename.endsWith('.lst')) {
      const rootBase = f.filename.replace(/\.lst$/, '');
      const companionMol = `${rootBase}.mol`;
      const companionSdf = `${rootBase}.sdf`;
      
      const molLocalPath = path.join(userCacheTargetDir, companionMol);
      if (!fs.existsSync(molLocalPath)) {
        fs.writeFileSync(molLocalPath, `1 ${rootBase}\n`);
        const molGcsPath = `users/${uid}/data/${targetDir}/${companionMol}`;
        bucket.upload(molLocalPath, { destination: molGcsPath }).catch(() => {});
      }

      const sdfLocalPath = path.join(userCacheTargetDir, companionSdf);
      if (!fs.existsSync(sdfLocalPath)) {
        fs.writeFileSync(sdfLocalPath, `${rootBase}\n  -OEChem-\n\n  0  0  0     0  0  0  0  0  0999 V2000\nM  END\n$$$$\n`);
        const sdfGcsPath = `users/${uid}/data/${targetDir}/${companionSdf}`;
        bucket.upload(sdfLocalPath, { destination: sdfLocalPath }).catch(() => {});
      }
    }
  }

  return res.json({ success: true, targetDir, files: uploadedResults });
});

app.post('/api/run-input', authenticateUser, async (req, res) => {
  const { inputFile, root, replacements } = req.body;
  const uid = req.user.uid;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);

  const startTime = Date.now();
  console.log(`[Job Start] ${jobId} for User ${uid}`);

  try {
    await hydrateUserWorkspace(uid, workspaceDir);

    // Locate or copy template input file
    let inpContent = '';
    const templatePath = path.join(REACTROOT, 'programs', 'inputs', inputFile);
    if (fs.existsSync(templatePath)) {
      inpContent = fs.readFileSync(templatePath, 'utf-8');
    } else {
      inpContent = `Print Instance\nExit\n`;
    }

    // Apply replacements if supplied
    if (replacements && typeof replacements === 'object') {
      for (const [key, val] of Object.entries(replacements)) {
        inpContent = inpContent.replaceAll(key, val);
      }
    }

    const jobInpFile = path.join(workspaceDir, 'run.inp');
    fs.writeFileSync(jobInpFile, inpContent);

    // Execute chemdb binary inside workspace
    let stdout = '';
    let stderr = '';

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');

    const child = spawn(CHEMDB_BIN, [root || 'test', '0', commandDir, staticFile], {
      cwd: workspaceDir,
      env: { ...process.env, REACTROOT, CCROOT: REACTROOT, REACT_USER_ID: uid, GCS_BUCKET: BUCKET_NAME }
    });

    child.stdin.write(inpContent);
    child.stdin.end();

    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });

    child.on('close', exitCode => {
      const elapsed = Date.now() - startTime;
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms with exit code ${exitCode}`);

      // Read any generated .ans or .out detail output files (e.g. MASTER.ans, molecule.ans)
      let combinedOutput = stdout;
      try {
        const detailFiles = fs.readdirSync(workspaceDir).filter(f => f.endsWith('.ans') || f.endsWith('.out'));
        for (const df of detailFiles) {
          if (df === 'run.inp' || df === 'test.inp') continue;
          const dfPath = path.join(workspaceDir, df);
          const dfContent = fs.readFileSync(dfPath, 'utf8');
          if (dfContent && dfContent.trim()) {
            combinedOutput += `\n${dfContent}`;
          }
        }
      } catch (e) {
        console.warn(`[Detail File Read Warning] ${e.message}`);
      }

      // Return HTTP response immediately for sub-second UI response
      res.json({
        jobId,
        inputFile,
        root: root || 'ROOT',
        exitCode,
        output: combinedOutput,
        error: stderr,
        elapsedMs: elapsed
      });

      // Async background persistence & cleanup
      const isReadOnly = inputFile.startsWith('Print') || inputFile.includes('List');
      persistUserWorkspace(uid, workspaceDir, jobId, isReadOnly)
        .catch(err => console.warn(`[GCS Persist Warning] ${err.message}`))
        .finally(() => cleanupWorkspace(workspaceDir));
    });
  } catch (err) {
    cleanupWorkspace(workspaceDir);
    console.error(`[Job Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/run-commands', authenticateUser, async (req, res) => {
  const { commands, root } = req.body;
  const uid = req.user.uid;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);

  const startTime = Date.now();

  try {
    await hydrateUserWorkspace(uid, workspaceDir);

    const commandText = Array.isArray(commands) ? commands.join('\n') : (commands || '');
    const jobInpFile = path.join(workspaceDir, 'run.inp');
    fs.writeFileSync(jobInpFile, commandText);

    // If querying item details (e.g. 1-butanal, AlkoxyDecomp, or PropaneCombinedMech), create xxx.mol, xxx.rxn, xxx.lst, mech.lst, MASTER.lst, and ${targetItemName}.lst
    const targetItemName = (req.body.targetItem || root || '').trim();
    if (targetItemName && targetItemName !== 'test' && targetItemName !== 'job1') {
      fs.writeFileSync(path.join(workspaceDir, 'xxx.mol'), `${targetItemName}\n`);
      fs.writeFileSync(path.join(workspaceDir, 'xxx.rxn'), `RxnPatternList\n${targetItemName}\n`);
      fs.writeFileSync(path.join(workspaceDir, 'xxx.lst'), `${targetItemName}\n`);
      fs.writeFileSync(path.join(workspaceDir, 'mech.lst'), `${targetItemName}\n`);
      fs.writeFileSync(path.join(workspaceDir, 'MASTER.lst'), `${targetItemName}\n`);
      fs.writeFileSync(path.join(workspaceDir, `${targetItemName}.lst`), `${targetItemName}\n`);
    }

    let stdout = '';
    let stderr = '';

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');

    const child = spawn(CHEMDB_BIN, [root || 'test', '0', commandDir, staticFile], {
      cwd: workspaceDir,
      env: { ...process.env, REACTROOT, CCROOT: REACTROOT, REACT_USER_ID: uid, GCS_BUCKET: BUCKET_NAME }
    });

    child.stdin.write(commandText);
    child.stdin.end();

    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });

    child.on('close', exitCode => {
      const elapsed = Date.now() - startTime;
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms`);

      // Read any generated detail output files (.ans, .out, .mech, .sdf, .thm, .corrs)
      let combinedOutput = '';
      try {
        const detailFiles = fs.readdirSync(workspaceDir).filter(f =>
          f.endsWith('.ans') || f.endsWith('.out') || f.endsWith('.mech') || f.endsWith('.sdf') || f.endsWith('.thm') || f.endsWith('.corrs')
        );
        for (const df of detailFiles) {
          if (df === 'run.inp' || df === 'test.inp' || df === 'mech.lst' || df === 'xxx.lst' || df === 'xxx.mol' || df === 'xxx.rxn') continue;
          const dfPath = path.join(workspaceDir, df);
          const dfContent = fs.readFileSync(dfPath, 'utf8');
          if (dfContent && dfContent.trim()) {
            let sectionTitle = '';
            if (df.endsWith('.mech')) sectionTitle = 'Mechanism Reactions';
            else if (df.endsWith('.thm')) sectionTitle = 'Molecule Thermodynamics';
            else if (df.endsWith('.sdf')) sectionTitle = 'Molecule Structures';
            else if (df.endsWith('.corrs')) sectionTitle = 'Name Correspondences';

            if (sectionTitle) {
              combinedOutput += `--- ${sectionTitle} ---\n` + dfContent + '\n\n';
            } else {
              combinedOutput += dfContent + '\n\n';
            }
          }
        }
      } catch (e) {
        console.warn(`[Detail File Read Warning] ${e.message}`);
      }

      combinedOutput += `--- Execution Log ---\n` + stdout;

      // Return HTTP response immediately for sub-second UI response
      res.json({
        jobId,
        root: root || 'ROOT',
        exitCode,
        output: combinedOutput,
        error: stderr,
        elapsedMs: elapsed
      });

      // Async background persistence & cleanup
      const hasWriteOps = commandText.includes('Store') || commandText.includes('Write') || commandText.includes('Fill');
      const isReadOnly = req.body.isReadOnly !== undefined ? Boolean(req.body.isReadOnly) : !hasWriteOps;
      persistUserWorkspace(uid, workspaceDir, jobId, isReadOnly)
        .catch(err => console.warn(`[GCS Persist Warning] ${err.message}`))
        .finally(() => cleanupWorkspace(workspaceDir));
    });
  } catch (err) {
    cleanupWorkspace(workspaceDir);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Database Storage APIs (Phase 1 Firestore Integration)
 * Allows REACT C backend and frontend services to store and retrieve
 * database records directly as JSON documents in Firestore.
 */
app.post('/api/db/store', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName, key, keyId, jsonStr } = req.body;
    if (!dbName || !key) {
      return res.status(400).json({ error: 'Missing required parameters: dbName, key' });
    }

    const docPath = `users/${uid}/databases/${dbName}/records/${key}`;
    const docRef = firestore.doc(docPath);

    let parsedData = jsonStr;
    if (typeof jsonStr === 'string') {
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = { rawString: jsonStr };
      }
    }

    const recordDoc = {
      key: String(key),
      keyId: Number(keyId || 0),
      dbName: String(dbName),
      updatedAt: new Date().toISOString(),
      ...(typeof parsedData === 'object' && parsedData !== null ? parsedData : { data: parsedData })
    };

    await docRef.set(recordDoc, { merge: true });
    console.log(`[Firestore DB Store] Saved record: ${docPath}`);
    return res.json({ status: 'OK', path: docPath });
  } catch (err) {
    console.error('[Firestore DB Store Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/fetch', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName, key } = req.body;
    if (!dbName || !key) {
      return res.status(400).json({ error: 'Missing required parameters: dbName, key' });
    }

    const docPath = `users/${uid}/databases/${dbName}/records/${key}`;
    const docRef = firestore.doc(docPath);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.json({ found: false, dbName, key });
    }

    const data = docSnap.data();
    return res.json({
      found: true,
      dbName,
      key,
      keyId: data.keyId || data.ID || 0,
      data: data,
      updatedAt: data.updatedAt
    });
  } catch (err) {
    console.error('[Firestore DB Fetch Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});


app.get('/api/db/keys', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName } = req.query;
    if (!dbName) {
      return res.status(400).json({ error: 'Missing required query parameter: dbName' });
    }

    const colPath = `users/${uid}/databases/${dbName}/records`;
    const colSnap = await firestore.collection(colPath).get();
    const keys = colSnap.docs.map(doc => doc.id);

    return res.json({ dbName, count: keys.length, keys });
  } catch (err) {
    console.error('[Firestore DB Keys Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {

  console.log(`================================───────────────────`);
  console.log(`REACTCLOUD High-Performance Orchestrator running on port ${PORT}`);
  console.log(`User Disk Cache enabled at: /tmp/reactcloud/users/<uid>/cache/`);
  console.log(`GCP Project: ${PROJECT_ID}`);
  console.log(`================================───────────────────`);
});
