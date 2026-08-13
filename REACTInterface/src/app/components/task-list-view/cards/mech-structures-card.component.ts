import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseSectionCardComponent } from './base-section-card.component';
import { KetcherViewerComponent } from '../../ketcher-viewer/ketcher-viewer.component';

@Component({
  selector: 'app-mech-structures-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, KetcherViewerComponent],
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

      <mat-card-content *ngIf="section.isExpanded" class="section-card-content">
        <!-- Parsed Molecule Structures Subcards -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.sdfBlocks && section.mechFileData.sdfBlocks.length > 0; else rawFallback">
          <div class="table-subtitle mb-2">Molecule Structures ({{ section.mechFileData.sdfBlocks.length }} structures)</div>
          <div class="sdf-blocks-list d-flex flex-column gap-3">
            <mat-card
              *ngFor="let block of section.mechFileData.sdfBlocks"
              class="sdf-subcard mat-elevation-z1">
              <mat-card-header
                class="sdf-card-header cursor-pointer select-none"
                (click)="block.isExpanded = !block.isExpanded">
                <mat-icon mat-card-avatar color="primary" class="sdf-icon">hub</mat-icon>
                <mat-card-title class="sdf-card-title">
                  <code>{{ block.moleculeName }}</code>
                </mat-card-title>
                <mat-card-subtitle class="sdf-card-subtitle">
                  2D Chemical Structure Viewer
                </mat-card-subtitle>
                <div class="sdf-header-actions">
                  <button
                    mat-icon-button
                    (click)="$event.stopPropagation(); block.isExpanded = !block.isExpanded"
                    [matTooltip]="block.isExpanded ? 'Collapse 2D structure' : 'Expand 2D structure'">
                    <mat-icon>{{ block.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </button>
                </div>
              </mat-card-header>

              <!-- Lazy On-Demand Ketcher Viewer Rendering -->
              <mat-card-content *ngIf="block.isExpanded" class="sdf-card-content p-0">
                <app-ketcher-viewer [molfile]="block.sdfContent" [title]="'2D Structure: ' + block.moleculeName"></app-ketcher-viewer>
              </mat-card-content>
            </mat-card>
          </div>
        </ng-container>

        <!-- Fallback Raw Text Block -->
        <ng-template #rawFallback>
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [`
    :host { display: block; width: 100%; }
    .sdf-subcard {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background-color: #ffffff;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }
    .sdf-subcard:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .sdf-card-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .sdf-card-header:hover {
      background-color: #f1f5f9;
    }
    .sdf-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .sdf-card-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }
    .sdf-header-actions {
      margin-left: auto;
    }
    .sdf-icon {
      margin-right: 12px;
    }
    .cursor-pointer { cursor: pointer; }
    .select-none { user-select: none; }
  `]
})
export class MechStructuresCardComponent extends BaseSectionCardComponent {}
