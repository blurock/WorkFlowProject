import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';
import { PrimitiveFileWrapperComponent } from '../dynamic-primitive/primitive-file-wrapper';
import { OntologyStructure } from '../base-primitive';
import { OntologyService } from '../../../services/ontology.service';

const TEST_DATA = {
  "dataset:uniquegenericname": "not assigned",
  "dataset:catalogobjectmaintainer": "UOqk0KtFtaXma5TGsi8Seh9RMbx1",
  "dataset:descrfilestaging": {
    "dataset:keywordfilestaging": [],
    "dataset:titlestaging": "not assigned",
    "dataset:abstractstaging": "not assigned",
    "dataset:purposefilestaging": {
      "dataset:purposekeyfilestaging": "Unassigned classification: dataset:PurposeFileStaging",
      "dataset:dataconceptstaging": "Unassigned classification: dataset:ConceptFileStaging"
    }
  },
  "dataset:fileidentifier": "not assigned",
  "dataset:uploadsrc": "Unassigned classification: dataset:UploadFileSource",
  "dcterms:title": "BensonRule",
  "dcterms:created": "2026-04-22T12:23:12.726Z",
  "foaf:page": [],
  "dataset:objectype": "dataset:ThermodynamicBensonRuleDefinitionDataSet",
  "dataset:datasetobjecttype": "dataset:ThermodynamicBensonRuleDefinitionDataSet",
  "dataset:collectionobjecttype": "dataset:ThermodynamicBensonRuleDefinitionDatabase",
  "dataset:filesourceformat": "dataset:TherGasBensonRules",
  "dataset:catobjtype": "dataset:ActivityRepositoryInitialReadLocalFile",
  "skos:mappingRelation": [],
  "dataset:filesourcesubtype": "dataset:FileMediaText",
  "<http://purl.org/dc/elements/1.1/identifier>": "dataset:initialrepositorylocal",
  "dataset:filemediatype": "dataset:FileMediaText",
  "dcterms:BibliographicResource": []
};

