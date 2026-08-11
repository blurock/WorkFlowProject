import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseCatalogDetailComponent } from './base-catalog-detail.component';

import { TextSectionCardComponent } from '../cards/text-section-card.component';
import { ReactionRateCardComponent } from '../cards/reaction-rate-card.component';
import { AtomCorrespondencesCardComponent } from '../cards/atom-correspondences-card.component';
import { KetcherViewerComponent } from '../../ketcher-viewer/ketcher-viewer.component';

@Component({
  selector: 'app-rxn-pattern-detail',
  standalone: true,
  imports: [
    CommonModule,
    TextSectionCardComponent,
    ReactionRateCardComponent,
    AtomCorrespondencesCardComponent,
    KetcherViewerComponent
  ],
  template: `
    <div class="molecule-info-split-container">
      <!-- Left Column: Ketcher 2D Viewer -->
      <div class="ketcher-panel-column">
        <app-ketcher-viewer [molfile]="sdfContent" title="2D Chemical Structure / Reaction"></app-ketcher-viewer>
      </div>

      <!-- Right Column: Sections Grid -->
      <div class="sections-grid-column">
        <div class="sections-grid">
          <ng-container *ngFor="let section of sections">
            <!-- Section 2 & 3: Reaction Rate Parameters -->
            <app-reaction-rate-card
              *ngIf="section.title.includes('Reaction Rate') || section.title.includes('Section 2')"
              [section]="section">
            </app-reaction-rate-card>

            <!-- Section 5: Atom Correspondences & Bond Changes -->
            <app-atom-correspondences-card
              *ngIf="section.title.includes('Section 5') || section.title.includes('Correspondences')"
              [section]="section">
            </app-atom-correspondences-card>

            <!-- Generic Text / Code Block -->
            <app-text-section-card
              *ngIf="!section.title.includes('Reaction Rate') && !section.title.includes('Section 2') && !section.title.includes('Section 5') && !section.title.includes('Correspondences')"
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
export class RxnPatternDetailComponent extends BaseCatalogDetailComponent {
  @Input() sdfContent: string | null = null;
}
