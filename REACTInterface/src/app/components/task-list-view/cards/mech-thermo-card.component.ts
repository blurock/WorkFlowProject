import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseSectionCardComponent } from './base-section-card.component';
import { MechThermoBlock } from '../../../models/task-list.models';

@Component({
  selector: 'app-mech-thermo-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card class="section-card" [class.collapsed]="!section.isExpanded">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">thermostat</mat-icon>
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
        <!-- Parsed Molecule Thermodynamics Subcards -->
        <ng-container *ngIf="section.mechFileData && section.mechFileData.thermoBlocks && section.mechFileData.thermoBlocks.length > 0; else rawFallback">
          <div class="table-subtitle mb-2">Molecule Thermodynamics Polynomials ({{ section.mechFileData.thermoBlocks.length }})</div>
          <div class="thermo-blocks-list d-flex flex-column gap-3">
            <mat-card
              *ngFor="let block of section.mechFileData.thermoBlocks"
              class="thermo-subcard mat-elevation-z1">
              <mat-card-header
                class="thermo-card-header cursor-pointer select-none"
                (click)="block.isExpanded = !block.isExpanded">
                <mat-icon mat-card-avatar color="primary" class="thermo-icon">local_fire_department</mat-icon>
                <mat-card-title class="thermo-card-title">
                  <code>{{ block.longName }}</code> <span class="short-name-tag font-mono">({{ block.shortName }})</span>
                </mat-card-title>
                <mat-card-subtitle class="thermo-card-subtitle">
                  CHEMKIN 7-Coefficient Polynomial
                </mat-card-subtitle>
                <div class="thermo-header-actions">
                  <button
                    mat-icon-button
                    (click)="$event.stopPropagation(); block.isExpanded = !block.isExpanded"
                    [matTooltip]="block.isExpanded ? 'Collapse polynomial' : 'Expand polynomial'">
                    <mat-icon>{{ block.isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </button>
                </div>
              </mat-card-header>

              <mat-card-content *ngIf="block.isExpanded" class="thermo-card-content pt-2">
                <pre class="section-code-block font-mono m-0">{{ block.rawBlock }}</pre>
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
    .thermo-subcard {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background-color: #ffffff;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }
    .thermo-subcard:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .thermo-card-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .thermo-card-header:hover {
      background-color: #f1f5f9;
    }
    .thermo-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .short-name-tag {
      font-size: 0.9rem;
      color: #475569;
      font-weight: normal;
      margin-left: 6px;
    }
    .thermo-card-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }
    .thermo-header-actions {
      margin-left: auto;
    }
    .thermo-icon {
      margin-right: 12px;
    }
    .cursor-pointer { cursor: pointer; }
    .select-none { user-select: none; }
  `]
})
export class MechThermoCardComponent extends BaseSectionCardComponent {}
