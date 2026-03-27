# Ketcher Angular Integration — Implementation Guide

This page documents the implementation of the **Ketcher molecular editor** embedded inside the `manager-frontend` Angular application, including the full architecture, design decisions, and integration with the Firestore workflow pattern.

---

## Overview

[Ketcher](https://github.com/epam/ketcher) is an open-source chemical structure editor built with React. Rather than re-implementing it in Angular (which would require React-in-Angular bridging), we embed the Ketcher **standalone server** inside an `<iframe>` and communicate via the browser's `postMessage` API. This gives a clean separation of concerns:

- **Ketcher** handles molecule drawing
- **Angular** handles all business logic, Firestore communication, and UI context

---

## Application Screenshot

![Ketcher Angular Integration — Running Application](../images/ketcher_angular_screenshot.png)

The Ketcher editor (left) is embedded in the Angular component with a control panel (right) for capturing the structure, viewing SMILES, and submitting tasks to Firestore.

---

## Architecture

![Ketcher Angular Integration Architecture](../images/ketcher_angular_architecture.png)

### Component Diagram

```
┌─────────────────────── Angular (manager-frontend) ────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────┐   postMessage API                 │
│  │  KetcherEditorComponent (Angular)   │◄──────────────────►  <iframe>     │
│  │                                     │                     Ketcher       │
│  │  • Captures SMILES/MOL from Ketcher │                     standalone    │
│  │  • Button: "Submit for Calculation" │                                   │
│  │  • Writes task to Firestore         │                                   │
│  │  • Monitors Firestore via onSnapshot│                                   │
│  └─────────────────────────────────────┘                                   │
│             │                    ▲                                          │
│             │ write trigger      │ result ready                             │
│             ▼                    │                                          │
│         Firestore ──────── (workflow callback) ──────── Java Backend       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Custom Features to Ketcher

Before the Angular integration, Ketcher itself was modified to add a **"Mark as Radical"** toolbar button.

#### Files Modified in `packages/ketcher-react/src/`

| File | Change |
|---|---|
| `assets/icons/files/radical.svg` | New radical dot icon |
| `script/editor/tool/radical.ts` | New `RadicalTool` class |
| `script/editor/tool/index.ts` | Registered `RadicalTool` |
| `script/ui/action/tools.js` | Added `radical` tool action |
| `script/ui/views/toolbars/toolbar.types.ts` | Added `'radical'` to `LeftToolbarItemVariant` |
| `script/ui/action/action.types.ts` | Added `'radical'` to `ToolVariant` |
| `components/Icon/utils/iconNameToIcon.ts` | Registered `RadicalIcon` |
| `script/ui/views/toolbars/LeftToolbar/LeftToolbar.tsx` | Added radical button to toolbar |

**Key insight:** Ketcher's schema maps radical values as:
- `0` = No radical
- `2` = Monoradical ← what we want (one dot)
- `1` = Diradical singlet (two paired dots)
- `3` = Diradical triplet

Setting `radical: 2` (not `1`) gives the correct monoradical behaviour.

---

### Step 2: Add the postMessage Bridge to Ketcher

To allow cross-origin communication (Angular on `:4200`, Ketcher on `:4002`), we added a message listener inside `example/src/App.tsx`:

```tsx
onInit={(ketcher: Ketcher) => {
  window.ketcher = ketcher;

  // postMessage bridge for cross-origin parent (e.g. Angular app)
  window.addEventListener('message', async (event: MessageEvent) => {
    if (event.data?.eventType === 'GET_STRUCTURE') {
      const [smiles, molfile] = await Promise.all([
        ketcher.getSmiles().catch(() => ''),
        ketcher.getMolfile().catch(() => ''),
      ]);
      safePostMessage({ eventType: 'STRUCTURE_RESPONSE', smiles, molfile });
    }

    if (event.data?.eventType === 'SET_STRUCTURE') {
      await ketcher.setMolecule(
        event.data.molfile || event.data.smiles || '',
      );
    }
  });

  safePostMessage({ eventType: 'init' });
}}
```

**Crucially**, `safePostMessage.ts` was also fixed to use `'*'` as the target origin when the parent origin cannot be read (cross-origin restriction):

```typescript
// When cross-origin, fall back to '*' so the Angular parent can receive messages
let parentOrigin = '*';
try {
  const origin = window.parent.location.origin;
  if (origin && origin !== 'null') parentOrigin = origin;
} catch {
  parentOrigin = '*'; // cross-origin: parent origin unreadable
}
window.parent.postMessage(message, parentOrigin);
```

---

### Step 3: Angular `KetcherEditorComponent`

**Location:** `manager-frontend/src/app/components/ketcher-editor/`

#### Key Design Decisions

1. **`SafeResourceUrl`** — Angular's `DomSanitizer.bypassSecurityTrustResourceUrl()` is used for the iframe `[src]` binding to avoid security exceptions.
2. **Pure postMessage** — No `contentWindow.ketcher` access (cross-origin forbidden). All communication is via `postMessage`.
3. **Firestore task pattern** — Follows the same pattern as Cloud Workflow tasks: write a document with `status: 'pending'`, then `onSnapshot()` monitors for the backend to set `status: 'complete'`.

#### postMessage Protocol

| Direction | Event Type | Payload |
|---|---|---|
| Angular → Ketcher | `GET_STRUCTURE` | _(none)_ |
| Ketcher → Angular | `STRUCTURE_RESPONSE` | `{ smiles, molfile }` |
| Angular → Ketcher | `SET_STRUCTURE` | `{ smiles? , molfile? }` |
| Ketcher → Angular | `init` | _(none)_ |

#### Firestore Document Schema (`molecule-tasks/{id}`)

```json
{
  "smiles": "C1CCCCC1",
  "molfile": "...",
  "status": "pending | processing | complete | error",
  "type": "molecule-calculation",
  "createdAt": "<timestamp>",
  "result": "<optional result string>",
  "error": "<optional error string>"
}
```

---

### Step 4: Routes and Navigation

**`app.routes.ts`** — new route added:
```typescript
{ path: 'molecule-editor', component: KetcherEditorComponent }
```

**`home.html`** — new card in the Tasks tab:
> _"Draw chemical structures using the Ketcher editor and submit them for calculation or data processing via Firestore."_

---

## Running Locally

### Start Ketcher Standalone

```sh
cd ketcher

# First time or after source changes — rebuild:
npm run build:example:standalone

# Serve (runs on http://localhost:4002):
npm run serve:standalone
```

### Start Angular Frontend

```sh
cd manager-frontend
ng serve   # http://localhost:4200
```

Navigate to: **Home → Tasks → Molecule Editor**  
or directly: `http://localhost:4200/molecule-editor`

---

## Firestore Security Rules

The `molecule-tasks` collection requires explicit Firestore rules:

```javascript
match /molecule-tasks/{taskId} {
  allow create: if request.auth != null;
  allow read, update: if request.auth != null;
}
```

For local development only:
```javascript
match /molecule-tasks/{taskId} {
  allow read, write: if true;  // ⚠️ remove before production
}
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `DOMException: Permission denied to access property "ketcher"` | Direct `contentWindow.ketcher` access blocked cross-origin | Use `postMessage` protocol only |
| `Failed to execute 'postMessage'... target origin does not match` | `safePostMessage` used Ketcher's own origin as target | Fixed: use `'*'` when parent origin unreadable |
| `Missing or insufficient permissions` | Firestore rules don't allow writes to `molecule-tasks` | Add rules (see above) |
| `Error: ENOENT: dist/standalone/serve.json` | Standalone build hasn't been run yet | Run `npm run build:example:standalone` first |
| `SyntaxError: JSON.parse unexpected character` in Save dialog | Running in remote mode without Indigo backend | Switch to `serve:standalone` mode |

---

## Future Work

- **Atom Properties dialog** — Integrate radical selection into the right-click → Atom Properties dialog
- **Backend listener** — Implement a Firestore listener in the Java backend that picks up `molecule-tasks` with `status: 'pending'` and runs the calculation
- **Multiple task types** — Extend the `type` field to support different backend operations (e.g. `thermodynamic-calculation`, `structure-validation`)
- **Result rendering** — Render structured results (not just raw strings) in the Angular control panel
