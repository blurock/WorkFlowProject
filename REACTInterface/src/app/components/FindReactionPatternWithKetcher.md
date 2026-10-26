*** Goal

The goal is to draw a simple generic reaction pattern in ketcher and then use this to see if that reaction pattern matches anything in the database. It is a way to search for reaction patterns.

This should be a reusable component that can be used in different contexts. The main usage will be in the creation of a mechanism pathway, but also in other usages. So many of the the tasks involved should be modularized in independent services and components.

*** Reaction Center encoding

The key to this is to add a property that encodes the reactive center (meaning the bonds that change betweenn reactants and products) for each reaction pattern. This encoding is stored as a property in the reaction pattern. The encoded string is a canonical description of the reaction center that can be searched for in Firebase.

The encoding is done as follows:
1. Identify the bonds that change: This is where the '4' is found in the correspondence description. 
2. In the reactants the changes are bond breaking and in the products the bond making.
3. For each bond that changes:
   a. Identify the atoms connected by this bond.
   b. For each atom identify three properties. 
         i: The type (T) of atom (C, O, etc)
         ii: A list of the types(B) of bonds, single (S), double(D), triple(T)
         iii: Whether the valence (V) is a Radical (R) or nonradical (N)
    c. For each atom this informaiton is encoded as a string.  TVBBB
    d. The two bond descriptions are ordered in alphbetical order and concatenated: TVBBBTVBBB
    e. The bond breakage bond is appended with a B and the formation appended with a F:  B-TVBBBTVBBB-F-TVBBBTVBBB.  
    f. The reaction center is then encoded in a property of the reaction pattern as follows:
       i. "reactionBrokenBonds": "TVBBBVBBB"
       ii. "reactionFormedBonds": "TVBBBVBBB"
    This is what is used to identify the reaction pattern. Every reaction pattern has such an encoding.

*** Sequence of events

1. The user draws a simple representation of a reaction pattern in ketcher. 
2. The bond changes are noted and the reaction center is
3. This encoding is used to identify the reaction patterns with the same reactive center with a search of the Firestore database of reaction patterns.
4. given the list of candidate reaction patterns:
     a. The ketcher reactant structure i checked to see if it is a substructure of one of the reactants in the reaction pattern.
     b. If a reactant is matched, then then the ketcher product is compared to see if it a substructure of the one  of the eaction pattern products.
     c. If both the reactant and product are substructures, then the reaction pattern is considered a match.
     d. The matching reaction patterns are then displayed as a set of collapsible lines with the reaction pattern name. If the eye is clicked, then the reaction pattern will be displayed in a ketcher panel. 
     e. On this line is also a check box. 
5. The will be a button that says 'Add Selected Reaction Patterns'. Where and how the selected patterns are added depends on what the user is doing.
     a. If the user is creating a MechanismPathway, then the selected patterns will be added to the MechanismPathway at the given step. 

The query can be for only the breaking of bonds in the reactants for example with "CH -> C. + .H". 
Or with only formation like for c. + OOH -> COOH 
Or for both CH + OH -> H2O + C
The code should recognize these situations.



*** Adding encoding to database

Once the encoding is implemented, it should be possible to add it to the reaction pattern when it is added to the database. 
Make a script to add this encoding to the existing 400 some odd reactions in the database. Make the script available so I can use it. 
From now on, when a new reaction pattern is created, the encoding is automatically also created.

*** Independent database questions

Make a script so that I can give an encoding and the list of reaction patterns matching that encoding will be displayed. 
I am particularly interested in the exact Firestore queries that are used and the way that they are structured. 
     
**** Use in Mechanism Pathway Creator

When the button 'Select Whole Classes / Patterns' is selected, a popup window with two tabs will appear:
1. Tab 1 (From List) is for finding patterns from a hierarchical tree list (prefix category -> class -> pattern).
2. Tab 2 (From Pattern) is for finding patterns from a reaction pattern drawn in Ketcher.

Selected patterns in either tab synchronize to a single shared selection set, and pressing "Add Selected Reaction Patterns" injects them directly into the pathway step.

---

*** Implementation Architecture & Documentation

### 1. Canonical Reactive Center Encoding Format

Each atom in a changing bond is canonically encoded as:
`T:V:BBB`
- `T`: Atom element type (`C`, `H`, `O`, `N`, etc.)
- `V`: Valence state (`R` for Radical with unpaired electron / radical center, `N` for Non-radical)
- `BBB`: Spectator bond types attached to this atom, **sorted alphabetically** (`S` for single, `D` for double, `T` for triple). Spectator bonds exclude the broken/formed bond itself so that the reactive center captures identical local chemical environments regardless of drawing order.

Each bond is canonically encoded as:
`min(atomA, atomB) + "_" + max(atomA, atomB)`
- The two atom descriptors are sorted alphabetically and separated by an underscore `_`.

The overall composite key (`reactionCenterKey`) is:
`B:<broken_bonds>_F:<formed_bonds>`
- Sorted semicolon-separated list of broken bonds, prefixed by `B:`.
- Sorted semicolon-separated list of formed bonds, prefixed by `F:`.
- Example for C–H breaking: `B:C:N:S_H:N:_F:C:N:S_H:N:`

### 2. Firestore Storage Structure

In Firestore (`users/{uid}/databases/ReactionPatterns/records`), each reaction pattern record stores three indexed properties:
1. `reactionCenterKey`: string (Exact composite key for $O(1)$ equality queries)
2. `reactionBrokenBonds`: array of strings (Individual broken bonds for `array-contains` index queries)
3. `reactionFormedBonds`: array of strings (Individual formed bonds for `array-contains` or filtering)

### 3. Database Migration Script (`backfill_reaction_pattern_encodings.js`)

