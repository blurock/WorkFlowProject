import { Injectable } from '@angular/core';

export interface ChatMessage {
    id: string;
    text: string;
    uid: string;
    displayName: string;
    photoURL: string;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    messages: ChatMessage[] = [
        {
            id: '1',
            text: 'Welcome to the Blurock Chat!',
            uid: 'system',
            displayName: 'System',
            photoURL: 'https://ui-avatars.com/api/?name=System&background=random',
            timestamp: Date.now() - 100000
        }
    ];

    addUserMessage(promptText: string, user: any) {
        if (!promptText.trim() || !user) return;

        this.messages.push({
            id: Date.now().toString(),
            text: promptText,
            uid: user.uid,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`,
            timestamp: Date.now()
        });
    }

    pushSystemMessage(text: string) {
        this.messages.push({
            id: (Date.now() + Math.random()).toString(),
            text: text,
            uid: 'system',
            displayName: 'System Assistant',
            photoURL: 'https://ui-avatars.com/api/?name=System&background=random',
            timestamp: Date.now()
        });
    }
}
