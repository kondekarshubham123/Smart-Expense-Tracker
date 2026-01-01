import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth';
import { CurrencyService } from '../../core/services/currency';
import { Database, ref, set, get } from '@angular/fire/database';

interface UserProfile {
  firstName: string;
  lastName: string;
  currency: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(Database);
  private authService = inject(AuthService);
  currencyService = inject(CurrencyService);
  private snackBar = inject(MatSnackBar);

  profileForm!: FormGroup;
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  ngOnInit() {
    this.initForm();
    this.loadUserProfile();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      currency: [this.currencyService.getCurrencyCode(), Validators.required]
    });
  }

  private async loadUserProfile() {
    const userId = this.authService.userId;
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    try {
      const profileRef = ref(this.db, `users/${userId}/profile`);
      const snapshot = await get(profileRef);
      
      if (snapshot.exists()) {
        const profile = snapshot.val() as UserProfile;
        this.profileForm.patchValue({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          currency: profile.currency || this.currencyService.getCurrencyCode()
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      return;
    }

    const userId = this.authService.userId;
    if (!userId) {
      this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue = this.profileForm.value;
      const profile: UserProfile = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        currency: formValue.currency
      };

      // Save profile to Firebase
      const profileRef = ref(this.db, `users/${userId}/profile`);
      await set(profileRef, profile);

      // Update currency preference
      this.currencyService.setCurrency(formValue.currency);

      this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error saving profile:', error);
      this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  get userEmail(): string | null {
    return this.authService.currentUser()?.email || null;
  }
}
