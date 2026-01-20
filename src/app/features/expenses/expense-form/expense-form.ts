import { Component, inject, signal, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExpenseService, Expense } from '../../../core/services/expense';
import { CurrencyService } from '../../../core/services/currency';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expense-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.scss',
})
export class ExpenseForm implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  currencyService = inject(CurrencyService);

  expense = input<Expense | null>(null);
  expenseForm: FormGroup;
  isSubmitting = signal(false);
  expenseAdded = output<void>();

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

  paymentMethods = [
    'UPI',
    'Cash',
    'Credit Card',
    'Debit Card',
    'Points'
  ];

  constructor() {
    this.expenseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      date: [new Date(), Validators.required],
      description: [''],
      paymentMethod: ['', Validators.required]
    });
  }

  ngOnInit() {
    const expenseData = this.expense();
    if (expenseData) {
      this.expenseForm.patchValue({
        title: expenseData.title,
        amount: expenseData.amount,
        category: expenseData.category,
        date: new Date(expenseData.date),
        description: expenseData.description || '',
        paymentMethod: expenseData.paymentMethod || ''
      });
    }
  }

  onSubmit() {
    if (this.expenseForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      
      const formValue = this.expenseForm.value;
      const selectedDate: Date = formValue.date;
      // format date in local timezone to avoid timezone shift
      const localDateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

      const expenseData = {
        ...formValue,
        date: localDateString
      };

      const expenseToEdit = this.expense();
      
      if (expenseToEdit?.id) {
        // Update existing expense
        this.expenseService.updateExpense(expenseToEdit.id, expenseData).subscribe({
          next: () => {
            this.snackBar.open('Expense updated successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.isSubmitting.set(false);
            this.expenseAdded.emit();
          },
          error: (error) => {
            console.error('Error updating expense:', error);
            this.snackBar.open('Failed to update expense. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.isSubmitting.set(false);
          }
        });
      } else {
        // Add new expense
        this.expenseService.addExpense(expenseData).subscribe({
          next: (expenseId) => {
            this.snackBar.open('Expense added successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.expenseForm.reset({ date: new Date() });
            this.isSubmitting.set(false);
            this.expenseAdded.emit();
          },
          error: (error) => {
            console.error('Error adding expense:', error);
            this.snackBar.open('Failed to add expense. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.isSubmitting.set(false);
          }
        });
      }
    }
  }

  resetForm() {
    this.expenseForm.reset({ date: new Date() });
  }

  get title() { return this.expenseForm.get('title'); }
  get amount() { return this.expenseForm.get('amount'); }
  get category() { return this.expenseForm.get('category'); }
  get date() { return this.expenseForm.get('date'); }
  get paymentMethod() { return this.expenseForm.get('paymentMethod'); }
}
