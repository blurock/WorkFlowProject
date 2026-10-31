const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');
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

async function resolveAndCacheInputFile(uid, fileUrl, customFileName = '', workspaceDir = null) {
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

  const copyToWorkspace = (srcPath) => {
    if (workspaceDir && fs.existsSync(workspaceDir) && fs.existsSync(srcPath)) {
      const wsDest = path.join(workspaceDir, targetFileName);
      fs.copyFileSync(srcPath, wsDest);
      const wsDataDir = path.join(workspaceDir, 'data');
      fs.mkdirSync(wsDataDir, { recursive: true });
      fs.copyFileSync(srcPath, path.join(wsDataDir, targetFileName));

      if (targetFileName.endsWith('.lst')) {
        const rootBase = targetFileName.replace(/\.lst$/, '');
        const molSrc = path.join(userCacheDataDir, `${rootBase}.mol`);
        const sdfSrc = path.join(userCacheDataDir, `${rootBase}.sdf`);
        if (fs.existsSync(molSrc)) {
          fs.copyFileSync(molSrc, path.join(workspaceDir, `${rootBase}.mol`));
          fs.copyFileSync(molSrc, path.join(wsDataDir, `${rootBase}.mol`));
        }
        if (fs.existsSync(sdfSrc)) {
          fs.copyFileSync(sdfSrc, path.join(workspaceDir, `${rootBase}.sdf`));
          fs.copyFileSync(sdfSrc, path.join(wsDataDir, `${rootBase}.sdf`));
        }
      }
    }
  };

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
    let needDownload = true;
    if (fs.existsSync(localFilePath) && metadata && metadata.md5Hash) {
      const existingBuf = fs.readFileSync(localFilePath);
      const existingMd5 = crypto.createHash('md5').update(existingBuf).digest('base64');
      if (existingMd5 === metadata.md5Hash) {
        console.log(`[File Link Cache Hit] ${targetFileName} matches GCS MD5 (${metadata.md5Hash})`);
        needDownload = false;
      }
    }

    if (needDownload) {
      // Download from GCS
      await file.download({ destination: localFilePath });
      console.log(`[File Link Downloaded] Saved GCS ${fileUrl} -> ${localFilePath}`);
    }

    // Auto-create matching companion files for .lst files
    if (targetFileName.endsWith('.lst')) {
      const rootBase = targetFileName.replace(/\.lst$/, '');
      const molPath = path.join(userCacheDataDir, `${rootBase}.mol`);
      const sdfPath = path.join(userCacheDataDir, `${rootBase}.sdf`);
      if (!fs.existsSync(molPath)) fs.writeFileSync(molPath, `1 ${rootBase}\n`);
      if (!fs.existsSync(sdfPath)) fs.writeFileSync(sdfPath, `${rootBase}\n  -OEChem-\n\n  0  0  0     0  0  0  0  0  0999 V2000\nM  END\n$$$$\n`);
    }

    copyToWorkspace(localFilePath);
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

    copyToWorkspace(localFilePath);

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
  } else {
    // If local file path or cache reference
    if (fs.existsSync(localFilePath)) {
      copyToWorkspace(localFilePath);
      return {
        fileName: targetFileName,
        localFilePath,
        fileSource: 'cache',
        fileUrl: taxonomy.fullGcsUri,
        category: taxonomy.category,
        subcategory: taxonomy.subcategory,
        sizeBytes: fs.statSync(localFilePath).size
      };
    }
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
async function persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classificationInput = true, inputFileManifest = [], mechanismMetadata = null) {
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

  // Include mechanism files in manifest if provided
  if (mechanismMetadata?.files && Array.isArray(mechanismMetadata.files)) {
    for (const mf of mechanismMetadata.files) {
      if (!fileManifest.some(f => f.filename === mf.filename)) {
        fileManifest.push(mf);
      }
    }
  }

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
      artifacts: artifactPaths,
      ...(mechanismMetadata ? { mechanism: mechanismMetadata } : {})
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
 * POST /api/storage/upload-url
 * Generates a GCS V4 Signed Upload URL for direct frontend client uploads to GCS
 * obeying the Target GCS Taxonomy Path: users/{uid}/data/{category}/{subcategory}/{filename}
 */
const handleGetSignedUploadUrl = async (req, res) => {
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
      contentType: contentType || 'text/plain'
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
    console.warn('[Get Signed Upload URL Fallback]', err.message);
    return res.json({
      success: false,
      fallback: true,
      error: err.message,
      message: 'Direct GCS upload not available; fallback to /api/upload-data-files supported'
    });
  }
};

