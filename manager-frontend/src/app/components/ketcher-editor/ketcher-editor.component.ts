import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { Auth } from '@angular/fire/auth';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Ontologyconstants } from '../constants/ontologyconstants';

/**
 * The ActivitySpeciesCatalogObjectCreation object sent as `dataset:activityinfo`
 * to the /transaction endpoint. Keys mirror the ontology identifiers.
 */
interface ActivitySpeciesCatalogObjectCreation {
  /** dataset:speciesformat — array of structure representations */
  'dataset:speciesformat': Array<{
    'dataset:molfiletype': string;
    'dataset:speciesrepresentation': string;
  }>;
  /** dataset:authorizationuid — Firebase UID of the submitting user */
  'dataset:authorizationuid': string;
  /** dataset:sessionId — browser session UUID */
  'dataset:sessionId': string;
  /** dcterms:created — ISO timestamp */
  'dcterms:created': string;
  /** dataset:catalogtype — identifies the ontology class */
  'dataset:catalogtype': string;
  'dataset:title': string;
  'dataset:structurename': string;
}

/** Shape of the /transaction response */
interface TransactionResponse {
  'dataset:servicesuccessful': boolean;
  'dataset:serviceresponsemessage': string;
  [key: string]: any;
}

@Component({
  selector: 'app-ketcher-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './ketcher-editor.component.html',
  styleUrl: './ketcher-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KetcherEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ketcherFrame') ketcherFrame!: ElementRef<HTMLIFrameElement>;

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private ontology = new Ontologyconstants();

  /** URL of the running Ketcher standalone server */
  ketcherUrl = environment.ketcherUrl;
  safeKetcherUrl: SafeResourceUrl;

  constructor() {
    this.safeKetcherUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.ketcherUrl);
    console.log('[KetcherEditor] Init Time:', new Date().toLocaleTimeString());
  }

  isEditorReady = false;
  isLoadingStructure = false;
  isSubmittingTask = false;

  currentSmiles: string | null = null;
  currentMolfile: string | null = null;

  /** Field for the title of the creation activity */
  title: string = 'Activity Species Catalog Object Creation';
  /** Field for the molecule name */
  moleculeName: string = '';

  /** True when the transaction completed successfully */
  taskComplete = false;
  /** True when the transaction returned an error */
  taskError = false;
  /** Human-readable error message */
  taskErrorMessage: string | null = null;

  /** Safe HTML result from dataset:serviceresponsemessage (org.dom4j.Document as string) */
  taskHtmlResult: SafeHtml | null = null;

  private messageHandler = this.onWindowMessage.bind(this);

  ngAfterViewInit() {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.messageHandler);
  }

  onFrameLoad() {
    this.isEditorReady = true;
    this.cdr.markForCheck();
  }

  private onWindowMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== 'object') return;

    const { eventType } = event.data;

    if (eventType === 'init') {
      this.isEditorReady = true;
      this.cdr.markForCheck();
    }

    if (eventType === 'STRUCTURE_RESPONSE') {
      this.currentSmiles = event.data.smiles || null;
      this.currentMolfile = event.data.molfile || null;
      this.isLoadingStructure = false;
      if (!this.currentSmiles && !this.currentMolfile) {
        this.snackBar.open('Canvas is empty — draw a molecule first', 'Close', { duration: 3000 });
      }
      this.cdr.markForCheck();
    }
  }

  /**
   * Request the current structure from the Ketcher iframe using the postMessage API.
   */
  getStructure() {
    if (!this.ketcherFrame?.nativeElement?.contentWindow) {
      this.snackBar.open('Editor not ready yet', 'Close', { duration: 2000 });
      return;
    }

    this.isLoadingStructure = true;
    this.currentSmiles = null;
    this.currentMolfile = null;
    this.cdr.markForCheck();

    this.ketcherFrame.nativeElement.contentWindow.postMessage(
      { eventType: 'GET_STRUCTURE' },
      '*'
    );

    // Safety timeout
    setTimeout(() => {
      if (this.isLoadingStructure) {
        this.isLoadingStructure = false;
        this.cdr.markForCheck();
        this.snackBar.open('No response from editor — is Ketcher started?', 'Close', { duration: 4000 });
      }
    }, 5000);
  }

  /**
   * Submits the molecule directly to the DatasetBackgroundServices /transaction endpoint.
   *
   * This is a singleton task (not a workflow), so a direct HTTP call is used instead
   * of the Firestore listener pattern. The response is rendered immediately.
   *
   * Flow:
   *  1. Build the ActivitySpeciesCatalogObjectCreation activityInfo object.
   *  2. Wrap it in a transaction payload (prov:activity + dataset:activityinfo + uid).
   *  3. POST to /transaction with the user's Firebase ID token.
   *  4. Read dataset:serviceresponsemessage from the response and display as HTML.
   */
  async submitMoleculeTask() {
    if (!this.currentSmiles && !this.currentMolfile) {
      this.snackBar.open('Get the structure first', 'Close', { duration: 2000 });
      return;
    }

    this.isSubmittingTask = true;
    this.taskComplete = false;
    this.taskError = false;
    this.taskErrorMessage = null;
    this.taskHtmlResult = null;
    this.cdr.markForCheck();

    try {
      // 1. Get the Firebase ID token for the current user
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated — please sign in first');
      }
      const idToken = await currentUser.getIdToken();
      const uid = currentUser.uid;

      // 2. Build the structure representations array
      const structureFormats: ActivitySpeciesCatalogObjectCreation['dataset:speciesformat'] = [];

      if (this.currentMolfile) {
        structureFormats.push({
          [this.ontology.SpeciesRepresentationType]: this.ontology.SpeciesRepresentationMolFileV2000,
          [this.ontology.SpeciesRepresentationAsText]: this.currentMolfile,
        } as any);
      }

      if (this.currentSmiles) {
        structureFormats.push({
          [this.ontology.SpeciesRepresentationType]: this.ontology.SpeciesRepresentationSMILES,
          [this.ontology.SpeciesRepresentationAsText]: this.currentSmiles,
        } as any);
      }

      // 3. Build the ActivitySpeciesCatalogObjectCreation (activityInfo) object
      const activityInfo: ActivitySpeciesCatalogObjectCreation = {
        [this.ontology.JThermodynamicsStructureFormat]: structureFormats,
        [this.ontology.UID]: uid,
        'dcterms:created': new Date().toISOString(),
        'dataset:catalogtype': 'dataset:ActivitySpeciesCatalogObjectCreation',
        [this.ontology.dctermsidentifier]: this.ontology.ActivitySpeciesCatalogObjectCreation,
        [this.ontology.DescriptionTitle]: this.title,
        [this.ontology.JThermodynamicsStructureName]: this.moleculeName,
      } as any;

      // 4. Wrap in the standard transaction payload
      const transactionPayload = {
        [this.ontology.TransactionEventType]: 'dataset:CreateA2DSpeciesFromGraphicInterface',
        [this.ontology.DatabaseIDFromRequiredTransaction]: {},
        [this.ontology.ActivityInfo]: activityInfo,
        uid,
      };

      console.log('[KetcherEditor] Calling /transaction with:', JSON.stringify(transactionPayload, null, 2));

      // 5. POST directly to DatasetBackgroundServices /transaction
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      });

      const response = await this.http
        .post<TransactionResponse>(
          `${environment.datasetBackgroundUrl}/transaction`,
          transactionPayload,
          { headers }
        )
        .toPromise();

      if (!response) {
        throw new Error('Empty response from /transaction');
      }

      console.log('[KetcherEditor] /transaction response:', response);

      // 6. Read the HTML document from dataset:serviceresponsemessage
      const htmlDoc = response[this.ontology.message];
      const successful = response[this.ontology.successful];

      if (successful === true || successful === 'true') {
        this.taskComplete = true;
        if (htmlDoc) {
          this.taskHtmlResult = this.sanitizer.bypassSecurityTrustHtml(htmlDoc);
        }
        this.snackBar.open('Species catalog object created!', 'Close', { duration: 3000 });
      } else {
        this.taskError = true;
        this.taskErrorMessage = htmlDoc ?? 'Processing failed — check server logs';
        if (htmlDoc) {
          this.taskHtmlResult = this.sanitizer.bypassSecurityTrustHtml(htmlDoc);
        }
        this.snackBar.open('Processing error — see result below', 'Close', { duration: 5000 });
      }

    } catch (err: any) {
      this.taskError = true;
      this.taskErrorMessage = err.message ?? 'Unknown error';
      this.snackBar.open('Failed: ' + (err.message ?? err), 'Close', { duration: 5000 });
      console.error('[KetcherEditor] /transaction call failed:', err);
    } finally {
      this.isSubmittingTask = false;
      this.cdr.markForCheck();
    }
  }

  /** Returns a Material icon name appropriate for the current result state */
  get statusIcon(): string {
    if (this.taskComplete) return 'check_circle';
    if (this.taskError) return 'error';
    return 'hourglass_top';
  }

  /** Returns a human-readable label for the current result state */
  get statusLabel(): string {
    if (this.taskComplete) return 'Complete';
    if (this.taskError) return 'Error';
    return '';
  }

  /** Clear the canvas and all results */
  clearStructure() {
    const frameWindow = this.ketcherFrame?.nativeElement?.contentWindow;
    if (frameWindow) {
      frameWindow.postMessage({ eventType: 'SET_STRUCTURE', smiles: '' }, '*');
    }
    this.currentSmiles = null;
    this.currentMolfile = null;
    this.taskComplete = false;
    this.taskError = false;
    this.taskErrorMessage = null;
    this.taskHtmlResult = null;
    this.cdr.markForCheck();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('SMILES copied to clipboard', 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Could not copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
