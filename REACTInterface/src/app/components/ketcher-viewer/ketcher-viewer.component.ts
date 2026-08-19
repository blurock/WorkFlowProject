import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ketcher-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card class="section-card ketcher-card">
      <mat-card-header class="section-card-header">
        <mat-icon mat-card-avatar color="accent" class="section-avatar-icon">hub</mat-icon>
        <mat-card-title class="section-card-title">{{ title }}</mat-card-title>
        <div class="section-header-actions">
          <button mat-icon-button (click)="triggerKetcherLayout()" matTooltip="Auto-arrange 2D layout">
            <mat-icon>auto_fix_high</mat-icon>
          </button>
          <button mat-icon-button (click)="reloadKetcherStructure()" matTooltip="Reload structure in Ketcher">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </mat-card-header>
      <mat-card-content class="section-card-content p-0">
        <div class="ketcher-iframe-container">
          <iframe
            #ketcherIframe
            [src]="ketcherSafeUrl"
            class="ketcher-iframe"
            (load)="onKetcherIframeLoad()"
            title="Ketcher Chemical Structure Viewer">
          </iframe>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['../task-list-view/task-list-view.component.scss'],
  styles: [`
    :host { display: block; width: 100%; }
    .ketcher-card { height: 100%; min-height: 520px; display: flex; flex-direction: column; }
    .ketcher-iframe-container { width: 100%; height: 520px; min-height: 520px; position: relative; border-radius: 0 0 8px 8px; overflow: hidden; }
    .ketcher-iframe { width: 100%; height: 100%; border: none; }
  `]
})
export class KetcherViewerComponent implements OnChanges {
  @Input() molfile: string | null = null;
  @Input() title: string = '2D Chemical Structure (Ketcher Viewer)';

  @ViewChild('ketcherIframe') ketcherIframe!: ElementRef<HTMLIFrameElement>;

  public ketcherSafeUrl: SafeResourceUrl;
  public isKetcherLoaded: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {
    this.ketcherSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.ketcherUrl);
  }

  @HostListener('window:message', ['$event'])
  onWindowMessage(event: MessageEvent): void {
    if (event.data?.eventType === 'init' || event.data === 'ketcher-ready') {
      this.isKetcherLoaded = true;
      if (this.molfile) {
        this.sendSdfToKetcher(this.molfile);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['molfile'] && this.molfile && this.isKetcherLoaded) {
      this.sendSdfToKetcher(this.molfile);
      setTimeout(() => this.sendSdfToKetcher(this.molfile!), 300);
    }
  }

  public onKetcherIframeLoad(): void {
    this.isKetcherLoaded = true;
    if (this.molfile) {
      this.sendSdfToKetcher(this.molfile);
      setTimeout(() => this.sendSdfToKetcher(this.molfile!), 300);
    }
  }

  public reloadKetcherStructure(): void {
    if (this.molfile) {
      this.sendSdfToKetcher(this.molfile);
      this.snackBar.open('Reloading structure in Ketcher panel...', 'Dismiss', { duration: 1500 });
    }
  }

  public triggerKetcherLayout(): void {
    try {
      const iframeWin = this.ketcherIframe?.nativeElement?.contentWindow;
      if (iframeWin) {
        iframeWin.postMessage({
          eventType: 'LAYOUT_STRUCTURE'
        }, '*');
        this.snackBar.open('Auto-arranging 2D layout...', 'Dismiss', { duration: 1500 });
      }
    } catch (err) {
      console.warn('[KetcherViewer] postMessage layout error:', err);
    }
  }

  public sendSdfToKetcher(sdfContent: string): void {
    if (!sdfContent) return;

    const sendMessage = (): void => {
      try {
        const iframeWin = this.ketcherIframe?.nativeElement?.contentWindow;
        if (iframeWin) {
          iframeWin.postMessage({
            eventType: 'SET_STRUCTURE',
            molfile: sdfContent,
            doLayout: true
          }, '*');
        }
      } catch (err) {
        console.warn('[KetcherViewer] postMessage error:', err);
      }
    };

    // Immediate attempt + progressive retries while iframe finishes initializing
    sendMessage();
    setTimeout(() => sendMessage(), 300);
    setTimeout(() => sendMessage(), 800);
    setTimeout(() => sendMessage(), 1500);
  }
}
