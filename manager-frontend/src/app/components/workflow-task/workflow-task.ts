import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth, idToken, authState } from '@angular/fire/auth';
import { switchMap, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ontologyconstants } from '../constants/ontologyconstants';
import { DynamicPrimitiveComponent } from '../primitives/dynamic-primitive/dynamic-primitive';
import { OntologyStructure } from '../primitives/base-primitive';
import { OntologyService } from '../../services/ontology.service';

@Component({
  selector: 'app-workflow-task',
  standalone: true,
  imports: [CommonModule, DynamicPrimitiveComponent],
  templateUrl: './workflow-task.html',
  styleUrl: './workflow-task.css'
})
export class WorkflowTaskComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  public ontology = new Ontologyconstants();

  public loading = true;
  public errorMessage = '';

  /** Stored on arrival so resumeBackendWorkflow can redirect back with them. */
  private currentUid: string = '';
  private currentSessionId: string = '';

  public sessionData: any;
  public activityData: any;
  public activityTemplateStruct?: OntologyStructure;
  public annotations: any;
  public classannotations: any;
  public explanation: string = '';
  public label: string = '';

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
            const activityInfo = data[this.ontology.ActivityInfo];

            if (!activityInfo) {
              if (this.currentRetry < this.maxRetries) {
                this.currentRetry++;
                setTimeout(() => this.fetchSessionData(uid, sessionId, token), this.retryInterval);
                return;
              } else {
                this.showError('No ActivityInformationClass attached to this specific session task after multiple retries.');
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
    const catalogType = this.activityData[this.ontology.CatalogObjectType];
    console.log("Catalog Type: " + catalogType);
    console.log("ActivityData: " + JSON.stringify(this.activityData));
    if (catalogType) {
      // Fetch UI structural template
      this.ontologyService.getUITemplate(catalogType).subscribe({
        next: (struct) => {
          console.log("Catalog Type: " + catalogType);
          this.activityTemplateStruct = struct["dataobject"];
          this.annotations = struct["annotations"];
          this.classannotations = this.annotations ? this.annotations[catalogType] : undefined;
          this.explanation = this.classannotations ? this.classannotations[this.ontology.rdfscomment] : '';
          this.label = this.classannotations && this.classannotations[this.ontology.rdfslabel] 
                        ? this.classannotations[this.ontology.rdfslabel] 
                        : (catalogType.split(':').pop() || catalogType);
          this.loading = false;
          console.log(JSON.stringify(this.activityTemplateStruct));
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
          console.log('JSON data merged into activityData successfully.');
        } catch (err) {
          this.showError('Invalid JSON file: ' + err);
        }
      };
      reader.readAsText(file);
    }
  }

  async submitTask() {
    this.loading = true;
    const currentUser = this.auth.currentUser;
    const token = await currentUser?.getIdToken();

    // 1. Sync updated activity data back into session data
    this.sessionData[this.ontology.ActivityInfo] = this.activityData;

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
      const payload = {
        summary: 'Form submitted by user',
        callbackUrl: callbackUrl
      };

      this.http.post(resumeUrl, payload, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => {
          console.log('Orchestrator successfully resumed workflow.');
          // Return to run-transaction with the same session so another transaction
          // can be executed within this session.
          this.router.navigate(['/run-transaction', this.currentUid, this.currentSessionId]);
        },
        error: (err) => {
          console.error('Orchestrator resume failed:', err);
          this.showError('Failed to resume workflow via orchestrator.');
        }
      });
    } else {
      // Return to run-transaction even without a callback URL.
      this.router.navigate(['/run-transaction', this.currentUid, this.currentSessionId]);
    }
  }

  showError(msg: string) {
    console.error(msg);
    this.errorMessage = msg;
    this.loading = false;
    this.cdr.detectChanges();
  }
}
