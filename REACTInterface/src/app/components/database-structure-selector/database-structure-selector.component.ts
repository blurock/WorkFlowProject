import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule, MatFormFieldAppearance } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CatalogItem } from '../../services/react-cloud-api.service';
import { CatalogServiceRegistry } from '../../services/catalog/catalog-service-registry.service';
import { BaseCatalogService } from '../../services/catalog/base-catalog.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';

export interface StructurePreset {
  name: string;
  smiles?: string;
  sdf?: string;
}

export interface StructureLoadedEvent {
  name: string;
  structure: string;
  format: 'sdf' | 'smiles';
  catalogItem?: CatalogItem;
}

@Component({
  selector: 'app-database-structure-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './database-structure-selector.component.html',
  styleUrls: ['./database-structure-selector.component.scss']
})
export class DatabaseStructureSelectorComponent implements OnInit, OnChanges {
  /** Database catalog type: 'molecules' or 'substructures' */
  @Input() public catalogType: 'molecules' | 'substructures' = 'molecules';

  /** Current text value (supports [(value)] two-way binding) */
  @Input() public value: string = '';

  /** Field display label */
  @Input() public label: string = 'Target Molecule Name';

  /** Placeholder text */
  @Input() public placeholder: string = 'Search database or enter custom name...';

  /** Optional hint text (if omitted, dynamic database status badge is shown) */
  @Input() public hint?: string;

  /** Required field flag */
  @Input() public required: boolean = false;

  /** Disabled state */
  @Input() public disabled: boolean = false;

  /** Appearance style of the mat-form-field */
  @Input() public appearance: MatFormFieldAppearance = 'outline';

  /** Optional preset structures for quick 1-click selection */
  @Input() public presets: StructurePreset[] = [];

  /** Label for presets row */
  @Input() public presetsLabel: string = 'Presets:';

  /** Whether to automatically fetch and emit 2D/3D structure when an item is chosen */
  @Input() public autoFetchStructure: boolean = true;

  /** Maximum suggestion items displayed in autocomplete dropdown */
  @Input() public maxSuggestions: number = 25;

  /** Whether to show the registered database status indicator */
  @Input() public showStatusBadge: boolean = true;

  /** Two-way value change emitter */
  @Output() public valueChange = new EventEmitter<string>();

  /** Emitted when an existing catalog item is selected from dropdown */
  @Output() public itemSelected = new EventEmitter<CatalogItem>();

  /** Emitted when structure data (SDF or SMILES) is loaded for the selected structure */
  @Output() public structureLoaded = new EventEmitter<StructureLoadedEvent>();

  // Internal state
  public availableItems: CatalogItem[] = [];
  public filteredItems: CatalogItem[] = [];
  public isLoadingCatalog: boolean = false;
  public isLoadingStructure: boolean = false;
  public activeMatchedItem: CatalogItem | null = null;

  constructor(
    private catalogRegistry: CatalogServiceRegistry,
    private chemParser: ChemStructureParserService
  ) {}

