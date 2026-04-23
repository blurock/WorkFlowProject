import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ontologyconstants } from '../constants/ontologyconstants';

@Component({
  selector: 'app-run-transaction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './run-transaction.html',
  styleUrl: './run-transaction.css'
})
export class RunTransactionComponent implements OnInit {
  transactionEvent: string = 'dataset:InitialReadInLocalStorageSystem';
  loading: boolean = false;
  errorMessage: string = '';

  /** The active session ID — reused across multiple transactions in this session. */
  activeSessionId: string = '';
  /** True when a session ID was received from the URL (i.e. we are continuing a session). */
  isReturningSession: boolean = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  public ontology = new Ontologyconstants();

  ngOnInit(): void {
    // Pick up an existing uid/sessionId if the workflow-task redirected us back here.
    this.route.paramMap.subscribe(params => {
      const sessionId = params.get('sessionId');
      if (sessionId) {
        this.activeSessionId = sessionId;
        this.isReturningSession = true;
      } else {
        this.activeSessionId = '';
        this.isReturningSession = false;
      }
      this.cdr.detectChanges();
    });
  }

  /** Discard the current session and start a brand-new one. */
  newSession(): void {
    this.router.navigate(['/run-transaction']);
  }

  async startWorkflow() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.showError('You must be logged in to start a transaction.');
      return;
    }

    try {
      const token = await currentUser.getIdToken();

      // Resolve the session ID: reuse existing or generate a fresh one.
      const sessionId = this.activeSessionId || crypto.randomUUID();
      this.activeSessionId = sessionId;

      // ── Step 1: Resolve SessionData ─────────────────────────────────────────
      let sessionData: any;

      if (this.isReturningSession) {
        // We have a known session ID from the URL — try to read its Firestore document.
        const readPayload: any = {
          service: 'ReadSessionDataService',
          uid: currentUser.uid
        };
        readPayload[this.ontology.UID] = currentUser.uid;
        readPayload[this.ontology.SessionId] = sessionId;
        readPayload[this.ontology.dctermsidentifier] = this.ontology.SessionData;

        const readResponse = await firstValueFrom(
          this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, readPayload, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );

        const catObjects = readResponse[this.ontology.catalogobject];
        if (
          readResponse[this.ontology.successful] === 'true' &&
          catObjects && catObjects.length > 0
        ) {
          // Existing document found — carry all fields forward.
          sessionData = { ...catObjects[0] };
          console.log('Reusing existing SessionData from Firestore for session:', sessionId);
        } else {
          // Returning session but no document yet (edge case) — build minimal.
          sessionData = this.buildMinimalSessionData(currentUser.uid, sessionId);
          console.log('Returning session but no Firestore document found; creating minimal:', sessionId);
        }
      } else {
        // Fresh session — the UUID is brand-new, no Firestore document can exist yet.
        sessionData = this.buildMinimalSessionData(currentUser.uid, sessionId);
        console.log('Creating fresh SessionData for new session:', sessionId);
      }

      // Always update these fields for the new transaction run.
      sessionData['dataset:transaction'] = this.transactionEvent;
      sessionData[this.ontology.SessionStatus] = 'Initial';

      // ── Step 2: Write the (new or updated) SessionData back to Firestore ───
      const writePayload: any = {
        service: 'UpdateSessionDataService',
        uid: currentUser.uid
      };
      writePayload[this.ontology.SessionData] = sessionData;

      await firstValueFrom(
        this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, writePayload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      console.log('SessionData written to Firestore.');

      // ── Step 3: Start the Cloud Workflow ────────────────────────────────────
      const orchestratorPayload = {
        workflowName: 'single-transaction-workflow',
        SessionData: sessionData
      };

      this.http.post<any>(
        `${environment.orchestratorUrl}/api/orchestration/start`,
        orchestratorPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      ).subscribe({
        next: (response) => {
          console.log('Workflow started successfully!', response);
          this.router.navigate(['/workflow-task', currentUser.uid, sessionId]);
        },
        error: (err) => this.showError(`Failed to start workflow: ${err.message}`)
      });

    } catch (e: any) {
      this.showError(`Error initiating transaction: ${e.message}`);
    }
  }

  /** Build a minimal SessionData object for a brand-new session. */
  private buildMinimalSessionData(uid: string, sessionId: string): any {
    const data: any = {};
    data[this.ontology.UID] = uid;
    data[this.ontology.SessionId] = sessionId;
    data[this.ontology.DateCreated] = new Date().toISOString();
    data[this.ontology.dctermsidentifier] = this.ontology.SessionData;
    return data;
  }

  showError(msg: string) {
    this.errorMessage = msg;
    this.loading = false;
    this.cdr.detectChanges();
  }
}
