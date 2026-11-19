const assert = require('assert');
const {
  SYSTEM_UID,
  PERSONAL_ID_START,
  SYSTEM_ID_START,
  getObjectConfig,
  getPersonalNamespaceUid,
  resolveScopeContext,
  mergeClassificationKeys,
  stripSystemClassificationKeys,
  mergeSearchKeySets,
  stripSystemSearchKeySets,
  createScopedDatabaseResolver
} = require('./scoped-db-resolver');

/**
 * Lightweight in-memory Firestore mock for unit testing ScopedDatabaseResolver
 */
function createMockFirestore(initialDocs = {}) {
  const store = new Map(Object.entries(initialDocs));

  const getDocRef = (docPath) => ({
    path: docPath,
    id: docPath.split('/').pop(),
    async get() {
      const exists = store.has(docPath);
      const data = exists ? JSON.parse(JSON.stringify(store.get(docPath))) : undefined;
      return {
        exists,
        id: docPath.split('/').pop(),
        ref: getDocRef(docPath),
        data: () => data
      };
    },
    async set(payload, opts = {}) {
      if (opts.merge && store.has(docPath)) {
        store.set(docPath, { ...store.get(docPath), ...JSON.parse(JSON.stringify(payload)) });
      } else {
        store.set(docPath, JSON.parse(JSON.stringify(payload)));
      }
    },
    async delete() {
      store.delete(docPath);
    }
  });

  const getColRef = (colPath) => {
    const getMatchingDocs = () => {
      const prefix = colPath.endsWith('/') ? colPath : `${colPath}/`;
      const docs = [];
      for (const [k, v] of store.entries()) {
        if (k.startsWith(prefix)) {
          const rest = k.slice(prefix.length);
          if (!rest.includes('/')) {
            docs.push({
              id: rest,
              exists: true,
              ref: getDocRef(k),
              data: () => JSON.parse(JSON.stringify(v))
            });
          }
        }
      }
      return docs;
    };

    const buildQuery = (filters = []) => ({
      where(field, op, val) {
        return buildQuery([...filters, { field, op, val }]);
      },
      limit() {
        return this;
      },
      select() {
        return this;
      },
      async get() {
        let docs = getMatchingDocs();
        for (const f of filters) {
          docs = docs.filter(d => d.data()[f.field] === f.val);
        }
        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
          forEach: (cb) => docs.forEach(cb)
        };
      }
    });

    return {
      doc: (id) => getDocRef(`${colPath}/${id}`),
      ...buildQuery([])
    };
  };

  return {
    _store: store,
    doc: getDocRef,
    collection: getColRef,
    async runTransaction(fn) {
      const tx = {
        get: (ref) => ref.get(),
        set: (ref, payload, opts) => ref.set(payload, opts)
      };
      return fn(tx);
    }
  };
}

