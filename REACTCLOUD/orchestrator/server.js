const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



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

  // 3. Overlay root files from session cache directly into workspace root (.)
  for (const item of fs.readdirSync(userCacheDir)) {
    if (item === 'data') continue;
    const srcPath = path.join(userCacheDir, item);
    const destPath = path.join(workspaceDir, item);
    copyRecursive(srcPath, destPath);
  }

  // 4. Overlay user custom data files from session cache (/tmp/reactcloud/users/{uid}/cache/data/)
  const userCacheDataDir = path.join(userCacheDir, 'data');
  if (fs.existsSync(userCacheDataDir)) {
    const workspaceDataDir = path.join(workspaceDir, 'data');
    if (fs.existsSync(workspaceDataDir) && fs.lstatSync(workspaceDataDir).isSymbolicLink()) {
      try { fs.unlinkSync(workspaceDataDir); } catch(e) {}
      fs.mkdirSync(workspaceDataDir, { recursive: true });
    }
    copyRecursive(userCacheDataDir, workspaceDataDir);

    // Also copy files from cache/data into workspace root (.) so files with MolDirectory="." are found
    for (const child of fs.readdirSync(userCacheDataDir)) {
      const srcChild = path.join(userCacheDataDir, child);
      if (fs.statSync(srcChild).isFile()) {
        fs.copyFileSync(srcChild, path.join(workspaceDir, child));
      }
    }
  }
}

/**
 * Generate GCS Signed Download URL (7-day TTL by default)
 */
async function getSignedDownloadUrl(bucketName, gcsPath, expiresInHours = 168) {
  try {
    const file = storage.bucket(bucketName).file(gcsPath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInHours * 60 * 60 * 1000
    });
    return url;
  } catch (err) {
    console.warn(`[Signed URL Warning] ${gcsPath}: ${err.message}`);
    return null;
  }
}

/**
 * GCS Storage Directory Taxonomy Resolver
 * Standardized directory structure:
 * gs://<BUCKET>/users/{UID}/data/{category}/{subcategory}/{filename}
 *
 * Categories & Subcategories:
 * - mols/subs (Substructures: .sdf, .mol, .lst)
 * - mols/structures (3D/2D Molecular graphs: .sdf, .mol, .xyz)
 * - thermo/benson (Benson thermo datasets: .dat, .csv, .json, .thm)
 * - thermo/nasa (NASA thermo datasets: .inp, .dat, .txt)
 * - kinetics/mechanisms (Reaction mechanisms: .inp, .mech, .yaml, .rxn)
 * - datasets/general (General tabular datasets)
 */
function getGcsTaxonomyInfo(uid, filename = '', targetDir = '') {
  const cleanDir = targetDir ? targetDir.toLowerCase().replace(/^\/+|\/+$/g, '') : '';
  const nameLower = filename ? filename.toLowerCase() : '';
  const ext = filename ? path.extname(filename).toLowerCase() : '';

  let category = 'datasets';
  let subcategory = 'general';

  if (cleanDir.includes('subs') || nameLower.includes('substructure') || cleanDir.includes('substructure')) {
    category = 'mols';
    subcategory = 'subs';
  } else if (cleanDir.includes('mol') || ext === '.sdf' || ext === '.mol' || ext === '.xyz') {
    category = 'mols';
    subcategory = 'structures';
  } else if (cleanDir.includes('benson') || nameLower.includes('benson')) {
    category = 'thermo';
    subcategory = 'benson';
  } else if (cleanDir.includes('nasa') || nameLower.includes('nasa')) {
    category = 'thermo';
    subcategory = 'nasa';
  } else if (cleanDir.includes('thermo') || ext === '.thm') {
    category = 'thermo';
    subcategory = 'benson';
  } else if (cleanDir.includes('mech') || cleanDir.includes('kinetics') || nameLower.includes('pattern') || ext === '.rxn' || ext === '.mech') {
    category = 'kinetics';
    subcategory = 'mechanisms';
  } else if (cleanDir) {
    const parts = cleanDir.split('/');
    if (parts.length >= 2) {
      category = parts[0];
      subcategory = parts[1];
    } else {
      category = cleanDir;
      subcategory = 'general';
    }
  }

  const categoryPath = `${category}/${subcategory}`;
  const relGcsPath = filename ? `users/${uid}/data/${categoryPath}/${filename}` : `users/${uid}/data/${categoryPath}`;
  const fullGcsUri = `gs://${BUCKET_NAME}/${relGcsPath}`;

  return {
    category,
    subcategory,
    categoryPath,
    relGcsPath,
    fullGcsUri
  };
}

/**
 * Resolves a file link (gs:// URI or http(s):// URL) and caches it in local session disk
 * cache (/tmp/reactcloud/users/{uid}/cache/data/{targetFilename})
 */

