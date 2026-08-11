import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseCatalogDetailComponent } from './base-catalog-detail.component';

import { TextSectionCardComponent } from '../cards/text-section-card.component';
import { BensonGroupCardComponent } from '../cards/benson-group-card.component';

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
    BensonGroupCardComponent
  ],
  template: `
    <div class="molecule-info-split-container">
      <div class="sections-grid-column">
        <div class="sections-grid benson-full-width">
          <ng-container *ngFor="let section of sections">
            <!-- Benson Group Thermodynamic Table -->
            <app-benson-group-card
              *ngIf="section.bensonGroupTableData && section.bensonGroupTableData.rows && section.bensonGroupTableData.rows.length > 0"
              [section]="section">
            </app-benson-group-card>

            <!-- Generic Text / Code Block -->
            <app-text-section-card
              *ngIf="!section.bensonGroupTableData || !section.bensonGroupTableData.rows || section.bensonGroupTableData.rows.length === 0"
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
