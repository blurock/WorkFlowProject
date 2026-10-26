#!/usr/bin/env node
/**
 * Query Reaction Patterns in Firestore by Reactive Center
 * Demonstrates exact Firestore queries and outputs matching reaction patterns.
 *
 * Usage:
 *   node query_reaction_patterns.js --center "B:C:N:SSS_H:N:_F:H:N:_O:N:S"
 *   node query_reaction_patterns.js --broken "C:N:SSS_H:N:"
 *   node query_reaction_patterns.js --formed "H:N:_O:N:S"
 *   node query_reaction_patterns.js --broken "C:N:SSS_H:N:" --formed "H:N:_O:N:S"
 */

const path = require('path');
const orchestratorNodeModules = path.resolve(__dirname, '..', 'orchestrator', 'node_modules');
const { Firestore } = require(path.join(orchestratorNodeModules, '@google-cloud/firestore'));

const PROJECT_ID = process.env.GCP_PROJECT || 'blurock-database';
const args = process.argv.slice(2);

let uid = 'user_default_local';
let centerKey = '';
let brokenBond = '';
let formedBond = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--center' && args[i + 1]) {
    centerKey = args[i + 1].trim();
    i++;
  } else if (args[i] === '--broken' && args[i + 1]) {
    brokenBond = args[i + 1].trim();
    i++;
  } else if (args[i] === '--formed' && args[i + 1]) {
    formedBond = args[i + 1].trim();
    i++;
  } else if (args[i] === '--uid' && args[i + 1]) {
    uid = args[i + 1].trim();
    i++;
  }
}

if (!centerKey && !brokenBond && !formedBond) {
  console.log(`
Usage:
  node query_reaction_patterns.js [options]

Options:
  --center <key>    Query by exact composite reaction center key (e.g. "B:C:N:SSS_H:N:_F:H:N:_O:N:S")
  --broken <bond>   Query patterns that break this bond (e.g. "C:N:SSS_H:N:")
  --formed <bond>   Query patterns that form this bond (e.g. "H:N:_O:N:S")
  --uid <uid>       Firestore user ID (default: "user_default_local")

Examples:
  node query_reaction_patterns.js --broken "C:N:SSS_H:N:"
  node query_reaction_patterns.js --formed "H:N:_O:N:S"
  node query_reaction_patterns.js --center "B:C:N:SSS_H:N:_F:H:N:_O:N:S"
`);
  process.exit(0);
}

async function executeQuery() {
  const firestore = new Firestore({ projectId: PROJECT_ID });
  const collectionPath = `users/${uid}/databases/ReactionPatterns/records`;
  const colRef = firestore.collection(collectionPath);

  console.log(`========================================================================`);
  console.log(`Firestore Reaction Pattern Search`);
  console.log(`Project:         ${PROJECT_ID}`);
  console.log(`Collection Path: ${collectionPath}`);
  console.log(`========================================================================\n`);

  let queryDescription = '';
  let queryPromise;
  const startTime = Date.now();

  // 1. Exact composite key query (O(1) direct index lookup)
  if (centerKey) {
    queryDescription = `colRef.where('reactionCenterKey', '==', '${centerKey}')`;
    console.log(`[Firestore Query Execution]:`);
    console.log(`  const snapshot = await firestore\n    .collection('${collectionPath}')\n    .where('reactionCenterKey', '==', '${centerKey}')\n    .get();\n`);
    queryPromise = colRef.where('reactionCenterKey', '==', centerKey).get();
  }
  // 2. Both broken & formed specified, but partial/multi-bond
  else if (brokenBond && formedBond) {
    // Note: Firestore does not allow two array-contains clauses in one query.
    // Query on broken bonds first, then in-memory filter formed bonds on the resulting candidates.
    queryDescription = `colRef.where('reactionBrokenBonds', 'array-contains', '${brokenBond}') + in-memory filter: reactionFormedBonds.includes('${formedBond}')`;
    console.log(`[Firestore Query Execution (Hybrid Array-Contains + In-Memory Filter)]:`);
    console.log(`  // Query Firestore on broken bond (returns <= 20 candidate docs):`);
    console.log(`  const snapshot = await firestore\n    .collection('${collectionPath}')\n    .where('reactionBrokenBonds', 'array-contains', '${brokenBond}')\n    .get();`);
    console.log(`  // In-memory filter on formed bond:\n  const matches = snapshot.docs.filter(d => d.data().reactionFormedBonds?.includes('${formedBond}'));\n`);
    queryPromise = colRef.where('reactionBrokenBonds', 'array-contains', brokenBond).get();
  }
  // 3. Broken bond only
  else if (brokenBond) {
    queryDescription = `colRef.where('reactionBrokenBonds', 'array-contains', '${brokenBond}')`;
    console.log(`[Firestore Query Execution]:`);
    console.log(`  const snapshot = await firestore\n    .collection('${collectionPath}')\n    .where('reactionBrokenBonds', 'array-contains', '${brokenBond}')\n    .get();\n`);
    queryPromise = colRef.where('reactionBrokenBonds', 'array-contains', brokenBond).get();
  }
  // 4. Formed bond only
  else if (formedBond) {
    queryDescription = `colRef.where('reactionFormedBonds', 'array-contains', '${formedBond}')`;
    console.log(`[Firestore Query Execution]:`);
    console.log(`  const snapshot = await firestore\n    .collection('${collectionPath}')\n    .where('reactionFormedBonds', 'array-contains', '${formedBond}')\n    .get();\n`);
    queryPromise = colRef.where('reactionFormedBonds', 'array-contains', formedBond).get();
  }

  const snapshot = await queryPromise;
  const fetchTime = Date.now() - startTime;

  let docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // In-memory filter for hybrid case
  if (brokenBond && formedBond) {
    docs = docs.filter(d => Array.isArray(d.reactionFormedBonds) && d.reactionFormedBonds.includes(formedBond));
  }

  console.log(`[Query Results]:`);
  console.log(`  Fetched: ${snapshot.size} candidate doc(s) in ${fetchTime}ms.`);
  console.log(`  Matched: ${docs.length} reaction pattern(s) matching criteria.\n`);

  if (docs.length === 0) {
    console.log(`No reaction patterns found matching query: ${queryDescription}`);
    console.log(`Tip: If records haven't been backfilled to Firestore, run:\n  node backfill_reaction_pattern_encodings.js\n`);
    return;
  }

  console.log(`--------------------------------------------------------------------------------------------------------------------------------`);
  console.log(`Name                                               | ID     | Equation (Reactants = Products)`);
  console.log(`--------------------------------------------------------------------------------------------------------------------------------`);
  docs.forEach(d => {
    const rawName = String(d.Name || d.key || d.id || '');
    const padName = rawName.padEnd(50).substring(0, 50);
    const idStr = String(d.ID || d.keyId || 0).padEnd(6);
    const eq = `${(d.reactants || []).join(' + ')} = ${(d.products || []).join(' + ')}`;
    console.log(`${padName} | ${idStr} | ${eq}`);
    if (d.reactionBrokenBonds && d.reactionBrokenBonds.length > 0) {
      console.log(`    Broken Bonds: ${d.reactionBrokenBonds.join(', ')}`);
    }
    if (d.reactionFormedBonds && d.reactionFormedBonds.length > 0) {
      console.log(`    Formed Bonds: ${d.reactionFormedBonds.join(', ')}`);
    }
    console.log(`--------------------------------------------------------------------------------------------------------------------------------`);
  });
}

executeQuery().catch(err => {
  console.error(`Error querying Firestore:`, err.message);
  process.exit(1);
});
