import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth, idToken, authState } from '@angular/fire/auth';
import { switchMap, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ontologyconstants } from '../constants/ontologyconstants';
import { DynamicPrimitiveComponent } from '../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyStructure, WorkflowVisibilityService } from '../primitives/base-primitive';
import { OntologyService } from '../../services/ontology.service';

@Component({
  selector: 'app-workflow-task',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicPrimitiveComponent],
  templateUrl: './workflow-task.html',
  styleUrl: './workflow-task.css'
})
export class WorkflowTaskComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  public visibilityService = inject(WorkflowVisibilityService);
  public ontology = new Ontologyconstants();

  public loading = true;
  public errorMessage = '';
  public successMessage = '';

  /** Stored on arrival so resumeBackendWorkflow can redirect back with them. */
  private currentUid: string = '';
  private currentSessionId: string = '';
  private nextSessionData: any = null;
  private backgroundPollActive = false;

  public sessionData: any;
  public activityData: any;
  public activityTemplateStruct?: OntologyStructure;
  public annotations: any;
  public classannotations: any;
  public explanation: string = '';
  public label: string = '';

  exportAsTransaction: boolean = false;
  showJsonPreview: boolean = false;

  toggleVisibility() {
    this.visibilityService.showAllFields = !this.visibilityService.showAllFields;
  }

  get exportJsonContent(): any {
    if (this.exportAsTransaction) {
      const transactionName = this.sessionData && this.sessionData['dataset:transaction']
        ? this.sessionData['dataset:transaction']
        : 'UnknownTransaction';
      return {
        "prov:activity": transactionName,
        "dataset:transreqobj": {},
        "dataset:activityinfo": this.activityData
      };
    } else {
      return this.activityData;
    }
  }

  get exportJsonString(): string {
    return JSON.stringify(this.exportJsonContent, null, 2);
  }

  toggleJsonPreview() {
    this.showJsonPreview = !this.showJsonPreview;
  }

  downloadJson() {
    const dataStr = this.exportJsonString;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = this.exportAsTransaction ? 'transaction_data.json' : 'activity_data.json';
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const uidFromQuery = params.get('uid');
      const sessionId = params.get('sessionId');

      if (!uidFromQuery || !sessionId) {
        this.showError('Invalid URL: Missing UID or Session ID');
        return;
      }

      // Ensure user is authorized
      const currentUser = await firstValueFrom(authState(this.auth));
      if (!currentUser || currentUser.uid !== uidFromQuery) {
        console.error(`Auth Check Failed! currentUser?.uid: ${currentUser?.uid}, uidFromQuery: ${uidFromQuery}`);
        this.showError(`Unauthorized: You do not have permission to view this task. (UID mismatch)`);
        return;
      }

      // Store for use in resumeBackendWorkflow redirect.
      this.currentUid = uidFromQuery;
      this.currentSessionId = sessionId;

      const token = await currentUser.getIdToken();
      await this.fetchSessionData(uidFromQuery, sessionId, token);
    });
  }

  private currentRetry = 0;
  private maxRetries = 15;
  private retryInterval = 2000;

  async fetchSessionData(uid: string, sessionId: string, token: string) {
    this.loading = true;
    this.errorMessage = '';

    // Construct minimal payload required for backend address calc
    const payload: any = {
      service: 'ReadSessionDataService',
      uid: uid
    };
    payload[this.ontology.UID] = uid;
    payload[this.ontology.SessionId] = sessionId;
    payload[this.ontology.dctermsidentifier] = this.ontology.SessionData;

    this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        if (response[this.ontology.successful] === 'true') {
          // Check if data exists
          const catObjects = response[this.ontology.catalogobject];
          if (catObjects && catObjects.length > 0) {
            const data = catObjects[0];

            const status = data[this.ontology.SessionStatus];
            if (status === 'Processing') {
              if (this.currentRetry < this.maxRetries) {
                this.currentRetry++;
                setTimeout(() => this.fetchSessionData(uid, sessionId, token), this.retryInterval);
                return;
              } else {
                this.showError('Workflow execution is taking too long. Please check the status later.');
                return;
              }
            }

            if (status === 'Complete') {
              this.successMessage = 'Workflow completed successfully.';
              this.loading = false;
              this.cdr.detectChanges();
              return;
            }

            const activityInfo = data[this.ontology.ActivityInfo];
            const callbackUrl = data[this.ontology.SessionWorkflowReturnLink];

            // Wait until the workflow has deposited BOTH the activity template and the webhook URL
            if (!activityInfo || !callbackUrl) {
              if (this.currentRetry < this.maxRetries) {
                this.currentRetry++;
                setTimeout(() => this.fetchSessionData(uid, sessionId, token), this.retryInterval);
                return;
              } else {
                this.showError('No ActivityInformationClass or Callback URL attached to this session task after retries.');
                return;
              }
            }

            this.sessionData = data;
            this.currentRetry = 0;
            this.processWorkflowState();
          } else {
            if (this.currentRetry < this.maxRetries) {
              this.currentRetry++;
              setTimeout(() => this.fetchSessionData(uid, sessionId, token), this.retryInterval);
              return;
            }
            this.showError('Session Data returned empty.');
          }
        } else {
          this.showError(response[this.ontology.message]);
        }
      },
      error: (err) => {
        this.showError(`HTTP Error: ${err.message}`);
      }
    });
  }

  processWorkflowState() {
    // ActivityInformationClass is stored under dataset:activityinfo
    this.activityData = this.sessionData[this.ontology.ActivityInfo];

    if (!this.activityData) {
      this.showError('No ActivityInformationClass attached to this specific session task.');
      return;
    }

    // The activity data must map to an ontology class name so the dynamic primitive knows how to render it.
    // E.g., 'dataset:ActivityRepositoryInitialReadLocalFile'
    const catalogType = this.activityData[this.ontology.DatabaseObjectType];
    if (catalogType) {
      // Fetch UI structural template
      this.ontologyService.getUITemplate(catalogType).subscribe({
        next: (struct) => {
          this.activityTemplateStruct = struct["dataobject"];
          this.annotations = struct["annotations"];
          this.classannotations = this.annotations ? this.annotations[catalogType] : undefined;
          this.explanation = this.classannotations ? this.classannotations[this.ontology.rdfscomment] : '';
          this.label = this.classannotations && this.classannotations[this.ontology.rdfslabel]
            ? this.classannotations[this.ontology.rdfslabel]
            : (catalogType.split(':').pop() || catalogType);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.showError(`Failed to load template for ${catalogType}`)
      });
    } else {
      this.showError('Activity data missing catalogtype reference.');
    }
  }


  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const parsedContent = JSON.parse(e.target.result);
          // If the JSON contains an activity info property, extract just that nested part
          const content = parsedContent[this.ontology.ActivityInfo] ? parsedContent[this.ontology.ActivityInfo] : parsedContent;

          // Merge uploaded data into activityData to preserve metadata like catalogType
          this.activityData = { ...this.activityData, ...content };
          this.cdr.detectChanges();
        } catch (err) {
          this.showError('Invalid JSON file: ' + err);
        }
      };
      reader.readAsText(file);
    }
  }

  isAllAssigned(): boolean {
    if (!this.activityData || !this.activityTemplateStruct) return false;
    return this.checkStructureAssigned(this.activityTemplateStruct, this.activityData);
  }

  private checkStructureAssigned(struct: OntologyStructure, data: any): boolean {
    if (struct.isArray) {
      if (!Array.isArray(data)) return false;
      if (data.length === 0) return true; // Empty array is considered filled

      // If it's an array of objects
      if (struct.isObject && struct.properties) {
        return data.every(item => this.checkStructureAssigned({ ...struct, isArray: false }, item));
      } else {
        // Array of primitives (like keywords)
        return data.every(item => this.checkValueAssigned(item));
      }
    }

    if (struct.isObject && struct.properties) {
      if (typeof data !== 'object' || data === null) return false;
      const keys = Object.keys(struct.properties);
      for (const key of keys) {
        if (!this.checkStructureAssigned(struct.properties[key], data[key])) {
          return false;
        }
      }
      return true;
    }

    // Primitive field
    return this.checkValueAssigned(data);
  }

  private checkValueAssigned(value: any): boolean {
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed !== 'not assigned' && !trimmed.startsWith('Unassigned classification:');
    }
    if (Array.isArray(value)) {
      return true; // Empty arrays are allowed
    }
    return true;
  }

  async submitTask() {
    this.loading = true;
    const currentUser = this.auth.currentUser;
    const token = await currentUser?.getIdToken();

    // 1. Sync updated activity data back into session data
    this.sessionData[this.ontology.ActivityInfo] = this.activityData;
    this.sessionData[this.ontology.SessionStatus] = 'Processing';

    // Clear previous service response to ensure we wait for the new one
    delete this.sessionData[this.ontology.ServiceResponseInformation];

    // Set service call

    var payload: any = {};
    payload["service"] = 'UpdateSessionDataService';
    payload["uid"] = currentUser?.uid;

    payload[this.ontology.SessionId] = this.sessionData[this.ontology.SessionId]
    payload[this.ontology.SessionData] = this.sessionData;

    this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        if (response[this.ontology.successful] === 'true') {
          this.resumeBackendWorkflow(token);
        } else {
          this.showError(`Update Failed: ${response[this.ontology.message]}`);
        }
      },
      error: (err) => this.showError(`HTTP Error: ${err.message}`)
    });
  }

  resumeBackendWorkflow(token: string | undefined) {
    // The workflow defines a resume endpoint inside the Session Data:
    const callbackUrl = this.sessionData[this.ontology.SessionWorkflowReturnLink];
    const executionId = this.sessionData[this.ontology.SessionId]; // Assuming SessionId is the Workflow Execution ID

    if (callbackUrl) {
      // We must call our OWN orchestrator proxy to avoid CORS issues with Google APIs
      const resumeUrl = `${environment.orchestratorUrl}/api/orchestration/resume/${executionId}`;
      const payload: any = {
        summary: 'Form submitted by user',
        callbackUrl: callbackUrl
      };

      let workflowName = 'single-transaction-workflow';
      payload['workflowName'] = workflowName;

      this.loading = true;
      this.explanation = 'Waiting for workflow to complete...';
      this.errorMessage = '';
      this.cdr.detectChanges();

      this.http.post(resumeUrl, payload, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (response: any) => {


          if (response && response.status === 'Completed') {

            try {
              let resultObj = response.result;
              try { if (typeof resultObj === 'string') resultObj = JSON.parse(resultObj); } catch (e) { }

              let body = resultObj.body || resultObj;
              try { if (typeof body === 'string') body = JSON.parse(body); } catch (e) { }

              const isSuccess = body[this.ontology.successful] === 'true' || body[this.ontology.successful] === true;
              const msg = body[this.ontology.message] || JSON.stringify(body, null, 2);


              if (isSuccess) {
                this.successMessage = msg;
                this.loading = false;
                this.cdr.detectChanges();

                // Start silent background poll for next task / completion status
                if (this.sessionData && this.sessionData['dataset:sessionworkflow'] === 'transactionsequence') {
                  this.startSilentBackgroundPoll(token);
                }
              } else {
                this.errorMessage = msg;
                delete this.sessionData[this.ontology.SessionWorkflowReturnLink];
                this.loading = false;
                this.cdr.detectChanges();
                return;
              }
            } catch (e) {
              this.successMessage = 'Workflow completed successfully.';
              this.loading = false;
              this.cdr.detectChanges();

              if (this.sessionData && this.sessionData['dataset:sessionworkflow'] === 'transactionsequence') {
                this.startSilentBackgroundPoll(token);
              }
            }
          } else if (response && response.status === 'ResumedButTimeoutWaiting') {
            this.showError('Workflow took too long to complete. Please check the status later.');
          } else {
            this.showError(`Workflow execution failed: ${response?.error || 'Unknown error'}`);
          }
        },
        error: (err) => {
          console.error('Orchestrator resume failed:', err);
          this.errorMessage = 'Failed to resume workflow via orchestrator.';
          delete this.sessionData[this.ontology.SessionWorkflowReturnLink];
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Return to run-transaction even without a callback URL.
      this.router.navigate(['/run-transaction', this.currentUid, this.currentSessionId]);
    }
  }

  async restartWorkflow() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) throw new Error('Not logged in');
      const token = await currentUser.getIdToken();

      // Clear the dead callback link. We want the new workflow to generate a new one.
      delete this.sessionData[this.ontology.SessionWorkflowReturnLink];

      // Preserve the user's currently entered activity data by saving it back into the session data!
      this.sessionData[this.ontology.ActivityInfo] = this.activityData;
      this.sessionData[this.ontology.SessionStatus] = 'Initial';

      const writePayload: any = {
        service: 'UpdateSessionDataService',
        uid: currentUser.uid
      };
      writePayload[this.ontology.SessionData] = this.sessionData;

      await firstValueFrom(
        this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, writePayload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      let workflowName = this.sessionData[this.ontology.SessionWorkflow];
      if (!workflowName) {
        workflowName = 'single-transaction-workflow';
      }

      const orchestratorPayload = {
        workflowName: workflowName,
        SessionData: this.sessionData
      };

      this.http.post<any>(
        `${environment.orchestratorUrl}/api/orchestration/start`,
        orchestratorPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      ).subscribe({
        next: (response) => {


          // Poll to reload the session data once the new callback is generated
          this.currentRetry = 0;
          this.loading = true;
          this.explanation = 'Restarting workflow and waiting for callback URL...';
          this.cdr.detectChanges();

          this.fetchSessionData(this.currentUid, this.currentSessionId, token);
        },
        error: (err) => this.showError(`Failed to restart workflow: ${err.message}`)
      });
    } catch (e: any) {
      this.showError(`Error restarting: ${e.message}`);
    }
  }

  checkNextSequenceTask(token: string | undefined, finalMsg: string, oldCallbackUrl?: string, retryCount = 0) {
    this.backgroundPollActive = false;
    this.explanation = 'Checking for next transaction in sequence...';
    this.cdr.detectChanges();

    const maxRetries = 10;
    const delay = retryCount === 0 ? 0 : 1000;

    setTimeout(async () => {
      try {
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          this.successMessage = finalMsg;
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        const resolvedToken = token || await currentUser.getIdToken();

        const readPayload: any = {
          service: 'ReadSessionDataService',
          uid: currentUser.uid
        };
        readPayload[this.ontology.UID] = currentUser.uid;
        readPayload[this.ontology.SessionId] = this.currentSessionId;
        readPayload[this.ontology.dctermsidentifier] = this.ontology.SessionData;

        const readResponse = await firstValueFrom(
          this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, readPayload, {
            headers: { Authorization: `Bearer ${resolvedToken}` }
          })
        );

        const catObjects = readResponse[this.ontology.catalogobject];
        if (
          readResponse[this.ontology.successful] === 'true' &&
          catObjects && catObjects.length > 0
        ) {
          const newSessionData = catObjects[0];
          const newCallbackUrl = newSessionData[this.ontology.SessionWorkflowReturnLink];
          const newStatus = newSessionData[this.ontology.SessionStatus];
          if (newCallbackUrl && newCallbackUrl !== oldCallbackUrl && newStatus === 'UserInput') {
            this.loading = true;
            this.activityTemplateStruct = undefined;
            this.activityData = null;
            this.successMessage = '';
            this.sessionData = newSessionData;
            this.processWorkflowState();
            return;
          }

          // If the parent workflow is still running/processing or the callback URL hasn't been updated yet, retry polling.
          if (newStatus !== 'Complete' && (newStatus === 'Processing' || newStatus === 'Initial' || newCallbackUrl === oldCallbackUrl)) {
            if (retryCount < maxRetries) {
              this.checkNextSequenceTask(resolvedToken, finalMsg, oldCallbackUrl, retryCount + 1);
              return;
            }
          }
          // If we reach here, it means the sequence has finished (or status is 'Complete')
          this.sessionData = newSessionData;
          this.returnToTransactions();
          return;
        }

        this.successMessage = finalMsg;
        this.loading = false;
        this.cdr.detectChanges();
      } catch (err) {
        console.error('Error checking next sequence task:', err);
        this.successMessage = finalMsg;
        this.loading = false;
        this.cdr.detectChanges();
      }
    }, delay);
  }

  showError(msg: string) {
    console.error(msg);
    this.errorMessage = msg;
    this.loading = false;
    this.cdr.detectChanges();
  }

  get isLastTransactionInSequence(): boolean {
    if (!this.sessionData) return false;
    const workflow = this.sessionData['dataset:sessionworkflow'];
    const currentTx = this.sessionData['dataset:transaction'];
    const targetTx = this.sessionData['dataset:targettransaction'];
    return workflow === 'transactionsequence' && currentTx === targetTx;
  }

  get isSequenceAndNotComplete(): boolean {
    if (!this.sessionData) return false;
    const workflow = this.sessionData['dataset:sessionworkflow'];
    const status = this.sessionData[this.ontology.SessionStatus];

    if (this.isLastTransactionInSequence) {
      return false;
    }

    return workflow === 'transactionsequence' && status !== 'Complete';
  }

  async continueSequenceOrReturn() {
    this.backgroundPollActive = false;

    if (this.nextSessionData) {
      this.loading = true;
      this.activityTemplateStruct = undefined;
      this.activityData = null;
      this.successMessage = '';
      this.sessionData = this.nextSessionData;
      this.nextSessionData = null;
      this.cdr.detectChanges();
      this.processWorkflowState();
      return;
    }

    if (this.isSequenceAndNotComplete) {
      this.loading = true;
      this.successMessage = '';
      this.cdr.detectChanges();

      const currentUser = this.auth.currentUser;
      const token = await currentUser?.getIdToken();

      const oldCallbackUrl = this.sessionData && this.sessionData[this.ontology.SessionWorkflowReturnLink];

      this.checkNextSequenceTask(token, 'All transactions in sequence executed successfully.', oldCallbackUrl);
    } else {
      this.returnToTransactions();
    }
  }

  startSilentBackgroundPoll(token: string | undefined) {
    if (this.backgroundPollActive) return;
    this.backgroundPollActive = true;
    this.runSilentBackgroundPoll(token);
  }

  private runSilentBackgroundPoll(token: string | undefined, retryCount = 0) {
    const maxRetries = 20;
    const delay = 1000;

    setTimeout(async () => {
      if (!this.backgroundPollActive) return;
      try {
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          this.backgroundPollActive = false;
          return;
        }

        const resolvedToken = token || await currentUser.getIdToken();

        const readPayload: any = {
          service: 'ReadSessionDataService',
          uid: currentUser.uid
        };
        readPayload[this.ontology.UID] = currentUser.uid;
        readPayload[this.ontology.SessionId] = this.currentSessionId;
        readPayload[this.ontology.dctermsidentifier] = this.ontology.SessionData;

        const readResponse = await firstValueFrom(
          this.http.post<any>(`${environment.datasetBackgroundUrl}/service`, readPayload, {
            headers: { Authorization: `Bearer ${resolvedToken}` }
          })
        );

        const catObjects = readResponse[this.ontology.catalogobject];
        if (
          readResponse[this.ontology.successful] === 'true' &&
          catObjects && catObjects.length > 0
        ) {
          const newSessionData = catObjects[0];
          const newCallbackUrl = newSessionData[this.ontology.SessionWorkflowReturnLink];
          const newStatus = newSessionData[this.ontology.SessionStatus];
          const oldCallbackUrl = this.sessionData && this.sessionData[this.ontology.SessionWorkflowReturnLink];

          if (newStatus === 'Complete') {

            this.sessionData = newSessionData;
            this.nextSessionData = null;
            this.backgroundPollActive = false;
            this.cdr.detectChanges();
            return;
          }

          if (newCallbackUrl && newCallbackUrl !== oldCallbackUrl && newStatus === 'UserInput') {

            this.nextSessionData = newSessionData;
            this.backgroundPollActive = false;
            this.cdr.detectChanges();
            return;
          }

          if (retryCount < maxRetries && this.backgroundPollActive) {
            this.runSilentBackgroundPoll(resolvedToken, retryCount + 1);
          } else {
            this.backgroundPollActive = false;
          }
        } else {
          this.backgroundPollActive = false;
        }
      } catch (err) {
        console.error('Error in silent background poll:', err);
        this.backgroundPollActive = false;
      }
    }, delay);
  }

  ngOnDestroy() {
    this.backgroundPollActive = false;
  }

  returnToTransactions() {
    this.router.navigate(['/run-transaction', this.currentUid, this.currentSessionId]);
  }
}
