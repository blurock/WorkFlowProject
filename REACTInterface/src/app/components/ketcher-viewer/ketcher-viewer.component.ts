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
      <div class="section-card-header">
        <div class="header-title-group">
          <mat-icon color="accent" class="section-avatar-icon">hub</mat-icon>
          <span class="section-card-title">{{ title }}</span>
        </div>
        <div class="section-header-actions">
          <button mat-stroked-button color="accent" (click)="triggerKetcherLayout()" matTooltip="Auto-arrange 2D layout">
            <mat-icon>auto_fix_high</mat-icon> Auto-Arrange 2D Layout
          </button>
          <button mat-stroked-button (click)="reloadKetcherStructure()" matTooltip="Reload structure in Ketcher">
            <mat-icon>refresh</mat-icon> Reload
          </button>
        </div>
      </div>
      <mat-card-content class="section-card-content p-0">
        <div class="ketcher-iframe-container" [style.height]="height || '520px'" [style.minHeight]="height || '520px'">
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
    .ketcher-card { height: 100%; display: flex; flex-direction: column; margin-bottom: 12px; }
    .section-card-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .header-title-group { display: flex; align-items: center; gap: 10px; }
    .section-card-title { font-weight: 600; font-size: 1.05rem; }
    .section-header-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
    .ketcher-iframe-container { width: 100%; height: 520px; min-height: 520px; position: relative; border-radius: 0 0 8px 8px; overflow: hidden; }
    .ketcher-iframe { width: 100%; height: 100%; border: none; }
  `]
})
export class KetcherViewerComponent implements OnChanges, AfterViewInit {
  @Input() molfile: string | null = null;
  @Input() title: string = '2D Chemical Structure (Ketcher Viewer)';
  @Input() height?: string;

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
      this.sendSdfToKetcher(this.molfile, true);
    }
  }

  private getStructureResolve: ((structure: string) => void) | null = null;

  private requestedFormat: 'mol' | 'rxn' = 'rxn';

  @HostListener('window:message', ['$event'])
  onWindowMessage(event: MessageEvent): void {
    const iframeWin = this.ketcherIframe?.nativeElement?.contentWindow;
    if (!iframeWin || event.source !== iframeWin) {
      return;
    }
    if (event.data?.eventType === 'init' || event.data === 'ketcher-ready') {
      this.isKetcherLoaded = true;
      if (this.molfile) {
        this.sendSdfToKetcher(this.molfile, true);
      }
    } else if (
      event.data?.eventType === 'STRUCTURE_RESPONSE' ||
      event.data?.eventType === 'GET_STRUCTURE_RESPONSE' ||
      event.data?.eventType === 'GET_MOLFILE_RESPONSE' ||
      event.data?.eventType === 'EXPORT_STRUCTURE_RESPONSE'
    ) {
      if (this.getStructureResolve) {
        let resultStr = '';
        if (this.requestedFormat === 'mol') {
          resultStr = event.data.molfile || event.data.structure || event.data.rxn || event.data.smiles || '';
        } else {
          resultStr = event.data.rxn || event.data.molfile || event.data.smiles || event.data.structure || '';
        }
        this.getStructureResolve(resultStr);
        this.getStructureResolve = null;
      }
    }
  }

  public exportStructureFromKetcher(format: 'mol' | 'rxn' = 'rxn'): Promise<string> {
    return new Promise<string>((resolve) => {
      try {
        const iframeWin = this.ketcherIframe?.nativeElement?.contentWindow;
        if (!iframeWin) {
          resolve('');
          return;
        }

        this.requestedFormat = format;
        this.getStructureResolve = resolve;
        iframeWin.postMessage({ eventType: 'GET_STRUCTURE', format }, '*');

        setTimeout(() => {
          if (this.getStructureResolve) {
            console.warn('[KetcherViewer] Structure request timed out, returning fallback.');
            this.getStructureResolve('');
            this.getStructureResolve = null;
          }
        }, 3000);
      } catch (err) {
        console.warn('[KetcherViewer] Export structure error:', err);
        resolve('');
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['molfile'] && this.molfile) {
      this.sendSdfToKetcher(this.molfile, true);
    }
  }

  public onKetcherIframeLoad(): void {
    this.isKetcherLoaded = true;
    if (this.molfile) {
      this.sendSdfToKetcher(this.molfile, true);
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

  public sendSdfToKetcher(sdfContent: string, force: boolean = false, doLayout?: boolean): void {
    if (!sdfContent) {
      console.warn(`[KetcherViewer] sendSdfToKetcher called with empty/null structure (title: "${this.title}")`);
      return;
    }
    if (!force && this.lastSentMolfile === sdfContent && this.isKetcherLoaded) {
      return;
    }

    console.log(`[KetcherViewer] Raw input structure received (title: "${this.title}", length: ${sdfContent.length}):\n`, sdfContent);
    const formattedSdf = this.ensureValidV2000Molfile(sdfContent);
    this.lastSentMolfile = sdfContent;

    console.log(`[KetcherViewer] Sending structure to Ketcher iframe (title: "${this.title}", formattedLength: ${formattedSdf.length}):\n`, formattedSdf);

    const isRxn = formattedSdf.includes('$RXN');
    const effectiveDoLayout = doLayout !== undefined ? doLayout : !isRxn;

    const sendMessage = (): void => {
      try {
        const iframeWin = this.ketcherIframe?.nativeElement?.contentWindow;
        if (iframeWin) {
          iframeWin.postMessage({
            eventType: 'SET_STRUCTURE',
            molfile: formattedSdf,
            doLayout: effectiveDoLayout
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
    let trimmed = rawSdf.trim();
    if (trimmed.includes('$RXN')) {
      const rxnIdx = trimmed.indexOf('$RXN');
      return trimmed.substring(rxnIdx).trim();
    }

    if (trimmed.includes('$$$$')) {
      const sdfBlocks = trimmed
        .split('$$$$')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      // Single MOL block with trailing $$$$
      if (sdfBlocks.length === 1) {
        return this.processSingleMolfile(sdfBlocks[0]);
      }

      return sdfBlocks
        .map(block => this.processSingleMolfile(block))
        .join('\n$$$$\n') + '\n$$$$\n';
    }

    return this.processSingleMolfile(trimmed);
  }

  private processSingleMolfile(molfileStr: string): string {
    let cleanMol = molfileStr.trim();
    // Strip leading $MOL block header delimiter lines like "$MOL\n1\n\n" if present
    cleanMol = cleanMol.replace(/^\$MOL\r?\n(\d+\r?\n)?/i, '').trim();

    const lines = cleanMol.split(/\r?\n/);
    const countsLineIdx = lines.findIndex(l => /V2000|V3000/i.test(l) || /^\s*\d{1,3}\s+\d{1,3}(?:\s+\d{1,3})?/.test(l));
    if (countsLineIdx < 0) return cleanMol;

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

    // Process atom lines for radical code 4 -> 0 and generate M RAD property lines
    const countsMatch = body[0].match(/^\s*(\d+)\s+(\d+)/);
    if (countsMatch) {
      const nAtoms = parseInt(countsMatch[1], 10);
      const radicals: { atomIdx: number; type: number }[] = [];

      for (let i = 1; i <= nAtoms && i < body.length; i++) {
        const atomLine = body[i];
        if (atomLine.length >= 39) {
          const chargeField = atomLine.substring(36, 39);
          const chargeVal = parseInt(chargeField.trim(), 10);
          if (chargeVal === 4) {
            // Replace charge 4 with 0 on atom line
            body[i] = atomLine.substring(0, 36) + '  0' + atomLine.substring(39);
            radicals.push({ atomIdx: i, type: 2 }); // 2 = doublet radical
          }
        }
      }

      // Check if M RAD line already exists
      const hasMRad = body.some(l => l.startsWith('M  RAD'));
      if (radicals.length > 0 && !hasMRad) {
        const mRadLines: string[] = [];
        // Max 8 entry pairs per M RAD line
        for (let idx = 0; idx < radicals.length; idx += 8) {
          const chunk = radicals.slice(idx, idx + 8);
          let mRadStr = `M  RAD${chunk.length.toString().padStart(3, ' ')}`;
          for (const rad of chunk) {
            mRadStr += `${rad.atomIdx.toString().padStart(4, ' ')}${rad.type.toString().padStart(4, ' ')}`;
          }
          mRadLines.push(mRadStr);
        }

        const mEndIdx = body.findIndex(l => l.trim() === 'M  END' || l.startsWith('M  END'));
        if (mEndIdx >= 0) {
          body.splice(mEndIdx, 0, ...mRadLines);
        } else {
          body.push(...mRadLines);
          body.push('M  END');
        }
      }
    }

    const hasMEnd = body.some(l => l.trim() === 'M  END' || l.startsWith('M  END'));
    if (!hasMEnd) {
      body.push('M  END');
    }

    return [...preamble, ...body].join('\n');
  }
}
