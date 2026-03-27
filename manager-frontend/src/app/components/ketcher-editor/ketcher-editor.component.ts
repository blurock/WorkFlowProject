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
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Firestore, collection, addDoc, onSnapshot, doc, collectionData } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/session.service';

/** Represents a molecule task document in Firestore */
interface MoleculeTask {
  smiles?: string;
  molfile?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  type: string;
  result?: string;
  error?: string;
  createdAt: Date;
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
  ],
  templateUrl: './ketcher-editor.component.html',
  styleUrl: './ketcher-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KetcherEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ketcherFrame') ketcherFrame!: ElementRef<HTMLIFrameElement>;

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private firestore = inject(Firestore);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private sessionService = inject(SessionService);

  /** URL of the running Ketcher standalone server */
  ketcherUrl = environment.ketcherUrl;
  safeKetcherUrl: SafeResourceUrl;

  constructor() {
    this.safeKetcherUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.ketcherUrl);
    console.log('%c [ANTIGRAVITY] Ketcher Component v3.2 Active (Session-Based) ', 'background: #222; color: #bada55; font-size: 1.2rem; font-weight: bold;');
    console.log('[KetcherEditor] Init Time:', new Date().toLocaleTimeString());
    console.log('[KetcherEditor] Current Session ID:', this.sessionService.getSessionId());
  }

  isEditorReady = false;
  isLoadingStructure = false;
  isSubmittingTask = false;

  currentSmiles: string | null = null;
  currentMolfile: string | null = null;
  taskStatus: string | null = null;
  taskResult: string | null = null;
  taskMolfile: string | null = null;
  taskError: string | null = null;

  private unsubscribeTask: (() => void) | null = null;
  private messageHandler = this.onWindowMessage.bind(this);

  ngAfterViewInit() {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.messageHandler);
    if (this.unsubscribeTask) {
      this.unsubscribeTask();
    }
  }

  onFrameLoad() {
    this.isEditorReady = true;
    this.cdr.markForCheck();
  }

  private onWindowMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== 'object') return;

    const { eventType } = event.data;

    if (eventType === 'init') {
      // Ketcher is ready
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
   * Ketcher responds with an 'init' or custom message containing the structure.
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

    // Send a GET_STRUCTURE request via postMessage to the Ketcher iframe.
    // The response comes back via the 'message' event listener as 'STRUCTURE_RESPONSE'.
    this.ketcherFrame.nativeElement.contentWindow.postMessage(
      { eventType: 'GET_STRUCTURE' },
      '*'
    );

    // Safety timeout: if no response in 5s, reset loading state
    setTimeout(() => {
      if (this.isLoadingStructure) {
        this.isLoadingStructure = false;
        this.cdr.markForCheck();
        this.snackBar.open('No response from editor — is Ketcher started?', 'Close', { duration: 4000 });
      }
    }, 5000);
  }

  /**
   * Submit the current molecule structure to Firestore as a task,
   * following the same pattern as Cloud Workflow tasks.
   * The backend listens for documents with status 'pending' and processes them.
   */
  async submitMoleculeTask(taskType: string = 'molecule-calculation') {
    if (!this.currentSmiles && !this.currentMolfile) {
      this.snackBar.open('Get the structure first', 'Close', { duration: 2000 });
      return;
    }

    this.isSubmittingTask = true;
    this.taskStatus = 'pending';
    this.taskResult = null;
    this.taskError = null;
    this.cdr.markForCheck();

    try {
      // 1. Get the session-based path (ontology-driven)
      const path = await this.sessionService.getCollectionPath('molecule-tasks');
      const tasksCol = collection(this.firestore, path);
      
      // 2. Update heartbeat so the backend knows this session is active
      await this.sessionService.updateHeartbeat();

      const taskDoc: MoleculeTask = {
        smiles: this.currentSmiles ?? undefined,
        molfile: this.currentMolfile ?? undefined,
        status: 'pending',
        type: taskType,
        createdAt: new Date(),
      };

      const docRef = await addDoc(tasksCol, taskDoc);
      
      this.snackBar.open('Task submitted! Watching: ' + docRef.id, 'Close', { duration: 4000 });

      // 3. Monitor the specific document for status changes
      if (this.unsubscribeTask) this.unsubscribeTask();
      const docPath = `${path}/${docRef.id}`;

      this.unsubscribeTask = onSnapshot(doc(this.firestore, path, docRef.id), (snapshot) => {
        const data = snapshot.data() as MoleculeTask | undefined;
        if (!data) return;

        this.taskStatus = data.status;
        if (data.status === 'complete') {
          this.taskResult = data.result ?? null;
          this.taskMolfile = data.molfile ?? null;
          this.isSubmittingTask = false;
          this.snackBar.open('Task complete!', 'Close', { duration: 3000 });
        } else if (data.status === 'error') {
          this.taskError = data.error ?? 'Unknown error';
          this.isSubmittingTask = false;
          this.snackBar.open('Task failed: ' + this.taskError, 'Close', { duration: 5000 });
        }
        this.cdr.markForCheck();
      });
    } catch (err: any) {
      this.isSubmittingTask = false;
      this.taskError = err.message;
      this.snackBar.open('Failed to submit task: ' + err.message, 'Close', { duration: 5000 });
      this.cdr.markForCheck();
    }
  }

  /** Clear the editor contents using postMessage bridge */
  clearStructure() {
    const frameWindow = this.ketcherFrame?.nativeElement?.contentWindow;
    if (frameWindow) {
      // Send message to Ketcher's bridge to clear/reset the molecule
      frameWindow.postMessage({ eventType: 'SET_STRUCTURE', smiles: '' }, '*');
    }
    this.currentSmiles = null;
    this.currentMolfile = null;
    this.taskStatus = null;
    this.taskResult = null;
    this.taskError = null;
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
