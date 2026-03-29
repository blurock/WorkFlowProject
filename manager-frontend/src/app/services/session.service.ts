import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, serverTimestamp, setDoc, getDoc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, take, switchMap, catchError } from 'rxjs/operators';
import { SessionData } from '../models/session-data.model';
import { Ontologyconstants } from '../components/constants/ontologyconstants';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private ontology = new Ontologyconstants();

  /** 
   * Unique ID for the current browser session (one per tab/refresh).
   * Using built-in crypto.randomUUID() to avoid external dependencies.
   */
  private readonly sessionId = crypto.randomUUID();

  /**
   * Singleton SessionData object.
   */
  public sessionData: SessionData | null = null;

  /**
   * Cached Firestore path for the session.
   */
  private sessionPath: string | null = null;

  constructor() {
    this.uid$.subscribe();
  }

  uid$ = user(this.auth).pipe(
    map(u => {
      const val = u?.uid || 'anonymous';
      if (u) {
        console.log('[SessionService] Authenticated UID:', val);
        if (!this.sessionData || this.sessionData[this.ontology.UID] !== val) {
          this.sessionData = new SessionData(val, this.sessionId);
          this.sessionPath = null; // Reset path on user change
        }
      } else {
        console.warn('[SessionService] No user detected, defaulting to:', val);
        if (!this.sessionData) {
          this.sessionData = new SessionData(val, this.sessionId);
          this.sessionPath = null;
        }
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
   * Also syncs the SessionData object.
   */
  async updateHeartbeat() {
    // 1. Ensure we have session data
    if (!this.sessionData) {
      const uid = await this.uid$.pipe(take(1)).toPromise() || 'anonymous';
      this.sessionData = new SessionData(uid, this.sessionId);
    }

    // 2. Resolve the session path via ontology if not cached
    if (!this.sessionPath) {
      console.log('[SessionService] Resolving session path via ontology...');
      const resolvedPath = await this.getFirestorePath(this.sessionData).pipe(take(1)).toPromise();
      if (resolvedPath) {
        this.sessionPath = resolvedPath;
      } else {
        // Fallback if backend call fails - but we should avoid this if possible
        const uid = this.sessionData[this.ontology.UID];
        this.sessionPath = `workflows/${uid}/sessions/${this.sessionId}`;
        console.warn('[SessionService] Using fallback path:', this.sessionPath);
      }
    }

    console.log('[SessionService] Attempting heartbeat update. Path:', this.sessionPath);
    const sessionRef = doc(this.firestore, this.sessionPath);
    
    try {
      const heartbeatData = {
        lastActivity: serverTimestamp(),
        [this.ontology.SessionId]: this.sessionId,
        updatedAt: serverTimestamp()
      };

      // Merge current sessionData into the document
      const dataToSave = { ...heartbeatData, ...this.sessionData };

      await setDoc(sessionRef, dataToSave, { merge: true });
      console.log('[SessionService] Heartbeat successful.');
    } catch (err: any) {
      console.error('[SessionService] Heartbeat FAILED:', err.message);
      throw err;
    }
  }

  /**
   * Explicitly writes current session data to Firestore.
   */
  async writeSessionData(): Promise<void> {
    await this.updateHeartbeat();
  }

  /**
   * Reads session data from Firestore and updates the local singleton.
   */
  async readSessionData(): Promise<SessionData | null> {
    let uid = this.auth.currentUser?.uid;
    if (!uid) {
      uid = await this.uid$.pipe(take(1)).toPromise() || 'anonymous';
    }
    const sessionRef = doc(this.firestore, `workflows/${uid}/sessions/${this.sessionId}`);
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Recover SessionData from Firestore doc
      this.sessionData = Object.assign(new SessionData(uid, this.sessionId), data);
      return this.sessionData;
    }
    return null;
  }

  /**
   * Calls the backend to get the Firestore path for a given object.
   */
  getFirestorePath(object: any): Observable<string> {
    return this.http.post<{ path: string }>('/api/getfirestorepath', object).pipe(
      map(res => res.path),
      catchError(err => {
        console.error('[SessionService] Error fetching Firestore path:', err);
        return of('');
      })
    );
  }

  /**
   * Updates an object path in SessionData and syncs to Firestore.
   */
  async setObjectPath(ontologyIdentifier: string, path: string) {
    if (this.sessionData) {
      this.sessionData[ontologyIdentifier] = path;
      await this.writeSessionData();
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
