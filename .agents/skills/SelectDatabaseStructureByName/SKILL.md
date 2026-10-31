---
name: SelectDatabaseStructureByName
description: Guidelines and standard patterns for selecting molecules or substructures from the database by name in REACTInterface using the reusable DatabaseStructureSelectorComponent (<app-database-structure-selector>). Always use whenever a user needs to input, search, or select a molecule or substructure by name.
---

# Select Database Structure by Name

This skill defines the standard pattern and reusable component for searching and selecting chemical structures (molecules or substructures) by name across `REACTInterface`.

Whenever a user needs to search or select a molecule or substructure from the database by name (e.g., in submechanisms, reaction pattern testing, pathway creation, or reaction generators), **always use the reusable standalone component** [`DatabaseStructureSelectorComponent`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/components/database-structure-selector/database-structure-selector.component.ts) (`<app-database-structure-selector>`).

Do **not** re-implement ad-hoc text inputs with custom autocomplete logic in new components.

---

## 1. Component Location & Overview

- **Component Path**: [`REACTInterface/src/app/components/database-structure-selector/database-structure-selector.component.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/components/database-structure-selector/database-structure-selector.component.ts)
- **Selector Tag**: `<app-database-structure-selector>`
- **Catalog Integration**: Automatically powered by [`CatalogServiceRegistry`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/catalog/catalog-service-registry.service.ts), querying [`MoleculesService`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/catalog/molecules.service.ts) or [`SubstructuresService`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/catalog/substructures.service.ts) with built-in session caching to eliminate redundant network requests.

### Key Capabilities
1. **Partial Name & ID Autocomplete**: Filter-as-you-type autocomplete dropdown listing matching names and database `#IDs`.
2. **Live Database Status Indicator**: Displays a clean status badge below the input:
   - Green check: `Registered in Database (#ID)` when the name exists in the database.
   - Amber info: `Not in database — custom/temporary structure` when custom input is entered.
3. **Preset Structures (1-Click Selection)**: Supports optional `presets` array (e.g. `propane`, `butane`, `cyclohexane`) rendered as pill buttons.
4. **Automatic Structure Fetching**: When an item is selected from the database, it automatically fetches its 2D/3D structure (SDF / SMILES) and emits a `structureLoaded` event so parent components can immediately display the structure in a Ketcher canvas.
5. **Two-Way Binding**: Fully supports `[(value)]="moleculeName"` two-way data binding.

---

## 2. Component API Reference

### Inputs
| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `catalogType` | `'molecules' \| 'substructures'` | `'molecules'` | Determines whether to search molecules or substructures in the database. |
| `value` | `string` | `''` | Current text value (supports `[(value)]` two-way binding). |
| `label` | `string` | `'Target Molecule Name'` | Label displayed on the form field. |
| `placeholder` | `string` | `'Search database or enter custom name...'` | Placeholder text inside input. |
| `hint` | `string` | `undefined` | Custom hint text. If omitted, the dynamic database registration status badge is shown. |
| `required` | `boolean` | `false` | Sets required validator on the input field. |
| `disabled` | `boolean` | `false` | Disables the selector. |
| `appearance` | `MatFormFieldAppearance` | `'outline'` | Form field appearance (`'outline'` or `'fill'`). |
| `presets` | `StructurePreset[]` | `[]` | Optional preset structures (`{ name: string, smiles?: string, sdf?: string }`) for quick selection. |
| `presetsLabel` | `string` | `'Presets:'` | Header label preceding preset buttons. |
| `autoFetchStructure` | `boolean` | `true` | If true, automatically fetches SDF from database upon selection and emits `structureLoaded`. |
| `maxSuggestions` | `number` | `25` | Maximum number of autocomplete options shown in dropdown. |
| `showStatusBadge` | `boolean` | `true` | Toggles the dynamic database registration badge. |

### Outputs
| Output | Event Type | Description |
| :--- | :--- | :--- |
| `valueChange` | `EventEmitter<string>` | Emits the string name when input changes or is cleared. |
| `itemSelected` | `EventEmitter<CatalogItem>` | Emits the full `CatalogItem` (`{ id, name, rawLine }`) when an existing database record is selected. |
| `structureLoaded` | `EventEmitter<StructureLoadedEvent>` | Emits `{ name, structure, format: 'sdf' \| 'smiles' }` when structure is loaded. |

---

## 3. Usage Examples

### Example A: Target Molecule with Presets & Ketcher Canvas Loading

In template:
```html
<app-database-structure-selector
  catalogType="molecules"
  [(value)]="targetMoleculeName"
  (valueChange)="onTargetMoleculeNameChange($event)"
  (structureLoaded)="onTargetStructureLoaded($event)"
  (itemSelected)="onTargetMoleculeSelected($event)"
  [presets]="presetMolecules"
  label="Target Molecule Name"
  placeholder="Search database molecule or enter custom name (e.g. propane)...">
</app-database-structure-selector>

<app-ketcher-viewer
  #ketcherCanvas
  [molfile]="targetMolfile"
  title="Target Molecule Canvas">
</app-ketcher-viewer>
```

In TypeScript:
```typescript
import { DatabaseStructureSelectorComponent, StructureLoadedEvent, StructurePreset } from '../database-structure-selector/database-structure-selector.component';
import { CatalogItem } from '../../services/react-cloud-api.service';

@Component({
  ...
  imports: [
    ...
    DatabaseStructureSelectorComponent,
    KetcherViewerComponent
  ]
})
export class MyComponent {
  @ViewChild('ketcherCanvas') public ketcherCanvas?: KetcherViewerComponent;

  public targetMoleculeName: string = 'propane';
  public targetMolfile: string | null = null;

  public presetMolecules: StructurePreset[] = [
    { name: 'butane', smiles: 'CCCC' },
    { name: 'propane', smiles: 'CCC' },
    { name: 'isobutane', smiles: 'CC(C)C' },
    { name: 'cyclohexane', smiles: 'C1CCCCC1' }
  ];

  public onTargetMoleculeNameChange(newName: string): void {
    this.targetMoleculeName = newName;
  }

  public onTargetStructureLoaded(event: StructureLoadedEvent): void {
    this.targetMoleculeName = event.name;
    this.targetMolfile = event.structure;
    if (this.ketcherCanvas) {
      this.ketcherCanvas.sendSdfToKetcher(event.structure, true, true);
    }
  }

  public onTargetMoleculeSelected(item: CatalogItem): void {
    console.log(`Selected item #${item.id}: ${item.name}`);
  }
}
```

---

### Example B: Substructure Selection

In template:
```html
<app-database-structure-selector
  catalogType="substructures"
  [(value)]="selectedSubstructure"
  (structureLoaded)="onSubstructureLoaded($event)"
  label="Database Substructure"
  placeholder="Search database substructures (e.g. carbonyl, hydroxyl)..."
  [required]="true">
</app-database-structure-selector>
```

---

## 4. Key Rules & Best Practices

1. **Always use `<app-database-structure-selector>`**: Whenever a form, card, or modal requires picking a molecule or substructure from the database by name.
2. **Never hardcode static lists alone**: Always let users search all database structures while offering common presets if appropriate.
3. **Connect to Ketcher when visual confirmation is needed**: Hook into `(structureLoaded)` to push the molecule/substructure straight into Ketcher with `sendSdfToKetcher()`.
4. **Preserve Custom Inputs**: If a user enters a molecule not in the database, the selector gracefully displays the `Not in database — custom/temporary structure` badge, allowing both registered and new temporary molecules to be handled seamlessly.
