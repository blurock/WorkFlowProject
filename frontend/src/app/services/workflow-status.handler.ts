import { Injectable, inject } from '@angular/core';
import { WorkflowStateService } from './workflow-state.service';
import { ChatService } from './chat.service';

export enum WorkflowStatus {
    WAITING_FOR_USER = 'waiting_for_user',
    COMPLETED = 'completed',
    PROCESSING = 'processing'
}

@Injectable({
    providedIn: 'root'
})
export class WorkflowStatusHandler {
    private chatService = inject(ChatService);
    private stateService = inject(WorkflowStateService);

    handleStatusUpdate(data: any, executionId: string) {
        if (!data) return;

        switch (data['status']) {
            case WorkflowStatus.WAITING_FOR_USER:
                this.handleWaitingForUser(data, executionId);
                break;
            case WorkflowStatus.PROCESSING:
                // Workflow is crunching data; we can just silently ignore or show a spinner Later
                break;
            case WorkflowStatus.COMPLETED:
                this.handleCompleted();
                break;
            default:
                console.warn('Unknown workflow status received:', data['status']);
        }
    }

    private handleWaitingForUser(data: any, executionId: string) {
        if (data['keyword'] === 'FindTask') {
            if (data['result']) {
                this.chatService.pushSystemMessage("Best Match: " + data['result']);
            }
            this.chatService.pushSystemMessage("Please provide a summary of the task:");

            this.stateService.activeWorkflowId = executionId;
            if (data['callbackUrl']) {
                this.stateService.activeCallbackUrl = data['callbackUrl'];
            }
        }
    }

    private handleCompleted() {
        this.chatService.pushSystemMessage("Workflow has marked this task as completed.");
        this.stateService.clearState();

        if (this.stateService.workflowUnsubscribe) {
            this.stateService.workflowUnsubscribe();
            this.stateService.workflowUnsubscribe = null;
        }
    }
}
