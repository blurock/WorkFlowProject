import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePrimitiveComponent, OntologyStructure, WorkflowVisibilityService, CatalogObjectNavigationService } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { forwardRef } from '@angular/core';
import { DynamicPrimitiveComponent } from '../../primitives/dynamic-primitive/dynamic-primitive';
import { MatTableModule } from '@angular/material/table';
import { CollectionDocumentIDPairAddressComponent } from '../collection-document-id-pair-address/collection-document-id-pair-address';

// dialog component declared below to display the fetched Firestore object
@Component({
  selector: 'app-fetched-object-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="primary">cloud_download</mat-icon>
      <span>Fetched Catalog Object</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="close()" class="close-btn" type="button">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <div *ngIf="loading" class="spinner-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading database object from path:<br><code class="path-text">{{ path }}</code></p>
      </div>
      
      <div *ngIf="error" class="error-container">
        <mat-icon color="warn">error</mat-icon>
        <p class="error-msg">{{ error }}</p>
      </div>
      
      <div *ngIf="!loading && !error && structure && value">
        <div class="meta-info">
          <span class="meta-label">Object Type:</span>
          <code class="meta-val">{{ resolvedClassname }}</code>
        </div>
        <div class="readonly-wrapper">
          <app-dynamic-primitive [structure]="structure" [value]="value"></app-dynamic-primitive>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .spacer {
      flex: 1;
    }
    .close-btn {
      margin-left: auto;
    }
    .dialog-content {
      min-width: 500px;
      max-width: 800px;
      min-height: 250px;
      max-height: 70vh;
      padding: 24px;
      overflow-y: auto;
    }
    .path-text {
      background-color: #f1f5f9;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      word-break: break-all;
    }
    .spinner-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      text-align: center;
      gap: 16px;
    }
    .error-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .error-msg {
      color: #ef4444;
      font-weight: 500;
    }
    .meta-info {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .meta-label {
      font-weight: 600;
      color: #1e3a8a;
      margin-right: 8px;
    }
    .meta-val {
      color: #2563eb;
      font-family: monospace;
    }
    .readonly-wrapper {
      pointer-events: none;
      opacity: 0.95;
    }
  `]
})
export class FetchedObjectDialogComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private ontologyService = inject(OntologyService);
  dialogRef = inject(MatDialogRef<FetchedObjectDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  private visibilityService = inject(WorkflowVisibilityService);
  private cdr = inject(ChangeDetectorRef);
  private previousShowAllFields = false;

  path: string = '';
  loading = true;
  error: string | null = null;
  structure: any;
  value: any;
  resolvedClassname: string = '';

  async ngOnInit() {
    this.previousShowAllFields = this.visibilityService.showAllFields;
    this.visibilityService.showAllFields = true;

    this.path = this.data.path;
    if (!this.path) {
      this.error = 'No Firestore path provided.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    // Clean trailing/leading spaces and slashes (Firestore doc paths cannot start with slash)
    let cleanPath = this.path.trim();
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    try {
      const docRef = doc(this.firestore, cleanPath);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        this.value = snap.data();
        this.resolvedClassname = this.value['dataset:objectype'] || this.value['dataset:catobjtype'] || this.value['dataset:DatabaseObjectType'] || 'dataset:FirestoreCatalogID';
        
        this.ontologyService.getUITemplate(this.resolvedClassname).subscribe({
          next: (res) => {
            this.structure = res['dataobject'];
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = 'Failed to load ontology template: ' + (err.message || err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.error = `No database document found at the path: ${this.path}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    } catch (err: any) {
      this.error = 'Error loading document: ' + (err.message || err);
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.visibilityService.showAllFields = this.previousShowAllFields;
  }

  close() {
    this.dialogRef.close();
  }
}

// main firestore catalog id component
@Component({
  selector: 'app-firestore-catalog-id',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTableModule,
    CollectionDocumentIDPairAddressComponent,
    forwardRef(() => DynamicPrimitiveComponent)
  ],
  templateUrl: './firestore-catalog-id.html',
  styleUrl: './firestore-catalog-id.css'
})
export class FirestoreCatalogIDComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private navService = inject(CatalogObjectNavigationService);

  isExpanded = false;
  loading = false;
  resolvedStructure?: OntologyStructure;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.structure || !this.structure.properties) {
      this.loading = true;
      this.ontologyService.getUITemplate('dataset:FirestoreCatalogID').subscribe({
        next: (res) => {
          this.resolvedStructure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[FirestoreCatalogIDComponent] Failed to load UI template', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.resolvedStructure = this.structure;
    }
  }

  toggleExpand(event: Event) {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }

  get rdfsLabel(): string {
    return this.structure?.label || 'Firestore Catalog ID';
  }

  get rdfsComment(): string {
    return this.structure?.comment || 'The catalog ID associated with the Google Firestore database.';
  }

  get shortDescription(): string {
    return this.value?.['dataset:shortdescription'] || 'not assigned';
  }

  get propertyKeys(): string[] {
    if (this.resolvedStructure?.properties) {
      return Object.keys(this.resolvedStructure.properties).filter(
        key => key !== 'dataset:addressidpairs' && 
               key !== 'skos:inScheme' && 
               key !== 'qb:DataSet'
      );
    }
    return [];
  }

  getPropertyStructure(key: string): OntologyStructure {
    return this.resolvedStructure!.properties![key];
  }

  isFullWidthKey(key: string): boolean {
    const struct = this.getPropertyStructure(key);
    if (!struct) return false;
    return key === 'dataset:firestorecatalog' || 
           struct.classname === 'dataset:FirestoreCatalogID' ||
           struct.classname === 'dataset:CollectionDocumentIDPairAddress' ||
           (!!struct.classname && (struct.classname.endsWith('CatalogID') || struct.classname.includes('CatalogID')));
  }

  get firestorePath(): string {
    const address = this.value?.['dataset:addressidpairs'];
    if (!address) return '';
    const pairs = address['dataset:collectiondocpair'];
    if (!Array.isArray(pairs)) return '';

    // Sort pairs by level to construct hierarchical address
    const sortedPairs = [...pairs].sort((a, b) => {
      const levelA = parseInt(a['dataset:idlevel']) || 0;
      const levelB = parseInt(b['dataset:idlevel']) || 0;
      return levelA - levelB;
    });

    const segments = sortedPairs.map(p => {
      const coll = p['dataset:collectionid'];
      const docId = p['dataset:documentid'];
      if (coll && docId && coll !== 'not assigned' && docId !== 'not assigned') {
        return `${coll}/${docId}`;
      }
      return '';
    }).filter(s => s !== '');

    if (segments.length === 0) return '';
    
    let path = '/' + segments.join('/');
    
    // Append skos:inScheme and qb:DataSet if present and assigned
    const scheme = this.value?.['skos:inScheme'];
    const dataset = this.value?.['qb:DataSet'];
    
    if (scheme && scheme !== 'not assigned') {
      path += '/' + scheme;
    }
    if (dataset && dataset !== 'not assigned') {
      path += '/' + dataset;
    }
    
    return path;
  }

  onFetchObject(event: Event) {
    event.stopPropagation();
    const path = this.firestorePath;
    if (path) {
      this.navService.navigateToPath(path);
    }
  }

  getData() {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
    this.cdr.detectChanges();
  }
}
