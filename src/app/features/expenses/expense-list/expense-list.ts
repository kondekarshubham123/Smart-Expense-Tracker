import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExpenseService, Expense, ExpenseFilters } from '../../../core/services/expense';
import { CurrencyService } from '../../../core/services/currency';
import { ExpenseDialog } from '../expense-dialog/expense-dialog';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-expense-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
})
export class ExpenseList implements OnInit {
  private expenseService = inject(ExpenseService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  currencyService = inject(CurrencyService);

  expenses = signal<Expense[]>([]);
  totalAmount = signal<number>(0);
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(true);
  
  // Pagination
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filters
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);
  
  categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Other'
  ];
  
  displayedColumns: string[] = ['date', 'title', 'category', 'paymentMethod', 'amount', 'actions'];

  ngOnInit() {
    this.loadExpenses();
    
    // Setup filter listeners
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadExpenses();
    });
    
    this.categoryControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadExpenses();
    });
    
    this.startDateControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadExpenses();
    });
    
    this.endDateControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadExpenses();
    });
  }

  private getFilters(): ExpenseFilters {
    const filters: ExpenseFilters = {};
    
    if (this.searchControl.value) {
      filters.searchText = this.searchControl.value;
    }
    
    if (this.categoryControl.value) {
      filters.category = this.categoryControl.value;
    }
    
    if (this.startDateControl.value) {
      filters.startDate = this.startDateControl.value.toISOString().split('T')[0];
    }
    
    if (this.endDateControl.value) {
      filters.endDate = this.endDateControl.value.toISOString().split('T')[0];
    }
    
    return filters;
  }

  loadExpenses() {
    this.isLoading.set(true);
    
    const filters = this.getFilters();
    
    this.expenseService.getFilteredExpenses(filters, this.pageIndex(), this.pageSize()).subscribe({
      next: (result) => {
        this.expenses.set(result.data);
        this.totalRecords.set(result.total);
        
        // Calculate total for current page
        const total = result.data.reduce((sum, expense) => sum + expense.amount, 0);
        this.totalAmount.set(total);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.snackBar.open('Failed to load expenses', 'Close', {
          duration: 3000
        });
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadExpenses();
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
  }

  editExpense(expense: Expense) {
    const isMobile = window.innerWidth < 768;
    const dialogRef = this.dialog.open(ExpenseDialog, {
      width: isMobile ? '100vw' : '600px',
      maxWidth: isMobile ? '100vw' : '95vw',
      height: isMobile ? '100vh' : 'auto',
      maxHeight: isMobile ? '100vh' : '90vh',
      panelClass: ['expense-dialog-container', isMobile ? 'mobile-dialog' : ''],
      data: expense,
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Expense updated');
      }
    });
  }

  loadTotal() {
    this.expenseService.getTotalExpenses().subscribe({
      next: (total) => {
        this.totalAmount.set(total);
      },
      error: (error) => {
        console.error('Error calculating total:', error);
      }
    });
  }

  deleteExpense(expense: Expense) {
    if (confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      this.expenseService.deleteExpense(expense.id!).subscribe({
        next: () => {
          this.snackBar.open('Expense deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          this.snackBar.open('Failed to delete expense', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Food & Dining': 'primary',
      'Transportation': 'accent',
      'Shopping': 'warn',
      'Entertainment': 'primary',
      'Bills & Utilities': 'accent',
      'Healthcare': 'warn',
      'Education': 'primary',
      'Travel': 'accent',
      'Other': ''
    };
    return colors[category] || '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getPaymentIcon(paymentMethod: string): string {
    const icons: { [key: string]: string } = {
      'UPI': 'qr_code_scanner',
      'Cash': 'payments',
      'Credit Card': 'credit_card',
      'Debit Card': 'credit_card'
    };
    return icons[paymentMethod] || 'payment';
  }
}