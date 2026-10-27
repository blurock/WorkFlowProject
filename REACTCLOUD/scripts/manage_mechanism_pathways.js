#!/usr/bin/env node
/**
 * Mechanism Pathway Migration & Management Tool
 *
 * Capabilities:
 *   - Parses REACT .lsr pathway files according to core chemdb standard (readchain.c).
 *   - Tests format validation across data/mechs/submechanisms.
 *   - Generates/updates data/mechs/submechanisms/MIGRATION_STATUS.md.
 *   - Seeds all valid pathways into Firestore (users/{uid}/databases/MechanismPathway/records).
 *   - Seeds/uploads a single pathway by filename or pathway name.
 *
 * Usage:
 *   node manage_mechanism_pathways.js --test                  # Dry-run test & update MIGRATION_STATUS.md
 *   node manage_mechanism_pathways.js --report                # Regenerate MIGRATION_STATUS.md table
 *   node manage_mechanism_pathways.js --file <path_or_name>   # Upload single pathway to Firestore
 *   node manage_mechanism_pathways.js --all                   # Upload all valid pathways to Firestore
 *   node manage_mechanism_pathways.js --uid <custom_uid>      # Specify Firestore user UID (default: user_default_local)
 */

const fs = require('fs');
const path = require('path');

// Resolve @google-cloud/firestore from orchestrator/node_modules
const orchestratorNodeModules = path.resolve(__dirname, '..', 'orchestrator', 'node_modules');
const { Firestore } = require(path.join(orchestratorNodeModules, '@google-cloud/firestore'));

const PROJECT_ID = process.env.GCP_PROJECT || 'blurock-database';
const REACTROOT = process.env.REACTROOT || path.resolve(__dirname, '..');
const SUBMECHS_DIR = path.join(REACTROOT, 'data', 'mechs', 'submechanisms');
const STATUS_MD_PATH = path.join(SUBMECHS_DIR, 'MIGRATION_STATUS.md');

// Parse CLI options
const args = process.argv.slice(2);
let uid = process.env.REACT_USER_UID || process.env.REACT_USER_ID || 'user_default_local';
let mode = 'test'; // 'test' | 'all' | 'file' | 'report'
let targetFile = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--uid' && args[i + 1]) {
    uid = args[i + 1];
    i++;
  } else if (arg === '--test' || arg === '--dry-run') {
    mode = 'test';
  } else if (arg === '--all') {
    mode = 'all';
  } else if (arg === '--report') {
    mode = 'report';
  } else if ((arg === '--file' || arg === '-f') && args[i + 1]) {
    mode = 'file';
    targetFile = args[i + 1];
    i++;
  } else if (!arg.startsWith('-') && !targetFile) {
    mode = 'file';
    targetFile = arg;
  }
}

/**
 * Strict parser replicating readchain.c logical line joining and syntax checks.
 */
