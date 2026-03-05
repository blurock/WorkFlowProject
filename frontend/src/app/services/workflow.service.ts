import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { WorkflowStateService } from './workflow-state.service';
import { WorkflowStatusHandler } from './workflow-status.handler';
import { ChatService } from './chat.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WorkflowService {
    private http = inject(HttpClient);
    private firestore = inject(Firestore);
    private injector = inject(Injector);

    // Injecting the decoupled domains
    private stateService = inject(WorkflowStateService);
    private statusHandler = inject(WorkflowStatusHandler);
    private chatService = inject(ChatService);

    async submitPrompt(promptText: string, user: any) {
        if (!promptText.trim() || !user) return;

        try {
            const token = await user.getIdToken();

            // If we are currently IN a workflow step waiting for user input
            if (this.stateService.activeWorkflowId) {
                await this.http.post<any>(`${environment.apiUrl}/orchestration/resume/${this.stateService.activeWorkflowId}`,
                    { summary: promptText, callbackUrl: this.stateService.activeCallbackUrl },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                ).toPromise();

                // Clear the local state so the next message is treated as a fresh workflow trigger
                this.stateService.clearState();
                return;
            }

            // Otherwise, Start a brand new Workflow via the Java Backend Orchestrator
            const response = await this.http.post<any>(`${environment.apiUrl}/orchestration/start`,
                { prompt: promptText },
                { headers: { 'Authorization': `Bearer ${token}` } }
            ).toPromise();

            // The backend responds with the clean `{ executionId: "1234abcd" }` structure
            if (response && response.executionId) {
                this.listenToWorkflow(response.executionId);
            }

        } catch (error) {
            console.error("Failed to fetch from backend", error);
            this.chatService.pushSystemMessage("Sorry, I couldn't reach the backend service.");
        }
    }

    private listenToWorkflow(executionId: string) {
        const workflowDocRef = doc(this.firestore, `workflows_dev/${executionId}`);

        if (this.stateService.workflowUnsubscribe) {
            this.stateService.workflowUnsubscribe();
        }

        runInInjectionContext(this.injector, () => {
            this.stateService.workflowUnsubscribe = onSnapshot(workflowDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    // Hand off the parsing logic to the dedicated Status Handler
                    this.statusHandler.handleStatusUpdate(docSnap.data(), executionId);
                }
            });
        });
    }
}