app.post('/api/upload/get-signed-url', authenticateUser, handleGetSignedUploadUrl);
app.post('/api/storage/upload-url', authenticateUser, handleGetSignedUploadUrl);

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
        
        const molLocalPath = path.join(userCacheDataDir, companionMol);
        if (!fs.existsSync(molLocalPath)) {
          fs.writeFileSync(molLocalPath, `1 ${rootBase}\n`);
          const molGcsPath = `users/${uid}/data/${companionMol}`;
          bucket.upload(molLocalPath, { destination: molGcsPath }).catch(() => {});
        }

        const sdfLocalPath = path.join(userCacheDataDir, companionSdf);
        if (!fs.existsSync(sdfLocalPath)) {
          fs.writeFileSync(sdfLocalPath, `${rootBase}\n  -OEChem-\n\n  0  0  0     0  0  0  0  0  0999 V2000\nM  END\n$$$$\n`);
          const sdfGcsPath = `users/${uid}/data/${companionSdf}`;
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
    // Resolve any input file links (GCS, HTTPS, or manifest) directly into isolated workspace
    await hydrateUserWorkspace(uid, workspaceDir);

    const inputFileManifest = [];
    const incomingFileUrls = [];
    if (req.body.fileUrl) incomingFileUrls.push({ url: req.body.fileUrl, name: req.body.fileName });
    if (req.body.inputFileUrl) incomingFileUrls.push({ url: req.body.inputFileUrl, name: req.body.fileName });
    if (req.body.gcsUrl) incomingFileUrls.push({ url: req.body.gcsUrl, name: req.body.fileName });
    if (req.body.gcsUri) incomingFileUrls.push({ url: req.body.gcsUri, name: req.body.fileName });
    if (Array.isArray(req.body.files)) {
      for (const f of req.body.files) {
        if (typeof f === 'string') incomingFileUrls.push({ url: f });
        else if (f && (f.fileUrl || f.gcsPath || f.url)) {
          incomingFileUrls.push({ url: f.fileUrl || f.gcsPath || f.url, name: f.fileName || f.filename });
        }
      }
    }

    for (const item of incomingFileUrls) {
      try {
        const resolved = await resolveAndCacheInputFile(uid, item.url, item.name, workspaceDir);
        if (resolved) inputFileManifest.push(resolved);
      } catch (linkErr) {
        console.warn(`[File Link Ingestion Warning] ${linkErr.message}`);
      }
    }


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

    child.on('close', (exitCode, signal) => {
      logStream.end();
      const elapsed = Date.now() - startTime;
      const effectiveExitCode = (exitCode !== null) ? exitCode : (signal ? 139 : 1);
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms with exit code ${exitCode}, signal: ${signal} (effective: ${effectiveExitCode})`);
      if (signal) {
        const sigMsg = `\n[Process Error] chemdb terminated by signal: ${signal}\n`;
        stderr += sigMsg;
        stdout += sigMsg;
      }

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

      const resError = (effectiveExitCode !== 0)
        ? (stderr.trim() || `Execution failed with exit code ${effectiveExitCode}${signal ? ` (Signal: ${signal})` : ''}`)
        : (stderr.trim() || undefined);

      // Async background persistence & cleanup
      const classification = classifyJob(req.body, '', inputFile);
      persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, inputFileManifest)
        .then(fileManifest => {
          res.json({
            jobId,
            sessionId,
            inputFile,
            root: root || 'ROOT',
            exitCode: effectiveExitCode,
            signal: signal || null,
            output: combinedOutput,
            executionLog: stdout,
            error: resError,
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
            exitCode: effectiveExitCode,
            signal: signal || null,
            output: combinedOutput,
            executionLog: stdout,
            error: resError,
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
    // Resolve any input file links (GCS, HTTPS, or manifest) directly into isolated workspace
    await hydrateUserWorkspace(uid, workspaceDir);

    const inputFileManifest = [];
    const incomingFileUrls = [];
    if (req.body.fileUrl) incomingFileUrls.push({ url: req.body.fileUrl, name: req.body.fileName });
    if (req.body.inputFileUrl) incomingFileUrls.push({ url: req.body.inputFileUrl, name: req.body.fileName });
    if (req.body.gcsUrl) incomingFileUrls.push({ url: req.body.gcsUrl, name: req.body.fileName });
    if (req.body.gcsUri) incomingFileUrls.push({ url: req.body.gcsUri, name: req.body.fileName });
    if (Array.isArray(req.body.files)) {
      for (const f of req.body.files) {
        if (typeof f === 'string') incomingFileUrls.push({ url: f });
        else if (f && (f.fileUrl || f.gcsPath || f.url)) {
          incomingFileUrls.push({ url: f.fileUrl || f.gcsPath || f.url, name: f.fileName || f.filename });
        }
      }
    }

    for (const item of incomingFileUrls) {
      try {
        const resolved = await resolveAndCacheInputFile(uid, item.url, item.name, workspaceDir);
        if (resolved) inputFileManifest.push(resolved);
      } catch (linkErr) {
        console.warn(`[File Link Ingestion Warning] ${linkErr.message}`);
      }
    }


    const commandText = Array.isArray(commands) ? commands.join('\n') : (commands || '');
    const jobInpFile = path.join(workspaceDir, 'run.inp');
    fs.writeFileSync(jobInpFile, commandText);

    // If querying item details (e.g. 1-butanal, AlkoxyDecomp, or PropaneCombinedMech), create default files ONLY if missing
    const targetItemName = (req.body.targetItem || root || '').trim();
    if (targetItemName && targetItemName !== 'test' && targetItemName !== 'job1') {
      const defaultFiles = [
        { name: 'xxx.mol', content: `${targetItemName}\n` },
        { name: 'xxx.rxn', content: `RxnPatternList\n${targetItemName}\n` },
        { name: 'xxx.lst', content: `${targetItemName}\n` },
        { name: 'mech.lst', content: `${targetItemName}\n` },
        { name: 'MASTER.lst', content: `${targetItemName}\n` },
        { name: `${targetItemName}.lst`, content: `${targetItemName}\n` },
        { name: `${targetItemName}.rxn`, content: `RxnPatternList\n${targetItemName}\n` },
        { name: `${targetItemName}.mol`, content: `${targetItemName}\n` }
      ];

      for (const df of defaultFiles) {
        const dest = path.join(workspaceDir, df.name);
        if (!fs.existsSync(dest)) {
          const candidatePaths = [
            path.join(REACTROOT, 'data', 'rxn', 'rxnpats', df.name),
            path.join(REACTROOT, 'data', 'rxn', df.name),
            path.join(REACTROOT, 'data', 'mol', 'molsdf', df.name),
            path.join(REACTROOT, 'data', 'mol', df.name),
            path.join(REACTROOT, 'data', 'mech', df.name)
          ];
          let copied = false;
          for (const cand of candidatePaths) {
            if (fs.existsSync(cand)) {
              fs.copyFileSync(cand, dest);
              copied = true;
              break;
            }
          }
          if (!copied) {
            fs.writeFileSync(dest, df.content);
          }
        }
      }
    }

    let stdout = '';
    let stderr = '';

    const logFilePath = path.join(workspaceDir, 'execution.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');

    const preExistingFiles = new Set(fs.readdirSync(workspaceDir));
    const chemdbStartTime = Date.now();

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

    child.on('close', (exitCode, signal) => {
      logStream.end();
      const elapsed = Date.now() - startTime;
      const effectiveExitCode = (exitCode !== null) ? exitCode : (signal ? 139 : 1);
      console.log(`[Job Complete] ${jobId} finished in ${elapsed}ms (exitCode: ${exitCode}, signal: ${signal}, effective: ${effectiveExitCode})`);
      if (signal) {
        const sigMsg = `\n[Process Error] chemdb terminated by signal: ${signal}\n`;
        stderr += sigMsg;
        stdout += sigMsg;
      }

      // Read any generated detail output files (.ans, .out, .mech, .sdf, .thm, .corrs)
      let combinedOutput = '';
      try {
        const detailFiles = fs.readdirSync(workspaceDir).filter(f =>
          f.endsWith('.ans') || f.endsWith('.out') || f.endsWith('.mech') || f.endsWith('.sdf') || f.endsWith('.thm') || f.endsWith('.corrs')
        );
        for (const df of detailFiles) {
          if (df === 'run.inp' || df === 'test.inp' || df === 'mech.lst' || df === 'xxx.lst' || df === 'xxx.mol' || df === 'xxx.rxn' || df === 'execution.log') continue;
          const dfPath = path.join(workspaceDir, df);

          // Only include files that were newly created or modified during chemdb execution
          let isGeneratedByJob = !preExistingFiles.has(df);
          if (!isGeneratedByJob) {
            try {
              isGeneratedByJob = fs.statSync(dfPath).mtimeMs >= chemdbStartTime;
            } catch (e) {}
          }
          if (!isGeneratedByJob) continue;

          // If querying a specific target item, do not attach unrelated detail files
          if (targetItemName && (df.endsWith('.sdf') || df.endsWith('.mech') || df.endsWith('.thm'))) {
            const isTargetMatch = df.startsWith(targetItemName);
            if (!isTargetMatch) continue;
          }
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

      const resError = (effectiveExitCode !== 0)
        ? (stderr.trim() || `Execution failed with exit code ${effectiveExitCode}${signal ? ` (Signal: ${signal})` : ''}`)
        : (stderr.trim() || undefined);

      // Respond immediately with chemdb results for fast UI response
      res.json({
        jobId,
        sessionId,
        root: root || 'ROOT',
        exitCode: effectiveExitCode,
        signal: signal || null,
        output: combinedOutput,
        executionLog: stdout,
        error: resError,
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
 * Save LSR file (/api/save-lsr)
 */
app.post('/api/save-lsr', authenticateUser, async (req, res) => {
  const rootName = req.body.rootName || req.body.name;
  const content = req.body.content;
  const uid = req.user?.uid || 'user_default_local';

  if (!rootName || !content) {
    return res.status(400).json({ error: "Request body must contain non-empty 'rootName' and 'content' fields." });
  }

  const cleanRootName = path.basename(rootName.replace(/\.lsr$/i, ''));
  const mechsDir = path.join(REACTROOT, 'data', 'mechs', 'submechanisms');
  fs.mkdirSync(mechsDir, { recursive: true });

  const destPath = path.join(mechsDir, `${cleanRootName}.lsr`);
  const dataPath = path.join(REACTROOT, 'data', `${cleanRootName}.lsr`);
  const tmpDir = path.join(REACTROOT, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `${cleanRootName}.lsr`);

  try {
    fs.writeFileSync(destPath, content, 'utf8');
    fs.writeFileSync(dataPath, content, 'utf8');
    fs.writeFileSync(tmpPath, content, 'utf8');

    const logMsg = `[Save LSR] User ${uid} saved ${cleanRootName}.lsr to data/mechs/submechanisms/${cleanRootName}.lsr (${content.length} chars)`;
    console.log(logMsg);

    try {
      const execLog = path.join(tmpDir, 'execution.log');
      fs.appendFileSync(execLog, `${logMsg}\n`);
    } catch (e) {}

    res.json({
      success: true,
      rootName: cleanRootName,
      path: `data/mechs/submechanisms/${cleanRootName}.lsr`,
      bytesWritten: Buffer.byteLength(content, 'utf8')
    });
  } catch (err) {
    console.error('[Save LSR Error]', err);
    res.status(500).json({ error: `Failed to save LSR file: ${err.message}` });
  }
});

/**
 * Helper to serialize a Firestore ReadChainSet document into standard .lsr text syntax
 */
function generateLsrFromReadChainSet(pathway) {
  const lines = [];
  const name = (pathway.Title || pathway.Name || pathway.key || 'MechanismPathway').trim();
  lines.push(`${name}:`);

  const extraMols = (pathway.ExtraMolecules?.Molecules || []).map(m => (m.Name || '').trim()).filter(Boolean);
  if (extraMols.length > 0) {
    lines.push(extraMols.join(','));
  } else {
    lines.push('NONE');
  }

  (pathway.Steps || []).forEach((step, index) => {
    lines.push('%%% ----------------------------------------------------');
    lines.push(`%%% Step ${index + 1}: ${step.Name || 'Reaction Step'}`);
    lines.push('%%% ----------------------------------------------------');

    const rxns = (step.Reactions?.Reactions || []).map(r => (r.Name || '').trim()).filter(Boolean);
    const stepMols = (step.Molecules?.Molecules || []).map(m => (m.Name || '').trim()).filter(Boolean);

    if (rxns.length === 0) {
      lines.push('%%% (No reaction patterns)');
    } else {
      for (let i = 0; i < rxns.length; i++) {
        const isLast = (i === rxns.length - 1);
        if (isLast) {
          if (stepMols.length > 0) {
            lines.push(`${rxns[i]}\\`);
            lines.push(`:${stepMols.join(',')}`);
          } else {
            lines.push(rxns[i]);
          }
        } else {
          lines.push(`${rxns[i]},\\`);
        }
      }
    }
  });

  lines.push('');
  return lines.join('\n');
}

/**
 * List available submechanism paths (/api/submechanisms)
 * ALWAYS loads from Firestore (users/{uid}/databases/MechanismPathway/records)
 */
app.get('/api/submechanisms', async (req, res) => {
  try {
    const uid = req.user?.uid || 'user_default_local';
    const colRef = firestore.collection(`users/${uid}/databases/MechanismPathway/records`);
    const snap = await colRef.select('Name', 'key', 'Title').get();

    const pathways = [];
    snap.forEach(doc => {
      const d = doc.data();
      const name = d.Name || d.key || doc.id;
      if (name && !pathways.includes(name)) {
        pathways.push(name);
      }
    });

    pathways.sort();
    console.log(`[Firestore API /api/submechanisms] Returned ${pathways.length} pathways for uid='${uid}'`);
    res.json(pathways);
  } catch (err) {
    console.error('[Firestore API /api/submechanisms Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Upload Generated Mechanism Artifacts to GCS under users/{uid}/mechanisms/{mechName}/
 */
async function uploadMechanismArtifacts(uid, mechName, workspaceDir, actualRunRoot = 'read') {
  const bucket = storage.bucket(BUCKET_NAME);
  const mechPrefix = `users/${uid}/mechanisms/${mechName}`;
  const filesManifest = [];
  const candidateArtifacts = [];

  const candidates = [
    { ext: '.mech', label: 'Mechanism Reactions (.mech)', fileType: 'mech' },
    { ext: '.sdf', label: 'Molecule Structures (.sdf)', fileType: 'sdf' },
    { ext: '.thm', label: 'Molecule Thermodynamics (.thm)', fileType: 'thm' },
    { ext: '.corrs', label: 'Name Correspondences (.corrs)', fileType: 'corrs' }
  ];

  for (const item of candidates) {
    const filename = `${mechName}${item.ext}`;
    const fileInWs = path.join(workspaceDir, filename);
    const fileInTmp = path.join(REACTROOT, 'tmp', filename);
    let targetPath = null;
    if (fs.existsSync(fileInWs)) {
      targetPath = fileInWs;
    } else if (fs.existsSync(fileInTmp)) {
      targetPath = fileInTmp;
      try { fs.copyFileSync(fileInTmp, fileInWs); } catch (_) {}
    }

    if (targetPath && fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      if (stats.size > 0) {
        candidateArtifacts.push({
          filePath: targetPath,
          filename,
          label: item.label,
          fileType: item.fileType,
          sizeBytes: stats.size
        });
      }
    }
  }

  // Check for execution.log
  const logFilePath = path.join(workspaceDir, 'execution.log');
  if (fs.existsSync(logFilePath)) {
    const logStats = fs.statSync(logFilePath);
    if (logStats.size > 0) {
      candidateArtifacts.push({
        filePath: logFilePath,
        filename: 'execution.log',
        label: 'Execution Console Log',
        fileType: 'log',
        sizeBytes: logStats.size
      });
    }
  }

  // Check for .lsr file
  const lsrFilePath = path.join(workspaceDir, `${actualRunRoot}.lsr`);
  if (fs.existsSync(lsrFilePath)) {
    const lsrStats = fs.statSync(lsrFilePath);
    if (lsrStats.size > 0) {
      candidateArtifacts.push({
        filePath: lsrFilePath,
        filename: `${actualRunRoot}.lsr`,
        label: 'Pathway Definition (.lsr)',
        fileType: 'lsr',
        sizeBytes: lsrStats.size
      });
    }
  }

  // Create zip bundle if we have artifacts
  if (candidateArtifacts.length > 0) {
    try {
      const zipFilename = `${mechName}_artifacts.zip`;
      const zipFilePath = path.join(workspaceDir, zipFilename);
      const filesToZip = candidateArtifacts.map(a => `"${path.basename(a.filePath)}"`).join(' ');
      execSync(`zip -j "${zipFilePath}" ${filesToZip}`, { cwd: workspaceDir });
      if (fs.existsSync(zipFilePath)) {
        candidateArtifacts.push({
          filePath: zipFilePath,
          filename: zipFilename,
          label: 'Complete Mechanism Artifacts (.zip)',
          fileType: 'zip',
          sizeBytes: fs.statSync(zipFilePath).size
        });
      }
    } catch (zipErr) {
      console.warn(`[Mechanism Zip Warning] Failed to create zip bundle: ${zipErr.message}`);
    }
  }

  // Upload candidate artifacts to GCS in parallel
  await Promise.all(candidateArtifacts.map(async (art) => {
    const gcsPath = `${mechPrefix}/${art.filename}`;
    try {
      await bucket.upload(art.filePath, {
        destination: gcsPath,
        gzip: true,
        metadata: {
          contentType: art.fileType === 'zip' ? 'application/zip' : 'text/plain; charset=utf-8'
        }
      });
      const downloadUrl = await getSignedDownloadUrl(BUCKET_NAME, gcsPath);
      filesManifest.push({
        filename: art.filename,
        label: art.label,
        fileType: art.fileType,
        sizeBytes: art.sizeBytes,
        gcsPath: `gs://${BUCKET_NAME}/${gcsPath}`,
        downloadUrl: downloadUrl || `http://localhost:8085/api/logs/content?gcsPath=${encodeURIComponent(`gs://${BUCKET_NAME}/${gcsPath}`)}`
      });
    } catch (uploadErr) {
      console.warn(`[Mechanism GCS Upload Error] ${art.filename}: ${uploadErr.message}`);
    }
  }));

  const orderMap = { mech: 1, sdf: 2, thm: 3, corrs: 4, log: 5, lsr: 6, zip: 7 };
  filesManifest.sort((a, b) => (orderMap[a.fileType] || 99) - (orderMap[b.fileType] || 99));

  return {
    storageDirectory: mechPrefix,
    gcsPrefix: `gs://${BUCKET_NAME}/${mechPrefix}/`,
    files: filesManifest
  };
}