function parseLsrContent(content, filename) {
  const rawLines = content.split(/\r?\n/);
  const logicalLines = [];
  let currentLogical = '';
  let currentStartLine = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();
    if (currentLogical === '') {
      if (raw === '' || raw.startsWith('%%')) continue;
      currentStartLine = i + 1;
    } else {
      if (raw.startsWith('%%')) continue;
    }

    let lineContent = raw;
    const hasCont = lineContent.endsWith('\\');
    if (hasCont) {
      lineContent = lineContent.slice(0, -1).trim();
    }

    currentLogical += (currentLogical ? '' : '') + lineContent;

    if (!hasCont) {
      logicalLines.push({ text: currentLogical, lineNum: currentStartLine });
      currentLogical = '';
    }
  }

  if (currentLogical !== '') {
    logicalLines.push({ text: currentLogical, lineNum: currentStartLine });
  }

  if (logicalLines.length === 0) {
    return { success: false, error: 'Empty file (no active lines)', stepsCount: 0 };
  }

  // Canonical name from filename (without .lsr)
  const canonicalName = path.basename(filename).replace(/\.lsr$/i, '').trim();

  // Line 1: Pathway Title / Name
  const line1 = logicalLines[0].text.trim();
  let title = line1;
  let description = '';
  if (line1.includes(':')) {
    const parts = line1.split(':');
    title = parts[0].trim();
    description = parts.slice(1).join(':').trim();
  }

  if (logicalLines.length < 2) {
    return {
      success: false,
      error: 'Missing line 2 (auxiliary molecules line) and reaction steps',
      pathwayName: canonicalName,
      title,
      description,
      stepsCount: 0
    };
  }

  // Line 2: Global Auxiliary Molecules (ExtraMolecules)
  const line2 = logicalLines[1].text.trim();
  const extraMols = (line2 === 'NONE' || line2 === '')
    ? []
    : line2.split(',').map(s => s.trim()).filter(Boolean);

  // Logical Lines 3+: Steps
  const steps = [];
  for (let i = 2; i < logicalLines.length; i++) {
    const stepText = logicalLines[i].text.trim();
    if (!stepText) continue;

    if (stepText.startsWith(':')) {
      return {
        success: false,
        error: `Format error on line ${logicalLines[i].lineNum}: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\\' on preceding line?)`,
        pathwayName: canonicalName,
        title,
        description,
        stepsCount: steps.length
      };
    }

    let rxnPart = stepText;
    let molPart = '';
    if (stepText.includes(':')) {
      const parts = stepText.split(':');
      rxnPart = parts[0];
      molPart = parts.slice(1).join(':');
    }

    const rxns = rxnPart.split(',').map(r => r.trim()).filter(Boolean);
    const stepMols = molPart ? molPart.split(',').map(m => m.trim()).filter(Boolean) : [];

    if (rxns.length === 0) {
      return {
        success: false,
        error: `Format error on line ${logicalLines[i].lineNum}: Step ${steps.length + 1} contains 0 reaction patterns`,
        pathwayName: canonicalName,
        title,
        description,
        stepsCount: steps.length
      };
    }

    steps.push({
      ID: steps.length,
      Name: `Step ${steps.length + 1}`,
      Reactions: {
        NumberOfReactions: rxns.length,
        Reactions: rxns.map((r, idx) => ({ ID: idx, Name: r }))
      },
      Molecules: {
        NumberOfMolecules: stepMols.length,
        Molecules: stepMols.map((m, idx) => ({ ID: idx, Name: m }))
      }
    });
  }

  if (steps.length === 0) {
    return {
      success: false,
      error: 'Mechanism pathway contains 0 reaction steps',
      pathwayName: canonicalName,
      title,
      description,
      stepsCount: 0
    };
  }

  // Compile totals
  const molMap = new Map();
  const rxnMap = new Map();

  extraMols.forEach((m, idx) => {
    if (m && !molMap.has(m)) molMap.set(m, molMap.size);
  });

  steps.forEach(step => {
    step.Molecules.Molecules.forEach(m => {
      if (m.Name && !molMap.has(m.Name)) molMap.set(m.Name, molMap.size);
    });
    step.Reactions.Reactions.forEach(r => {
      if (r.Name && !rxnMap.has(r.Name)) rxnMap.set(r.Name, rxnMap.size);
    });
  });

  const totalMols = Array.from(molMap.entries()).map(([Name, ID]) => ({ ID, Name }));
  const totalRxns = Array.from(rxnMap.entries()).map(([Name, ID]) => ({ ID, Name }));

  const readChainSet = {
    ID: 0,
    key: canonicalName,
    Name: canonicalName,
    Title: title,
    Description: description,
    NumberOfSteps: steps.length,
    ExtraMolecules: {
      NumberOfMolecules: extraMols.length,
      Molecules: extraMols.map((m, idx) => ({ ID: idx, Name: m }))
    },
    Steps: steps,
    Molecules: {
      NumberOfMolecules: totalMols.length,
      Molecules: totalMols
    },
    Reactions: {
      NumberOfReactions: totalRxns.length,
      Reactions: totalRxns
    },
    sourceFile: path.basename(filename)
  };

  return {
    success: true,
    pathwayName: canonicalName,
    title,
    description,
    stepsCount: steps.length,
    extraMols,
    totalMolsCount: totalMols.length,
    totalRxnsCount: totalRxns.length,
    readChainSet
  };
}

/**
 * Generate standard Markdown Status Table
 */
function generateMarkdownTable(results) {
  const successList = results.filter(r => r.success);
  const failList = results.filter(r => !r.success);

  let md = `# REACTCLOUD Mechanism Pathway Migration Status Report\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Total Pathway Files Evaluated**: ${results.length}\n`;
  md += `**Valid Pathways (Ready for Firestore)**: ${successList.length} (${Math.round((successList.length / results.length) * 100)}%)\n`;
  md += `**Malformed Files (Requiring Format Fix)**: ${failList.length}\n\n`;

  md += `> [!NOTE]\n`;
  md += `> Mechanism pathways loaded into Firestore under \`users/{uid}/databases/MechanismPathway/records/{Name}\`.\n`;
  md += `> Malformed files require missing continuation backslashes (\`\\\`) or reaction step definitions to be corrected before upload.\n\n`;

  if (failList.length > 0) {
    md += `## ⚠️ Malformed Files (${failList.length} Files)\n\n`;
    md += `These files failed validation and were **not** seeded to Firestore. You can fix the syntax and seed individually using:\n`;
    md += `\`\`\`bash\nnode scripts/manage_mechanism_pathways.js --file <filename>.lsr\n\`\`\`\n\n`;
    md += `| File Name | Detected Title | Error Description |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const item of failList) {
      md += `| \`${item.file}\` | ${item.title || 'N/A'} | ${item.error} |\n`;
    }
    md += `\n---\n\n`;
  }

  md += `## ✅ Successfully Parsed Pathways (${successList.length} Files)\n\n`;
  md += `| # | Pathway Key (Name) | Steps | Aux Molecules | Patterns | Molecules | File Name |\n`;
  md += `| :---: | :--- | :---: | :--- | :---: | :---: | :--- |\n`;

  successList.forEach((item, index) => {
    const auxStr = item.extraMols.length > 0 ? item.extraMols.join(', ') : '*None*';
    md += `| ${index + 1} | **${item.pathwayName}** | ${item.stepsCount} | ${auxStr} | ${item.totalRxnsCount} | ${item.totalMolsCount} | \`${item.file}\` |\n`;
  });

  md += `\n`;
  return md;
}

