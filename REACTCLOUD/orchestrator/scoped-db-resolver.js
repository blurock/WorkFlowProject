/**
 * Centralized Scoped Database Resolver (System + Personal Data Layer)
 *
 * Implements the unified System (read-only baseline) and Personal (user-writable overlay)
 * database architecture for REACTCLOUD.
 *
 * Key Principles:
 * 1. System Namespace: Designated by SYSTEM_UID ('UOqk0KtFtaXma5TGsi8Seh9RMbx1').
 *    All authenticated users can read System objects; only Administrators in 'system' writeScope can modify them.
 * 2. Personal Namespace: Each user has their own writable namespace:
 *    - Normal user ({uid}): 'users/{uid}'
 *    - System Admin ('UOqk0KtFtaXma5TGsi8Seh9RMbx1'): 'users/UOqk0KtFtaXma5TGsi8Seh9RMbx1_personal'
 *      when writing to 'personal' scope, or 'users/UOqk0KtFtaXma5TGsi8Seh9RMbx1' when writing to 'system' scope.
 * 3. Partitioned ID Ranges:
 *    - System IDs allocate starting at 10,000 (< 1,000,000)
 *    - Personal IDs allocate starting at 1,000,000 (>= 1,000,000)
 * 4. Personal Shadowing (Copy-on-Write / Override):
 *    - Lookups resolve Personal first, then System fallback.
 *    - Same-name personal objects override system objects for that user; deleting the personal object restores the system default.
 * 5. Classification & SearchKey Index Virtual Merging:
 *    - On Read: Merges System + Personal Keys arrays on the fly.
 *    - On Write (Personal): Strips unmodified System keys so personal index collections only store personal additions/overrides.
 */

const SYSTEM_UID = process.env.REACT_SYSTEM_UID || 'UOqk0KtFtaXma5TGsi8Seh9RMbx1';
const PERSONAL_ID_START = 1000000;
const SYSTEM_ID_START = 10000;

/**
 * Tracks active C-binary job scopes per user UID so internal IPC calls from chemdb
 * automatically inherit the viewScope and writeScope of the parent HTTP request.
 */
const activeJobScopes = new Map();

function setActiveJobScope(uid, { viewScope, writeScope, isAdmin }) {
  if (!uid) return;
  activeJobScopes.set(String(uid).trim(), {
    viewScope: normalizeViewScope(viewScope),
    writeScope: normalizeWriteScope(writeScope),
    isAdmin: Boolean(isAdmin),
    updatedAt: Date.now()
  });
}

function getActiveJobScope(uid) {
  if (!uid) return null;
  return activeJobScopes.get(String(uid).trim()) || null;
}

/**
 * Declarative Registry of all Database Object Types in REACTCLOUD.
 * To add a new object type in the future, register its metadata here.
 */
const CATALOG_OBJECT_REGISTRY = {
  Molecules: {
    dbKey: 'Molecules',
    dbName: 'Molecules',
    classIndex: 'DB-Index-MoleculeIDs',
    hasSearchKeys: true,
    idOffset: PERSONAL_ID_START,
    keyByName: false
  },
  SubStructures: {
    dbKey: 'Substructures',
    dbName: 'SubStructures',
    aliases: ['Substructures', 'SubStructure'],
    classIndex: 'DB-Index-SubStructureIDs',
    hasSearchKeys: true,
    idOffset: PERSONAL_ID_START,
    keyByName: false
  },
  ReactionPatterns: {
    dbKey: 'ReactionPatterns',
    dbName: 'ReactionPatterns',
    classIndex: 'DB-Index-ReactionPatternIDs',
    altClassIndices: ['DB-Index-PatternIDs'],
    hasSearchKeys: true,
    idOffset: PERSONAL_ID_START,
    keyByName: false
  },
  Reactions: {
    dbKey: 'Reactions',
    dbName: 'Reactions',
    classIndex: 'DB-Index-ReactionIDs',
    hasSearchKeys: true,
    idOffset: PERSONAL_ID_START,
    keyByName: false
  },
  Thermodynamics: {
    dbKey: 'Thermodynamics',
    dbName: 'Thermodynamics',
    classIndex: 'DB-Index-ThermodynamicsIDs',
    hasSearchKeys: false,
    idOffset: PERSONAL_ID_START,
    keyByName: false
  },
  MechanismPathway: {
    dbKey: 'MechanismPathway',
    dbName: 'MechanismPathway',
    aliases: ['MechanismPathways'],
    classIndex: null,
    hasSearchKeys: false,
    idOffset: PERSONAL_ID_START,
    keyByName: true
  },
  RxnMechanism: {
    dbKey: 'RxnMechanism',
    dbName: 'RxnMechanism',
    aliases: ['Mechanisms'],
    classIndex: null,
    hasSearchKeys: false,
    idOffset: PERSONAL_ID_START,
    keyByName: true,
    customCollection: 'mechanisms'
  }
};

/**
 * Lookup registry metadata by dbName or alias
 */
