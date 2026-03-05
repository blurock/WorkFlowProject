import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { WorkflowService } from '../../services/workflow.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatDividerModule,
        MatListModule
    ],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent {
    // Expose user observable to the template
    user$;
    newMessageText = '';

    constructor(
        public authService: AuthService,
        public chatService: ChatService,
        private workflowService: WorkflowService
    ) {
        this.user$ = this.authService.user$;
    }

    async sendMessage(user: any) {
        if (!this.newMessageText.trim() || !user) return;

        const promptText = this.newMessageText;
        this.newMessageText = '';

        // Show message on UI
        this.chatService.addUserMessage(promptText, user);

        // Send to workflow orchestration backend
        await this.workflowService.submitPrompt(promptText, user);
    }
}