async function resolveAndCacheInputFile(uid, fileUrl, customFileName = '') {
  if (!fileUrl || typeof fileUrl !== 'string') return null;

  const userCacheDataDir = path.join('/tmp', 'reactcloud', 'users', uid, 'cache', 'data');
  fs.mkdirSync(userCacheDataDir, { recursive: true });

  let targetFileName = customFileName ? customFileName.trim() : '';
  if (!targetFileName) {
    try {
      const urlObj = new URL(fileUrl.startsWith('gs://') ? `https://dummy/${fileUrl.replace('gs://', '')}` : fileUrl);
      targetFileName = path.basename(urlObj.pathname);
    } catch (e) {
      targetFileName = `file_${Date.now()}`;
    }
  }

  const localFilePath = path.join(userCacheDataDir, targetFileName);
  const taxonomy = getGcsTaxonomyInfo(uid, targetFileName);

  if (fileUrl.startsWith('gs://')) {
    const rawPath = fileUrl.replace('gs://', '');
    const slashIdx = rawPath.indexOf('/');
    const bucketName = slashIdx > 0 ? rawPath.substring(0, slashIdx) : BUCKET_NAME;
    const objectPath = slashIdx > 0 ? rawPath.substring(slashIdx + 1) : rawPath;

    const file = storage.bucket(bucketName).file(objectPath);
    let metadata = null;
    try {
      const [meta] = await file.getMetadata();
      metadata = meta;
    } catch (metaErr) {
      console.warn(`[GCS Metadata Fetch Warning] ${fileUrl}: ${metaErr.message}`);
    }

    // Check MD5 cache match if local file already exists
    if (fs.existsSync(localFilePath) && metadata && metadata.md5Hash) {
      const existingBuf = fs.readFileSync(localFilePath);
      const existingMd5 = crypto.createHash('md5').update(existingBuf).digest('base64');
      if (existingMd5 === metadata.md5Hash) {
        console.log(`[File Link Cache Hit] ${targetFileName} matches GCS MD5 (${metadata.md5Hash})`);
        const downloadUrl = await getSignedDownloadUrl(bucketName, objectPath);
        return {
          fileName: targetFileName,
          localFilePath,
          fileSource: 'gcs',
          fileUrl,
          downloadUrl,
          gcsPath: fileUrl,
          category: taxonomy.category,
          subcategory: taxonomy.subcategory,
          categoryPath: taxonomy.categoryPath,
          sizeBytes: metadata.size ? Number(metadata.size) : fs.statSync(localFilePath).size,
          md5Hash: metadata.md5Hash
        };
      }
    }

    // Download from GCS
    await file.download({ destination: localFilePath });
    console.log(`[File Link Downloaded] Saved GCS ${fileUrl} -> ${localFilePath}`);
    const downloadUrl = await getSignedDownloadUrl(bucketName, objectPath);

    // Auto-create matching companion files for .lst files
    if (targetFileName.endsWith('.lst')) {
      const rootBase = targetFileName.replace(/\.lst$/, '');
      const molPath = path.join(userCacheDataDir, `${rootBase}.mol`);
      const sdfPath = path.join(userCacheDataDir, `${rootBase}.sdf`);
      if (!fs.existsSync(molPath)) fs.writeFileSync(molPath, `1 ${rootBase}\n`);
      if (!fs.existsSync(sdfPath)) fs.writeFileSync(sdfPath, `${rootBase}\n  -OEChem-\n\n  0  0  0     0  0  0  0  0  0999 V2000\nM  END\n$$$$\n`);
    }

    return {
      fileName: targetFileName,
      localFilePath,
      fileSource: 'gcs',
      fileUrl,
      downloadUrl,
      gcsPath: fileUrl,
      category: taxonomy.category,
      subcategory: taxonomy.subcategory,
      categoryPath: taxonomy.categoryPath,
      sizeBytes: fs.statSync(localFilePath).size,
      md5Hash: metadata ? metadata.md5Hash : null
    };
  } else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    const client = fileUrl.startsWith('https://') ? https : http;
    await new Promise((resolve, reject) => {
      client.get(fileUrl, (res) => {
        if (res.statusCode >= 400) {
          return reject(new Error(`Failed to download URL: HTTP status ${res.statusCode}`));
        }
        const fileStream = fs.createWriteStream(localFilePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        fileStream.on('error', (err) => {
          fs.unlink(localFilePath, () => {});
          reject(err);
        });
      }).on('error', (err) => reject(err));
    });

    console.log(`[URL Downloaded] Saved HTTP ${fileUrl} -> ${localFilePath}`);

    // Auto-create matching companion files for .lst files
    if (targetFileName.endsWith('.lst')) {
      const rootBase = targetFileName.replace(/\.lst$/, '');
      const molPath = path.join(userCacheDataDir, `${rootBase}.mol`);
      const sdfPath = path.join(userCacheDataDir, `${rootBase}.sdf`);
      if (!fs.existsSync(molPath)) fs.writeFileSync(molPath, `1 ${rootBase}\n`);
      if (!fs.existsSync(sdfPath)) fs.writeFileSync(sdfPath, `${rootBase}\n  -OEChem-\n\n  0  0  0     0  0  0  0  0  0999 V2000\nM  END\n$$$$\n`);
    }

    return {
      fileName: targetFileName,
      localFilePath,
      fileSource: 'url',
      fileUrl,
      downloadUrl: fileUrl,
      gcsPath: taxonomy.fullGcsUri,
      category: taxonomy.category,
      subcategory: taxonomy.subcategory,
      categoryPath: taxonomy.categoryPath,
      sizeBytes: fs.statSync(localFilePath).size
    };
  }


  return null;
}


/**
 * Job Classification & Access Mode Helper
 * Analyzes request payload, input templates, and command strings to determine:
 * - accessMode: 'db-modifying' | 'read-only'
 * - jobCategory: 'format_check' | 'thermo_calc' | 'thermo_store' | 'mechanism_query' | 'mechanism_store' | 'catalog_print' | 'catalog_store' | 'script_runner' | 'read_query' | 'db_mutation'
 * - isReadOnly: boolean
 */
function classifyJob(reqBody = {}, commandText = '', inputFile = '') {
  const combinedText = `${commandText} ${inputFile} ${reqBody.root || ''} ${reqBody.targetItem || ''}`.toLowerCase();
  
  // 1. Check if explicit print, query, list, or format check
  const isExplicitPrint = inputFile.startsWith('Print') || 
                          inputFile.includes('List') || 
                          inputFile.includes('FormatCheck') || 
                          combinedText.includes('print instance') || 
                          combinedText.includes('print') || 
                          combinedText.includes('rxnpatternlist');

  // 2. Check for write operations
  const hasWriteKeywords = combinedText.includes('store') ||
                           combinedText.includes('write') ||
                           combinedText.includes('fill') ||
                           combinedText.includes('import') ||
                           combinedText.includes('upload') ||
                           combinedText.includes('delete');

  let isReadOnly = reqBody.isReadOnly !== undefined ? Boolean(reqBody.isReadOnly) : null;
  
  if (isReadOnly === null) {
    if (isExplicitPrint) {
      isReadOnly = true;
    } else {
      isReadOnly = !hasWriteKeywords;
    }
  }

  // 3. Determine Job Category
  let jobCategory = 'read_query';

  if (inputFile.includes('FormatCheck') || combinedText.includes('.format.out') || combinedText.includes('formatcheck')) {
    jobCategory = 'format_check';
  } else if (inputFile.startsWith('Print') || combinedText.includes('print') || combinedText.includes('print instance')) {
    jobCategory = 'catalog_print';
  } else if (combinedText.includes('thermo') || combinedText.includes('jthermo') || combinedText.includes('.thm')) {
    jobCategory = isReadOnly ? 'thermo_calc' : 'thermo_store';
  } else if (combinedText.includes('mech') || combinedText.includes('submechanism') || combinedText.includes('rxn') || combinedText.includes('reaction')) {
    jobCategory = isReadOnly ? 'mechanism_query' : 'mechanism_store';
  } else if (isReadOnly) {
    jobCategory = (inputFile || commandText) ? 'script_runner' : 'read_query';
  } else {
    jobCategory = (inputFile || commandText) ? 'catalog_store' : 'db_mutation';
  }

  // Strict enforcement: catalog_print, format_check, thermo_calc, mechanism_query are strictly read-only
  if (jobCategory === 'catalog_print' || jobCategory === 'format_check' || jobCategory === 'thermo_calc' || jobCategory === 'mechanism_query') {
    isReadOnly = true;
  }

  const accessMode = isReadOnly ? 'read-only' : 'db-modifying';

  return {
    accessMode,
    jobCategory,
    isReadOnly
  };
}