function getObjectConfig(dbNameOrKey) {
  if (!dbNameOrKey) return null;
  if (CATALOG_OBJECT_REGISTRY[dbNameOrKey]) {
    return CATALOG_OBJECT_REGISTRY[dbNameOrKey];
  }
  const lower = String(dbNameOrKey).toLowerCase();
  for (const cfg of Object.values(CATALOG_OBJECT_REGISTRY)) {
    if (cfg.dbName.toLowerCase() === lower || cfg.dbKey.toLowerCase() === lower) {
      return cfg;
    }
    if (Array.isArray(cfg.aliases) && cfg.aliases.some(a => a.toLowerCase() === lower)) {
      return cfg;
    }
  }
  return {
    dbKey: dbNameOrKey,
    dbName: dbNameOrKey,
    classIndex: null,
    hasSearchKeys: false,
    idOffset: PERSONAL_ID_START,
    keyByName: false
  };
}

/**
 * Resolves the personal namespace UID for a given authenticated user UID.
 * Because SYSTEM_UID ('UOqk0KtFtaXma5TGsi8Seh9RMbx1') holds the System database,
 * its personal scratch/override namespace is '${SYSTEM_UID}_personal'.
 */
function getPersonalNamespaceUid(uid) {
  const clean = String(uid || '').trim();
  if (!clean) return '';
  if (clean === SYSTEM_UID) {
    return `${SYSTEM_UID}_personal`;
  }
  return clean;
}

/**
 * Normalizes viewScope ('all' | 'personal' | 'system')
 */
function normalizeViewScope(rawScope) {
  const s = String(rawScope || 'all').trim().toLowerCase();
  if (s === 'personal' || s === 'user') return 'personal';
  if (s === 'system' || s === 'global') return 'system';
  return 'all';
}

/**
 * Normalizes writeScope ('personal' | 'system')
 */
function normalizeWriteScope(rawScope) {
  const s = String(rawScope || 'personal').trim().toLowerCase();
  if (s === 'system') return 'system';
  return 'personal';
}

/**
 * Builds a complete ScopeContext from an Express request (or explicit caller object)
 */
function resolveScopeContext(req, options = {}) {
  const callerUid = String(options.callerUid || req?.user?.uid || '').trim();
  if (!callerUid || callerUid === 'user_default_local') {
    const err = new Error("Authentication required: A valid authenticated user UID is required.");
    err.statusCode = 401;
    throw err;
  }

  const isAdmin = Boolean(
    options.isAdmin ||
    req?.user?.isAdmin ||
    req?.user?.role === 'admin' ||
    req?.user?.isInternalIpc ||
    callerUid === SYSTEM_UID
  );

  // Inherit active job scope if this is an internal IPC request from chemdb
  const inheritedJobScope = req?.user?.isInternalIpc ? getActiveJobScope(callerUid) : null;

  // Extract requested view scope and write scope from options, headers, query, body, or active job
  const rawViewScope =
    options.scope ||
    options.viewScope ||
    req?.headers?.['x-react-view-scope'] ||
    req?.query?.scope ||
    req?.body?.scope ||
    inheritedJobScope?.viewScope ||
    'all';

  const rawWriteScope =
    options.writeScope ||
    options.targetScope ||
    req?.headers?.['x-react-write-scope'] ||
    req?.query?.writeScope ||
    req?.body?.writeScope ||
    req?.body?.targetScope ||
    inheritedJobScope?.writeScope ||
    'personal';

  const viewScope = normalizeViewScope(rawViewScope);
  const writeScope = normalizeWriteScope(rawWriteScope);

  // Determine target user if admin requested a specific user's personal database
  let baseUserUid = callerUid;
  const requestedUid = String(options.requestedUid || req?.body?.uid || req?.query?.uid || '').trim();
  if (requestedUid && requestedUid !== callerUid && requestedUid !== 'user_default_local') {
    // Allow internal IPC or Admin to target a specific user; also allow if requestedUid ends with _personal for caller
    if (requestedUid === `${callerUid}_personal`) {
      baseUserUid = callerUid;
    } else if (!isAdmin) {
      const err = new Error('Forbidden: Cannot access personal data belonging to another user.');
      err.statusCode = 403;
      throw err;
    } else {
      baseUserUid = requestedUid;
    }
  }

  const systemUid = SYSTEM_UID;
  const personalUid = requestedUid.endsWith('_personal')
    ? requestedUid
    : getPersonalNamespaceUid(baseUserUid);

  // Determine effective write target namespace
  let targetWriteUid = personalUid;
  let isSystemWrite = false;

  if (writeScope === 'system') {
    if (!isAdmin) {
      const err = new Error('Forbidden: Only administrators can modify system database objects.');
      err.statusCode = 403;
      throw err;
    }
    targetWriteUid = systemUid;
    isSystemWrite = true;
  }

  return {
    callerUid,
    isAdmin,
    viewScope,
    writeScope,
    systemUid,
    personalUid,
    targetWriteUid,
    isSystemWrite
  };
}

/**
 * Merges System and Personal Keys arrays for an ObjectIDClass (classification document).
 * Personal keys override System keys if they share the same Name or ID.
 */
