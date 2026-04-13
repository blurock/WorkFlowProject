import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Ontologyconstants } from '../constants/ontologyconstants';

@Component({
  selector: 'app-run-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './run-transaction.html',
  styleUrl: './run-transaction.css'
})
export class RunTransactionComponent {
  transactionEvent: string = 'dataset:InitialReadInLocalStorageSystem';
  loading: boolean = false;
  errorMessage: string = '';

  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  public ontology = new Ontologyconstants();

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
      // Scaffold initial SessionData with a new generated ID
      const newSessionId = crypto.randomUUID();
      const sessionData: any = {};
      sessionData[this.ontology.UID] = currentUser.uid;
      sessionData[this.ontology.SessionId] = newSessionId;
      sessionData['dataset:transaction'] = this.transactionEvent;
      // dataset:sessionstatus will default locally until backend overwrites
      sessionData[this.ontology.SessionStatus] = 'Initial';
      sessionData[this.ontology.dctermsidentifier] = this.ontology.SessionData;

      const payload = {
        workflowName: 'single-transaction-workflow',
        SessionData: sessionData
      };

      // 1. Initialise the SessionData in Firestore *BEFORE* triggering the orchestrator!
      // We must merge the object flat so the backend finds both the "service" route and the "SessionData" properties!
      var initPayload: any = {
        service: 'UpdateSessionDataService',
        uid: currentUser.uid
      };
      initPayload[this.ontology.SessionData] = sessionData;

      this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, initPayload, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (initResponse) => {
          console.log('Session initialized in DB:', initResponse);

          // 2. Start the Cloud Workflow
          this.http.post<any>(`${environment.orchestratorUrl}/api/orchestration/start`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          }).subscribe({
            next: (response) => {
              console.log('Workflow Started Successfully!', response);
              // Immediately route to WorkflowTask UI so human can await the form!
              this.router.navigate(['/workflow-task', currentUser.uid, newSessionId]);
            },
            error: (err) => {
              this.showError(`Failed to start workflow: ${err.message}`);
            }
          });
        },
        error: (err) => {
          this.showError(`Failed to initialize session in database: ${err.message}`);
        }
      });
    } catch (e: any) {
      this.showError(`Error initiating transaction: ${e.message}`);
    }
  }

  showError(msg: string) {
    this.errorMessage = msg;
    this.loading = false;
    this.cdr.detectChanges();
  }
}
