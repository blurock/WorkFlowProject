import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseSectionCardComponent } from './base-section-card.component';
import { SdfViewerComponent } from '../../sdf-viewer/sdf-viewer.component';

@Component({
  selector: 'app-mech-structures-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, SdfViewerComponent],
  template: `
    <mat-card class="section-card" [class.collapsed]="!section.isExpanded">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">hub</mat-icon>
        <mat-card-title class="section-card-title">{{ section.title }}</mat-card-title>
        <div class="section-header-actions">
          <button mat-icon-button (click)="onCopy()" matTooltip="Copy section content">
            <mat-icon>content_copy</mat-icon>
          </button>
          <button mat-icon-button (click)="onToggle()" [matTooltip]="section.isExpanded ? 'Collapse section' : 'Expand section'">
            <mat-icon>{{ section.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content *ngIf="section.isExpanded" class="section-card-content p-0">
        <app-sdf-viewer
          [sdfContent]="effectiveSdfContent"
          [filename]="(section.title || 'structures') + '.sdf'">
        </app-sdf-viewer>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [`
    :host { display: block; width: 100%; }
    .section-card-content { padding: 12px !important; }
  `]
})
export class MechStructuresCardComponent extends BaseSectionCardComponent {
  get effectiveSdfContent(): string {
    if (this.section?.content) return this.section.content;
    if (this.section?.mechFileData?.sdfBlocks && this.section.mechFileData.sdfBlocks.length > 0) {
      return this.section.mechFileData.sdfBlocks.map(b => b.sdfContent).join('\n$$$$\n');
    }
    return '';
  }
}
