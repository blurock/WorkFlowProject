#!/usr/bin/env node
/**
 * Backfill Reaction Pattern Encodings
 * Reads all .lst files in REACTCLOUD/data/rxn/rxnpats, parses their reaction patterns
 * and atom correspondences, computes canonical reactive center encodings, and updates
 * (or creates) Firestore documents under users/{uid}/databases/ReactionPatterns/records.
 *
 * Usage:
 *   node backfill_reaction_pattern_encodings.js [--uid user_default_local] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Resolve modules from orchestrator/node_modules if not in global path
const orchestratorNodeModules = path.resolve(__dirname, '..', 'orchestrator', 'node_modules');
const { Firestore } = require(path.join(orchestratorNodeModules, '@google-cloud/firestore'));
const encoder = require('../orchestrator/reactive_center_encoder');

const PROJECT_ID = process.env.GCP_PROJECT || 'blurock-database';
const REACTROOT = process.env.REACTROOT || path.resolve(__dirname, '..');
const RXNPATS_DIR = path.join(REACTROOT, 'data', 'rxn', 'rxnpats');
const ALL_SDF_PATH = path.join(REACTROOT, 'data', 'mol', 'subs', 'all.sdf');

const args = process.argv.slice(2);
let uid = 'user_default_local';
let isDryRun = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uid' && args[i + 1]) {
    uid = args[i + 1];
    i++;
  } else if (args[i] === '--dry-run') {
    isDryRun = true;
  }
}

console.log(`========================================================================`);
console.log(`REACTCLOUD: Backfill Reaction Pattern Reactive Center Encodings`);
console.log(`Project:  ${PROJECT_ID}`);
console.log(`User UID: ${uid}`);
console.log(`Dry Run:  ${isDryRun ? 'YES (No database writes)' : 'NO (Writing to Firestore)'}`);
console.log(`========================================================================\n`);

async function run() {
  // 1. Load Substructures from all.sdf
  if (!fs.existsSync(ALL_SDF_PATH)) {
    console.error(`Error: Substructure file not found: ${ALL_SDF_PATH}`);
    process.exit(1);
  }

  console.log(`Loading master substructures from: ${ALL_SDF_PATH}...`);
  const allSdfContent = fs.readFileSync(ALL_SDF_PATH, 'utf8');
  const subMap = encoder.parseSdfCollection(allSdfContent);
  console.log(`Loaded ${subMap.size / 2} unique substructure definitions.\n`);

  // 2. Discover all .lst files
  if (!fs.existsSync(RXNPATS_DIR)) {
    console.error(`Error: Reaction patterns directory not found: ${RXNPATS_DIR}`);
    process.exit(1);
  }

  const lstFiles = fs.readdirSync(RXNPATS_DIR).filter(f => f.endsWith('.lst'));
  console.log(`Found ${lstFiles.length} .lst files in ${RXNPATS_DIR}.\n`);

  // 3. Process all reaction patterns
  const firestore = new Firestore({ projectId: PROJECT_ID });
  const colRef = firestore.collection(`users/${uid}/databases/ReactionPatterns/records`);

  let totalPatterns = 0;
  let encodedPatterns = 0;
  let skippedPatterns = 0;
  const processedRecords = [];

  for (const file of lstFiles) {
    const filePath = path.join(RXNPATS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = content.split('$$$$');

    for (const block of blocks) {
      if (!block.trim()) continue;
      const parsed = encoder.parseLstPatternBlock(block);
      if (!parsed.name) continue;

      totalPatterns++;
      const res = encoder.computeReactiveCenterForPattern(parsed, subMap);

      if (res.reactionBrokenBonds.length > 0 || res.reactionFormedBonds.length > 0) {
        encodedPatterns++;
      } else {
        skippedPatterns++;
      }

      processedRecords.push({
        file,
        name: parsed.name,
        id: parsed.id,
        reactants: parsed.reactants,
        products: parsed.products,
        reactionBrokenBonds: res.reactionBrokenBonds,
        reactionFormedBonds: res.reactionFormedBonds,
        reactionCenterKey: res.reactionCenterKey
      });
    }
  }

  console.log(`Parsed ${totalPatterns} reaction patterns across ${lstFiles.length} files.`);
  console.log(`  - With reactive center encodings: ${encodedPatterns}`);
  console.log(`  - Without detected changes/skipped: ${skippedPatterns}\n`);

  // 4. Write/Update Firestore in Batches
  if (!isDryRun) {
    console.log(`Beginning Firestore batch commits to: users/${uid}/databases/ReactionPatterns/records...`);
    const batchSize = 350;
    let committedCount = 0;

    for (let i = 0; i < processedRecords.length; i += batchSize) {
      const chunk = processedRecords.slice(i, i + batchSize);
      const batch = firestore.batch();

      for (const rec of chunk) {
        // Document key is the reaction pattern name (sanitized for firestore doc ID)
        const docKey = rec.name.replace(/\//g, '_');
        const docRef = colRef.doc(docKey);

        const docData = {
          key: docKey,
          keyId: rec.id || 0,
          ID: rec.id || 0,
          Name: rec.name,
          dbName: 'ReactionPatterns',
          sourceFile: rec.file,
          reactants: rec.reactants,
          products: rec.products,
          reactionBrokenBonds: rec.reactionBrokenBonds,
          reactionFormedBonds: rec.reactionFormedBonds,
          reactionCenterKey: rec.reactionCenterKey,
          updatedAt: new Date().toISOString()
        };

        batch.set(docRef, docData, { merge: true });
      }

      await batch.commit();
      committedCount += chunk.length;
      console.log(`  Committed batch: ${committedCount} / ${processedRecords.length} records written.`);
    }

    console.log(`\nSuccessfully backfilled ${committedCount} reaction pattern records in Firestore!`);
  } else {
    console.log(`[DRY RUN COMPLETE] No records written to Firestore.`);
  }

  // 5. Display sample encodings
  console.log(`\nSample Encodings Preview:`);
  console.log(`--------------------------------------------------------------------------------------------------------------------`);
  console.log(`Pattern Name                                       | Center Key`);
  console.log(`--------------------------------------------------------------------------------------------------------------------`);
  processedRecords.filter(r => r.reactionCenterKey).slice(0, 10).forEach(r => {
    const padName = (r.name + '                                                   ').substring(0, 50);
    console.log(`${padName} | ${r.reactionCenterKey}`);
  });
  console.log(`--------------------------------------------------------------------------------------------------------------------\n`);
}

run().catch(err => {
  console.error(`Error executing backfill:`, err);
  process.exit(1);
});
