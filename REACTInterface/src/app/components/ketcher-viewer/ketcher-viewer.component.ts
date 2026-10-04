import { Component, Input, OnChanges, AfterViewInit, SimpleChanges, ElementRef, ViewChild, HostListener } from '@angular/core';
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
export class KetcherViewerComponent implements OnChanges, AfterViewInit {
  @Input() molfile: string | null = null;
  @Input() title: string = '2D Chemical Structure (Ketcher Viewer)';

  @ViewChild('ketcherIframe') ketcherIframe!: ElementRef<HTMLIFrameElement>;

  public ketcherSafeUrl: SafeResourceUrl;
  public isKetcherLoaded: boolean = false;
  private lastSentMolfile: string | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {
    this.ketcherSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.ketcherUrl);
  }

  ngAfterViewInit(): void {
    if (this.molfile) {
      this.sendSdfToKetcher(this.molfile);
    }
  }

  @HostListener('window:message', ['$event'])
  onWindowMessage(event: MessageEvent): void {
    if (event.data?.eventType === 'init' || event.data === 'ketcher-ready') {
      this.isKetcherLoaded = true;
      if (this.molfile) {
        this.sendSdfToKetcher(this.molfile, true);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['molfile'] && this.molfile) {
      this.sendSdfToKetcher(this.molfile, true);
    }
  }

  public onKetcherIframeLoad(): void {
    this.isKetcherLoaded = true;
    if (this.molfile) {
      this.sendSdfToKetcher(this.molfile);
    }
  }

  public reloadKetcherStructure(): void {
    if (this.molfile) {
      this.sendSdfToKetcher(this.molfile, true);
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
      }
    } catch (err) {
      console.warn('[KetcherViewer] postMessage layout error:', err);
    }
  }

  public sendSdfToKetcher(sdfContent: string, force: boolean = false): void {
    if (!sdfContent) return;
    if (!force && this.lastSentMolfile === sdfContent && this.isKetcherLoaded) {
      return;
    }

    const formattedSdf = this.ensureValidV2000Molfile(sdfContent);
    this.lastSentMolfile = sdfContent;

    const sendMessage = (): void => {
      try {
        const iframeWin = this.ketcherIframe?.nativeElement?.contentWindow;
        if (iframeWin) {
          iframeWin.postMessage({
            eventType: 'SET_STRUCTURE',
            molfile: formattedSdf,
            doLayout: true
          }, '*');
        }
      } catch (err) {
        console.warn('[KetcherViewer] postMessage error:', err);
      }
    };

    sendMessage();
    setTimeout(() => sendMessage(), 300);
    setTimeout(() => sendMessage(), 1000);
  }

  private ensureValidV2000Molfile(rawSdf: string): string {
    if (!rawSdf) return '';
    const trimmed = rawSdf.trim();
    if (trimmed.includes('$RXN')) return trimmed; // MDL $RXN reaction format

    const lines = trimmed.split(/\r?\n/);
    const countsLineIdx = lines.findIndex(l => /^\s*\d+\s+\d+/.test(l));
    if (countsLineIdx < 0) return trimmed;

    // Ensure exactly 3 preamble lines before the counts line as mandated by MDL MOL spec
    let preamble = lines.slice(0, countsLineIdx);
    if (preamble.length === 0) {
      preamble = ['Molecule', '  -REACTCLOUD-', ''];
    } else if (preamble.length === 1) {
      preamble = [preamble[0], '  -REACTCLOUD-', ''];
    } else if (preamble.length === 2) {
      preamble = [preamble[0], preamble[1], ''];
    } else if (preamble.length > 3) {
      preamble = preamble.slice(preamble.length - 3);
    }

    const body = lines.slice(countsLineIdx);
    if (body.length > 0 && !body[0].includes('V2000') && !body[0].includes('V3000')) {
      const countsMatch = body[0].match(/^\s*(\d+)\s+(\d+)/);
      if (countsMatch) {
        const nAtoms = parseInt(countsMatch[1], 10);
        const nBonds = parseInt(countsMatch[2], 10);
        const formattedAtoms = nAtoms.toString().padStart(3, ' ');
        const formattedBonds = nBonds.toString().padStart(3, ' ');
        body[0] = `${formattedAtoms}${formattedBonds}  0  0  0  0  0  0  0  0999 V2000`;
      }
    }

    return [...preamble, ...body].join('\n');
  }
}
