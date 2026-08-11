import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { BaseSectionCardComponent } from './base-section-card.component';
import { AltNameRow } from '../../../models/task-list.models';

@Component({
  selector: 'app-alt-names-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule],
  template: `
    <mat-card class="section-card" [class.collapsed]="!section.isExpanded">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">{{ section.icon }}</mat-icon>
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
        <div class="alt-names-container mb-3" *ngIf="altNames && altNames.length > 0">
          <div class="alt-name-item" *ngFor="let alt of altNames">
            <span class="alt-name-text">{{ alt.name }}</span>
            <span class="alt-type-tag">({{ alt.type }})</span>
          </div>
        </div>

        <ng-container *ngIf="!altNames || altNames.length === 0">
          <pre class="section-code-block">{{ section.content }}</pre>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view.component.scss'],
  styles: [':host { display: block; width: 100%; }']
})
export class AltNamesCardComponent extends BaseSectionCardComponent {
  public get altNames(): AltNameRow[] {
    if (this.section?.altNamesData && this.section.altNamesData.length > 0) {
      return this.section.altNamesData;
    }
    if (this.section?.content) {
      const lines = this.section.content.split(/\r?\n/);
      return AltNamesCardComponent.parseAltNames(lines);
    }
    return [];
  }

  public static parseAltNames(lines: string[]): AltNameRow[] {
    const results: AltNameRow[] = [];
    let currentType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.includes('Alternative Names')) continue;

      if (line.includes(';')) {
        const parts = line.split(';')[0].trim().split(/\s+/);
        if (parts.length >= 2) {
          currentType = parts.slice(1).join(' ').toUpperCase();
        } else if (parts.length === 1) {
          currentType = parts[0].toUpperCase();
        }
      } else if (currentType && line.length > 0) {
        results.push({
          name: line.trim(),
          type: currentType
        });
        currentType = '';
      }
    }

    return results;
  }
}
