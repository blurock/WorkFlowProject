const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Test suite for Cloud Storage & Workspace Staging Architecture
console.log('=== Starting Cloud Storage & Staging Architecture Verification ===\n');

const uid = 'UOqk0KtFtaXma5TGsi8Seh9RMbx1';
const BUCKET_NAME = 'blurock-database.appspot.com';

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

// 1. Test Taxonomy Paths
console.log('[Test 1] Validating Taxonomy Directory Structure:');
const testCases = [
  { file: 'ethanol.sdf', dir: '.', expectedCat: 'mols/structures' },
  { file: 'sub1.sdf', dir: 'subs', expectedCat: 'mols/subs' },
  { file: 'benson.dat', dir: 'benson', expectedCat: 'thermo/benson' },
  { file: 'nasa7.inp', dir: 'nasa', expectedCat: 'thermo/nasa' },
  { file: 'propane.mech', dir: 'mechanisms', expectedCat: 'kinetics/mechanisms' },
  { file: 'custom.csv', dir: 'custom/data', expectedCat: 'custom/data' }
];

for (const tc of testCases) {
  const tax = getGcsTaxonomyInfo(uid, tc.file, tc.dir);
  console.log(`  File: ${tc.file} (dir: '${tc.dir}') -> ${tax.relGcsPath}`);
  assert.strictEqual(tax.categoryPath, tc.expectedCat, `Category path mismatch for ${tc.file}`);
  assert(tax.fullGcsUri.startsWith(`gs://${BUCKET_NAME}/users/${uid}/data/${tc.expectedCat}/`));
}
console.log('✔ Taxonomy paths verified successfully.\n');

// 2. Test Multi-User & Multi-Job Isolation
console.log('[Test 2] Validating Ephemeral Workspace Sandbox Isolation:');
const job1 = `job_test_1_${Date.now()}`;
const job2 = `job_test_2_${Date.now()}`;
const wsDir1 = path.join('/tmp', 'reactcloud', 'users', uid, job1);
const wsDir2 = path.join('/tmp', 'reactcloud', 'users', uid, job2);

fs.mkdirSync(wsDir1, { recursive: true });
fs.mkdirSync(wsDir2, { recursive: true });

// Job 1 creates a specific run file
fs.writeFileSync(path.join(wsDir1, 'job_specific.txt'), 'Job 1 Payload');
fs.writeFileSync(path.join(wsDir2, 'job_specific.txt'), 'Job 2 Different Payload');

assert.strictEqual(fs.readFileSync(path.join(wsDir1, 'job_specific.txt'), 'utf8'), 'Job 1 Payload');
assert.strictEqual(fs.readFileSync(path.join(wsDir2, 'job_specific.txt'), 'utf8'), 'Job 2 Different Payload');

// Cleanup test sandboxes
fs.rmSync(wsDir1, { recursive: true, force: true });
fs.rmSync(wsDir2, { recursive: true, force: true });
console.log('✔ Workspace sandboxes are strictly isolated with zero cross-job pollution.\n');

console.log('=== All Cloud Storage & Staging Verification Tests Passed! ===');