Located in [`REACTCLOUD/scripts/backfill_reaction_pattern_encodings.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/scripts/backfill_reaction_pattern_encodings.js).
This script parses all 106 `.lst` reaction pattern files and `all.sdf` substructures in `REACTCLOUD/data/mol/subs/all.sdf`, derives broken/formed bonds from correspondence blocks, computes canonical reactive center encodings, and writes them directly to Firestore using batched writes.

**Usage:**
```bash
cd /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
# Run live migration for default user
node scripts/backfill_reaction_pattern_encodings.js

# Optional flags:
node scripts/backfill_reaction_pattern_encodings.js --user user_default_local --dry-run
node scripts/backfill_reaction_pattern_encodings.js --limit 50
```

*Results from initial execution:*
- Total reaction patterns scanned: **1,212**
- Patterns with explicit reactive center bond changes: **952**
- Successfully committed to Firestore `blurock-database` under collection `users/user_default_local/databases/ReactionPatterns/records`.

### 4. Standalone CLI Query Script (`query_reaction_patterns.js`)

Located in [`REACTCLOUD/scripts/query_reaction_patterns.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/scripts/query_reaction_patterns.js).
Allows developers and users to query reaction patterns directly from the terminal and inspect the exact Firestore queries executed.

**Usage Examples:**
```bash
cd /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD

# 1. Search by exact composite center key:
node scripts/query_reaction_patterns.js --center "B:C:N:S_H:N:_F:C:N:S_H:N:"

# 2. Search by broken bond:
node scripts/query_reaction_patterns.js --broken "C:N:S_H:N:"

# 3. Search by formed bond:
node scripts/query_reaction_patterns.js --formed "C:N:S_H:N:"

# 4. Search by both broken and formed bonds (Hybrid Query):
node scripts/query_reaction_patterns.js --broken "C:N:S_H:N:" --formed "C:N:S_H:N:"
```

**Exact Firestore Queries Used:**
1. **Exact Composite Key ($O(1)$ direct index lookup):**
   ```javascript
   const snapshot = await firestore
     .collection('users/user_default_local/databases/ReactionPatterns/records')
     .where('reactionCenterKey', '==', centerKey)
     .get();
   ```
2. **Broken Bond Query:**
   ```javascript
   const snapshot = await firestore
     .collection('users/user_default_local/databases/ReactionPatterns/records')
     .where('reactionBrokenBonds', 'array-contains', brokenBond)
     .get();
   ```
3. **Formed Bond Query:**
   ```javascript
   const snapshot = await firestore
     .collection('users/user_default_local/databases/ReactionPatterns/records')
     .where('reactionFormedBonds', 'array-contains', formedBond)
     .get();
   ```
4. **Hybrid Query (Broken AND Formed bonds):**
   *Note: Cloud Firestore limits queries to at most one `array-contains` clause per query.*
   Therefore, the system performs an indexed `array-contains` query on the broken bond (which narrows the candidates to $\le 20$ documents in < 150ms), followed by an in-memory filter on `reactionFormedBonds`:
   ```javascript
   const snapshot = await firestore
     .collection('users/user_default_local/databases/ReactionPatterns/records')
     .where('reactionBrokenBonds', 'array-contains', brokenBond)
     .get();
   const matches = snapshot.docs
     .map(d => ({ id: d.id, ...d.data() }))
     .filter(d => Array.isArray(d.reactionFormedBonds) && d.reactionFormedBonds.includes(formedBond));
   ```

### 5. Backend Orchestrator REST Endpoint

**Route:** `POST /api/db/searchRxnPatternsByCenter`
**Payload:**
```json
{
  "uid": "user_default_local",
  "reactionCenterKey": "B:C:N:S_H:N:_F:C:N:S_H:N:",
  "reactionBrokenBonds": ["C:N:S_H:N:"],
  "reactionFormedBonds": ["C:N:S_H:N:"]
}
```
**Response:**
```json
{
  "success": true,
  "count": 4,
  "records": [
    {
      "Name": "EightRing-chain-h-isomerization",
      "ID": 14450,
      "reactionCenterKey": "B:C:N:S_H:N:_F:C:N:S_H:N:",
      "reactionBrokenBonds": ["C:N:S_H:N:"],
      "reactionFormedBonds": ["C:N:S_H:N:"],
      "reactants": [".ccccccc(h)"],
      "products": [".ccccccc(h)"]
    }
  ]
}
```

### 6. Angular Frontend Services & Components

1. **[`ReactiveCenterService`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/reactive-center.service.ts):**
   - Parses Ketcher RXN/Molfile representation.
   - Extracts reactant and product atom/bond tables.
   - Derives correspondences using hybrid matching (drawing topology + Ketcher reaction atom mapping AAM numbers).
   - Computes canonical reactive center strings and broken/formed bond lists.
2. **[`RxnPatternKetcherSearchComponent`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/components/rxn-pattern-ketcher-search/):**
   - Embeds Ketcher canvas for drawing reaction patterns.
   - Provides quick load presets (e.g. C–H Abstraction, C–C Cleavage, H-Shift Isomerization, Radical Addition).
   - Dynamically analyzes the drawn reaction and computes the reactive center.
   - Displays reactive center chips (`Broken: C:N:S_H:N:`, `Formed: C:N:S_H:N:`, etc.).
   - Fetches matching patterns and displays them following the **One-Line Summary layout principles** with eye toggle for 2D previews and checkboxes for selection.
3. **[`RxnPatternSelectionDialogComponent`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/components/rxn-pattern-selection-dialog/):**
   - 2-Tab dialog container:
     - Tab 1: **From List (Tree)** — hierarchical exploration by category and class.
     - Tab 2: **From Pattern (Ketcher)** — visual chemical drawing search.
   - Synchronized selection set across both tabs.