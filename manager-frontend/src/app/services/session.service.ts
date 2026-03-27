import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, serverTimestamp, setDoc, updateDoc } from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  /** 
   * Unique ID for the current browser session (one per tab/refresh).
   * Using built-in crypto.randomUUID() to avoid external dependencies.
   */
  private readonly sessionId = crypto.randomUUID();

  uid$ = user(this.auth).pipe(
    map(u => {
      const val = u?.uid || 'anonymous';
      if (u) {
        console.log('[SessionService] Authenticated UID:', val);
      } else {
        console.warn('[SessionService] No user detected, defaulting to:', val);
      }
      return val;
    })
  );

  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Internal helper to ensure the 'sessions' document exists 
   * and update its heartbeat timestamp.
   */
  async updateHeartbeat() {
    let uid = this.auth.currentUser?.uid;
    if (!uid) {
      uid = await this.uid$.pipe(take(1)).toPromise() || 'anonymous';
    }

    console.log('[SessionService] Attempting heartbeat update. UID:', uid, 'Session:', this.sessionId);
    const sessionRef = doc(this.firestore, `workflows/${uid}/sessions/${this.sessionId}`);
    
    try {
      await setDoc(sessionRef, {
        lastActivity: serverTimestamp(),
        sessionId: this.sessionId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('[SessionService] Heartbeat successful.');
    } catch (err: any) {
      console.error('[SessionService] Heartbeat FAILED:', err.message);
      throw err; // Re-throw to let the component handle it
    }
  }

  /**
   * Constructs a full Firestore path for a given collection name,
   * following the hierarchy: workflows/{uid}/sessions/{sessionId}/{collectionName}
   */
  async getCollectionPath(collectionName: string): Promise<string> {
    let uid = this.auth.currentUser?.uid;
    if (!uid) {
      uid = await this.uid$.pipe(take(1)).toPromise() || 'anonymous';
    }
    const path = `workflows/${uid}/sessions/${this.sessionId}/${collectionName}`;
    console.log('[SessionService] Generated Path:', path);
    return path;
  }
}
