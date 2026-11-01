#!/usr/bin/env node
/**
 * REACTCLOUD User & Role Management CLI
 *
 * Manages user roles ('admin' | 'researcher' | 'viewer'), account authorization/blocking,
 * and security flags using Firebase Auth Custom Claims and Firestore `users/{uid}` documents
 * without hardcoding any administrator UIDs or emails in application source code.
 *
 * Usage:
 *   node scripts/manage-users.js --list
 *   node scripts/manage-users.js --set-admin <uid-or-email>
 *   node scripts/manage-users.js --set-role <uid-or-email> <admin|researcher|viewer>
 *   node scripts/manage-users.js --block <uid-or-email>
 *   node scripts/manage-users.js --unblock <uid-or-email>
 *   node scripts/manage-users.js --clear-flags <uid-or-email>
 */

const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = process.env.GCP_PROJECT || 'blurock-database';

admin.initializeApp({ projectId: PROJECT_ID });
const firestore = new Firestore({ projectId: PROJECT_ID });

async function resolveUser(identifier) {
  if (!identifier) {
    throw new Error('Missing user UID or email identifier.');
  }
  try {
    if (identifier.includes('@')) {
      return await admin.auth().getUserByEmail(identifier);
    }
    return await admin.auth().getUser(identifier);
  } catch (authErr) {
    // Fallback lookup in Firestore users collection
    if (identifier.includes('@')) {
      const snap = await firestore.collection('users').where('email', '==', identifier).limit(1).get();
      if (!snap.empty) {
        const d = snap.docs[0].data();
        return { uid: snap.docs[0].id, email: d.email, displayName: d.displayName, customClaims: { role: d.role, authorized: d.authorized, blocked: d.blocked } };
      }
    } else {
      const doc = await firestore.collection('users').doc(identifier).get();
      if (doc.exists) {
        const d = doc.data();
        return { uid: doc.id, email: d.email, displayName: d.displayName, customClaims: { role: d.role, authorized: d.authorized, blocked: d.blocked } };
      }
    }
    throw new Error(`Could not resolve user '${identifier}' in Firebase Auth or Firestore: ${authErr.message}`);
  }
}

async function updateUserRoleAndStatus(identifier, updates) {
  const userRecord = await resolveUser(identifier);
  const uid = userRecord.uid;
  const existingClaims = userRecord.customClaims || {};

  const newClaims = {
    ...existingClaims,
    role: updates.role !== undefined ? updates.role : (existingClaims.role || 'researcher'),
    admin: (updates.role !== undefined ? updates.role : existingClaims.role) === 'admin',
    authorized: updates.authorized !== undefined ? Boolean(updates.authorized) : (existingClaims.authorized !== false),
    blocked: updates.blocked !== undefined ? Boolean(updates.blocked) : Boolean(existingClaims.blocked)
  };

  try {
    await admin.auth().setCustomUserClaims(uid, newClaims);
    console.log(`[Firebase Auth] Updated custom claims for ${uid} (${userRecord.email || 'no-email'}):`, newClaims);
  } catch (e) {
    console.warn(`[Firebase Auth Warning] Could not set custom claims on Auth record (updating Firestore profile): ${e.message}`);
  }

  const userDocRef = firestore.collection('users').doc(uid);
  const firestorePayload = {
    uid,
    email: userRecord.email || '',
    displayName: userRecord.displayName || userRecord.email || uid,
    role: newClaims.role,
    authorized: newClaims.authorized,
    blocked: newClaims.blocked,
    updatedAt: new Date().toISOString()
  };

  if (updates.clearFlags) {
    firestorePayload.securityFlags = [];
    firestorePayload.flaggedAt = null;
  }

  await userDocRef.set(firestorePayload, { merge: true });
  console.log(`[Firestore] Updated users/${uid} profile document.`);
}

async function listUsers() {
  const usersMap = new Map();

  try {
    const listResult = await admin.auth().listUsers(200);
    for (const u of listResult.users) {
      const claims = u.customClaims || {};
      usersMap.set(u.uid, {
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        role: claims.role || (claims.admin ? 'admin' : 'researcher'),
        authorized: claims.authorized !== false && !claims.blocked,
        blocked: Boolean(claims.blocked || u.disabled),
        providers: (u.providerData || []).map(p => p.providerId).join(','),
        securityFlags: []
      });
    }
  } catch (e) {
    console.warn(`[Firebase Auth List Warning] ${e.message}`);
  }

  const snap = await firestore.collection('users').get();
  for (const doc of snap.docs) {
    const d = doc.data();
    const existing = usersMap.get(doc.id) || { uid: doc.id };
    usersMap.set(doc.id, {
      ...existing,
      email: d.email || existing.email || '',
      displayName: d.displayName || existing.displayName || '',
      role: d.role || existing.role || 'researcher',
      authorized: d.authorized !== undefined ? d.authorized : (existing.authorized ?? true),
      blocked: d.blocked !== undefined ? d.blocked : Boolean(existing.blocked),
      securityFlags: Array.isArray(d.securityFlags) ? d.securityFlags : [],
      storageUsedBytes: d.storageUsedBytes || 0
    });
  }

  console.table(Array.from(usersMap.values()));
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`
Usage:
  node scripts/manage-users.js --list
  node scripts/manage-users.js --set-admin <uid-or-email>
  node scripts/manage-users.js --set-role <uid-or-email> <admin|researcher|viewer>
  node scripts/manage-users.js --block <uid-or-email>
  node scripts/manage-users.js --unblock <uid-or-email>
  node scripts/manage-users.js --clear-flags <uid-or-email>
    `);
    process.exit(0);
  }

  if (cmd === '--list') {
    await listUsers();
  } else if (cmd === '--set-admin') {
    await updateUserRoleAndStatus(args[1], { role: 'admin', authorized: true, blocked: false });
  } else if (cmd === '--set-role') {
    const role = args[2];
    if (!['admin', 'researcher', 'viewer'].includes(role)) {
      throw new Error(`Invalid role '${role}'. Must be 'admin', 'researcher', or 'viewer'.`);
    }
    await updateUserRoleAndStatus(args[1], { role, authorized: true, blocked: false });
  } else if (cmd === '--block') {
    await updateUserRoleAndStatus(args[1], { authorized: false, blocked: true });
  } else if (cmd === '--unblock') {
    await updateUserRoleAndStatus(args[1], { authorized: true, blocked: false, clearFlags: true });
  } else if (cmd === '--clear-flags') {
    await updateUserRoleAndStatus(args[1], { clearFlags: true });
  } else {
    throw new Error(`Unknown command: ${cmd}`);
  }
}

main().catch(err => {
  console.error('[Error]', err.message);
  process.exit(1);
});