function mergeClassificationKeys(systemKeys = [], personalKeys = []) {
  const byName = new Map();
  const result = [];

  // 1. Add system keys first
  for (const k of systemKeys) {
    if (!k) continue;
    const name = String(k.Name || '').trim();
    const entry = { ...k };
    if (name) {
      byName.set(name, result.length);
    }
    result.push(entry);
  }

  // 2. Overlay personal keys (replace matching Name or ID, or append)
  for (const pk of personalKeys) {
    if (!pk) continue;
    const pName = String(pk.Name || '').trim();
    const pId = Number(pk.ID);

    if (pName && byName.has(pName)) {
      const idx = byName.get(pName);
      result[idx] = { ...pk };
    } else {
      const existingIdIdx = !isNaN(pId) ? result.findIndex(r => Number(r.ID) === pId) : -1;
      if (existingIdIdx !== -1) {
        result[existingIdIdx] = { ...pk };
      } else {
        if (pName) byName.set(pName, result.length);
        result.push({ ...pk });
      }
    }
  }

  return result;
}

/**
 * Strips unmodified System keys from an incoming Keys array before writing to a Personal classification document.
 */
function stripSystemClassificationKeys(incomingKeys = [], systemKeys = []) {
  if (!Array.isArray(incomingKeys)) return [];
  const systemKeyIds = new Set();
  for (const sk of systemKeys) {
    if (sk && sk.ID !== undefined && sk.ID !== null) {
      systemKeyIds.add(Number(sk.ID));
    }
  }

  return incomingKeys.filter(k => {
    if (!k) return false;
    const kId = Number(k.ID);
    // Keep if it's not a known system key ID, or if it's in the personal ID range and not in systemKeyIds
    return !systemKeyIds.has(kId);
  });
}

/**
 * Merges System and Personal SetOfSearchKeys objects.
 */
function mergeSearchKeySets(sysSet, perSet) {
  if (!sysSet && !perSet) return null;
  if (!sysSet) return perSet;
  if (!perSet) return sysSet;

  const sysKeys = Array.isArray(sysSet.Keys) ? sysSet.Keys : [];
  const perKeys = Array.isArray(perSet.Keys) ? perSet.Keys : [];

  const getKeyName = (item) => {
    return String(item?.Search?.Name || item?.DBKey?.Name || item?.Name || '').trim();
  };
  const getKeyId = (item) => {
    return Number(item?.DBKey?.ID ?? item?.ID ?? NaN);
  };

  const byName = new Map();
  const mergedKeys = [];

  for (const sk of sysKeys) {
    if (!sk) continue;
    const name = getKeyName(sk);
    if (name) byName.set(name, mergedKeys.length);
    mergedKeys.push(sk);
  }

  for (const pk of perKeys) {
    if (!pk) continue;
    const pName = getKeyName(pk);
    const pId = getKeyId(pk);

    if (pName && byName.has(pName)) {
      mergedKeys[byName.get(pName)] = pk;
    } else {
      const idIdx = !isNaN(pId) ? mergedKeys.findIndex(m => getKeyId(m) === pId) : -1;
      if (idIdx !== -1) {
        mergedKeys[idIdx] = pk;
      } else {
        if (pName) byName.set(pName, mergedKeys.length);
        mergedKeys.push(pk);
      }
    }
  }

  return {
    ...sysSet,
    ...perSet,
    NumberOfKeys: mergedKeys.length,
    NumberOfAllocatedKeys: Math.max(mergedKeys.length, Number(perSet.NumberOfAllocatedKeys) || 0, Number(sysSet.NumberOfAllocatedKeys) || 0),
    Keys: mergedKeys
  };
}

/**
 * Strips unmodified System keys from an incoming SetOfSearchKeys payload before saving to Personal searchkeys.
 */
function stripSystemSearchKeySets(incomingSet, sysSet) {
  if (!incomingSet || typeof incomingSet !== 'object') return incomingSet;
  if (!sysSet || !Array.isArray(sysSet.Keys) || !Array.isArray(incomingSet.Keys)) {
    return incomingSet;
  }

  const getKeyId = (item) => Number(item?.DBKey?.ID ?? item?.ID ?? NaN);
  const sysIds = new Set();
  for (const sk of sysSet.Keys) {
    const id = getKeyId(sk);
    if (!isNaN(id)) sysIds.add(id);
  }

  const personalKeys = incomingSet.Keys.filter(k => {
    const id = getKeyId(k);
    return isNaN(id) || !sysIds.has(id);
  });

  return {
    ...incomingSet,
    NumberOfKeys: personalKeys.length,
    NumberOfAllocatedKeys: personalKeys.length,
    Keys: personalKeys
  };
}

/**
 * Factory creating the ScopedDatabaseResolver instance bound to Firestore and blob helpers.
 */
