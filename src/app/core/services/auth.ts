import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
  User,
  sendPasswordResetEmail,
  updateProfile
} from '@angular/fire/auth';

import { Observable, from } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  user$ = user(this.auth);
  currentUser = signal<User | null>(null);

  constructor() {
    // Subscribe to auth state changes
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

    // Register with email and password
    register(email: string, password: string, displayName: string): Observable<any> {
      return from(
        createUserWithEmailAndPassword(this.auth, email, password)
        .then(credential => { 
          return updateProfile(credential.user, { displayName })
        })
      );
    }

    // Login with email and password
    login(email: string, password: string): Observable<any> {
      return from(signInWithEmailAndPassword(this.auth, email, password));
    }

    // Login with Google
    loginWithGoogle(): Observable<any> {
      const provider = new GoogleAuthProvider();
      return from(signInWithPopup(this.auth, provider));
    }
  
    // Logout
    logout(): Observable<void> {
      return from(signOut(this.auth).then(() => {
        this.router.navigate(['/login']);
      }));
    }

    // Send password reset email
    resetPassword(email: string): Observable<void> {
      return from(sendPasswordResetEmail(this.auth, email));
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
      return !!this.currentUser();
    }

    // Get current user ID
    get userId(): string | undefined { 
      return this.currentUser()?.uid;
    }
}
