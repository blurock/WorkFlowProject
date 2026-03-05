import { Injectable, inject } from '@angular/core';
import {
    Auth,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signOut,
    user,
    User
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth: Auth = inject(Auth);

    // Observable that emits the current user state
    public user$: Observable<User | null> = user(this.auth);

    constructor() { }

    // Login with Google
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, provider);
            return result.user;
        } catch (error) {
            console.error('Error logging in with Google', error);
            throw error;
        }
    }

    // Login with GitHub
    async loginWithGitHub() {
        const provider = new GithubAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, provider);
            return result.user;
        } catch (error) {
            console.error('Error logging in with GitHub', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            await signOut(this.auth);
        } catch (error) {
            console.error('Error logging out', error);
        }
    }
}