/**
 * Run submechanism from path (/api/run-submechanism)
 * Loads pathway definition from Firestore or on-disk .lsr fallback
 */
app.post('/api/run-submechanism', authenticateUser, async (req, res) => {
  const { molecule, rootName, supplement, runRoot } = req.body;
  const customMechName = req.body.mechName;
  const uid = req.user?.uid || 'user_default_local';
  const sessionId = req.body.sessionId || req.headers['x-session-id'] || 'default_session';
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);

  console.log(`\n================================================================================`);
  console.log(`[RunSubmechanism] === Incoming Request [Job: ${jobId}] ===`);
  console.log(`  User UID:      ${uid}`);
  console.log(`  Molecule:      ${molecule}`);
  console.log(`  RootName:      ${rootName}`);
  console.log(`  CustomMech:    ${customMechName || '(auto)'}`);
  console.log(`  Supplement:    ${supplement || '(none)'}`);
  console.log(`  RunRoot:       ${runRoot || 'read'}`);
  console.log(`================================================================================`);

  if (!molecule || !rootName) {
    console.warn(`[RunSubmechanism 400] Missing required parameters: molecule='${molecule}', rootName='${rootName}'`);
    return res.status(400).json({
      error: "Request body must contain non-empty 'molecule' and 'rootName' fields.",
      received: { molecule, rootName }
    });
  }

  const mechName = (customMechName && customMechName.trim())
    ? customMechName.trim()
    : `${molecule}-${rootName}`;

  const cleanRootName = path.basename(rootName.replace(/\.lsr$/i, ''));
  const actualRunRoot = runRoot || 'read';
  const initialMolecules = (supplement && supplement.trim())
    ? `${molecule},${supplement.trim()}`
    : molecule;

  try {
    console.log(`[RunSubmechanism 1/5] Hydrating workspace at '${workspaceDir}'...`);
    await hydrateUserWorkspace(uid, workspaceDir);
    console.log(`[RunSubmechanism 1/5] Workspace hydrated successfully.`);

    // 1. Fetch Mechanism Pathway: first check Firestore (Primary single source of truth for pathways)
    console.log(`[RunSubmechanism 2/5] Searching Firestore for pathway '${cleanRootName}'...`);
    const colRef = firestore.collection(`users/${uid}/databases/MechanismPathway/records`);
    let docSnap = await colRef.doc(cleanRootName).get();
    let pathwayData = null;

    if (docSnap.exists) {
      pathwayData = docSnap.data();
      console.log(`  -> Found pathway document directly by ID: users/${uid}/databases/MechanismPathway/records/${cleanRootName}`);
    } else {
      console.log(`  -> Direct doc ID '${cleanRootName}' not found under users/${uid}. Searching by Name/key field...`);
      let querySnap = await colRef.where('Name', '==', cleanRootName).limit(1).get();
      if (querySnap.empty) {
        querySnap = await colRef.where('key', '==', cleanRootName).limit(1).get();
      }
      if (!querySnap.empty) {
        pathwayData = querySnap.docs[0].data();
        console.log(`  -> Found pathway document by Name/key query: doc ID '${querySnap.docs[0].id}'`);
      }
    }

    if (!pathwayData && uid !== 'user_default_local') {
      console.log(`  -> Not found in user '${uid}'. Checking fallback 'user_default_local'...`);
      const defaultColRef = firestore.collection('users/user_default_local/databases/MechanismPathway/records');
      let defSnap = await defaultColRef.doc(cleanRootName).get();
      if (defSnap.exists) {
        pathwayData = defSnap.data();
        console.log(`  -> Found pathway document in users/user_default_local (ID: '${cleanRootName}')`);
      } else {
        let defQuery = await defaultColRef.where('Name', '==', cleanRootName).limit(1).get();
        if (defQuery.empty) defQuery = await defaultColRef.where('key', '==', cleanRootName).limit(1).get();
        if (!defQuery.empty) {
          pathwayData = defQuery.docs[0].data();
          console.log(`  -> Found pathway document in users/user_default_local by query (ID: '${defQuery.docs[0].id}')`);
        }
      }
    }

    let lsrContent = '';
    let lsrSource = 'Firestore';

    if (pathwayData) {
      console.log(`[RunSubmechanism 2/5] Successfully resolved pathway from Firestore. Generating standard .lsr syntax...`);
      lsrContent = generateLsrFromReadChainSet(pathwayData);
      console.log(`  -> Generated LSR content (${lsrContent.length} chars).`);
    } else {
      // Fallback: Check if an on-disk .lsr file exists (e.g. from runStepTest or test-reaction-pattern via /api/save-lsr)
      console.log(`[RunSubmechanism 2/5] Pathway '${cleanRootName}' not found in Firestore. Checking on-disk fallback locations...`);
      const searchDirs = [
        path.join(REACTROOT, 'data', 'mechs', 'submechanisms', `${cleanRootName}.lsr`),
        path.join(REACTROOT, 'data', 'mechs', 'submechanisms', cleanRootName),
        path.join(REACTROOT, 'data', `${cleanRootName}.lsr`),
        path.join(REACTROOT, 'data', cleanRootName),
        path.join(REACTROOT, 'tmp', `${cleanRootName}.lsr`),
        path.join(workspaceDir, `${cleanRootName}.lsr`),
        path.join(REACTROOT, 'data', 'mechs', 'rxnpattests', `${cleanRootName}.lsr`),
        path.join(REACTROOT, 'data', 'runs', `${cleanRootName}.lsr`),
        path.join(REACTROOT, 'data', 'mechs', 'submechanism-orig', `${cleanRootName}.lsr`)
      ];

      let lsrPath = null;
      for (const cand of searchDirs) {
        const candExists = fs.existsSync(cand) && fs.statSync(cand).isFile();
        console.log(`  Candidate: ${cand} -> ${candExists ? 'FOUND' : 'not present'}`);
        if (candExists) {
          lsrPath = cand;
          break;
        }
      }

      if (lsrPath) {
        lsrContent = fs.readFileSync(lsrPath, 'utf8');
        lsrSource = `Disk (${lsrPath})`;
        console.log(`[RunSubmechanism 2/5] Successfully loaded LSR from disk: ${lsrPath} (${lsrContent.length} chars).`);
      } else {
        console.error(`[RunSubmechanism 404 Not Found] Pathway '${cleanRootName}' could NOT be found in Firestore nor at any on-disk candidate location.`);
        cleanupWorkspace(workspaceDir);
        return res.status(404).json({
          error: `Mechanism pathway '${cleanRootName}' not found in Firestore database (users/${uid}/databases/MechanismPathway/records) nor as a .lsr file on disk.`,
          searchedRootName: cleanRootName,
          uid,
          searchedDiskLocations: searchDirs
        });
      }
    }

    // 2. Hydrate ephemeral workspace for chemdb execution
    console.log(`[RunSubmechanism 3/5] Writing LSR and input template files for chemdb...`);
    fs.writeFileSync(path.join(workspaceDir, `${actualRunRoot}.lsr`), lsrContent);
    fs.writeFileSync(path.join(workspaceDir, `${cleanRootName}.lsr`), lsrContent);
    fs.writeFileSync(path.join(REACTROOT, 'data', `${actualRunRoot}.lsr`), lsrContent);
    const tmpDir = path.join(REACTROOT, 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, `${actualRunRoot}.lsr`), lsrContent);

    const templatePath = path.join(REACTROOT, 'programs', 'inputs', 'CallChain.inp');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`CallChain.inp template file missing at ${templatePath}`);
    }
    let callChainTemplate = fs.readFileSync(templatePath, 'utf8');
    callChainTemplate = callChainTemplate.split('XXXXXXXXXX').join(initialMolecules);
    callChainTemplate = callChainTemplate.split('YYYYYYYYYY').join(mechName);

    const jobInpFile = path.join(workspaceDir, `${actualRunRoot}.api.inp`);
    fs.writeFileSync(jobInpFile, callChainTemplate);

    let stdout = '';
    let stderr = '';
    const logFilePath = path.join(workspaceDir, 'execution.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const lsrLogNote = `[Submechanism Run] Target Molecule: ${molecule}, Supplement: ${supplement || 'none'}, Pathway: ${cleanRootName} (Source: ${lsrSource}), Mechanism: ${mechName}\n`;
    logStream.write(lsrLogNote);
    stdout += lsrLogNote;

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');
    const startTime = Date.now();

    if (!fs.existsSync(CHEMDB_BIN)) {
      throw new Error(`chemdb binary missing at ${CHEMDB_BIN}. Build with 'make chemdb' in REACTCLOUD.`);
    }

    console.log(`[RunSubmechanism 4/5] Spawning chemdb binary: ${CHEMDB_BIN}`);
    console.log(`  Args: [${actualRunRoot}, 0, ${commandDir}, ${staticFile}]`);
    console.log(`  Working directory: ${workspaceDir}`);

    const child = spawn(CHEMDB_BIN, [actualRunRoot, '0', commandDir, staticFile], {
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

    console.log(`  -> chemdb child process spawned with PID: ${child.pid}`);

    child.on('error', spawnErr => {
      console.error(`[RunSubmechanism Chemdb Spawn Error] PID ${child?.pid}:`, spawnErr);
    });

    child.stdin.write(callChainTemplate);
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

    child.on('close', async (exitCode, signal) => {
      logStream.end();
      const elapsed = Date.now() - startTime;
      const effectiveExitCode = (exitCode !== null) ? exitCode : (signal ? 139 : 1);
      console.log(`[RunSubmechanism 5/5] chemdb process (PID ${child.pid}) finished in ${elapsed}ms with exitCode: ${exitCode}, signal: ${signal} (effectiveExitCode: ${effectiveExitCode})`);
      if (signal) {
        const sigMsg = `\n[Process Error] chemdb terminated by signal: ${signal}\n`;
        stderr += sigMsg;
        stdout += sigMsg;
      }
      if (stderr && stderr.trim()) {
        console.warn(`  -> chemdb stderr output (${stderr.length} chars):\n${stderr.substring(0, 500)}`);
      }

      // Upload generated artifacts to GCS under users/{uid}/mechanisms/{mechName}/
      console.log(`[RunSubmechanism 5/5] Collecting and uploading generated mechanism artifacts...`);
      const artifactResult = await uploadMechanismArtifacts(uid, mechName, workspaceDir, actualRunRoot).catch(err => {
        console.warn(`[Mechanism Upload Warning]: ${err.message}`);
        return { storageDirectory: `users/${uid}/mechanisms/${mechName}`, gcsPrefix: '', files: [] };
      });
      console.log(`  -> Mechanism artifacts processed: ${artifactResult.files.length} files available.`);

      // Fallback combined text if GCS files are not present
      let combinedOutput = '';
      const readDetail = (ext, title) => {
        const fileInWs = path.join(workspaceDir, `${mechName}${ext}`);
        const fileInTmp = path.join(REACTROOT, 'tmp', `${mechName}${ext}`);
        let content = '';
        if (fs.existsSync(fileInWs)) {
          content = fs.readFileSync(fileInWs, 'utf8');
        } else if (fs.existsSync(fileInTmp)) {
          content = fs.readFileSync(fileInTmp, 'utf8');
        }
        if (content && content.trim()) {
          combinedOutput += `--- ${title} ---\n` + content + '\n\n';
        }
      };

      readDetail('.mech', 'Mechanism Reactions');
      readDetail('.sdf', 'Molecule Structures');
      readDetail('.thm', 'Molecule Thermodynamics');
      readDetail('.corrs', 'Name Correspondences');
      combinedOutput += `--- Execution Log ---\n` + stdout;

      const outputMsg = (artifactResult.files && artifactResult.files.length > 0)
        ? `[Submechanism Generated: ${mechName}] Artifacts stored in Cloud Storage: ${artifactResult.storageDirectory} (${artifactResult.files.length} files).`
        : combinedOutput;

      const resError = (effectiveExitCode !== 0)
        ? (stderr.trim() || `Submechanism run exited with code ${effectiveExitCode}${signal ? ` (Signal: ${signal})` : ''}`)
        : (stderr.trim() || undefined);

      console.log(`[RunSubmechanism Complete] Sending response for '${mechName}' (effectiveExitCode: ${effectiveExitCode}, error: ${resError || 'none'}).`);

      res.json({
        molecule,
        rootName,
        mechName,
        exitCode: effectiveExitCode,
        signal: signal || null,
        storageDirectory: artifactResult.storageDirectory,
        gcsPrefix: artifactResult.gcsPrefix,
        files: artifactResult.files,
        output: outputMsg,
        combinedOutput: combinedOutput,
        executionLog: stdout,
        error: resError
      });

      const classification = classifyJob(req.body, callChainTemplate, '');
      persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, [], {
        mechName,
        molecule,
        rootName,
        storageDirectory: artifactResult.storageDirectory,
        files: artifactResult.files
      })
        .catch(e => console.warn(`[GCS Persist Warning] ${e.message}`))
        .finally(() => cleanupWorkspace(workspaceDir));
    });
  } catch (err) {
    console.error(`[RunSubmechanism Fatal Error] ${err.message}`, err.stack);
    cleanupWorkspace(workspaceDir);
    return res.status(500).json({
      error: `Internal server error in run-submechanism: ${err.message}`,
      stack: err.stack,
      rootName,
    });
  }
});

