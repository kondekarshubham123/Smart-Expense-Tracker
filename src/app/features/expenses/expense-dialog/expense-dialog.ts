import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseForm } from '../expense-form/expense-form';
import { Expense } from '../../../core/services/expense';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ExpenseForm
  ],
  template: `
    <div class="expense-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data ? 'edit' : 'add_circle_outline' }}</mat-icon>
          {{ data ? 'Edit Expense' : 'Add New Expense' }}
        </h2>
        <button mat-icon-button (click)="close()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <mat-dialog-content>
        <app-expense-form [expense]="data" (expenseAdded)="onExpenseAdded()"></app-expense-form>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .expense-dialog {
      min-width: 500px;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      
      @media (max-width: 768px) {
        min-width: 100%;
        max-width: 100%;
        height: 100vh;
        max-height: 100vh;
      }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
      
      @media (max-width: 768px) {
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      h2 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        font-weight: 600;
        color: #1976d2;
        
        @media (max-width: 768px) {
          font-size: 20px;
        }
        
        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          
          @media (max-width: 768px) {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }
      }
      
      .close-button {
        color: #666;
        
        &:hover {
          color: #333;
        }
      }
    }

    mat-dialog-content {
      padding: 0;
      margin: 0;
      overflow-y: auto;
      max-height: calc(90vh - 100px);
      
      @media (max-width: 768px) {
        padding: 16px;
        max-height: calc(100vh - 80px);
        -webkit-overflow-scrolling: touch;
      }
    }

    ::ng-deep {
      .expense-dialog mat-card {
        box-shadow: none !important;
        margin: 0 !important;
        
        mat-card-header {
          display: none;
        }
      }
    }
  `]
})
export class ExpenseDialog {
  private dialogRef = inject(MatDialogRef<ExpenseDialog>);
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: Expense | null) {}

  close() {
    this.dialogRef.close();
  }

  onExpenseAdded() {
    this.dialogRef.close(true);
  }
}