/**
 * Main Execution Controller
 */
async function main() {
  console.log(`========================================================================`);
  console.log(`REACTCLOUD Mechanism Pathway Manager`);
  console.log(`Target Firestore Project: ${PROJECT_ID}`);
  console.log(`User UID:                ${uid}`);
  console.log(`Mode:                    ${mode.toUpperCase()}`);
  console.log(`========================================================================\n`);

  if (!fs.existsSync(SUBMECHS_DIR)) {
    console.error(`ERROR: Submechanisms directory not found: ${SUBMECHS_DIR}`);
    process.exit(1);
  }

  // Handle single file upload
  if (mode === 'file') {
    let resolvedPath = targetFile;
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.join(SUBMECHS_DIR, targetFile);
      if (!fs.existsSync(resolvedPath) && !resolvedPath.endsWith('.lsr')) {
        resolvedPath = path.join(SUBMECHS_DIR, `${targetFile}.lsr`);
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      console.error(`ERROR: Could not find file '${targetFile}' (checked ${resolvedPath})`);
      process.exit(1);
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    const filename = path.basename(resolvedPath);
    console.log(`Parsing pathway file: ${filename}...`);
    const parsed = parseLsrContent(content, filename);

    if (!parsed.success) {
      console.error(`\n❌ FAILED to parse pathway '${filename}':`);
      console.error(`   ${parsed.error}\n`);
      process.exit(1);
    }

    console.log(`✅ Successfully parsed pathway '${parsed.pathwayName}':`);
    console.log(`   Steps:               ${parsed.stepsCount}`);
    console.log(`   Auxiliary Molecules: ${parsed.extraMols.join(', ') || 'NONE'}`);
    console.log(`   Total Patterns:      ${parsed.totalRxnsCount}`);
    console.log(`   Total Molecules:     ${parsed.totalMolsCount}`);

    console.log(`\nUploading to Firestore: users/${uid}/databases/MechanismPathway/records/${parsed.pathwayName}...`);
    const firestore = new Firestore({ projectId: PROJECT_ID });
    const docRef = firestore.doc(`users/${uid}/databases/MechanismPathway/records/${parsed.pathwayName}`);

    await docRef.set({
      ...parsed.readChainSet,
      dbName: 'MechanismPathway',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`🚀 Upload complete! Document successfully stored in Firestore.`);
    return;
  }

  // Scan all .lsr files in directory
  const files = fs.readdirSync(SUBMECHS_DIR)
    .filter(f => f.endsWith('.lsr') && !f.startsWith('#') && !f.endsWith('~'))
    .sort();

  console.log(`Found ${files.length} pathway (.lsr) files in ${SUBMECHS_DIR}`);
  const results = [];

  for (const file of files) {
    const filePath = path.join(SUBMECHS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseLsrContent(content, file);
    results.push({ file, ...parsed });
  }

  const successList = results.filter(r => r.success);
  const failList = results.filter(r => !r.success);

  console.log(`Validation summary: ${successList.length} valid, ${failList.length} malformed/failed.`);

  // Write Status Markdown table
  const mdReport = generateMarkdownTable(results);
  fs.writeFileSync(STATUS_MD_PATH, mdReport, 'utf8');
  console.log(`Status report written to: ${STATUS_MD_PATH}`);

  if (mode === 'all') {
    console.log(`\nSeeding ${successList.length} valid pathways into Firestore under uid='${uid}'...`);
    const firestore = new Firestore({ projectId: PROJECT_ID });
    let uploadedCount = 0;

    for (const item of successList) {
      const docRef = firestore.doc(`users/${uid}/databases/MechanismPathway/records/${item.pathwayName}`);
      await docRef.set({
        ...item.readChainSet,
        dbName: 'MechanismPathway',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      uploadedCount++;
      if (uploadedCount % 10 === 0 || uploadedCount === successList.length) {
        console.log(`  [${uploadedCount}/${successList.length}] Uploaded '${item.pathwayName}'`);
      }
    }

    console.log(`\n🎉 Seeding complete! ${uploadedCount} mechanism pathways are now live in Firestore!`);
  } else {
    console.log(`\n(Dry-run/Test mode: No Firestore documents were modified. Run with --all to seed to Firestore.)`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