async function runTests() {
  console.log('Running ScopedDatabaseResolver unit tests...');

  // 1. Namespace resolution for normal user vs System Admin
  assert.strictEqual(getPersonalNamespaceUid('user_alice_123'), 'user_alice_123');
  assert.strictEqual(getPersonalNamespaceUid(SYSTEM_UID), `${SYSTEM_UID}_personal`);

  // Normal user context
  const aliceCtx = resolveScopeContext({
    user: { uid: 'user_alice_123', isAdmin: false },
    headers: {}
  });
  assert.strictEqual(aliceCtx.systemUid, SYSTEM_UID);
  assert.strictEqual(aliceCtx.personalUid, 'user_alice_123');
  assert.strictEqual(aliceCtx.targetWriteUid, 'user_alice_123');
  assert.strictEqual(aliceCtx.isSystemWrite, false);

  // Normal user trying to write to system -> 403 Forbidden
  assert.throws(() => {
    resolveScopeContext({
      user: { uid: 'user_alice_123', isAdmin: false },
      headers: { 'x-react-write-scope': 'system' }
    });
  }, /Forbidden: Only administrators can modify system database objects/);

  // Admin context in personal mode vs system mode
  const adminPersonalCtx = resolveScopeContext({
    user: { uid: SYSTEM_UID, isAdmin: true },
    headers: { 'x-react-write-scope': 'personal' }
  });
  assert.strictEqual(adminPersonalCtx.systemUid, SYSTEM_UID);
  assert.strictEqual(adminPersonalCtx.personalUid, `${SYSTEM_UID}_personal`);
  assert.strictEqual(adminPersonalCtx.targetWriteUid, `${SYSTEM_UID}_personal`);
  assert.strictEqual(adminPersonalCtx.isSystemWrite, false);

  const adminSystemCtx = resolveScopeContext({
    user: { uid: SYSTEM_UID, isAdmin: true },
    headers: { 'x-react-write-scope': 'system' }
  });
  assert.strictEqual(adminSystemCtx.targetWriteUid, SYSTEM_UID);
  assert.strictEqual(adminSystemCtx.isSystemWrite, true);

  // 2. Classification key merging and stripping
  const sysKeys = [
    { ID: 1001, Name: 'propane' },
    { ID: 10607104, Name: 'oc(h)(cooh)' }
  ];
  const perKeys = [
    { ID: 1000001, Name: 'propane' }, // overrides system 'propane'
    { ID: 1000002, Name: 'my_custom_mol' }
  ];
  const merged = mergeClassificationKeys(sysKeys, perKeys);
  assert.strictEqual(merged.length, 3);
  assert.strictEqual(merged.find(k => k.Name === 'propane').ID, 1000001);
  assert.strictEqual(merged.find(k => k.Name === 'oc(h)(cooh)').ID, 10607104);
  assert.strictEqual(merged.find(k => k.Name === 'my_custom_mol').ID, 1000002);

  // Stripping system keys (including legacy 8-digit 10607104)
  const stripped = stripSystemClassificationKeys(merged, sysKeys);
  assert.strictEqual(stripped.length, 2);
  assert.deepStrictEqual(stripped.map(k => k.ID), [1000001, 1000002]);

  // 3. End-to-End Resolver tests with Mock Firestore
  const mockFs = createMockFirestore({
    [`users/${SYSTEM_UID}/databases/Molecules/records/1001`]: {
      ID: 1001,
      Name: 'propane',
      Formula: 'C3H8'
    },
    [`users/${SYSTEM_UID}/databases/Molecules/records/1002`]: {
      ID: 1002,
      Name: 'butane',
      Formula: 'C4H10'
    },
    [`users/${SYSTEM_UID}/classifications/database/DB-Index-MoleculeIDs/doc_3_8`]: {
      Keys: [{ ID: 1001, Name: 'propane' }],
      NumberOfKeys: 1
    }
  });

  const resolver = createScopedDatabaseResolver({ firestore: mockFs });

  // 3a. Fetch fallback from System when not in Personal
  const res1 = await resolver.fetchRecord(aliceCtx, { dbName: 'Molecules', key: 'propane', type: 'string' });
  assert.strictEqual(res1.found, true);
  assert.strictEqual(res1.scope, 'system');
  assert.strictEqual(res1.data.ID, 1001);

  // 3b. Generate Next ID in Personal Scope -> starts at 1,000,000
  const nextIdRes = await resolver.generateNextID(aliceCtx, { dbName: 'Molecules' });
  assert.strictEqual(nextIdRes.id, PERSONAL_ID_START);
  assert.strictEqual(nextIdRes.scope, 'personal');

  // 3c. Store Personal override of 'propane' + new 'pentane'
  await resolver.storeRecord(aliceCtx, {
    dbName: 'Molecules',
    key: '1000000',
    keyId: 1000000,
    jsonStr: JSON.stringify({ ID: 1000000, Name: 'propane', Formula: 'C3H8_custom' })
  });
  await resolver.storeRecord(aliceCtx, {
    dbName: 'Molecules',
    key: '1000001',
    keyId: 1000001,
    jsonStr: JSON.stringify({ ID: 1000001, Name: 'pentane', Formula: 'C5H12' })
  });

  // 3d. Fetch 'propane' in 'all' viewScope -> resolves Personal override (1000000)!
  const resOverride = await resolver.fetchRecord(aliceCtx, { dbName: 'Molecules', key: 'propane', type: 'string' });
  assert.strictEqual(resOverride.found, true);
  assert.strictEqual(resOverride.scope, 'personal');
  assert.strictEqual(resOverride.data.ID, 1000000);
  assert.strictEqual(resOverride.data.Formula, 'C3H8_custom');

  // 3e. Fetch 'propane' in 'system' viewScope -> resolves original System version (1001)!
  const aliceSysView = { ...aliceCtx, viewScope: 'system' };
  const resSysOnly = await resolver.fetchRecord(aliceSysView, { dbName: 'Molecules', key: 'propane', type: 'string' });
  assert.strictEqual(resSysOnly.found, true);
  assert.strictEqual(resSysOnly.scope, 'system');
  assert.strictEqual(resSysOnly.data.ID, 1001);

  // 3f. List summary across 'all', 'personal', and 'system' scopes
  const listAll = await resolver.listSummary(aliceCtx, { dbName: 'Molecules' });
  assert.strictEqual(listAll.count, 3); // propane (personal override), butane (system), pentane (personal)
  const propaneEntry = listAll.records.find(r => r.Name === 'propane');
  assert.strictEqual(propaneEntry.scope, 'personal');
  assert.strictEqual(propaneEntry.overridesSystem, true);
  assert.strictEqual(propaneEntry.overriddenSystemId, 1001);

  const listPer = await resolver.listSummary({ ...aliceCtx, viewScope: 'personal' }, { dbName: 'Molecules' });
  assert.strictEqual(listPer.count, 2); // propane, pentane
  assert.strictEqual(listPer.records.find(r => r.Name === 'propane').overridesSystem, true);

  const listSys = await resolver.listSummary({ ...aliceCtx, viewScope: 'system' }, { dbName: 'Molecules' });
  assert.strictEqual(listSys.count, 2); // propane (1001), butane (1002)

  // 3g. Promote 'pentane' (Personal 1000001) to System as Admin
  const adminAliceTarget = resolveScopeContext({
    user: { uid: SYSTEM_UID, isAdmin: true },
    body: { uid: 'user_alice_123' }
  });
  const promoteRes = await resolver.promoteToSystem(adminAliceTarget, {
    dbName: 'Molecules',
    key: '1000001'
  });
  assert.strictEqual(promoteRes.success, true);
  assert.strictEqual(promoteRes.name, 'pentane');
  assert.strictEqual(promoteRes.systemId, SYSTEM_ID_START); // Allocated 10000 in System!

  // Verify 'pentane' is now in System and removed from Alice's personal DB
  const listSysAfter = await resolver.listSummary({ ...aliceCtx, viewScope: 'system' }, { dbName: 'Molecules' });
  assert.strictEqual(listSysAfter.count, 3);
  assert.strictEqual(listSysAfter.records.find(r => r.Name === 'pentane').ID, SYSTEM_ID_START);

  const listPerAfter = await resolver.listSummary({ ...aliceCtx, viewScope: 'personal' }, { dbName: 'Molecules' });
  assert.strictEqual(listPerAfter.count, 1); // only 'propane' override remains in Alice's personal DB

  console.log('ALL ScopedDatabaseResolver tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

