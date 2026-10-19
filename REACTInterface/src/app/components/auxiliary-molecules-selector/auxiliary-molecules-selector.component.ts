import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MoleculesService } from '../../services/catalog/molecules.service';
import { CatalogItem } from '../../services/react-cloud-api.service';

@Component({
  selector: 'app-auxiliary-molecules-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './auxiliary-molecules-selector.component.html',
  styleUrls: ['./auxiliary-molecules-selector.component.scss']
})
export class AuxiliaryMoleculesSelectorComponent implements OnInit {
  @Input() public selectedMolecules: string[] = [];
  @Output() public selectionChange = new EventEmitter<string[]>();

  public availableMolecules: CatalogItem[] = [];
  public filteredMolecules: CatalogItem[] = [];
  public searchQuery: string = '';
  public isLoading: boolean = false;

  public presetRadicals: string[] = [
    'hydroxyl-radical',
    'oxygen-radical',
    'oxygen',
    'hydrogen-radical',
    'peroxyl-radical',
    'water',
    'hydrogen-peroxide',
    'methyl-radical'
  ];

  constructor(private moleculesService: MoleculesService) {}

  ngOnInit(): void {
    this.loadMolecules();
  }

  public loadMolecules(): void {
    this.isLoading = true;
    this.moleculesService.getCatalogList().subscribe({
      next: (items) => {
        this.availableMolecules = items || [];
        this.filterMolecules();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[AuxiliaryMoleculesSelector] Failed to load molecules:', err);
        this.isLoading = false;
      }
    });
  }

  public onSearchChange(val: string): void {
    this.searchQuery = val;
    this.filterMolecules();
  }

  public clearSearch(): void {
    this.searchQuery = '';
    this.filterMolecules();
  }

  public filterMolecules(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredMolecules = this.availableMolecules;
      return;
    }
    this.filteredMolecules = this.availableMolecules.filter(m =>
      m.name.toLowerCase().includes(q)
    );
  }

  public isSelected(name: string): boolean {
    return this.selectedMolecules.includes(name);
  }

  public toggleMolecule(name: string): void {
    const idx = this.selectedMolecules.indexOf(name);
    if (idx >= 0) {
      this.selectedMolecules = this.selectedMolecules.filter(m => m !== name);
    } else {
      this.selectedMolecules = [...this.selectedMolecules, name];
    }
    this.selectionChange.emit(this.selectedMolecules);
  }

  public togglePreset(preset: string): void {
    this.toggleMolecule(preset);
  }

  public clearAll(): void {
    this.selectedMolecules = [];
    this.selectionChange.emit(this.selectedMolecules);
  }
}