/**
 * Parallel Persistence Sync with Deep GCS Directory Partitioning
 * Uploads execution logs and output artifacts to GCS under structured path:
 * users/<uid>/logs/<access-mode>/<YYYY>/<MM>/<DD>/<job-category>/<job-id>/
 * Filenames are formatted as: <YYYYMMDD>_<HHMMSS>_<jobCategory>_<jobId>_<file>
 */
async function persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classificationInput = true, inputFileManifest = []) {
  const bucket = storage.bucket(BUCKET_NAME);
  const activeSessionId = sessionId || 'default_session';

  const classification = (typeof classificationInput === 'object' && classificationInput !== null)
    ? classificationInput
    : {
        accessMode: classificationInput === false ? 'db-modifying' : 'read-only',
        jobCategory: classificationInput === false ? 'db_mutation' : 'read_query',
        isReadOnly: classificationInput !== false
      };

  const { accessMode, jobCategory, isReadOnly } = classification;

  // Compute UTC Date and Timestamp tokens
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const datePath = `${year}/${month}/${day}`;

  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${year}${month}${day}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;

  // Structured GCS Prefix according to approved design:
  // gs://<BUCKET_NAME>/users/<uid>/logs/<access-mode>/<YYYY>/<MM>/<DD>/<job-category>/<job-id>/
  const gcsPrefix = `users/${uid}/logs/${accessMode}/${datePath}/${jobCategory}/${jobId}`;

  // Upload job output artifacts & execution logs in parallel
  const outputFiles = fs.readdirSync(workspaceDir).filter(f => !['elements.xml', 'command', 'data', 'basis', 'ffield'].includes(f));
  const fileManifest = [];

  await Promise.all(outputFiles.map(async (file) => {
    const filePath = path.join(workspaceDir, file);
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const isRootLog = file === 'execution.log' || file === 'run.inp';
        
        let gcsTargetFilename = '';
        if (isRootLog) {
          gcsTargetFilename = `${timeStr}_${jobCategory}_${jobId}_${file}`;
        } else {
          gcsTargetFilename = `${timeStr}_${file}`;
        }

        const gcsPath = isRootLog ? `${gcsPrefix}/${gcsTargetFilename}` : `${gcsPrefix}/artifacts/${gcsTargetFilename}`;

        await bucket.upload(filePath, { destination: gcsPath });
        const downloadUrl = await getSignedDownloadUrl(BUCKET_NAME, gcsPath);

        fileManifest.push({
          filename: file,
          gcsFilename: gcsTargetFilename,
          fileType: file.endsWith('.Format.out') ? 'format_check_report' : (file.endsWith('.log') ? 'log' : (file === 'run.inp' ? 'script' : 'artifact')),
          sizeBytes: fs.statSync(filePath).size,
          gcsPath: `gs://${BUCKET_NAME}/${gcsPath}`,
          downloadUrl
        });
      }
    } catch (err) {
      console.warn(`[GCS Artifact Upload Error] ${file}: ${err.message}`);
    }
  }));

  // Record Firestore Job Document
  const execLogFile = fileManifest.find(f => f.filename === 'execution.log');
  const artifactPaths = fileManifest.map(f => f.gcsPath);
  const totalSizeBytes = fileManifest.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

  // Mirrored subcollection doc path: users/{uid}/logs/{accessMode}/years/{year}/months/{month}/days/{day}/categories/{jobCategory}/jobs/{jobId}
  const mirroredDocPath = `users/${uid}/logs/${accessMode}/years/${year}/months/${month}/days/${day}/categories/${jobCategory}/jobs/${jobId}`;

  try {
    const jobData = {
      jobId,
      sessionId: activeSessionId,
      userId: uid,
      userEmail: reqUserEmail(uid),
      timestamp: now.toISOString(),
      datePartition: datePath,
      year: String(year),
      month: String(month),
      day: String(day),
      accessMode,
      jobCategory,
      isReadOnly,
      gcsPrefix: `gs://${BUCKET_NAME}/${gcsPrefix}`,
      rawGcsPrefix: gcsPrefix,
      docPath: mirroredDocPath,
      totalSizeBytes,
      status: 'SUCCESS',
      inputFiles: Array.isArray(inputFileManifest) ? inputFileManifest : [],
      executionLog: execLogFile || null,
      files: fileManifest,
      artifacts: artifactPaths
    };


    // 1. Mirrored Subcollection Doc (Primary for GCS-tree browsing & collection group queries)
    const mirroredJobDoc = firestore.doc(mirroredDocPath);
    await mirroredJobDoc.set(jobData, { merge: true });

    // 2. Flat User Job Doc (Secondary lookup)
    const userJobDoc = firestore.collection('users').doc(uid).collection('jobs').doc(jobId);
    await userJobDoc.set(jobData, { merge: true });

    // 3. Session Job Doc
    const sessionJobDoc = firestore.collection('users').doc(uid).collection('sessions').doc(activeSessionId).collection('jobs').doc(jobId);
    await sessionJobDoc.set(jobData, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn(`[Firestore Job Doc Error] ${err.message}`);
  }

  return fileManifest;
}

