import { Component, OnInit, inject, ChangeDetectorRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';
import { OntologyStructure } from '../base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

interface DropdownClass {
  classname: string;
  label: string;
}

@Component({
  selector: 'app-test-ontology-class',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <div class="test-page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-badge">
          <mat-icon class="badge-icon">auto_stories</mat-icon>
          <span>Ontology Tester</span>
        </div>
        <h1 class="page-title">Symmetry & Primitive Test Harness</h1>
        <p class="page-subtitle">
          Instantiate any ontology class with system defaults to test its rendering, interactions, and output JSON format.
        </p>
      </header>

      <!-- Selection Bar -->
      <mat-card class="control-card">
        <mat-card-content class="control-grid">
          <mat-form-field appearance="outline" class="select-field">
            <mat-label>Select Ontology Class</mat-label>
            <mat-select [(ngModel)]="selectedClassname" (selectionChange)="onClassSelectChange($event.value)">
              <mat-option *ngFor="let cls of PRESET_CLASSES" [value]="cls.classname">
                {{ cls.label }} ({{ cls.classname }})
              </mat-option>
              <mat-option value="custom">-- Custom Class Name --</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="text-field" *ngIf="selectedClassname === 'custom'">
            <mat-label>Custom Class URI</mat-label>
            <input matInput [(ngModel)]="customClassname" placeholder="e.g. dataset:JThermodynamicsSymmetryDefinition" />
          </mat-form-field>

          <button mat-flat-button color="primary" class="action-btn" (click)="loadOntologyClass()" [disabled]="loading">
            <mat-icon *ngIf="!loading">play_circle</mat-icon>
            <mat-spinner diameter="20" *ngIf="loading" color="accent" style="margin-right: 8px; display: inline-block; vertical-align: middle;"></mat-spinner>
            Load & Generate Defaults
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Main Layout Panels -->
      <div class="panels-grid" *ngIf="structure && !loading">
        <!-- Left Panel: Interactive Form Editor -->
        <mat-card class="panel-card editor-panel">
          <mat-card-header class="panel-header">
            <mat-icon color="primary">edit_note</mat-icon>
            <mat-card-title class="panel-title">Component Interface Editor</mat-card-title>
          </mat-card-header>
          <mat-divider></mat-divider>
          <mat-card-content class="panel-content scrollable-panel">
            <div class="editor-container">
              <app-dynamic-primitive
                [structure]="structure"
                [value]="value"
                (valueChange)="onValueChange($event)">
              </app-dynamic-primitive>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Right Panel: Live JSON Output & Import -->
        <mat-card class="panel-card output-panel">
          <mat-card-header class="panel-header">
            <mat-icon color="primary">code</mat-icon>
            <mat-card-title class="panel-title">Output JSON & Schema Spec</mat-card-title>
            <div class="spacer"></div>
            <button mat-stroked-button (click)="importCustomJSON()" matTooltip="Import custom edited JSON" style="margin-right: 8px;">
              <mat-icon>upload</mat-icon> Import JSON
            </button>
            <button mat-stroked-button color="accent" (click)="resetDefaults()" matTooltip="Reset to default values">
              <mat-icon>restart_alt</mat-icon> Reset
            </button>
          </mat-card-header>
          <mat-divider></mat-divider>
          <mat-card-content class="panel-content scrollable-panel">
            <!-- Formatted JSON Block -->
            <div class="json-header-row">
              <span class="json-filename">live-data-model.json</span>
              <button mat-icon-button class="copy-btn" (click)="copyToClipboard()" matTooltip="Copy JSON to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            <pre class="json-code"><code>{{ value | json }}</code></pre>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Spinner for first load / transitions -->
      <div class="spinner-container" *ngIf="loading">
        <mat-spinner diameter="60"></mat-spinner>
        <p class="spinner-text">Retrieving class template definition from ontology services...</p>
      </div>

      <!-- No class loaded state -->
      <div class="empty-state" *ngIf="!structure && !loading">
        <mat-icon class="empty-icon">api</mat-icon>
        <h2>No Class Template Loaded</h2>
        <p>Choose an ontology class from the dropdown above and click "Load & Generate Defaults" to start testing.</p>
      </div>
    </div>
  `,
  styles: [`
    .test-page-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      font-family: 'Outfit', 'Inter', sans-serif;
      background-color: #f8fafc;
      min-height: 100vh;
      box-sizing: border-box;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 24px;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 20px;
      color: #3b82f6;
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 12px;
      letter-spacing: 0.03em;
    }
    .badge-icon {
      font-size: 1rem;
      width: 16px;
      height: 16px;
    }
    .page-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
      background: linear-gradient(to right, #0f172a, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .page-subtitle {
      font-size: 1rem;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }

    /* Control / Selection Card */
    .control-card {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      background: #ffffff;
    }
    .control-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      padding: 16px !important;
    }
    .select-field {
      flex: 2;
      min-width: 250px;
    }
    .text-field {
      flex: 2;
      min-width: 250px;
    }
    .action-btn {
      height: 56px;
      padding: 0 24px;
      font-weight: 600;
      font-size: 1rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #3b82f6, #4f46e5) !important;
      color: #ffffff !important;
      transition: all 0.2s ease;
      box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
    }
    .action-btn:hover:not([disabled]) {
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(59, 130, 246, 0.3);
    }

    /* Panels Grid Layout */
    .panels-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      height: calc(100vh - 280px);
      min-height: 500px;
    }
    @media (max-width: 1024px) {
      .panels-grid {
        grid-template-columns: 1fr;
        height: auto;
      }
    }
    .panel-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      background: #ffffff;
      overflow: hidden;
    }
    .panel-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
    }
    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .spacer {
      flex: 1;
    }
    .panel-content {
      padding: 20px !important;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .scrollable-panel {
      overflow-y: auto;
    }

    /* Editor Specific Container */
    .editor-container {
      width: 100%;
    }

    /* Live JSON Viewer styling */
    .json-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #1e293b;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      color: #94a3b8;
      font-size: 0.85rem;
      font-family: monospace;
      border-bottom: 1px solid #334155;
    }
    .json-code {
      margin: 0;
      padding: 16px;
      background: #0f172a;
      color: #38bdf8;
      font-family: 'Fira Code', 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      overflow: auto;
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
      flex: 1;
    }
    .copy-btn {
      color: #94a3b8 !important;
    }
    .copy-btn:hover {
      color: #ffffff !important;
    }

    /* State screens */
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      color: #475569;
    }
    .spinner-text {
      margin-top: 16px;
      font-weight: 500;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px 20px;
      color: #64748b;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .empty-icon {
      font-size: 4rem;
      width: 64px;
      height: 64px;
      color: #cbd5e1;
      margin-bottom: 16px;
    }
    .empty-state h2 {
      margin: 0 0 8px 0;
      color: #334155;
    }
    .empty-state p {
      margin: 0;
      max-width: 450px;
      line-height: 1.5;
    }
  `]
})
export class TestOntologyClassComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedClassname = 'dataset:JThermodynamicsSymmetryDefinition';
  customClassname = '';
  structure: OntologyStructure | null = null;
  value: any = null;

  readonly PRESET_CLASSES: DropdownClass[] = [
    { classname: 'dataset:JThermodynamicsSymmetryDefinition', label: 'Symmetry Definition' },
    { classname: 'dataset:JThermodynamicsSymmetryStructureDefinitionDataSet', label: 'Symmetry Structure Def DataSet' },
    { classname: 'dataset:JThermodynamicsVibrationalStructureDataSet', label: 'Vibrational Structure DataSet' },
    { classname: 'dataset:JThermodynamicsMetaAtomDefinitionDataSet', label: 'Meta Atom Definition DataSet' },
    { classname: 'dataset:JThermodynamicsDisassociationEnergyOfStructureDataSet', label: 'Disassociation Energy DataSet' },
    { classname: 'dataset:ThermodynamicBensonRuleDefinitionDataSet', label: 'Benson Rule Definition DataSet' },
    { classname: 'dataset:JThermodynamicMolarQuantities', label: 'Molar Quantities' },
    { classname: 'dataset:JThermodynamicsBensonConnectionWithMultiplicity', label: 'Benson Connection With Multiplicity' },
    { classname: 'dataset:JThermodynamicsBensonRuleStructure', label: 'Benson Rule Structure' },
    { classname: 'dataset:JThermodynamics2DSpeciesStructure', label: '2D Species Structure' }
  ];

  ngOnInit() {
    this.loadOntologyClass();
  }

  onClassSelectChange(val: string): void {
    if (val !== 'custom') {
      this.loadOntologyClass();
    }
  }

  getCurrentClassname(): string {
    return this.selectedClassname === 'custom' ? this.customClassname.trim() : this.selectedClassname;
  }

  loadOntologyClass(): void {
    const cls = this.getCurrentClassname();
    if (!cls) {
      this.snackBar.open('Please specify a class name first!', 'Dismiss', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.structure = null;
    this.value = null;
    this.cdr.detectChanges();

    this.ontologyService.getUITemplate(cls).subscribe({
      next: (res) => {
        const rawObj = res['dataobject'];
        if (rawObj) {
          this.structure = rawObj;
          this.value = this.generateDefaultValue(rawObj);
        } else {
          this.snackBar.open('Failed to find template structure in server response.', 'Dismiss', { duration: 4000 });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load class template:', err);
        this.snackBar.open(`Error loading ontology structure for: ${cls}`, 'Dismiss', { duration: 5000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateDefaultValue(struct: any): any {
    if (!struct) return null;
    if (struct.isArray) {
      return [];
    }
    if (struct.isObject && struct.properties) {
      const obj: any = {};
      for (const key of Object.keys(struct.properties)) {
        obj[key] = this.generateDefaultValue(struct.properties[key]);
      }
      if (struct.classname) {
        obj['<http://purl.org/dc/elements/1.1/identifier>'] = struct.classname;
      }
      return obj;
    }
    if (struct.isBoolean) {
      return false;
    }
    if (struct.isClassification) {
      return `Unassigned classification: ${struct.classname}`;
    }
    return "not assigned";
  }

  onValueChange(newValue: any): void {
    this.value = newValue;
    this.cdr.detectChanges();
  }

  resetDefaults(): void {
    if (this.structure) {
      this.value = this.generateDefaultValue(this.structure);
      this.cdr.detectChanges();
      this.snackBar.open('Values reset to defaults!', 'Success', { duration: 2000 });
    }
  }

  copyToClipboard(): void {
    if (this.value) {
      const jsonStr = JSON.stringify(this.value, null, 2);
      navigator.clipboard.writeText(jsonStr).then(() => {
        this.snackBar.open('JSON copied to clipboard!', 'Success', { duration: 2000 });
      }).catch((err) => {
        console.error('Copy failed:', err);
        this.snackBar.open('Failed to copy JSON.', 'Dismiss', { duration: 3000 });
      });
    }
  }

  importCustomJSON(): void {
    const rawInput = prompt('Paste your custom JSON string below to load it into the form:');
    if (rawInput === null) return; // Cancelled
    try {
      const parsed = JSON.parse(rawInput);
      if (parsed && typeof parsed === 'object') {
        this.value = parsed;
        this.cdr.detectChanges();
        this.snackBar.open('Custom JSON successfully imported!', 'Success', { duration: 3000 });
      } else {
        throw new Error('Not a valid JSON object');
      }
    } catch (e) {
      console.error(e);
      alert('Invalid JSON! Please verify your formatting and try again.');
    }
  }
}
