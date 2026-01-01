import { Injectable, inject } from '@angular/core';
import { Database, ref, push, set, update, remove, get, onValue, query, orderByChild, limitToLast, limitToFirst, startAt, endAt } from '@angular/fire/database';
import { AuthService } from './auth';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Expense {
  id?: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  paymentMethod: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchText?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private db = inject(Database);
  private authService = inject(AuthService);

  // Get reference to user's expenses path
  private getUserExpensesRef(userId: string) {
    return ref(this.db, `users/${userId}/expenses`);
  }

  // Add a new expense
  addExpense(expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const userId = this.authService.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const expensesRef = this.getUserExpensesRef(userId);
    const newExpenseRef = push(expensesRef);
    
    const newExpense: Expense = {
      ...expense,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return from(
      set(newExpenseRef, newExpense).then(() => newExpenseRef.key!)
    );
  }

  // Get all expenses for current user
  getExpenses(): Observable<Expense[]> {
    const userId = this.authService.userId;
    if (!userId) {
      return of([]);
    }

    const expensesRef = this.getUserExpensesRef(userId);
    
    return new Observable<Expense[]>(subscriber => {
      const unsubscribe = onValue(expensesRef, (snapshot) => {
        const expenses: Expense[] = [];
        snapshot.forEach((childSnapshot) => {
          const expense = childSnapshot.val();
          expenses.push({
            id: childSnapshot.key!,
            ...expense
          });
        });
        // Sort by date (newest first)
        expenses.sort((a, b) => b.createdAt - a.createdAt);
        subscriber.next(expenses);
      }, (error) => {
        subscriber.error(error);
      });

      return () => unsubscribe();
    });
  }

  // Get filtered and paginated expenses
  getFilteredExpenses(filters: ExpenseFilters = {}, page: number = 0, pageSize: number = 10): Observable<PaginatedResult<Expense>> {
    return this.getExpenses().pipe(
      map(allExpenses => {
        // Apply filters
        let filtered = allExpenses;

        // Filter by category
        if (filters.category) {
          filtered = filtered.filter(e => e.category === filters.category);
        }

        // Filter by date range
        if (filters.startDate) {
          filtered = filtered.filter(e => e.date >= filters.startDate!);
        }
        if (filters.endDate) {
          filtered = filtered.filter(e => e.date <= filters.endDate!);
        }

        // Filter by amount range
        if (filters.minAmount !== undefined) {
          filtered = filtered.filter(e => e.amount >= filters.minAmount!);
        }
        if (filters.maxAmount !== undefined) {
          filtered = filtered.filter(e => e.amount <= filters.maxAmount!);
        }

        // Filter by search text (title or description)
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          filtered = filtered.filter(e => 
            e.title.toLowerCase().includes(searchLower) ||
            (e.description && e.description.toLowerCase().includes(searchLower))
          );
        }

        // Calculate pagination
        const total = filtered.length;
        const start = page * pageSize;
        const end = start + pageSize;
        const data = filtered.slice(start, end);

        return {
          data,
          total,
          page,
          pageSize
        };
      })
    );
  }

  // Get expenses by category
  getExpensesByCategory(category: string): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map(expenses => expenses.filter(expense => expense.category === category))
    );
  }

  // Get expense by ID
  getExpenseById(expenseId: string): Observable<Expense | null> {
    const userId = this.authService.userId;
    if (!userId) {
      return of(null);
    }

    const expenseRef = ref(this.db, `users/${userId}/expenses/${expenseId}`);
    
    return from(get(expenseRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return {
            id: snapshot.key!,
            ...snapshot.val()
          };
        }
        return null;
      })
    );
  }

  // Update an expense
  updateExpense(expenseId: string, updates: Partial<Expense>): Observable<void> {
    const userId = this.authService.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const expenseRef = ref(this.db, `users/${userId}/expenses/${expenseId}`);
    const updatedData = {
      ...updates,
      updatedAt: Date.now()
    };

    return from(update(expenseRef, updatedData));
  }

  // Delete an expense
  deleteExpense(expenseId: string): Observable<void> {
    const userId = this.authService.userId;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const expenseRef = ref(this.db, `users/${userId}/expenses/${expenseId}`);
    return from(remove(expenseRef));
  }

  // Get total expenses amount
  getTotalExpenses(): Observable<number> {
    return this.getExpenses().pipe(
      map(expenses => expenses.reduce((total, expense) => total + expense.amount, 0))
    );
  }

  // Get expenses by date range
  getExpensesByDateRange(startDate: string, endDate: string): Observable<Expense[]> {
    return this.getExpenses().pipe(
      map(expenses => expenses.filter(expense => 
        expense.date >= startDate && expense.date <= endDate
      ))
    );
  }

  // Get expenses grouped by category
  getExpensesGroupedByCategory(): Observable<{ [category: string]: Expense[] }> {
    return this.getExpenses().pipe(
      map(expenses => {
        const grouped: { [category: string]: Expense[] } = {};
        expenses.forEach(expense => {
          if (!grouped[expense.category]) {
            grouped[expense.category] = [];
          }
          grouped[expense.category].push(expense);
        });
        return grouped;
      })
    );
  }

  // Get total expenses by category
  getTotalByCategory(): Observable<{ [category: string]: number }> {
    return this.getExpenses().pipe(
      map(expenses => {
        const totals: { [category: string]: number } = {};
        expenses.forEach(expense => {
          if (!totals[expense.category]) {
            totals[expense.category] = 0;
          }
          totals[expense.category] += expense.amount;
        });
        return totals;
      })
    );
  }
}
