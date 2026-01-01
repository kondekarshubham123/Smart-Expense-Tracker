import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './core/services/auth';
import { ExpenseDialog } from './features/expenses/expense-dialog/expense-dialog';
import { APP_NAME } from './core/constants/app.constants';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = APP_NAME;
  private titleService = inject(Title);
  authService = inject(AuthService);
  router = inject(Router);
  private dialog = inject(MatDialog);
  isSpeedDialOpen = signal<boolean>(false);

  constructor() {
    this.titleService.setTitle(`${APP_NAME} - Smart Expense Tracker`);
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  toggleSpeedDial() {
    this.isSpeedDialOpen.set(!this.isSpeedDialOpen());
  }

  navigateToExpenses() {
    this.isSpeedDialOpen.set(false);
    this.router.navigate(['/expenses']);
  }

  openAddExpenseDialog() {
    this.isSpeedDialOpen.set(false);
    const isMobile = window.innerWidth < 768;
    const dialogRef = this.dialog.open(ExpenseDialog, {
      width: isMobile ? '100vw' : '600px',
      maxWidth: isMobile ? '100vw' : '95vw',
      height: isMobile ? '100vh' : 'auto',
      maxHeight: isMobile ? '100vh' : '90vh',
      panelClass: ['expense-dialog-container', isMobile ? 'mobile-dialog' : ''],
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Expense was added successfully - router will handle updates
        console.log('Expense added');
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }
}