function createScopedDatabaseResolver({ firestore, convertBytesObjectsToBlobs, convertBlobsToBytesObjects }) {
  /**
   * Internal helper to search a single namespace collection for a record by key/ID/Name
   */
  async function findRecordInNamespace(targetUid, dbName, key, type) {
    const isInt = type === 'int' || (typeof key === 'number') || (type !== 'string' && !isNaN(key) && Number.isInteger(Number(key)));
    const keyStr = String(key);
    const keyNum = Number(key);

    const colRef = firestore.collection(`users/${targetUid}/databases/${dbName}/records`);
    const directSnap = await colRef.doc(keyStr).get();
    if (directSnap.exists) {
      return { docId: directSnap.id, data: directSnap.data() };
    }

    if (isInt) {
      let q = await colRef.where('ID', '==', keyNum).limit(1).get();
      if (q.empty) q = await colRef.where('keyId', '==', keyNum).limit(1).get();
      if (!q.empty) return { docId: q.docs[0].id, data: q.docs[0].data() };
    } else {
      let q = await colRef.where('Name', '==', keyStr).limit(1).get();
      if (q.empty) q = await colRef.where('key', '==', keyStr).limit(1).get();
      if (!q.empty) return { docId: q.docs[0].id, data: q.docs[0].data() };
    }
    return null;
  }

  /**
   * 1. Fetch a record with Personal -> System fallback (or filtered by viewScope)
   */
  async function fetchRecord(ctx, { dbName, type, key }) {
    const namespacesToSearch = [];
    if (ctx.viewScope === 'personal') {
      namespacesToSearch.push({ uid: ctx.personalUid, scope: 'personal' });
    } else if (ctx.viewScope === 'system') {
      namespacesToSearch.push({ uid: ctx.systemUid, scope: 'system' });
    } else {
      // 'all' -> Personal first, then System fallback
      namespacesToSearch.push({ uid: ctx.personalUid, scope: 'personal' });
      if (ctx.systemUid !== ctx.personalUid) {
        namespacesToSearch.push({ uid: ctx.systemUid, scope: 'system' });
      }
    }

    for (const ns of namespacesToSearch) {
      const found = await findRecordInNamespace(ns.uid, dbName, key, type);
      if (found && found.data) {
        const data = convertBlobsToBytesObjects ? convertBlobsToBytesObjects(found.data) : found.data;
        return {
          found: true,
          dbName,
          key,
          type,
          scope: ns.scope,
          ownerUid: ns.uid,
          keyId: data.keyId || data.ID || 0,
          data: {
            ...data,
            scope: ns.scope
          },
          updatedAt: data.updatedAt
        };
      }
    }

    return { found: false, dbName, key, type };
  }

  /**
   * 2. List summary of records with scope metadata ('system', 'personal', 'overridesSystem')
   */
  async function listSummary(ctx, { dbName, fields = ['ID', 'Name'] }) {
    const selectFields = Array.isArray(fields) && fields.length > 0 ? fields : ['ID', 'Name'];

    const loadNamespaceMap = async (targetUid, scopeLabel) => {
      const map = new Map();
      const colRef = firestore.collection(`users/${targetUid}/databases/${dbName}/records`);
      const querySnap = await colRef.select(...selectFields).get();
      querySnap.forEach(doc => {
        const d = doc.data() || {};
        const idVal = d.ID !== undefined ? d.ID : (d.keyId !== undefined ? d.keyId : Number(doc.id) || 0);
        const nameVal = String(d.Name || d.key || doc.id).trim();
        if (!nameVal) return;
        map.set(nameVal, {
          ID: Number(idVal),
          Name: nameVal,
          docId: doc.id,
          scope: scopeLabel,
          isSystem: scopeLabel === 'system',
          isPersonal: scopeLabel === 'personal',
          overridesSystem: false
        });
      });
      return map;
    };

    const needSystem = ctx.viewScope === 'all' || ctx.viewScope === 'system';
    const needPersonal = ctx.viewScope === 'all' || ctx.viewScope === 'personal';

    const [systemMap, personalMap] = await Promise.all([
      needSystem ? loadNamespaceMap(ctx.systemUid, 'system') : Promise.resolve(new Map()),
      // Even in 'personal' view, loading systemMap lets us flag overridesSystem accurately
      needPersonal ? loadNamespaceMap(ctx.personalUid, 'personal') : Promise.resolve(new Map())
    ]);

    // If in 'personal' view, check system names for overridesSystem flag
    let sysNamesSet = new Set(systemMap.keys());
    if (ctx.viewScope === 'personal' && sysNamesSet.size === 0) {
      const sysCheckMap = await loadNamespaceMap(ctx.systemUid, 'system');
      sysNamesSet = new Set(sysCheckMap.keys());
    }

    const mergedMap = new Map();

    if (ctx.viewScope === 'system') {
      systemMap.forEach((val, key) => mergedMap.set(key, val));
    } else if (ctx.viewScope === 'personal') {
      personalMap.forEach((val, key) => {
        mergedMap.set(key, {
          ...val,
          overridesSystem: sysNamesSet.has(key)
        });
      });
    } else {
      // 'all' (Combined): System baseline + Personal overlay
      systemMap.forEach((val, key) => mergedMap.set(key, val));
      personalMap.forEach((val, key) => {
        const sysItem = systemMap.get(key);
        mergedMap.set(key, {
          ...val,
          overridesSystem: Boolean(sysItem),
          overriddenSystemId: sysItem ? sysItem.ID : undefined
        });
      });
    }

    const records = Array.from(mergedMap.values());
    return {
      found: true,
      dbName,
      scope: ctx.viewScope,
      count: records.length,
      records
    };
  }

  /**
   * 3. Store record into targetWriteUid (Personal by default, or System if Admin & writeScope === 'system')
   */
  async function storeRecord(ctx, { dbName, key, keyId = 0, jsonStr }) {
    const targetUid = ctx.targetWriteUid;
    const scopeLabel = ctx.isSystemWrite ? 'system' : 'personal';
    const docPath = `users/${targetUid}/databases/${dbName}/records/${key}`;
    const docRef = firestore.doc(docPath);

    let parsedData = jsonStr;
    if (typeof jsonStr === 'string') {
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = { rawString: jsonStr };
      }
    }

    if (convertBytesObjectsToBlobs) {
      parsedData = convertBytesObjectsToBlobs(parsedData);
    }

    const recordDoc = {
      key: String(key),
      keyId: Number(keyId || 0),
      dbName: String(dbName),
      scope: scopeLabel,
      updatedAt: new Date().toISOString(),
      ...(typeof parsedData === 'object' && parsedData !== null ? parsedData : { data: parsedData })
    };

    await docRef.set(recordDoc, { merge: true });
    return {
      status: 'OK',
      path: docPath,
      scope: scopeLabel,
      targetUid
    };
  }

  /**
   * 4. Allocate next unique integer ID (System: 10,000+, Personal: 1,000,000+)
   */
  async function generateNextID(ctx, { dbName, startAt }) {
    const targetUid = ctx.targetWriteUid;
    const minFloor = ctx.isSystemWrite ? SYSTEM_ID_START : PERSONAL_ID_START;
    const effectiveStartAt = Math.max(Number(startAt) || minFloor, minFloor);

    const counterRef = firestore.doc(`users/${targetUid}/databases/${dbName}/metadata/counter`);
    let allocatedId = 0;

    await firestore.runTransaction(async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let currentId = effectiveStartAt - 1;
      if (counterSnap.exists) {
        const data = counterSnap.data();
        if (typeof data.nextID === 'number') {
          currentId = data.nextID - 1;
        }
      }
      allocatedId = currentId + 1;
      if (allocatedId < effectiveStartAt) {
        allocatedId = effectiveStartAt;
      }
      transaction.set(counterRef, {
        nextID: allocatedId + 1,
        lastAllocatedID: allocatedId,
        scope: ctx.isSystemWrite ? 'system' : 'personal',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    return {
      id: allocatedId,
      dbName,
      scope: ctx.isSystemWrite ? 'system' : 'personal',
      targetUid
    };
  }

  /**
   * 5. Find or Create ObjectIDClass (with On-the-Fly System + Personal Merging)
   */
  async function findOrCreateObjectIDClass(ctx, {
    sessionId = 'default_session',
    source = 'DATABASE',
    classificationName,
    objectIDs,
    defaultClassData
  }) {
    const docKey = `doc_${objectIDs.join('_')}`;
    const isDb = source === 'DATABASE' || source === 100 || source === '100';
    const sourceDir = isDb ? 'database' : (sessionId || 'default_session');

    const extractClassObj = (snap) => {
      if (!snap || !snap.exists) return null;
      const rawData = snap.data() || {};
      const { classData, classificationName: _cn, docKey: _dk, updatedAt, ...cleanData } = rawData;
      const targetObj = classData || (Object.keys(cleanData).length > 0 ? cleanData : rawData);
      return convertBlobsToBytesObjects ? convertBlobsToBytesObjects(targetObj) : targetObj;
    };

    // For local session classifications (not DATABASE), use targetWriteUid directly
    if (!isDb) {
      const localPath = `users/${ctx.personalUid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
      const localSnap = await firestore.doc(localPath).get();
      if (localSnap.exists) {
        return { found: true, docPath: localPath, data: extractClassObj(localSnap) };
      }
    } else {
      // DATABASE classifications: Merge System + Personal
      const sysPath = `users/${ctx.systemUid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
      const perPath = `users/${ctx.personalUid}/classifications/${sourceDir}/${classificationName}/${docKey}`;

      const needSys = ctx.viewScope !== 'personal';
      const needPer = ctx.viewScope !== 'system' && !ctx.isSystemWrite;

      const [sysSnap, perSnap] = await Promise.all([
        needSys ? firestore.doc(sysPath).get() : Promise.resolve(null),
        needPer ? firestore.doc(perPath).get() : Promise.resolve(null)
      ]);

      const sysObj = extractClassObj(sysSnap);
      const perObj = extractClassObj(perSnap);

      if (sysObj || perObj) {
        const sysKeys = Array.isArray(sysObj?.Keys) ? sysObj.Keys : (Array.isArray(sysObj?.keys) ? sysObj.keys : []);
        const perKeys = Array.isArray(perObj?.Keys) ? perObj.Keys : (Array.isArray(perObj?.keys) ? perObj.keys : []);
        const mergedKeys = mergeClassificationKeys(sysKeys, perKeys);
        const baseObj = perObj || sysObj;
        const mergedData = {
          ...baseObj,
          NumberOfKeys: mergedKeys.length,
          Keys: mergedKeys
        };
        return {
          found: true,
          docPath: perSnap?.exists ? perPath : sysPath,
          data: mergedData
        };
      }
    }

    // Neither exists: create default in targetWriteUid
    const writeDocPath = `users/${ctx.targetWriteUid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
    const writeDocRef = firestore.doc(writeDocPath);

    let parsedClassData = defaultClassData;
    if (typeof defaultClassData === 'string') {
      try {
        parsedClassData = JSON.parse(defaultClassData);
      } catch (e) {
        parsedClassData = { rawString: defaultClassData };
      }
    }

    if (convertBytesObjectsToBlobs) {
      parsedClassData = convertBytesObjectsToBlobs(parsedClassData);
    }

    const docPayload = {
      classificationName: String(classificationName),
      objectIDs: objectIDs.map(Number),
      docKey,
      updatedAt: new Date().toISOString(),
      ...(typeof parsedClassData === 'object' && parsedClassData !== null ? parsedClassData : {})
    };

    await writeDocRef.set(docPayload, { merge: true });
    const returnData = convertBlobsToBytesObjects ? convertBlobsToBytesObjects(parsedClassData) : parsedClassData;

    return {
      found: false,
      created: true,
      docPath: writeDocPath,
      data: returnData
    };
  }

  /**
   * 6. Store ObjectIDClass (Stripping unmodified System keys when writing to Personal scope)
   */
  async function storeObjectIDClass(ctx, {
    sessionId = 'default_session',
    source = 'DATABASE',
    classificationName,
    objectIDs,
    jsonStr
  }) {
    const docKey = `doc_${objectIDs.join('_')}`;
    const isDb = source === 'DATABASE' || source === 100 || source === '100';
    const sourceDir = isDb ? 'database' : (sessionId || 'default_session');

    let parsedClassData = jsonStr;
    if (typeof jsonStr === 'string') {
      try {
        parsedClassData = JSON.parse(jsonStr);
      } catch (e) {
        parsedClassData = { rawString: jsonStr };
      }
    }

    // If writing to Personal scope for a DATABASE classification, strip out unmodified System keys
    if (isDb && !ctx.isSystemWrite && parsedClassData && typeof parsedClassData === 'object') {
      const sysPath = `users/${ctx.systemUid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
      const sysSnap = await firestore.doc(sysPath).get();
      if (sysSnap.exists) {
        const sysData = sysSnap.data() || {};
        const sysKeys = sysData.Keys || sysData.keys || [];
        const incomingKeys = parsedClassData.Keys || parsedClassData.keys || [];
        const personalOnlyKeys = stripSystemClassificationKeys(incomingKeys, sysKeys);
        parsedClassData = {
          ...parsedClassData,
          NumberOfKeys: personalOnlyKeys.length,
          Keys: personalOnlyKeys,
          keys: personalOnlyKeys
        };
      }
    }

    if (convertBytesObjectsToBlobs) {
      parsedClassData = convertBytesObjectsToBlobs(parsedClassData);
    }

    const docPath = `users/${ctx.targetWriteUid}/classifications/${sourceDir}/${classificationName}/${docKey}`;
    const docRef = firestore.doc(docPath);

    const docPayload = {
      classificationName: String(classificationName),
      objectIDs: objectIDs.map(Number),
      docKey,
      scope: ctx.isSystemWrite ? 'system' : 'personal',
      updatedAt: new Date().toISOString(),
      ...(typeof parsedClassData === 'object' && parsedClassData !== null ? parsedClassData : {})
    };

    await docRef.set(docPayload, { merge: true });
    return {
      status: 'OK',
      path: docPath,
      scope: ctx.isSystemWrite ? 'system' : 'personal'
    };
  }

  /**
   * 7. Fetch SearchKeys (Merging System + Personal on the fly)
   */
  async function fetchSearchKeys(ctx, { dbName }) {
    const sysPath = `users/${ctx.systemUid}/searchkeys/${dbName}`;
    const perPath = `users/${ctx.personalUid}/searchkeys/${dbName}`;

    const needSys = ctx.viewScope !== 'personal';
    const needPer = ctx.viewScope !== 'system' && !ctx.isSystemWrite;

    const [sysSnap, perSnap] = await Promise.all([
      needSys ? firestore.doc(sysPath).get() : Promise.resolve(null),
      needPer ? firestore.doc(perPath).get() : Promise.resolve(null)
    ]);

    const sysExists = Boolean(sysSnap && sysSnap.exists);
    const perExists = Boolean(perSnap && perSnap.exists);

    if (!sysExists && !perExists) {
      return { found: false, dbName };
    }

    const sysData = sysExists
      ? (convertBlobsToBytesObjects ? convertBlobsToBytesObjects(sysSnap.data()) : sysSnap.data())
      : null;
    const perData = perExists
      ? (convertBlobsToBytesObjects ? convertBlobsToBytesObjects(perSnap.data()) : perSnap.data())
      : null;

    if (sysData && !perData) {
      return { found: true, dbName, data: sysData, updatedAt: sysData.updatedAt };
    }
    if (!sysData && perData) {
      return { found: true, dbName, data: perData, updatedAt: perData.updatedAt };
    }

    // Both exist -> merge each searchKeys_<id> field and top-level data field
    const mergedDoc = {
      ...sysData,
      ...perData,
      data: mergeSearchKeySets(sysData.data, perData.data)
    };

    const allFieldKeys = new Set([...Object.keys(sysData), ...Object.keys(perData)]);
    for (const fKey of allFieldKeys) {
      if (fKey.startsWith('searchKeys_')) {
        mergedDoc[fKey] = mergeSearchKeySets(sysData[fKey], perData[fKey]);
      }
    }

    return {
      found: true,
      dbName,
      data: mergedDoc,
      updatedAt: perData.updatedAt || sysData.updatedAt
    };
  }

  /**
   * 8. Store SearchKeys (Stripping unmodified System keys when writing to Personal scope)
   */
  async function storeSearchKeys(ctx, { dbName, keyId = 0, jsonStr }) {
    let parsedData = jsonStr;
    if (typeof jsonStr === 'string') {
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = { rawString: jsonStr };
      }
    }

    if (!ctx.isSystemWrite && parsedData && typeof parsedData === 'object') {
      const sysPath = `users/${ctx.systemUid}/searchkeys/${dbName}`;
      const sysSnap = await firestore.doc(sysPath).get();
      if (sysSnap.exists) {
        const sysDoc = convertBlobsToBytesObjects ? convertBlobsToBytesObjects(sysSnap.data()) : sysSnap.data();
        const sysSet = sysDoc?.[`searchKeys_${keyId}`] || sysDoc?.data;
        parsedData = stripSystemSearchKeySets(parsedData, sysSet);
      }
    }

    if (convertBytesObjectsToBlobs) {
      parsedData = convertBytesObjectsToBlobs(parsedData);
    }

    const docPath = `users/${ctx.targetWriteUid}/searchkeys/${dbName}`;
    const docRef = firestore.doc(docPath);

    const searchKeysDoc = {
      dbName: String(dbName),
      scope: ctx.isSystemWrite ? 'system' : 'personal',
      updatedAt: new Date().toISOString(),
      keyId: Number(keyId),
      data: parsedData,
      [`searchKeys_${keyId}`]: parsedData
    };

    await docRef.set(searchKeysDoc, { merge: true });
    return {
      status: 'OK',
      path: docPath,
      scope: ctx.isSystemWrite ? 'system' : 'personal'
    };
  }

  /**
   * 9. Promote a Personal Record to the System Database (Admin Only)
   */
  async function promoteToSystem(ctx, { dbName, key, id }) {
    if (!ctx.isAdmin) {
      const err = new Error('Forbidden: Only administrators can promote objects to the System database.');
      err.statusCode = 403;
      throw err;
    }

    const cfg = getObjectConfig(dbName);
    const actualDbName = cfg ? cfg.dbName : dbName;
    const lookupKey = key !== undefined && key !== null ? key : id;

    // 1. Locate record in Personal namespace
    const perFound = await findRecordInNamespace(ctx.personalUid, actualDbName, lookupKey);
    if (!perFound || !perFound.data) {
      const err = new Error(`Personal record '${lookupKey}' not found in users/${ctx.personalUid}/databases/${actualDbName}/records.`);
      err.statusCode = 404;
      throw err;
    }

    const personalRecord = perFound.data;
    const recordName = String(personalRecord.Name || personalRecord.name || personalRecord.key || perFound.docId).trim();
    const oldPersonalId = Number(personalRecord.ID ?? personalRecord.keyId ?? NaN);

    // 2. Check if a System record with the same Name already exists
    const sysExisting = recordName
      ? await findRecordInNamespace(ctx.systemUid, actualDbName, recordName, 'string')
      : null;

    let targetSystemId = oldPersonalId;
    let targetDocKey = perFound.docId;

    if (!cfg?.keyByName) {
      if (sysExisting && sysExisting.data && (sysExisting.data.ID || sysExisting.data.keyId)) {
        // Reuse existing System ID so existing references remain valid
        targetSystemId = Number(sysExisting.data.ID || sysExisting.data.keyId);
        targetDocKey = String(sysExisting.docId || targetSystemId);
      } else if (isNaN(targetSystemId) || targetSystemId >= PERSONAL_ID_START) {
        // Allocate a fresh System ID (< 1,000,000)
        const sysCtx = { ...ctx, targetWriteUid: ctx.systemUid, isSystemWrite: true };
        const alloc = await generateNextID(sysCtx, { dbName: actualDbName, startAt: SYSTEM_ID_START });
        targetSystemId = alloc.id;
        targetDocKey = String(targetSystemId);
      }
    } else {
      targetDocKey = recordName;
    }

    // 3. Prepare System record payload
    const updatedRecord = {
      ...personalRecord,
      scope: 'system',
      promotedAt: new Date().toISOString(),
      promotedFromUid: ctx.personalUid,
      updatedAt: new Date().toISOString()
    };

    if (!cfg?.keyByName && !isNaN(targetSystemId)) {
      updatedRecord.ID = targetSystemId;
      updatedRecord.keyId = targetSystemId;
      updatedRecord.key = String(targetDocKey);
    }

    // 4. Write to System database
    const sysDocPath = `users/${ctx.systemUid}/databases/${actualDbName}/records/${targetDocKey}`;
    await firestore.doc(sysDocPath).set(updatedRecord, { merge: true });

    // 5. If this database has a classification index, move the classification key from Personal to System
    if (cfg?.classIndex) {
      const perClassCol = firestore.collection(`users/${ctx.personalUid}/classifications/database/${cfg.classIndex}`);
      const perClassSnap = await perClassCol.get();
      let matchedClassDocId = null;

      for (const cDoc of perClassSnap.docs) {
        const cData = cDoc.data() || {};
        const keys = cData.Keys || cData.keys || [];
        const hasMatch = keys.some(k => Number(k.ID) === oldPersonalId || String(k.Name || '').trim() === recordName);
        if (hasMatch) {
          matchedClassDocId = cDoc.id;
          const remaining = keys.filter(k => Number(k.ID) !== oldPersonalId && String(k.Name || '').trim() !== recordName);
          await cDoc.ref.set({
            Keys: remaining,
            keys: remaining,
            NumberOfKeys: remaining.length,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // Add/update in System classification index
      const sysClassDocId = matchedClassDocId || 'doc_0_0_0_1';
      const sysClassRef = firestore.doc(`users/${ctx.systemUid}/classifications/database/${cfg.classIndex}/${sysClassDocId}`);
      const sysClassSnap = await sysClassRef.get();
      let sysKeys = [];
      if (sysClassSnap.exists) {
        const sData = sysClassSnap.data() || {};
        sysKeys = (sData.Keys || sData.keys || []).filter(
          k => Number(k.ID) !== targetSystemId && String(k.Name || '').trim() !== recordName
        );
      }
      sysKeys.push({
        ID: targetSystemId,
        Name: recordName,
        Size: 4,
        KeyWord: targetSystemId
      });
      sysKeys.sort((a, b) => Number(a.ID || 0) - Number(b.ID || 0));
      await sysClassRef.set({
        classificationName: cfg.classIndex,
        docKey: sysClassDocId,
        NumberOfKeys: sysKeys.length,
        Keys: sysKeys,
        keys: sysKeys,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 6. Remove the temporary personal copy so it no longer shadows the newly promoted System record
    await firestore.doc(`users/${ctx.personalUid}/databases/${actualDbName}/records/${perFound.docId}`).delete();

    return {
      success: true,
      dbName: actualDbName,
      name: recordName,
      oldPersonalId,
      systemId: targetSystemId,
      systemPath: sysDocPath,
      message: `Promoted '${recordName}' to System database (${actualDbName}) with ID ${targetSystemId}.`
    };
  }

  /**
   * 10. Revert a Personal Override (or delete a personal record), restoring the System baseline if one exists.
   */
  async function revertPersonalOverride(ctx, { dbName, key, id }) {
    const cfg = getObjectConfig(dbName);
    const actualDbName = cfg ? cfg.dbName : dbName;
    const lookupKey = key !== undefined && key !== null ? key : id;

    const perFound = await findRecordInNamespace(ctx.personalUid, actualDbName, lookupKey);
    if (!perFound || !perFound.data) {
      const err = new Error(`Personal record '${lookupKey}' not found in users/${ctx.personalUid}/databases/${actualDbName}/records.`);
      err.statusCode = 404;
      throw err;
    }

    const personalRecord = perFound.data;
    const recordName = String(personalRecord.Name || personalRecord.name || personalRecord.key || perFound.docId).trim();
    const personalId = Number(personalRecord.ID ?? personalRecord.keyId ?? NaN);

    await firestore.doc(`users/${ctx.personalUid}/databases/${actualDbName}/records/${perFound.docId}`).delete();

    let prunedClassDocs = 0;
    if (cfg?.classIndex) {
      const perClassCol = firestore.collection(`users/${ctx.personalUid}/classifications/database/${cfg.classIndex}`);
      const perClassSnap = await perClassCol.get();
      for (const cDoc of perClassSnap.docs) {
        const cData = cDoc.data() || {};
        const keys = cData.Keys || cData.keys || [];
        const filtered = keys.filter(
          k => Number(k.ID) !== personalId && String(k.Name || '').trim() !== recordName
        );
        if (filtered.length !== keys.length) {
          await cDoc.ref.set({
            Keys: filtered,
            keys: filtered,
            NumberOfKeys: filtered.length,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          prunedClassDocs++;
        }
      }
    }

    return {
      success: true,
      dbName: actualDbName,
      deletedDocId: perFound.docId,
      name: recordName,
      personalId,
      prunedClassDocs,
      message: `Reverted personal override '${recordName}' (ID: ${personalId}) from ${actualDbName}.`
    };
  }

  return {
    SYSTEM_UID,
    PERSONAL_ID_START,
    SYSTEM_ID_START,
    CATALOG_OBJECT_REGISTRY,
    getObjectConfig,
    getPersonalNamespaceUid,
    setActiveJobScope,
    getActiveJobScope,
    resolveScopeContext,
    findRecordInNamespace,
    fetchRecord,
    listSummary,
    storeRecord,
    generateNextID,
    findOrCreateObjectIDClass,
    storeObjectIDClass,
    fetchSearchKeys,
    storeSearchKeys,
    promoteToSystem,
    revertPersonalOverride
  };
}

module.exports = {
  SYSTEM_UID,
  PERSONAL_ID_START,
  SYSTEM_ID_START,
  CATALOG_OBJECT_REGISTRY,
  getObjectConfig,
  getPersonalNamespaceUid,
  setActiveJobScope,
  getActiveJobScope,
  normalizeViewScope,
  normalizeWriteScope,
  resolveScopeContext,
  mergeClassificationKeys,
  stripSystemClassificationKeys,
  mergeSearchKeySets,
  stripSystemSearchKeySets,
  createScopedDatabaseResolver
};
