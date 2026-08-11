import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseCatalogDetailComponent } from './base-catalog-detail.component';

import { TextSectionCardComponent } from '../cards/text-section-card.component';
import { ElectronicPropertiesCardComponent } from '../cards/electronic-properties-card.component';
import { AtomicRadiiCardComponent } from '../cards/atomic-radii-card.component';
import { AltNamesCardComponent } from '../cards/alt-names-card.component';
import { KetcherViewerComponent } from '../../ketcher-viewer/ketcher-viewer.component';

@Component({
  selector: 'app-substructure-detail',
  standalone: true,
  imports: [
    CommonModule,
    TextSectionCardComponent,
    ElectronicPropertiesCardComponent,
    AtomicRadiiCardComponent,
    AltNamesCardComponent,
    KetcherViewerComponent
  ],
  template: `
    <div class="molecule-info-split-container">
      <!-- Left Column: Ketcher 2D Viewer -->
      <div class="ketcher-panel-column">
        <app-ketcher-viewer [molfile]="sdfContent" title="2D Substructure Pattern"></app-ketcher-viewer>
      </div>

      <!-- Right Column: Sections Grid -->
      <div class="sections-grid-column">
        <div class="sections-grid">
          <ng-container *ngFor="let section of sections">
            <!-- Electronic Properties -->
            <app-electronic-properties-card
              *ngIf="section.title.includes('Electronic Properties')"
              [section]="section">
            </app-electronic-properties-card>

            <!-- Atomic Radii -->
            <app-atomic-radii-card
              *ngIf="section.title.includes('Atomic Radii')"
              [section]="section">
            </app-atomic-radii-card>

            <!-- Alternative Names -->
            <app-alt-names-card
              *ngIf="section.title.includes('Alternative Chemical Names')"
              [section]="section">
            </app-alt-names-card>

            <!-- Generic Text / Code Block -->
            <app-text-section-card
              *ngIf="!section.title.includes('Electronic Properties') && !section.title.includes('Atomic Radii') && !section.title.includes('Alternative Chemical Names')"
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
export class SubstructureDetailComponent extends BaseCatalogDetailComponent {
  @Input() sdfContent: string | null = null;
}
