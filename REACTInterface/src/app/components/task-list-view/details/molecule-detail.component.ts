import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseCatalogDetailComponent } from './base-catalog-detail.component';

import { TextSectionCardComponent } from '../cards/text-section-card.component';
import { ElectronicPropertiesCardComponent } from '../cards/electronic-properties-card.component';
import { AtomicRadiiCardComponent } from '../cards/atomic-radii-card.component';
import { AltNamesCardComponent } from '../cards/alt-names-card.component';

@Component({
  selector: 'app-molecule-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TextSectionCardComponent,
    ElectronicPropertiesCardComponent,
    AtomicRadiiCardComponent,
    AltNamesCardComponent
  ],
  template: `
    <div class="molecule-info-split-container">
      <!-- Left Column: Ketcher 2D Viewer -->
      <div class="ketcher-panel-column">
        <mat-card class="ketcher-card">
          <mat-card-header class="ketcher-card-header">
            <mat-icon mat-card-avatar color="primary">hub</mat-icon>
            <mat-card-title>2D Chemical Structure</mat-card-title>
            <mat-card-subtitle>Ketcher Interactive Viewer</mat-card-subtitle>
            <div class="ketcher-header-actions">
              <button mat-icon-button (click)="onTriggerLayout()" matTooltip="Clean & Auto-Arrange 2D Layout">
                <mat-icon>auto_awesome</mat-icon>
              </button>
              <button mat-icon-button (click)="onReloadStructure()" matTooltip="Reload structure in Ketcher">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </mat-card-header>
          <mat-card-content class="ketcher-card-content">
            <iframe
              #ketcherIframe
              [src]="ketcherSafeUrl"
              class="ketcher-iframe"
              (load)="onKetcherIframeLoad()"
              title="Ketcher Chemical Structure Editor"
            ></iframe>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Right Column: Sections Grid -->
      <div class="sections-grid-column">
        <div class="sections-grid">
          <ng-container *ngFor="let section of sections">
            <!-- Electronic Properties -->
            <app-electronic-properties-card
              *ngIf="section.electronicTableData && section.electronicTableData.length > 0"
              [section]="section">
            </app-electronic-properties-card>

            <!-- Atomic Radii -->
            <app-atomic-radii-card
              *ngIf="section.chargeTableData && section.chargeTableData.length > 0"
              [section]="section">
            </app-atomic-radii-card>

            <!-- Alternative Names -->
            <app-alt-names-card
              *ngIf="section.altNamesData && section.altNamesData.length > 0"
              [section]="section">
            </app-alt-names-card>

            <!-- Generic Text / Code Block -->
            <app-text-section-card
              *ngIf="(!section.electronicTableData || section.electronicTableData.length === 0) && (!section.chargeTableData || section.chargeTableData.length === 0) && (!section.altNamesData || section.altNamesData.length === 0)"
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
export class MoleculeDetailComponent extends BaseCatalogDetailComponent implements OnChanges {
  @Input({ required: true }) ketcherSafeUrl!: SafeResourceUrl;
  @Input() sdfContent: string | null = null;
  @ViewChild('ketcherIframe') ketcherIframe!: ElementRef<HTMLIFrameElement>;

  private isKetcherLoaded: boolean = false;

  @HostListener('window:message', ['$event'])
  onWindowMessage(event: MessageEvent): void {
    if (event.data?.eventType === 'init' || event.data === 'ketcher-ready') {
      this.isKetcherLoaded = true;
      if (this.sdfContent) {
        this.sendSdfToKetcher(this.sdfContent);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sdfContent'] && this.sdfContent) {
      if (this.isKetcherLoaded) {
        this.sendSdfToKetcher(this.sdfContent);
      } else {
        setTimeout(() => {
          if (this.sdfContent) {
            this.sendSdfToKetcher(this.sdfContent);
          }
        }, 500);
      }
    }
  }

  public onKetcherIframeLoad(): void {
    setTimeout(() => {
      if (this.sdfContent) {
        this.sendSdfToKetcher(this.sdfContent);
      }
    }, 400);
  }

  public onTriggerLayout(): void {
    if (this.ketcherIframe?.nativeElement?.contentWindow) {
      this.ketcherIframe.nativeElement.contentWindow.postMessage({
        eventType: 'LAYOUT_STRUCTURE'
      }, '*');
    }
  }

  public onReloadStructure(): void {
    if (this.sdfContent) {
      this.sendSdfToKetcher(this.sdfContent);
    }
  }

  private sendSdfToKetcher(sdf: string | null): void {
    if (!sdf) return;
    if (this.ketcherIframe?.nativeElement?.contentWindow) {
      this.ketcherIframe.nativeElement.contentWindow.postMessage({
        eventType: 'SET_STRUCTURE',
        molfile: sdf
      }, '*');
    }
  }
}
