import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WorkflowStateService {
    activeWorkflowId: string | null = null;
    activeCallbackUrl: string | null = null;

    // Using simple callback references for unsubscribing from Firestore
    workflowUnsubscribe: any = null;

    clearState() {
        this.activeWorkflowId = null;
        this.activeCallbackUrl = null;
    }
}