/**
 * Run combine submechanisms task (/api/run-combine-submechanisms)
 */
app.post('/api/run-combine-submechanisms', authenticateUser, async (req, res) => {
  const { rootName, mechName, submechanisms } = req.body;
  if (!rootName || !mechName || !Array.isArray(submechanisms) || submechanisms.length === 0) {
    return res.status(400).json({ error: "Request body must contain 'rootName', 'mechName', and non-empty 'submechanisms' array." });
  }

  const uid = req.user?.uid || 'user_default_local';
  const sessionId = req.body.sessionId || req.headers['x-session-id'] || 'default_session';
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const workspaceDir = path.join('/tmp', 'reactcloud', 'users', uid, jobId);

  try {
    await hydrateUserWorkspace(uid, workspaceDir);

    const templatePath = path.join(REACTROOT, 'programs', 'inputs', 'CombineMechanisms.inp');
    let templateContent = fs.readFileSync(templatePath, 'utf8');

    const submechLines = submechanisms.join('\n') + '\nQuit';
    templateContent = templateContent.split('XXXXXXXXXX').join(submechLines);
    templateContent = templateContent.split('YYYYYYYYYY').join(mechName);

    const jobInpFile = path.join(workspaceDir, 'combine.inp');
    fs.writeFileSync(jobInpFile, templateContent);

    let stdout = '';
    let stderr = '';
    const logFilePath = path.join(workspaceDir, 'execution.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const commandDir = path.join(REACTROOT, 'command');
    const staticFile = path.join(REACTROOT, 'data', 'stat-inf.dat');
    const startTime = Date.now();

    const child = spawn(CHEMDB_BIN, ['read', '0', commandDir, staticFile], {
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

    child.stdin.write(templateContent);
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

    child.on('close', async (exitCode, signal) => {
      logStream.end();
      const elapsed = Date.now() - startTime;
      const effectiveExitCode = (exitCode !== null) ? exitCode : (signal ? 139 : 1);
      console.log(`[Combine Run Complete] ${jobId} finished in ${elapsed}ms (exitCode: ${exitCode}, signal: ${signal}, effectiveExitCode: ${effectiveExitCode})`);
      if (signal) {
        const sigMsg = `\n[Process Error] chemdb terminated by signal: ${signal}\n`;
        stderr += sigMsg;
        stdout += sigMsg;
      }

      // Upload generated artifacts to GCS under users/{uid}/mechanisms/{mechName}/
      const artifactResult = await uploadMechanismArtifacts(uid, mechName, workspaceDir, 'combine').catch(err => {
        console.warn(`[Combine Upload Warning]: ${err.message}`);
        return { storageDirectory: `users/${uid}/mechanisms/${mechName}`, gcsPrefix: '', files: [] };
      });

      const resError = (effectiveExitCode !== 0)
        ? (stderr.trim() || `Combine submechanisms exited with code ${effectiveExitCode}${signal ? ` (Signal: ${signal})` : ''}`)
        : (stderr.trim() || undefined);

      res.json({
        rootName,
        mechName,
        count: submechanisms.length,
        exitCode: effectiveExitCode,
        signal: signal || null,
        storageDirectory: artifactResult.storageDirectory,
        gcsPrefix: artifactResult.gcsPrefix,
        files: artifactResult.files,
        output: `[Combined Mechanism Generated: ${mechName}] Artifacts stored in Cloud Storage: ${artifactResult.storageDirectory} (${artifactResult.files.length} files).`,
        executionLog: stdout,
        error: resError
      });

      const classification = classifyJob(req.body, templateContent, '');
      persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, [], {
        mechName,
        rootName,
        submechanisms,
        storageDirectory: artifactResult.storageDirectory,
        files: artifactResult.files
      })
        .catch(e => console.warn(`[GCS Persist Warning] ${e.message}`))
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
    let authUid = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token.startsWith('reactcloud-bearer-token')) {
        const match = token.match(/reactcloud-bearer-token-(.+)/);
        authUid = match && match[1] ? match[1].replace(/[^a-zA-Z0-9_-]/g, '_') : 'default';
      } else if (firebaseInitialized) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          authUid = decoded.uid;
        } catch (_) {}
      }
    }

    const { uid = (authUid || 'user_default_local'), dbName, key, keyId, jsonStr } = req.body;
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

    // If saving MechanismPathway under a specific user UID, also sync to user_default_local
    if (dbName === 'MechanismPathway' && uid !== 'user_default_local') {
      const defaultDocPath = `users/user_default_local/databases/${dbName}/records/${key}`;
      await firestore.doc(defaultDocPath).set(recordDoc, { merge: true });
      console.log(`[Firestore DB Store] Synced record to: ${defaultDocPath}`);
    }

    return res.json({ status: 'OK', path: docPath });
  } catch (err) {
    console.error('[Firestore DB Store Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/fetch', async (req, res) => {
  try {
    let authUid = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token.startsWith('reactcloud-bearer-token')) {
        const match = token.match(/reactcloud-bearer-token-(.+)/);
        authUid = match && match[1] ? match[1].replace(/[^a-zA-Z0-9_-]/g, '_') : 'default';
      } else if (firebaseInitialized) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          authUid = decoded.uid;
        } catch (_) {}
      }
    }

    const { uid = (authUid || 'user_default_local'), dbName, type, key } = req.body;
    if (!dbName || key === undefined || key === null) {
      return res.status(400).json({ error: 'Missing required parameters: dbName, key' });
    }

    const isInt = type === 'int' || (typeof key === 'number') || (type !== 'string' && !isNaN(key) && Number.isInteger(Number(key)));
    const keyStr = String(key);
    const keyNum = Number(key);

    const findInCollection = async (targetUid) => {
      const colRef = firestore.collection(`users/${targetUid}/databases/${dbName}/records`);
      const directRef = colRef.doc(keyStr);
      const directSnap = await directRef.get();
      if (directSnap.exists) return directSnap.data();

      if (isInt) {
        let q = await colRef.where('ID', '==', keyNum).limit(1).get();
        if (q.empty) q = await colRef.where('keyId', '==', keyNum).limit(1).get();
        if (!q.empty) return q.docs[0].data();
      } else {
        let q = await colRef.where('Name', '==', keyStr).limit(1).get();
        if (q.empty) q = await colRef.where('key', '==', keyStr).limit(1).get();
        if (!q.empty) return q.docs[0].data();
      }
      return null;
    };

    let docData = await findInCollection(uid);
    if (!docData && uid !== 'user_default_local') {
      docData = await findInCollection('user_default_local');
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

/**
 * Search Reaction Patterns by Reactive Center Encodings
 * Supports:
 *   - reactionCenterKey (exact composite match)
 *   - reactionBrokenBonds (array-contains)
 *   - reactionFormedBonds (array-contains)
 *   - hybrid broken + formed (array-contains + in-memory filter)
 */
app.post('/api/db/searchRxnPatternsByCenter', async (req, res) => {
  try {
    const {
      uid = 'user_default_local',
      reactionCenterKey,
      reactionBrokenBonds,
      reactionFormedBonds
    } = req.body;

    const colRef = firestore.collection(`users/${uid}/databases/ReactionPatterns/records`);
    let querySnap;

    const bBond = Array.isArray(reactionBrokenBonds) ? reactionBrokenBonds[0] : reactionBrokenBonds;
    const fBond = Array.isArray(reactionFormedBonds) ? reactionFormedBonds[0] : reactionFormedBonds;

    if (reactionCenterKey) {
      querySnap = await colRef.where('reactionCenterKey', '==', String(reactionCenterKey)).get();
    } else if (bBond) {
      querySnap = await colRef.where('reactionBrokenBonds', 'array-contains', String(bBond)).get();
    } else if (fBond) {
      querySnap = await colRef.where('reactionFormedBonds', 'array-contains', String(fBond)).get();
    } else {
      return res.status(400).json({
        error: 'Must provide at least one search parameter: reactionCenterKey, reactionBrokenBonds, or reactionFormedBonds'
      });
    }

    let records = [];
    querySnap.forEach(doc => {
      records.push({ id: doc.id, ...doc.data() });
    });

    // In-memory filter if both broken and formed were provided without a composite center key
    if (!reactionCenterKey && bBond && fBond) {
      records = records.filter(d =>
        Array.isArray(d.reactionFormedBonds) && d.reactionFormedBonds.includes(String(fBond))
      );
    }

    console.log(`[Firestore SearchRxnPatternsByCenter] Query: center='${reactionCenterKey || ''}', broken='${bBond || ''}', formed='${fBond || ''}', count=${records.length}, uid='${uid}'`);

    return res.json({
      success: true,
      count: records.length,
      records: records
    });
  } catch (err) {
    console.error('[Firestore SearchRxnPatternsByCenter Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/delete', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName, key } = req.body;
    if (!dbName || !key) {
      return res.status(400).json({ error: 'Missing required parameters: dbName, key' });
    }
    const docPath = `users/${uid}/databases/${dbName}/records/${key}`;
    await firestore.doc(docPath).delete();
    console.log(`[Firestore DB Delete] Deleted record: ${docPath}`);
    return res.json({ status: 'OK', path: docPath });
  } catch (err) {
    console.error('[Firestore DB Delete Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Atomic Unique ID Generator
 * Allocates monotonically increasing unique integer IDs per database collection.
 */
app.post('/api/db/generateNextID', async (req, res) => {
  try {
    const { uid = 'user_default_local', dbName, startAt = 10000 } = req.body;
    if (!dbName) {
      return res.status(400).json({ error: 'Missing required parameter: dbName' });
    }

    const counterRef = firestore.doc(`users/${uid}/databases/${dbName}/metadata/counter`);

    let allocatedId = 0;
    await firestore.runTransaction(async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let currentId = Number(startAt) - 1;
      if (counterSnap.exists) {
        const data = counterSnap.data();
        if (typeof data.nextID === 'number') {
          currentId = data.nextID - 1;
        }
      }
      allocatedId = currentId + 1;
      if (allocatedId < Number(startAt)) {
        allocatedId = Number(startAt);
      }
      transaction.set(counterRef, {
        nextID: allocatedId + 1,
        lastAllocatedID: allocatedId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    console.log(`[Firestore GenerateNextID] dbName='${dbName}', allocatedId=${allocatedId}, uid='${uid}'`);
    return res.json({ id: allocatedId, dbName });
  } catch (err) {
    console.error('[Firestore GenerateNextID Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Purges all records and/or classifications for a database collection.
 */
app.post('/api/db/purgeCollection', async (req, res) => {
  try {
    const {
      uid = 'user_default_local',
      dbName,
      purgeClassifications = true,
      classificationName,
      resetCounter = true,
      startAt = 10000
    } = req.body;

    if (!dbName) {
      return res.status(400).json({ error: 'Missing required parameter: dbName' });
    }

    // 1. Delete all records under users/${uid}/databases/${dbName}/records
    const recordsCol = firestore.collection(`users/${uid}/databases/${dbName}/records`);
    const recordsSnap = await recordsCol.get();
    let deletedRecordsCount = 0;
    const batchSize = 400;
    for (let i = 0; i < recordsSnap.docs.length; i += batchSize) {
      const batch = firestore.batch();
      recordsSnap.docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deletedRecordsCount += recordsSnap.docs.slice(i, i + batchSize).length;
    }

    // 2. Optionally delete classifications
    let deletedClassCount = 0;
    if (purgeClassifications) {
      const classColName = classificationName || (
        dbName === 'ReactionPatterns' ? 'DB-Index-PatternIDs' :
        (dbName === 'Molecules' ? 'DB-Index-MoleculeIDs' :
        (dbName === 'Substructures' ? 'DB-Index-SubStructureIDs' :
        (dbName === 'Reactions' ? 'DB-Index-ReactionIDs' : '')))
      );
      if (classColName) {
        const classCol = firestore.collection(`users/${uid}/classifications/database/${classColName}`);
        const classSnap = await classCol.get();
        for (let i = 0; i < classSnap.docs.length; i += batchSize) {
          const batch = firestore.batch();
          classSnap.docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          deletedClassCount += classSnap.docs.slice(i, i + batchSize).length;
        }
      }
    }

    // 3. Reset counter & initialize metadata
    if (resetCounter) {
      const counterRef = firestore.doc(`users/${uid}/databases/${dbName}/metadata/counter`);
      await counterRef.set({
        nextID: Number(startAt),
        lastAllocatedID: 0,
        description: `Monotonically increasing unique integer ID counter for ${dbName} database`,
        updatedAt: new Date().toISOString()
      });

      const infoRef = firestore.doc(`users/${uid}/databases/${dbName}/metadata/databaseInfo`);
      await infoRef.set({
        dbName: String(dbName),
        classificationName: String(classColName || ''),
        startAt: Number(startAt),
        description: `REACTCLOUD ${dbName} database with unique sequential IDs`,
        status: 'INITIALIZED',
        recordCount: 0,
        classificationCount: 0,
        initializedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 4. Optionally clear search keys
    try {
      const searchKeyRef = firestore.doc(`users/${uid}/searchkeys/${dbName}`);
      const skSnap = await searchKeyRef.get();
      if (skSnap.exists) {
        await searchKeyRef.delete();
      }
    } catch (e) {
      console.warn(`[Firestore PurgeCollection] SearchKeys cleanup warning for ${dbName}:`, e.message);
    }

    console.log(`[Firestore PurgeCollection] dbName='${dbName}', deletedRecords=${deletedRecordsCount}, deletedClassDocs=${deletedClassCount}`);
    return res.json({
      success: true,
      dbName,
      deletedRecords: deletedRecordsCount,
      deletedClassDocs: deletedClassCount,
      counterResetTo: Number(startAt)
    });
  } catch (err) {
    console.error('[Firestore PurgeCollection Error]', err.message);
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
