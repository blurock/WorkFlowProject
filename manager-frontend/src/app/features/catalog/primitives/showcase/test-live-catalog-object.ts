import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../../core/services/auth.service';
import { OntologyService } from '../../../../core/services/ontology.service';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';
import { Router } from '@angular/router';
import { WorkflowVisibilityService, CatalogObjectNavigationService } from '../base-primitive';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

interface FetchedObject {
  path: string;
  value: any;
  structure: any;
  classname: string;
}

@Component({
  selector: 'app-test-live-catalog-object',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    DynamicPrimitiveComponent,
    MatTabsModule,
    MatTooltipModule
  ],
  template: `
    <div class="test-page-container">
      <!-- Header -->
      <header class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-btn" matTooltip="Back to Home">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-badge">
          <mat-icon class="badge-icon">cloud_sync</mat-icon>
          <span>Live Catalog Test</span>
        </div>
        <h1 class="page-title">Live Firestore Catalog Object</h1>
        <p class="page-subtitle">
          Query and render live Firestore objects using custom ontology template visualization
        </p>
        <div style="margin-top: 12px; display: flex; justify-content: center; gap: 8px;">
          <button mat-flat-button color="primary" (click)="router.navigate(['/test-ontology-class'])">
            <mat-icon>auto_stories</mat-icon> Open Ontology Tester
          </button>
        </div>
      </header>

      <!-- Auth Status Panel -->
      <mat-card class="auth-card mat-elevation-z2" [class.authenticated]="auth.uid() !== 'Guest'">
        <mat-card-content class="auth-card-content">
          <div class="auth-info">
            <mat-icon class="auth-icon">{{ auth.uid() !== 'Guest' ? 'vpn_key' : 'lock' }}</mat-icon>
            <div class="auth-details">
              <span class="auth-status-label">Authentication Status:</span>
              <span class="auth-uid">
                Logged in UID: <strong>{{ auth.uid() }}</strong>
              </span>
              <p *ngIf="auth.uid() === 'Guest'" class="auth-warn-text">
                You are currently signed out. Firestore queries for user paths will fail with permission-denied.
              </p>
            </div>
          </div>
          <div class="auth-actions">
            <button *ngIf="auth.uid() === 'Guest'" mat-flat-button color="primary" (click)="loginWithGoogle()">
              <mat-icon>login</mat-icon>
              <span>Sign In with Google</span>
            </button>
            <button *ngIf="auth.uid() !== 'Guest'" mat-stroked-button color="warn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Path Input Form -->
      <mat-card class="path-card mat-elevation-z2">
        <mat-card-content>
          <div class="path-form-row">
            <mat-form-field appearance="outline" class="path-input-field">
              <mat-label>Firestore Document Path</mat-label>
              <input matInput [(ngModel)]="firestorePath" placeholder="Enter collection/doc/collection/doc path...">
              <mat-hint>Even number of path segments required for document lookup</mat-hint>
            </mat-form-field>
            
            <div class="action-buttons-group">
              <button mat-stroked-button 
                      class="uid-helper-btn"
                      (click)="injectMyUid()" 
                      [disabled]="auth.uid() === 'Guest'"
                      matTooltip="Swap path UID with your active logged-in UID">
                <mat-icon>person</mat-icon>
                <span>Use My UID</span>
              </button>
              
              <button mat-raised-button color="primary" class="load-btn" (click)="fetchObject()" [disabled]="loading || !firestorePath">
                <mat-icon *ngIf="!loading">sync</mat-icon>
                <mat-spinner *ngIf="loading" diameter="20" color="accent" class="btn-spinner"></mat-spinner>
                <span>Load Object</span>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading Panel -->
      <div class="loading-panel" *ngIf="loading">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Fetching Firestore document and resolving ontology template...</p>
      </div>

      <!-- Error Alert -->
      <mat-card class="error-card mat-elevation-z2" *ngIf="error && !loading">
        <mat-card-content>
          <div class="error-content">
            <mat-icon color="warn">error_outline</mat-icon>
            <div>
              <strong>Failed to load object</strong>
              <p class="error-text">{{ error }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Visualization Content -->
      <div class="visualizer-section" *ngIf="fetchedObjects.length > 0 && !loading">
        <div class="section-header">
          <mat-icon>layers</mat-icon>
          <h2>UI Visualizer Output</h2>
        </div>
        
        <mat-tab-group [(selectedIndex)]="activeTabIndex" class="visualizer-tabs">
          <mat-tab *ngFor="let obj of fetchedObjects" [label]="getTabLabel(obj)">
            <div class="tab-content-wrapper">
              <div class="tab-meta">
                <span class="type-tag">{{ obj.classname }}</span>
                <span class="path-tag" [matTooltip]="obj.path">{{ getShortPath(obj.path) }}</span>
              </div>
              <div class="rendered-component-box">
                <app-dynamic-primitive [structure]="obj.structure" [value]="obj.value" (valueChange)="obj.value = $event; cdr.detectChanges()"></app-dynamic-primitive>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <!-- Raw JSON Output -->
      <div class="json-section" *ngIf="value && !loading">
        <div class="section-header">
          <mat-icon>code</mat-icon>
          <h2>Raw Database JSON</h2>
          <button mat-icon-button (click)="copyJson()" matTooltip="Copy JSON" class="copy-btn">
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>
        <mat-card class="json-card mat-elevation-z2">
          <mat-card-content>
            <pre class="json-output">{{ value | json }}</pre>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .test-page-container {
      padding: 32px 40px 80px;
      min-height: 100vh;
      max-width: 1100px;
      margin: 0 auto;
      background: #f8fafc;
      font-family: 'Google Sans', 'Inter', sans-serif;
    }

    .page-header {
      text-align: center;
      margin-bottom: 36px;
      position: relative;
    }

    .back-btn {
      position: absolute;
      left: 0;
      top: 0;
      color: #64748b;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .badge-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .page-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 10px;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 1rem;
      margin-bottom: 0;
    }

    /* ── Auth Card ──────────────────── */
    .auth-card {
      border-radius: 12px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #94a3b8;
      background-color: #f8fafc;
      transition: all 0.3s ease;
    }

    .auth-card.authenticated {
      border-left: 4px solid #22c55e;
      background-color: #f0fdf4;
    }

    .auth-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .auth-info {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex: 1;
    }

    .auth-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #64748b;
      margin-top: 2px;
    }

    .authenticated .auth-icon {
      color: #22c55e;
    }

    .auth-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .auth-status-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .auth-uid {
      font-size: 1rem;
      color: #1e293b;
    }

    .auth-uid strong {
      font-family: monospace;
      background-color: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }

    .authenticated .auth-uid strong {
      background-color: #dcfce7;
      border-color: #bbf7d0;
      color: #15803d;
    }

    .auth-warn-text {
      color: #ef4444;
      font-size: 0.85rem;
      margin: 4px 0 0;
      font-weight: 500;
    }

    .auth-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    /* ── Path Card ───────────────────── */
    .path-card {
      border-radius: 12px;
      margin-bottom: 32px;
      border: 1px solid #e2e8f0;
    }

    .path-form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .path-input-field {
      flex: 1;
      min-width: 300px;
    }

    .action-buttons-group {
      display: flex;
      gap: 12px;
      height: 56px;
    }

    .uid-helper-btn {
      height: 100%;
      font-weight: 600;
    }

    .load-btn {
      height: 100%;
      padding: 0 24px;
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-spinner {
      margin-right: 8px;
    }

    .loading-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 60px 0;
      color: #64748b;
    }

    .error-card {
      border-left: 4px solid #ef4444;
      margin-bottom: 32px;
      border-radius: 8px;
    }

    .error-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .error-content mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .error-text {
      color: #ef4444;
      margin: 4px 0 0;
      font-size: 0.9rem;
    }

    .visualizer-section, .json-section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .section-header mat-icon {
      color: #2563eb;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      flex: 1;
    }

    .type-tag {
      font-family: monospace;
      font-size: 0.8rem;
      background: #eff6ff;
      color: #2563eb;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 500;
      border: 1px solid #dbeafe;
    }

    .rendered-component-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .json-card {
      border-radius: 12px;
      background: #0f172a;
      border: 1px solid #1e293b;
    }

    .json-output {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      color: #38bdf8;
      background: transparent;
      padding: 12px;
      overflow-x: auto;
      max-height: 500px;
      margin: 0;
    }

    .copy-btn {
      color: #2563eb;
    }

    .visualizer-tabs {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      margin-top: 12px;
    }
    .tab-content-wrapper {
      padding: 24px;
      background: #f8fafc;
    }
    .tab-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
    }
    .path-tag {
      font-size: 0.8rem;
      color: #64748b;
      font-family: monospace;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      max-width: 450px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: help;
    }
  `]
})
export class TestLiveCatalogObjectComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private ontologyService = inject(OntologyService);
  private snackBar = inject(MatSnackBar);
  public cdr = inject(ChangeDetectorRef);
  public router = inject(Router);
  public auth = inject(AuthService);
  private visibilityService = inject(WorkflowVisibilityService);
  private navService = inject(CatalogObjectNavigationService);
  private previousShowAllFields = false;
  private navSubscription?: any;

  // Pre-populated default path requested by user
  firestorePath = '/hierthermodynamicdataset/UOqk0KtFtaXma5TGsi8Seh9RMbx1/datainformationhierarchy/hierdatasetseriesdataobjects/JThermodynamicsSymmetryStructureDefinitionDataSet/JThermodynamicsSymmetryStructureDefinitionDataSet/Carbon+Atom+External+Symmetry/ExternalSymmetry-CyB1zyB1zyB1zyB1z-3';


  loading = false;
  error: string | null = null;
  fetchedObjects: FetchedObject[] = [];
  activeTabIndex = 0;

  get value(): any {
    return this.fetchedObjects[this.activeTabIndex]?.value || null;
  }

  get structure(): any {
    return this.fetchedObjects[this.activeTabIndex]?.structure || null;
  }

  get resolvedClassname(): string {
    return this.fetchedObjects[this.activeTabIndex]?.classname || '';
  }

  ngOnInit() {
    this.previousShowAllFields = this.visibilityService.showAllFields;
    this.visibilityService.showAllFields = true;
    this.fetchObject();

    this.navSubscription = this.navService.fetchObject$.subscribe(path => {
      this.firestorePath = path;
      this.fetchObject();
    });
  }

  ngOnDestroy() {
    this.visibilityService.showAllFields = this.previousShowAllFields;
    if (this.navSubscription) {
      this.navSubscription.unsubscribe();
    }
  }

  async fetchObject() {
    if (!this.firestorePath) return;

    // Clean trailing/leading spaces and slashes
    let cleanPath = this.firestorePath.trim();
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    const segments = cleanPath.split('/').filter(x => x);
    if (segments.length % 2 !== 0) {
      this.error = `Invalid document path: A document path must have an even number of segments. Your path has ${segments.length} segments.`;
      this._resetState();
      return;
    }

    const normalizedPath = cleanPath.toLowerCase();
    const existingIndex = this.fetchedObjects.findIndex(o => o.path.replace(/^\//, '').toLowerCase() === normalizedPath);
    if (existingIndex !== -1) {
      this.activeTabIndex = existingIndex;
      this.snackBar.open('Switched to already loaded object tab!', 'Close', { duration: 3000 });
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    try {
      const docRef = doc(this.firestore, cleanPath);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const docData = snap.data() as any;

        // Read objectype / catobjtype / DatabaseObjectType to determine class template
        const resolvedClassname = docData['dataset:objectype'] ||
          docData['dataset:catobjtype'] ||
          docData['dataset:DatabaseObjectType'] ||
          'dataset:FirestoreCatalogID';

        this.ontologyService.getUITemplate(resolvedClassname).subscribe({
          next: (res: any) => {
            const structure = res['dataobject'];

            const newObj: FetchedObject = {
              path: '/' + cleanPath,
              value: docData,
              structure: structure,
              classname: resolvedClassname
            };

            this.fetchedObjects.push(newObj);
            this.activeTabIndex = this.fetchedObjects.length - 1;

            this.loading = false;
            this.cdr.detectChanges();
            this.snackBar.open('Catalog object fetched and added to tabs!', 'Close', { duration: 3000 });
          },
          error: (err: any) => {
            this.error = 'Failed to load ontology template: ' + (err.message || err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.error = `No database document found at the path: /${cleanPath}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    } catch (err: any) {
      this.error = 'Firestore query error: ' + (err.message || err);
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getTabLabel(obj: FetchedObject): string {
    const shortDesc = obj.value?.['dataset:shortdescription'];
    if (shortDesc && shortDesc !== 'not assigned' && shortDesc.trim() !== '') {
      return shortDesc;
    }
    const segments = obj.path.split('/').filter(x => x);
    return segments[segments.length - 1] || 'Object';
  }

  getShortPath(path: string): string {
    if (path.length > 50) {
      return '...' + path.substring(path.length - 47);
    }
    return path;
  }

  private _resetState() {
    this.fetchedObjects = [];
    this.activeTabIndex = 0;
  }

  copyJson() {
    if (!this.value) return;
    navigator.clipboard.writeText(JSON.stringify(this.value, null, 2)).then(() => {
      this.snackBar.open('Raw JSON copied to clipboard', 'OK', { duration: 2000 });
    });
  }

  async loginWithGoogle() {
    try {
      await this.auth.loginWithGoogle();
      this.snackBar.open('Logged in successfully!', 'Close', { duration: 3000 });
      this.fetchObject();
    } catch (err: any) {
      this.snackBar.open('Login failed: ' + (err.message || err), 'Close', { duration: 5000 });
    }
  }

  async logout() {
    try {
      await this.auth.logout();
      this.snackBar.open('Signed out.', 'Close', { duration: 3000 });
      this._resetState();
      this.cdr.detectChanges();
    } catch (err: any) {
      this.snackBar.open('Logout failed: ' + (err.message || err), 'Close', { duration: 5000 });
    }
  }

  injectMyUid() {
    const activeUid = this.auth.uid();
    if (activeUid && activeUid !== 'Guest') {
      this.firestorePath = this.firestorePath.replace(/UOqk0KtFtaXma5TGsi8Seh9RMbx1/g, activeUid);
      this.snackBar.open('Injected your active UID into path!', 'Close', { duration: 2000 });
      this.cdr.detectChanges();
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