@Component({
  selector: 'app-dynamic-primitive-test',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    DynamicPrimitiveComponent,
    PrimitiveFileWrapperComponent
  ],
  template: `
    <div class="test-page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-badge">
          <mat-icon class="badge-icon">science</mat-icon>
          <span>Test Harness</span>
        </div>
        <h1 class="page-title">Dynamic Primitive Test</h1>
        <p class="page-subtitle">
          Rendering <code class="type-chip">dataset:ActivityRepositoryInitialReadLocalFile</code>
          with pre-populated test data
        </p>
        <div class="status-row">
          <div class="status-badge" [class.status-loading]="loading" [class.status-error]="error" [class.status-ready]="!loading && !error">
            <mat-icon class="status-icon">{{ loading ? 'sync' : error ? 'error' : 'check_circle' }}</mat-icon>
            {{ loading ? 'Loading ontology structure…' : error ? 'Failed to load structure' : 'Structure loaded — ready' }}
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div class="loading-panel" *ngIf="loading">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Fetching UI template from ontology service…</p>
      </div>

      <!-- Error -->
      <mat-card class="error-card" *ngIf="error">
        <mat-card-content>
          <div class="error-content">
            <mat-icon>error_outline</mat-icon>
            <div>
              <strong>Could not load ontology structure</strong>
              <p>{{ error }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Main Form -->
      <div class="form-section" *ngIf="structure && !loading">
        <div class="section-header">
          <mat-icon>edit_note</mat-icon>
          <h2>Edit Object</h2>
          <span class="datatype-tag">{{ datatypeKey }}</span>
        </div>

        <mat-card class="form-card">
          <mat-card-content>
            <app-primitive-file-wrapper
              [structure]="structure"
              [(value)]="formData">
            </app-primitive-file-wrapper>
          </mat-card-content>
        </mat-card>

        <div class="actions-row">
          <button mat-stroked-button color="warn" (click)="resetData()" id="btn-reset-data">
            <mat-icon>restart_alt</mat-icon>
            Reset to Test Data
          </button>
          <button mat-stroked-button (click)="clearData()" id="btn-clear-data">
            <mat-icon>clear_all</mat-icon>
            Clear All
          </button>
          <button mat-raised-button color="primary" (click)="logData()" id="btn-log-data">
            <mat-icon>data_object</mat-icon>
            Log to Console
          </button>
        </div>
      </div>

      <!-- JSON Preview -->
      <div class="json-section" *ngIf="structure && !loading">
        <div class="section-header">
          <mat-icon>code</mat-icon>
          <h2>Live JSON Output</h2>
          <button mat-icon-button color="primary" (click)="copyJson()" matTooltip="Copy JSON" id="btn-copy-json">
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>
        <mat-card class="json-card">
          <mat-card-content>
            <pre class="json-output">{{ formData | json }}</pre>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Test Data Reference -->
      <div class="reference-section">
        <div class="section-header">
          <mat-icon>info</mat-icon>
          <h2>Original Test Data</h2>
          <button mat-icon-button (click)="showReference = !showReference" id="btn-toggle-ref">
            <mat-icon>{{ showReference ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
        <mat-card class="json-card reference-card" *ngIf="showReference">
          <mat-card-content>
            <pre class="json-output reference-json">{{ testDataRef | json }}</pre>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .test-page-container {
      padding: 32px 40px 80px;
      min-height: 100vh;
      max-width: 1100px;
      margin: 0 auto;
      background: #f8f9fc;
      font-family: 'Google Sans', 'Inter', sans-serif;
    }

    /* ── Header ─────────────────────── */
    .page-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e8f0fe;
      color: #1a73e8;
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .badge-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .page-title {
      font-size: 2.4rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      color: #5f6368;
      font-size: 1rem;
      margin-bottom: 20px;
    }

    code.type-chip {
      background: #1a1a2e;
      color: #80deea;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.88rem;
      font-family: 'Roboto Mono', monospace;
    }

    /* ── Status ─────────────────────── */
    .status-row {
      display: flex;
      justify-content: center;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .status-loading {
      background: #fff8e1;
      color: #f9a825;
    }
    .status-error {
      background: #fce4ec;
      color: #c62828;
    }
    .status-ready {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ── Loading panel ───────────────── */
    .loading-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 60px 0;
      color: #5f6368;
    }

    /* ── Error card ──────────────────── */
    .error-card {
      border-left: 4px solid #c62828;
      margin-bottom: 32px;
    }

    .error-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: #c62828;
    }

    .error-content mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    /* ── Section layout ──────────────── */
    .form-section, .json-section, .reference-section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .section-header mat-icon {
      color: #1a73e8;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .section-header h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
      flex: 1;
    }

    .datatype-tag {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.78rem;
      background: #e8f0fe;
      color: #1a73e8;
      padding: 3px 10px;
      border-radius: 12px;
    }

    /* ── Cards ───────────────────────── */
    .form-card, .json-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid #e8eaed;
    }

    .reference-card {
      background: #1a1a2e;
    }

    /* ── Actions row ─────────────────── */
    .actions-row {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .actions-row button {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── JSON output ─────────────────── */
    .json-output {
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 0.82rem;
      line-height: 1.6;
      background: #1a1a2e;
      color: #80deea;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      max-height: 480px;
      white-space: pre;
      margin: 0;
    }

    .reference-json {
      color: #a5d6a7;
      max-height: 360px;
    }
  `]
})
export class DynamicPrimitiveTestComponent implements OnInit {
  readonly datatypeKey = 'dataset:ActivityRepositoryInitialReadLocalFile';
  readonly testDataRef = TEST_DATA;

  structure?: OntologyStructure;
  formData: any = { ...TEST_DATA };
  loading = true;
  error: string | null = null;
  showReference = false;

  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.ontologyService.getUITemplate(this.datatypeKey).subscribe({
      next: (struct) => {
        this.structure = struct["dataobject"];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.message || 'Unknown error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetData() {
    this.formData = JSON.parse(JSON.stringify(TEST_DATA));
    this.snackBar.open('Reset to original test data', 'OK', { duration: 2000 });
  }

  clearData() {
    this.formData = {};
    this.snackBar.open('Form data cleared', 'OK', { duration: 2000 });
  }

  logData() {
    console.log('[DynamicPrimitiveTest] Current form data:', this.formData);
    this.snackBar.open('Data logged to browser console', 'OK', { duration: 2500 });
  }

  copyJson() {
    navigator.clipboard.writeText(JSON.stringify(this.formData, null, 2)).then(() => {
      this.snackBar.open('JSON copied to clipboard', 'OK', { duration: 2000 });
    });
  }
}