  ngOnInit(): void {
    this.loadCatalogItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['catalogType'] && !changes['catalogType'].firstChange) {
      this.loadCatalogItems(true);
    }
    if (changes['value']) {
      this.updateActiveMatch(this.value);
      this.filterItems(this.value);
    }
  }

  /**
   * Returns the catalog service for the specified type ('molecules' or 'substructures').
   */
  private get service(): BaseCatalogService {
    return this.catalogRegistry.getServiceForTask(this.catalogType);
  }

  /**
   * Loads catalog list from service (with automatic session caching).
   */
  public loadCatalogItems(forceRefresh: boolean = false): void {
    this.isLoadingCatalog = true;
    this.service.getCatalogList('job1', forceRefresh).subscribe({
      next: (items) => {
        this.availableItems = items || [];
        this.filterItems(this.value);
        this.updateActiveMatch(this.value);
        this.isLoadingCatalog = false;
      },
      error: (err) => {
        console.warn(`[DatabaseStructureSelector] Failed to load catalog for ${this.catalogType}:`, err);
        this.isLoadingCatalog = false;
      }
    });
  }

  /**
   * Filters available items by query (matches name or ID).
   */
  public filterItems(query: string): void {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.filteredItems = this.availableItems.slice(0, this.maxSuggestions);
      return;
    }
    this.filteredItems = this.availableItems
      .filter(item => item.name.toLowerCase().includes(q) || (item.id && item.id.includes(q)))
      .slice(0, this.maxSuggestions);
  }

  /**
   * Updates the match state for the current input value.
   */
  private updateActiveMatch(val: string): void {
    const clean = (val || '').trim().toLowerCase();
    if (!clean) {
      this.activeMatchedItem = null;
      return;
    }
    this.activeMatchedItem = this.availableItems.find(
      item => item.name.toLowerCase() === clean
    ) || null;
  }

  /**
   * Checks whether the given name exists in the database.
   */
  public isRegistered(name: string): boolean {
    if (!name) return false;
    const clean = name.trim().toLowerCase();
    return this.availableItems.some(item => item.name.toLowerCase() === clean);
  }

  /**
   * Handles user typing in the input field.
   */
  public onInputChange(newVal: string): void {
    this.value = newVal;
    this.valueChange.emit(this.value);
    this.filterItems(newVal);
    this.updateActiveMatch(newVal);
  }

  /**
   * Handles autocomplete selection.
   */
  public onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedName = event.option.value;
    this.value = selectedName;
    this.valueChange.emit(this.value);
    this.updateActiveMatch(selectedName);

    const foundItem = this.availableItems.find(item => item.name === selectedName);
    if (foundItem) {
      this.itemSelected.emit(foundItem);
    }

    // Check if there is an associated preset first
    const preset = this.presets.find(p => p.name.toLowerCase() === selectedName.toLowerCase());
    if (preset && (preset.smiles || preset.sdf)) {
      this.structureLoaded.emit({
        name: preset.name,
        structure: preset.sdf || preset.smiles!,
        format: preset.sdf ? 'sdf' : 'smiles',
        catalogItem: foundItem
      });
      return;
    }

    // Otherwise, fetch structure from database if enabled
    if (this.autoFetchStructure) {
      this.fetchStructureFor(selectedName, foundItem);
    }
  }

  /**
   * Fetches full SDF detail from database and emits structureLoaded.
   */
  public fetchStructureFor(itemName: string, catalogItem?: CatalogItem): void {
    if (!itemName) return;
    this.isLoadingStructure = true;
    this.service.getItemDetails(itemName).subscribe({
      next: (detailText) => {
        this.isLoadingStructure = false;
        const sdf = this.chemParser.extractSdfContent(detailText);
        if (sdf) {
          this.structureLoaded.emit({
            name: itemName,
            structure: sdf,
            format: 'sdf',
            catalogItem
          });
        }
      },
      error: (err) => {
        this.isLoadingStructure = false;
        console.warn(`[DatabaseStructureSelector] Could not fetch details for '${itemName}':`, err);
      }
    });
  }

  /**
   * Loads a preset structure on click.
   */
  public selectPreset(preset: StructurePreset): void {
    this.value = preset.name;
    this.valueChange.emit(this.value);
    this.updateActiveMatch(preset.name);

    const foundItem = this.availableItems.find(i => i.name.toLowerCase() === preset.name.toLowerCase());
    if (foundItem) {
      this.itemSelected.emit(foundItem);
    }

    if (preset.smiles || preset.sdf) {
      this.structureLoaded.emit({
        name: preset.name,
        structure: preset.sdf || preset.smiles!,
        format: preset.sdf ? 'sdf' : 'smiles',
        catalogItem: foundItem
      });
    } else if (this.autoFetchStructure) {
      this.fetchStructureFor(preset.name, foundItem);
    }
  }

  /**
   * Clears the input field.
   */
  public clear(): void {
    this.value = '';
    this.valueChange.emit('');
    this.activeMatchedItem = null;
    this.filterItems('');
  }
}