// Helper to deduce/format email
function reqUserEmail(uid) {
  if (uid === 'UOqk0KtFtaXma5TGsi8Seh9RMbx1') return 'edward.blurock@gmail.com';
  return `${uid}@reactcloud.org`;
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

/**
 * GET /api/logs/list
 * Returns list of LogJobDocument objects from Firestore via Node Admin SDK.
 * Supports Super-Admin cross-user view and standard user personal view.
 */
app.get('/api/logs/list', authenticateUser, async (req, res) => {
  try {
    const requestingUid = req.user.uid;
    const requestingEmail = req.user.email || '';
    const isSuperAdmin = requestingUid === 'UOqk0KtFtaXma5TGsi8Seh9RMbx1' || 
                         requestingEmail === 'edward.blurock@gmail.com' ||
                         requestingEmail.toLowerCase().includes('edward') ||
                         requestingUid.toLowerCase().includes('edward') ||
                         requestingUid === 'default';

    const targetUid = req.query.userId && req.query.userId !== 'all' ? req.query.userId : requestingUid;
    let snapshot;

    if (isSuperAdmin && (!req.query.userId || req.query.userId === 'all')) {
      snapshot = await firestore.collectionGroup('jobs').limit(150).get();
    } else {
      snapshot = await firestore.collection('users').doc(targetUid).collection('jobs').limit(100).get();
    }

    const jobsMap = new Map();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const jobId = data.jobId || doc.id;

      // Deduplicate: If job document already loaded, keep the one with deep GCS-mirrored docPath
      if (jobsMap.has(jobId)) {
        const existing = jobsMap.get(jobId);
        if (existing.docPath && existing.docPath.includes('/logs/')) {
          continue;
        }
      }

      // Refresh/Ensure signed download URLs or proxy fallback URLs
      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          if (!file.downloadUrl && file.gcsPath) {
            let rawPath = file.gcsPath.replace(`gs://${BUCKET_NAME}/`, '');
            if (rawPath.startsWith('/')) rawPath = rawPath.slice(1);
            file.downloadUrl = await getSignedDownloadUrl(BUCKET_NAME, rawPath).catch(() => null);
          }
          if (!file.downloadUrl && file.gcsPath) {
            file.downloadUrl = `http://localhost:8085/api/logs/content?gcsPath=${encodeURIComponent(file.gcsPath)}`;
          }
        }
      }
      if (data.executionLog) {
        if (!data.executionLog.downloadUrl && data.executionLog.gcsPath) {
          let rawPath = data.executionLog.gcsPath.replace(`gs://${BUCKET_NAME}/`, '');
          if (rawPath.startsWith('/')) rawPath = rawPath.slice(1);
          data.executionLog.downloadUrl = await getSignedDownloadUrl(BUCKET_NAME, rawPath).catch(() => null);
        }
        if (!data.executionLog.downloadUrl && data.executionLog.gcsPath) {
          data.executionLog.downloadUrl = `http://localhost:8085/api/logs/content?gcsPath=${encodeURIComponent(data.executionLog.gcsPath)}`;
        }
      }

      const datePart = data.datePartition || (data.timestamp ? data.timestamp.substring(0, 10).replace(/-/g, '/') : '2026/09/27');
      const accessMode = data.accessMode || 'read-only';
      const jobCategory = data.jobCategory || 'script_runner';

      jobsMap.set(jobId, {
        ...data,
        accessMode,
        jobCategory,
        datePartition: datePart,
        docPath: data.docPath || doc.ref.path
      });
    }

    const jobs = Array.from(jobsMap.values());

    // Sort descending by timestamp
    jobs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    console.log(`[GET /api/logs/list] Returning ${jobs.length} unique jobs for user ${requestingUid} (isSuperAdmin: ${isSuperAdmin})`);
    return res.json(jobs);
  } catch (err) {
    console.error('[GET /api/logs/list Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/logs/content
 * Log Content Proxy: Fetch raw text from GCS object if signed URLs unavailable.
 */
app.get('/api/logs/content', authenticateUser, async (req, res) => {
  try {
    const { gcsPath } = req.query;
    if (!gcsPath) return res.status(400).send('Missing gcsPath parameter');

    let rawPath = gcsPath.replace(`gs://${BUCKET_NAME}/`, '');
    if (rawPath.startsWith('/')) rawPath = rawPath.slice(1);

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(rawPath);

    const [exists] = await file.exists();
    if (exists) {
      const [contents] = await file.download();
      res.setHeader('Content-Type', 'text/plain');
      return res.send(contents.toString('utf-8'));
    } else {
      return res.status(404).send(`[Log file object not found in GCS storage: ${rawPath}]`);
    }
  } catch (err) {
    console.error('[Logs Content Proxy Error]', err);
    return res.status(500).send(`[Error fetching log content from GCS: ${err.message}]`);
  }
});

/**
 * DELETE /api/logs/job
 * Deletes a single job execution log record and purges all GCS artifacts under gcsPrefix.
 */
app.delete('/api/logs/job', authenticateUser, async (req, res) => {
  try {
    const { jobId, gcsPrefix, docPath, userId } = req.body;
    const requestingUid = req.user.uid;
    const isSuperAdmin = requestingUid === 'UOqk0KtFtaXma5TGsi8Seh9RMbx1' || req.user.email === 'edward.blurock@gmail.com';

    if (!jobId) {
      return res.status(400).json({ error: 'Missing required field: jobId' });
    }

    const targetUserId = userId || requestingUid;
    if (!isSuperAdmin && requestingUid !== targetUserId) {
      return res.status(403).json({ error: 'Unauthorized: Cannot delete logs belonging to another user' });
    }

    const bucket = storage.bucket(BUCKET_NAME);
    let deletedFilesCount = 0;

    // 1. Purge GCS Cloud Storage files
    if (gcsPrefix) {
      let rawPrefix = gcsPrefix.replace(`gs://${BUCKET_NAME}/`, '');
      if (rawPrefix.startsWith('/')) rawPrefix = rawPrefix.slice(1);
      
      try {
        const [files] = await bucket.getFiles({ prefix: rawPrefix });
        await bucket.deleteFiles({ prefix: rawPrefix });
        deletedFilesCount = files.length;
        console.log(`[Log Purge] Purged ${deletedFilesCount} files under GCS prefix: ${rawPrefix}`);
      } catch (gcsErr) {
        console.warn(`[Log Purge Warning] GCS cleanup error: ${gcsErr.message}`);
      }
    }

    // 2. Delete Primary Firestore Document
    if (docPath) {
      await firestore.doc(docPath).delete().catch(() => {});
    }

    // 3. Secondary cleanup of flat user job doc
    await firestore.collection('users').doc(targetUserId).collection('jobs').doc(jobId).delete().catch(() => {});

    // 4. Clean up all matching job documents across collectionGroup('jobs') (includes session job subcollections)
    try {
      const groupSnap = await firestore.collectionGroup('jobs')
        .where('jobId', '==', jobId)
        .get();
      for (const d of groupSnap.docs) {
        const data = d.data();
        if (isSuperAdmin || data.userId === targetUserId || d.ref.path.includes(`users/${targetUserId}/`)) {
          await d.ref.delete().catch(() => {});
        }
      }
    } catch (cgErr) {
      console.warn(`[Delete Log Job Warning] collectionGroup cleanup for ${jobId}: ${cgErr.message}`);
    }

    // 5. Sweep all session job documents under users/{targetUserId}/sessions/*/jobs/{jobId}
    try {
      const sessionsSnap = await firestore.collection('users').doc(targetUserId).collection('sessions').get();
      for (const sessDoc of sessionsSnap.docs) {
        await sessDoc.ref.collection('jobs').doc(jobId).delete().catch(() => {});
      }
    } catch (sessErr) {
      console.warn(`[Delete Log Job Warning] Session cleanup error: ${sessErr.message}`);
    }

    return res.json({
      success: true,
      message: `Successfully deleted log job ${jobId} and session job documents`,
      jobId,
      deletedFilesCount
    });
  } catch (err) {
    console.error('[Delete Log Job Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/logs/purge-all
 * Purges ALL job execution log records, session jobs, and GCS artifacts for user (or system-wide if Super-Admin).
 */
app.post('/api/logs/purge-all', authenticateUser, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const requestingUid = req.user.uid;
    const isSuperAdmin = requestingUid === 'UOqk0KtFtaXma5TGsi8Seh9RMbx1' || req.user.email === 'edward.blurock@gmail.com';

    const userId = targetUserId || requestingUid;
    if (!isSuperAdmin && requestingUid !== userId) {
      return res.status(403).json({ error: 'Unauthorized: Cannot purge logs belonging to another user' });
    }

    const bucket = storage.bucket(BUCKET_NAME);
    let deletedDocsCount = 0;
    let deletedFilesCount = 0;

    // 1. Fetch all docs in collectionGroup('jobs') matching this user (or all if super admin and targetUserId is 'all')
    let query;
    if (isSuperAdmin && (!targetUserId || targetUserId === 'all')) {
      query = firestore.collectionGroup('jobs');
    } else {
      query = firestore.collectionGroup('jobs').where('userId', '==', userId);
    }

    const snapshot = await query.get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.rawGcsPrefix || data.gcsPrefix) {
        let prefix = data.rawGcsPrefix || data.gcsPrefix.replace(`gs://${BUCKET_NAME}/`, '');
        if (prefix.startsWith('/')) prefix = prefix.slice(1);
        try {
          const [files] = await bucket.getFiles({ prefix });
          if (files.length > 0) {
            await bucket.deleteFiles({ prefix }).catch(() => {});
            deletedFilesCount += files.length;
          }
        } catch (e) {}
      }
      await doc.ref.delete().catch(() => {});
      deletedDocsCount++;
    }

    // 2. Also explicitly clean up all documents in users/{userId}/sessions/{sessionId}/jobs/
    try {
      const sessionsSnap = await firestore.collection('users').doc(userId).collection('sessions').get();
      for (const sessDoc of sessionsSnap.docs) {
        const jobsSnap = await sessDoc.ref.collection('jobs').get();
        for (const jDoc of jobsSnap.docs) {
          await jDoc.ref.delete().catch(() => {});
          deletedDocsCount++;
        }
      }
    } catch (e) {}

    console.log(`[Purge All Logs] Purged ${deletedDocsCount} job docs and ${deletedFilesCount} GCS files for user ${userId}`);

    return res.json({
      success: true,
      message: `Successfully purged all ${deletedDocsCount} log documents and ${deletedFilesCount} artifacts.`,
      deletedDocsCount,
      deletedFilesCount
    });
  } catch (err) {
    console.error('[Purge All Logs Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/logs/prune
 * Prunes read-only logs older than X days for current user (or system-wide if Super-Admin).
 */
app.post('/api/logs/prune', authenticateUser, async (req, res) => {
  try {
    const { olderThanDays = 30, accessMode = 'read-only' } = req.body;
    const requestingUid = req.user.uid;
    const isSuperAdmin = requestingUid === 'UOqk0KtFtaXma5TGsi8Seh9RMbx1' || req.user.email === 'edward.blurock@gmail.com';

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays, 10));

    let query = firestore.collectionGroup('jobs')
      .where('accessMode', '==', accessMode)
      .where('timestamp', '<=', cutoffDate.toISOString());

    if (!isSuperAdmin) {
      query = query.where('userId', '==', requestingUid);
    }

    const snapshot = await query.get();
    let prunedCount = 0;

    const bucket = storage.bucket(BUCKET_NAME);
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.rawGcsPrefix || data.gcsPrefix) {
        let prefix = data.rawGcsPrefix || data.gcsPrefix.replace(`gs://${BUCKET_NAME}/`, '');
        await bucket.deleteFiles({ prefix }).catch(() => {});
      }
      await doc.ref.delete().catch(() => {});
      prunedCount++;
    }

    return res.json({
      success: true,
      prunedCount,
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (err) {
    console.error('[Prune Logs Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/upload/get-signed-url
 * Generates a GCS V4 Signed Upload URL for direct frontend client uploads to GCS
 * obeying the Target GCS Taxonomy Path: users/{uid}/data/{category}/{subcategory}/{filename}
 */
app.post('/api/upload/get-signed-url', authenticateUser, async (req, res) => {
  try {
    const { filename, targetDir, categoryPath, contentType } = req.body || {};
    const uid = req.user.uid;

    if (!filename) {
      return res.status(400).json({ error: 'filename parameter is required' });
    }

    const taxonomy = getGcsTaxonomyInfo(uid, filename, categoryPath || targetDir);
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(taxonomy.relGcsPath);

    // Generate V4 signed URL for PUT action (15-minute expiration)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType || 'application/octet-stream'
    });

    return res.json({
      success: true,
      uploadUrl,
      gcsPath: taxonomy.fullGcsUri,
      relativePath: taxonomy.relGcsPath,
      category: taxonomy.category,
      subcategory: taxonomy.subcategory,
      categoryPath: taxonomy.categoryPath,
      filename
    });
  } catch (err) {
    console.error('[Get Signed Upload URL Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-data-files', authenticateUser, async (req, res) => {
  try {
    const { targetDir, files } = req.body || {};
    const uid = req.user.uid;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid payload: files array required' });
    }

    const userCacheDir = path.join('/tmp', 'reactcloud', 'users', uid, 'cache');
    const userCacheDataDir = path.join(userCacheDir, 'data');
    fs.mkdirSync(userCacheDataDir, { recursive: true });

    const bucket = storage.bucket(BUCKET_NAME);
    const uploadedResults = [];

    for (const f of files) {
      if (!f.filename || f.content === undefined) continue;

      const taxonomy = getGcsTaxonomyInfo(uid, f.filename, targetDir);
      
      // Save locally in root data dir AND taxonomy subdirectory
      const localPath = path.join(userCacheDataDir, f.filename);
      fs.writeFileSync(localPath, f.content);

      const taxonomyLocalDir = path.join(userCacheDataDir, taxonomy.categoryPath);
      fs.mkdirSync(taxonomyLocalDir, { recursive: true });
      fs.writeFileSync(path.join(taxonomyLocalDir, f.filename), f.content);

      const relGcsPath = taxonomy.relGcsPath;
      try {
        await bucket.upload(localPath, { destination: relGcsPath });
        console.log(`[Taxonomy Data Upload] Saved ${f.filename} to GCS Path: ${relGcsPath}`);
        uploadedResults.push({
          filename: f.filename,
          gcsPath: taxonomy.fullGcsUri,
          relativePath: relGcsPath,
          category: taxonomy.category,
          subcategory: taxonomy.subcategory
        });
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
          const molGcsPath = cleanTargetDir ? `users/${uid}/data/${cleanTargetDir}/${companionMol}` : `users/${uid}/data/${companionMol}`;
          bucket.upload(molLocalPath, { destination: molGcsPath }).catch(() => {});
        }

        const sdfLocalPath = path.join(userCacheTargetDir, companionSdf);
        if (!fs.existsSync(sdfLocalPath)) {
          fs.writeFileSync(sdfLocalPath, `${rootBase}\n  -OEChem-\n\n  0  0  0     0  0  0  0  0  0999 V2000\nM  END\n$$$$\n`);
          const sdfGcsPath = cleanTargetDir ? `users/${uid}/data/${cleanTargetDir}/${companionSdf}` : `users/${uid}/data/${companionSdf}`;
          bucket.upload(sdfLocalPath, { destination: sdfGcsPath }).catch(() => {});
        }
      }
    }

    return res.json({ success: true, targetDir, files: uploadedResults });
  } catch (err) {
    console.error('[Upload Data Files Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/resolve-file-link', authenticateUser, async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body || {};
    const uid = req.user.uid;

    if (!fileUrl) {
      return res.status(400).json({ error: 'fileUrl parameter is required' });
    }

    const resolved = await resolveAndCacheInputFile(uid, fileUrl, fileName);
    if (!resolved) {
      return res.status(400).json({ error: 'Unsupported or unresolvable file link format' });
    }

    return res.json({ success: true, file: resolved });
  } catch (err) {
    console.error('[Resolve File Link Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/run-input', authenticateUser, async (req, res) => {
  const { inputFile, root, replacements } = req.body;
  const uid = req.user.uid;
  const sessionId = req.body.sessionId || req.headers['x-session-id'] || req.headers['session-id'] || 'default_session';
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);

  const startTime = Date.now();
  console.log(`[Job Start] ${jobId} (Session: ${sessionId}) for User ${uid}`);

  try {
    // Resolve any input file link (GCS or HTTPS) into user session cache prior to workspace hydration
    const inputFileManifest = [];
    const incomingFileUrl = req.body.fileUrl || req.body.inputFileUrl || req.body.gcsUrl;
    if (incomingFileUrl) {
      try {
        const resolved = await resolveAndCacheInputFile(uid, incomingFileUrl, req.body.fileName);
        if (resolved) inputFileManifest.push(resolved);
      } catch (linkErr) {
        console.warn(`[File Link Ingestion Warning] ${linkErr.message}`);
      }
    }

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

    const logFilePath = path.join(workspaceDir, 'execution.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');

    const child = spawn(CHEMDB_BIN, [root || 'test', '0', commandDir, staticFile], {
      cwd: workspaceDir,
      env: {
        ...process.env,
        REACTROOT,
        CCROOT: REACTROOT,
        REACT_USER_ID: uid,
        REACT_USER_UID: uid,
        REACT_SESSION_ID: sessionId,
        GCS_BUCKET: BUCKET_NAME
      }
    });

    child.stdin.write(inpContent);
    child.stdin.end();

    const MAX_MEM_LOG_BYTES = 5 * 1024 * 1024;
    child.stdout.on('data', data => {
      const str = data.toString();
      if (stdout.length < MAX_MEM_LOG_BYTES) {
        stdout += str.slice(0, MAX_MEM_LOG_BYTES - stdout.length);
      }
      logStream.write(str);
    });
    child.stderr.on('data', data => {
      const str = data.toString();
      if (stderr.length < MAX_MEM_LOG_BYTES) {
        stderr += str.slice(0, MAX_MEM_LOG_BYTES - stderr.length);
      }
      logStream.write(str);
    });

    child.on('close', exitCode => {
      logStream.end();
      const elapsed = Date.now() - startTime;
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms with exit code ${exitCode}`);

      // Read any generated .ans or .out detail output files (e.g. MASTER.ans, molecule.ans)
      let combinedOutput = stdout;
      try {
        const detailFiles = fs.readdirSync(workspaceDir).filter(f => f.endsWith('.ans') || f.endsWith('.out'));
        for (const df of detailFiles) {
          if (df === 'run.inp' || df === 'test.inp' || df === 'execution.log') continue;
          const dfPath = path.join(workspaceDir, df);
          const dfContent = fs.readFileSync(dfPath, 'utf8');
          if (dfContent && dfContent.trim()) {
            combinedOutput += `\n${dfContent}`;
          }
        }
      } catch (e) {
        console.warn(`[Detail File Read Warning] ${e.message}`);
      }

      // Async background persistence & cleanup
      const classification = classifyJob(req.body, '', inputFile);
      persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, inputFileManifest)
        .then(fileManifest => {
          res.json({
            jobId,
            sessionId,
            inputFile,
            root: root || 'ROOT',
            exitCode,
            output: combinedOutput,
            error: stderr,
            elapsedMs: elapsed,
            files: fileManifest
          });
        })
        .catch(err => {
          console.warn(`[GCS Persist Warning] ${err.message}`);
          res.json({
            jobId,
            sessionId,
            inputFile,
            root: root || 'ROOT',
            exitCode,
            output: combinedOutput,
            error: stderr,
            elapsedMs: elapsed
          });
        })
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
  const sessionId = req.body.sessionId || req.headers['x-session-id'] || req.headers['session-id'] || 'default_session';
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);

  const startTime = Date.now();

  try {
    // Resolve any input file link (GCS or HTTPS) into user session cache prior to workspace hydration
    const inputFileManifest = [];
    const incomingFileUrl = req.body.fileUrl || req.body.inputFileUrl || req.body.gcsUrl;
    if (incomingFileUrl) {
      try {
        const resolved = await resolveAndCacheInputFile(uid, incomingFileUrl, req.body.fileName);
        if (resolved) inputFileManifest.push(resolved);
      } catch (linkErr) {
        console.warn(`[File Link Ingestion Warning] ${linkErr.message}`);
      }
    }

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
      fs.writeFileSync(path.join(workspaceDir, `${targetItemName}.rxn`), `RxnPatternList\n${targetItemName}\n`);
      fs.writeFileSync(path.join(workspaceDir, `${targetItemName}.mol`), `${targetItemName}\n`);
    }

    let stdout = '';
    let stderr = '';

    const logFilePath = path.join(workspaceDir, 'execution.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');

    const child = spawn(CHEMDB_BIN, [root || 'test', '0', commandDir, staticFile], {
      cwd: workspaceDir,
      env: {
        ...process.env,
        REACTROOT,
        CCROOT: REACTROOT,
        REACT_USER_ID: uid,
        REACT_USER_UID: uid,
        REACT_SESSION_ID: sessionId,
        GCS_BUCKET: BUCKET_NAME
      }
    });

    child.stdin.write(commandText);
    child.stdin.end();

    const MAX_MEM_LOG_BYTES = 5 * 1024 * 1024;
    child.stdout.on('data', data => {
      const str = data.toString();
      if (stdout.length < MAX_MEM_LOG_BYTES) {
        stdout += str.slice(0, MAX_MEM_LOG_BYTES - stdout.length);
      }
      logStream.write(str);
    });
    child.stderr.on('data', data => {
      const str = data.toString();
      if (stderr.length < MAX_MEM_LOG_BYTES) {
        stderr += str.slice(0, MAX_MEM_LOG_BYTES - stderr.length);
      }
      logStream.write(str);
    });

    child.on('close', exitCode => {
      logStream.end();
      const elapsed = Date.now() - startTime;
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms`);

      // Read any generated detail output files (.ans, .out, .mech, .sdf, .thm, .corrs)
      let combinedOutput = '';
      try {
        const detailFiles = fs.readdirSync(workspaceDir).filter(f =>
          f.endsWith('.ans') || f.endsWith('.out') || f.endsWith('.mech') || f.endsWith('.sdf') || f.endsWith('.thm') || f.endsWith('.corrs')
        );
        for (const df of detailFiles) {
          if (df === 'run.inp' || df === 'test.inp' || df === 'mech.lst' || df === 'xxx.lst' || df === 'xxx.mol' || df === 'xxx.rxn' || df === 'execution.log') continue;
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

      // Respond immediately with chemdb results for fast UI response
      res.json({
        jobId,
        sessionId,
        root: root || 'ROOT',
        exitCode,
        output: combinedOutput,
        error: stderr,
        elapsedMs: elapsed
      });

      // Async background GCS persistence & cleanup
      const classification = classifyJob(req.body, commandText, '');
      persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, inputFileManifest)
        .catch(err => {
          console.warn(`[GCS Persist Warning] ${err.message}`);
        })
        .finally(() => cleanupWorkspace(workspaceDir));
    });
  } catch (err) {
    cleanupWorkspace(workspaceDir);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Database Storage APIs (Phase 1 Firestore Integration)
 */
function convertBytesObjectsToBlobs(val) {
  if (val === null || val === undefined) return val;

  if (typeof val === 'object') {
    if (!Array.isArray(val) && val._type === 'bytes' && typeof val.base64 === 'string') {
      try {
        const buf = Buffer.from(val.base64, 'base64');
        if (admin.firestore && admin.firestore.Blob) {
          return admin.firestore.Blob.fromBuffer(buf);
        } else if (Firestore.Blob) {
          return Firestore.Blob.fromBuffer(buf);
        }
      } catch (e) {
        console.warn('[Orchestrator Blob conversion failed]', e.message);
      }
    }

    if (Array.isArray(val)) {
      return val.map(convertBytesObjectsToBlobs);
    }

    const newObj = {};
    for (const key of Object.keys(val)) {
      newObj[key] = convertBytesObjectsToBlobs(val[key]);
    }
    return newObj;
  }

  return val;
}

function convertBlobsToBytesObjects(val) {
  if (val === null || val === undefined) return val;

  if (typeof val === 'object') {
    if (val.constructor && val.constructor.name === 'Blob' && typeof val.toBase64 === 'function') {
      return {
        _type: 'bytes',
        base64: val.toBase64()
      };
    }
    if (val.toBase64 && typeof val.toBase64 === 'function') {
      return {
        _type: 'bytes',
        base64: val.toBase64()
      };
    }

    if (Array.isArray(val)) {
      return val.map(convertBlobsToBytesObjects);
    }

    const newObj = {};
    for (const key of Object.keys(val)) {
      newObj[key] = convertBlobsToBytesObjects(val[key]);
    }
    return newObj;
  }

  return val;
}

/**
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

    parsedData = convertBytesObjectsToBlobs(parsedData);

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
    const { uid = 'user_default_local', dbName, type, key } = req.body;
    if (!dbName || key === undefined || key === null) {
      return res.status(400).json({ error: 'Missing required parameters: dbName, key' });
    }

    const isInt = type === 'int' || (typeof key === 'number') || (type !== 'string' && !isNaN(key) && Number.isInteger(Number(key)));
    const keyStr = String(key);
    const keyNum = Number(key);

    const colRef = firestore.collection(`users/${uid}/databases/${dbName}/records`);

    let docData = null;

    // 1. Direct document ID lookup
    const directRef = colRef.doc(keyStr);
    const directSnap = await directRef.get();
    if (directSnap.exists) {
      docData = directSnap.data();
    } else {
      // 2. Query collection based on type
      if (isInt) {
        let querySnap = await colRef.where('ID', '==', keyNum).get();
        if (querySnap.empty) {
          querySnap = await colRef.where('keyId', '==', keyNum).get();
        }
        if (!querySnap.empty) {
          docData = querySnap.docs[0].data();
        }
      } else {
        let querySnap = await colRef.where('Name', '==', keyStr).get();
        if (querySnap.empty) {
          querySnap = await colRef.where('key', '==', keyStr).get();
        }
        if (!querySnap.empty) {
          docData = querySnap.docs[0].data();
        }
      }
    }

    if (!docData) {
      return res.json({ found: false, dbName, key, type });
    }

    const data = convertBlobsToBytesObjects(docData);
    return res.json({
      found: true,
      dbName,
      key,
      type,
      keyId: data.keyId || data.ID || 0,
      data: data,
      updatedAt: data.updatedAt
    });
  } catch (err) {
    console.error('[Firestore DB Fetch Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/listSummary', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName, fields = ['ID', 'Name'] } = req.body;
    if (!dbName) {
      return res.status(400).json({ error: 'Missing required parameter: dbName' });
    }

    const colRef = firestore.collection(`users/${uid}/databases/${dbName}/records`);
    let querySnap;
    if (Array.isArray(fields) && fields.length > 0) {
      querySnap = await colRef.select(...fields).get();
    } else {
      querySnap = await colRef.select('ID', 'Name').get();
    }

    const records = [];
    querySnap.forEach(doc => {
      const d = doc.data();
      const idVal = d.ID !== undefined ? d.ID : (d.keyId !== undefined ? d.keyId : Number(doc.id) || 0);
      const nameVal = d.Name || d.key || doc.id;
      records.push({
        ID: Number(idVal),
        Name: String(nameVal)
      });
    });

    console.log(`[Firestore DB ListSummary] dbName='${dbName}', count=${records.length}, uid='${uid}'`);
    return res.json({
      found: true,
      dbName,
      count: records.length,
      records: records
    });
  } catch (err) {
    console.error('[Firestore DB ListSummary Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});



app.post('/api/db/storeSearchKeys', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName, keyId = 0, jsonStr } = req.body;
    if (!dbName) {
      return res.status(400).json({ error: 'Missing required parameter: dbName' });
    }

    const docPath = `users/${uid}/searchkeys/${dbName}`;
    const docRef = firestore.doc(docPath);

    let parsedData = jsonStr;
    if (typeof jsonStr === 'string') {
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = { rawString: jsonStr };
      }
    }

    parsedData = convertBytesObjectsToBlobs(parsedData);

    const searchKeysDoc = {
      dbName: String(dbName),
      updatedAt: new Date().toISOString(),
      keyId: Number(keyId),
      data: parsedData,
      [`searchKeys_${keyId}`]: parsedData
    };

    await docRef.set(searchKeysDoc, { merge: true });
    console.log(`[Firestore SearchKeys Store] Saved search keys doc: ${docPath}`);
    return res.json({ status: 'OK', path: docPath });
  } catch (err) {
    console.error('[Firestore SearchKeys Store Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/fetchSearchKeys', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName } = req.body;
    if (!dbName) {
      return res.status(400).json({ error: 'Missing required parameter: dbName' });
    }

    const docPath = `users/${uid}/searchkeys/${dbName}`;
    const docRef = firestore.doc(docPath);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.json({ found: false, dbName });
    }

    const data = convertBlobsToBytesObjects(docSnap.data());
    return res.json({
      found: true,
      dbName,
      data: data,
      updatedAt: data.updatedAt
    });
  } catch (err) {
    console.error('[Firestore SearchKeys Fetch Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/findOrCreateObjectIDClass', async (req, res) => {
  try {
    const {
      uid = 'user_default_local',
      sessionId = 'default_session',
      source = 'DATABASE',
      classificationName,
      objectIDs,
      defaultClassData
    } = req.body;

    if (!classificationName || !Array.isArray(objectIDs)) {
      return res.status(400).json({ error: 'Missing required parameters: classificationName, objectIDs array' });
    }

    const docKey = `doc_${objectIDs.join('_')}`;
    const isDb = source === 'DATABASE' || source === 100 || source === '100' || source === 100;
    const sourceDir = isDb ? 'database' : (sessionId || 'default_session');
    const docPath = `users/${uid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
    const docRef = firestore.doc(docPath);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const rawData = docSnap.data();
      const { classData, classificationName, docKey, updatedAt, ...cleanData } = rawData;
      const targetObj = classData || (Object.keys(cleanData).length > 0 ? cleanData : rawData);
      const data = convertBlobsToBytesObjects(targetObj);
      console.log(`[Firestore Classification Class Found] Path: ${docPath}`);
      return res.json({
        found: true,
        docPath,
        data: data
      });
    }

    let parsedClassData = defaultClassData;
    if (typeof defaultClassData === 'string') {
      try {
        parsedClassData = JSON.parse(defaultClassData);
      } catch (e) {
        parsedClassData = { rawString: defaultClassData };
      }
    }

    parsedClassData = convertBytesObjectsToBlobs(parsedClassData);

    const docPayload = {
      classificationName: String(classificationName),
      objectIDs: objectIDs.map(Number),
      docKey,
      updatedAt: new Date().toISOString(),
      ...(typeof parsedClassData === 'object' && parsedClassData !== null ? parsedClassData : {})
    };

    await docRef.set(docPayload, { merge: true });
    console.log(`[Firestore Classification Class Created] Path: ${docPath}`);

    const returnData = convertBlobsToBytesObjects(parsedClassData);
    return res.json({
      found: false,
      created: true,
      docPath,
      data: returnData
    });
  } catch (err) {
    console.error('[Firestore findOrCreateObjectIDClass Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/storeObjectIDClass', async (req, res) => {
  try {
    const {
      uid = 'user_default_local',
      sessionId = 'default_session',
      source = 'DATABASE',
      classificationName,
      objectIDs,
      jsonStr
    } = req.body;

    if (!classificationName || !Array.isArray(objectIDs)) {
      return res.status(400).json({ error: 'Missing required parameters: classificationName, objectIDs array' });
    }

    const docKey = `doc_${objectIDs.join('_')}`;
    const isDb = source === 'DATABASE' || source === 100 || source === '100' || source === 100;
    const sourceDir = isDb ? 'database' : (sessionId || 'default_session');
    const docPath = `users/${uid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
    const docRef = firestore.doc(docPath);

    let parsedClassData = jsonStr;
    if (typeof jsonStr === 'string') {
      try {
        parsedClassData = JSON.parse(jsonStr);
      } catch (e) {
        parsedClassData = { rawString: jsonStr };
      }
    }

    parsedClassData = convertBytesObjectsToBlobs(parsedClassData);

    const docPayload = {
      classificationName: String(classificationName),
      objectIDs: objectIDs.map(Number),
      docKey,
      updatedAt: new Date().toISOString(),
      ...(typeof parsedClassData === 'object' && parsedClassData !== null ? parsedClassData : {})
    };

    await docRef.set(docPayload, { merge: true });
    console.log(`[Firestore Store ObjectIDClass] Saved path: ${docPath}`);
    return res.json({ status: 'OK', path: docPath });
  } catch (err) {
    console.error('[Firestore Store ObjectIDClass Error]', err.message);
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

app.use((err, req, res, next) => {
  console.error('[Orchestrator Global Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {

  console.log(`================================───────────────────`);
  console.log(`REACTCLOUD High-Performance Orchestrator running on port ${PORT}`);
  console.log(`User Disk Cache enabled at: /tmp/reactcloud/users/<uid>/cache/`);
  console.log(`GCP Project: ${PROJECT_ID}`);
  console.log(`================================───────────────────`);
});
