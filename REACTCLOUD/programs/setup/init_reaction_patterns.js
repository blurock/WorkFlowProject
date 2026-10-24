#!/usr/bin/env node
/**
 * init_reaction_patterns.js
 * 
 * Initializes the ReactionPatterns database in Firestore:
 * - Deletes all existing records in /users/{uid}/databases/ReactionPatterns/records
 * - Deletes all existing classification docs in /users/{uid}/classifications/database/DB-Index-PatternIDs
 * - Clears search keys in /users/{uid}/searchkeys/ReactionPatterns
 * - Sets up metadata:
 *     - /users/{uid}/databases/ReactionPatterns/metadata/counter (nextID: 10000)
 *     - /users/{uid}/databases/ReactionPatterns/metadata/databaseInfo
 */

const path = require('path');
const fs = require('fs');

// Attempt to resolve Firestore SDK from local or orchestrator node_modules
let Firestore;
try {
  Firestore = require('@google-cloud/firestore').Firestore;
} catch (e1) {
  try {
    const orchestratorPath = path.resolve(__dirname, '../../orchestrator/node_modules/@google-cloud/firestore');
    Firestore = require(orchestratorPath).Firestore;
  } catch (e2) {
    console.error('ERROR: Could not resolve @google-cloud/firestore SDK:', e2.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${name}` && i + 1 < args.length) return args[i + 1];
    if (args[i].startsWith(`--${name}=`)) return args[i].split('=')[1];
  }
  return defaultValue;
}

const uid = getArg('uid', process.env.REACT_USER_UID || 'UOqk0KtFtaXma5TGsi8Seh9RMbx1');
const startAt = parseInt(getArg('start-at', '10000'), 10);
const dryRun = args.includes('--dry-run');
const projectId = getArg('project', process.env.GCP_PROJECT || 'blurock-database');

console.log('================================================================');
console.log(' REACTCLOUD Reaction Patterns Database Initialization');
console.log('================================================================');
console.log(` Target GCP Project : ${projectId}`);
console.log(` Target User UID    : ${uid}`);
console.log(` Starting Unique ID : ${startAt}`);
console.log(` Dry Run Mode       : ${dryRun ? 'YES (No changes will be written)' : 'NO (Live Firestore changes)'}`);
console.log('----------------------------------------------------------------');

const firestore = new Firestore({ projectId });

async function deleteCollectionBatch(colRef, name) {
  process.stdout.write(`Fetching '${name}'... `);
  const snap = await colRef.get();
  console.log(`found ${snap.docs.length} documents.`);
  
  if (dryRun || snap.docs.length === 0) {
    return snap.docs.length;
  }

  const batchSize = 400;
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const chunk = snap.docs.slice(i, i + batchSize);
    const batch = firestore.batch();
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += chunk.length;
    process.stdout.write(`Deleted ${deleted}/${snap.docs.length} documents...\r`);
  }
  console.log(`\nSuccessfully deleted ${deleted} documents in '${name}'.`);
  return deleted;
}

async function run() {
  try {
    // 1. Delete ReactionPatterns records
    const recordsCol = firestore.collection(`users/${uid}/databases/ReactionPatterns/records`);
    const deletedRecords = await deleteCollectionBatch(recordsCol, 'ReactionPatterns/records');

    // 2. Delete DB-Index-PatternIDs classifications
    const classCol = firestore.collection(`users/${uid}/classifications/database/DB-Index-PatternIDs`);
    const deletedClasses = await deleteCollectionBatch(classCol, 'DB-Index-PatternIDs classifications');

    // 3. Clear SearchKeys
    const searchKeysDoc = firestore.doc(`users/${uid}/searchkeys/ReactionPatterns`);
    const skSnap = await searchKeysDoc.get();
    if (skSnap.exists) {
      if (!dryRun) {
        await searchKeysDoc.delete();
      }
      console.log(`Deleted search keys document: users/${uid}/searchkeys/ReactionPatterns`);
    }

    // 4. Set up Metadata & Counter
    const now = new Date().toISOString();
    const counterDoc = firestore.doc(`users/${uid}/databases/ReactionPatterns/metadata/counter`);
    const infoDoc = firestore.doc(`users/${uid}/databases/ReactionPatterns/metadata/databaseInfo`);

    if (!dryRun) {
      await counterDoc.set({
        nextID: startAt,
        lastAllocatedID: 0,
        description: 'Monotonically increasing unique integer ID counter for ReactionPatterns database',
        updatedAt: now
      });

      await infoDoc.set({
        dbName: 'ReactionPatterns',
        classificationName: 'DB-Index-PatternIDs',
        startAt: startAt,
        description: 'REACTCLOUD Reaction Patterns database with unique sequential IDs',
        status: 'INITIALIZED',
        recordCount: 0,
        classificationCount: 0,
        initializedAt: now,
        updatedAt: now
      });
      console.log(`Metadata & Counter initialized:`);
      console.log(`  - users/${uid}/databases/ReactionPatterns/metadata/counter (nextID: ${startAt})`);
      console.log(`  - users/${uid}/databases/ReactionPatterns/metadata/databaseInfo`);
    } else {
      console.log(`[Dry Run] Would initialize metadata counter to startAt: ${startAt}`);
    }

    console.log('----------------------------------------------------------------');
    console.log(` Initialization Complete!`);
    console.log(` - Purged Records         : ${deletedRecords}`);
    console.log(` - Purged Classifications : ${deletedClasses}`);
    console.log(` - Next Allocated ID      : ${startAt}`);
    console.log('================================================================');
  } catch (err) {
    console.error('\nERROR during database initialization:', err);
    process.exit(1);
  }
}

run();
