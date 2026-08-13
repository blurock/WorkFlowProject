import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseCatalogDetailComponent } from './base-catalog-detail.component';

import { TextSectionCardComponent } from '../cards/text-section-card.component';
import { BensonGroupCardComponent } from '../cards/benson-group-card.component';
import { MechReactionsCardComponent } from '../cards/mech-reactions-card.component';
import { MechThermoCardComponent } from '../cards/mech-thermo-card.component';
import { MechStructuresCardComponent } from '../cards/mech-structures-card.component';
import { MechCorrsCardComponent } from '../cards/mech-corrs-card.component';

@Component({
  selector: 'app-benson-group-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TextSectionCardComponent,
    BensonGroupCardComponent,
    MechReactionsCardComponent,
    MechThermoCardComponent,
    MechStructuresCardComponent,
    MechCorrsCardComponent
  ],
  template: `
    <div class="molecule-info-split-container">
      <div class="sections-grid-column">
        <div class="sections-grid benson-full-width">
          <ng-container *ngFor="let section of sections">
            <!-- 1. Mechanism Reactions Card -->
            <app-mech-reactions-card
              *ngIf="section.title === 'Mechanism Reactions'"
              [section]="section">
            </app-mech-reactions-card>

            <!-- 2. Molecule Thermodynamics Expandable Cards -->
            <app-mech-thermo-card
              *ngIf="section.title === 'Molecule Thermodynamics'"
              [section]="section">
            </app-mech-thermo-card>

            <!-- 3. Molecule Structures Expandable Cards (Lazy Ketcher Loading) -->
            <app-mech-structures-card
              *ngIf="section.title === 'Molecule Structures'"
              [section]="section">
            </app-mech-structures-card>

            <!-- 4. Name Correspondences MatTable Matrix Card -->
            <app-mech-corrs-card
              *ngIf="section.title === 'Name Correspondences'"
              [section]="section">
            </app-mech-corrs-card>

            <!-- Benson Group Thermodynamic Table -->
            <app-benson-group-card
              *ngIf="section.title.includes('Benson') || (section.bensonGroupTableData && section.bensonGroupTableData.rows && section.bensonGroupTableData.rows.length > 0)"
              [section]="section">
            </app-benson-group-card>

            <!-- Generic Text / Code Block (Execution Log, etc.) -->
            <app-text-section-card
              *ngIf="section.title !== 'Mechanism Reactions' && section.title !== 'Molecule Thermodynamics' && section.title !== 'Molecule Structures' && section.title !== 'Name Correspondences' && !section.title.includes('Benson') && (!section.bensonGroupTableData || !section.bensonGroupTableData.rows || section.bensonGroupTableData.rows.length === 0)"
              [section]="section">
            </app-text-section-card>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class BensonGroupDetailComponent extends BaseCatalogDetailComponent {}
