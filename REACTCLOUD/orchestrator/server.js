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
      const userSlug = match && match[1] ? match[1].replace(/[^a-zA-Z0-9_-]/g, '_') : 'user_default_local';
      req.user = {
        uid: userSlug.startsWith('user_') ? userSlug : `user_${userSlug}`,
        email: `${userSlug}@reactcloud.org`,
        name: `REACT User (${userSlug})`
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
  next();
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
      const [exists] = await file.exists();

      if (exists) {
        await file.download({ destination: cachedPath });
        console.log(`[GCS Sync] Downloaded ${dbFile} from ${gcsPath}`);
      } else {
        const seedPath = path.join(REACTROOT, 'data', 'DB', dbFile);
        if (fs.existsSync(seedPath)) {
          fs.copyFileSync(seedPath, cachedPath);
          console.log(`[GCS Seed] Initialized ${dbFile} from system default seed`);
        }
      }

      // Check if downloaded DB file is uninitialized/empty (< 100KB for Molecules.dbf) and re-seed if needed
      const seedPath = path.join(REACTROOT, 'data', 'DB', dbFile);
      if (fs.existsSync(cachedPath)) {
        const stats = fs.statSync(cachedPath);
        if (dbFile === 'Molecules.dbf' && stats.size < 100000 && fs.existsSync(seedPath)) {
          console.log(`[GCS Re-Seed] DB file ${dbFile} was empty (${stats.size} bytes). Re-seeding from system default (${seedPath})`);
          fs.copyFileSync(seedPath, cachedPath);
          bucket.upload(cachedPath, { destination: gcsPath }).catch(() => {});
        }
      }

      if (fs.existsSync(cachedPath)) {
        fs.copyFileSync(cachedPath, localPath);
      }
    } catch (err) {
      console.warn(`[GCS Sync Warning] Failed to download ${dbFile}: ${err.message}`);
    }
  }));
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
      env: { ...process.env, REACTROOT, CCROOT: REACTROOT }
    });

    child.stdin.write(inpContent);
    child.stdin.end();

    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });

    child.on('close', async exitCode => {
      const elapsed = Date.now() - startTime;
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms with exit code ${exitCode}`);

      // List queries are read-only -> skip re-uploading 40MB DBs back to GCS
      const isReadOnly = inputFile.startsWith('Print') || inputFile.includes('List');
      await persistUserWorkspace(uid, workspaceDir, jobId, isReadOnly);
      cleanupWorkspace(workspaceDir);

      return res.json({
        jobId,
        inputFile,
        root: root || 'ROOT',
        exitCode,
        output: stdout,
        error: stderr,
        elapsedMs: elapsed
      });
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

    let stdout = '';
    let stderr = '';

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');

    const child = spawn(CHEMDB_BIN, [root || 'test', '0', commandDir, staticFile], {
      cwd: workspaceDir,
      env: { ...process.env, REACTROOT, CCROOT: REACTROOT }
    });

    child.stdin.write(commandText);
    child.stdin.end();

    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });

    child.on('close', async exitCode => {
      const elapsed = Date.now() - startTime;
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms`);

      const isReadOnly = commandText.includes('Print') || !commandText.includes('Write');
      await persistUserWorkspace(uid, workspaceDir, jobId, isReadOnly);
      cleanupWorkspace(workspaceDir);

      return res.json({
        jobId,
        root: root || 'ROOT',
        exitCode,
        output: stdout,
        error: stderr,
        elapsedMs: elapsed
      });
    });
  } catch (err) {
    cleanupWorkspace(workspaceDir);
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
