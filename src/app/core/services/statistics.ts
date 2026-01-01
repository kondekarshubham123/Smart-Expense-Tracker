import { Injectable, inject } from '@angular/core';
import { Database, ref, get } from '@angular/fire/database';
import { Observable, from, of, shareReplay } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface AppStatistics {
  activeUsers: number;
  totalExpenses: number;
  expensesThisMonth: number;
  expensesToday: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private db = inject(Database);
  private cache$: Observable<AppStatistics> | null = null;
  private cacheTime: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get application-wide statistics
   * Uses caching to avoid repeated slow database queries
   */
  getAppStatistics(): Observable<AppStatistics> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache$ && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.cache$;
    }

    // Create new observable with caching
    this.cacheTime = now;
    this.cache$ = from(this.calculateStatistics()).pipe(
      tap(() => console.log('Statistics loaded from database')),
      catchError(error => {
        console.error('Error fetching statistics:', error);
        // Return default values on error
        return of({
          activeUsers: 0,
          totalExpenses: 0,
          expensesThisMonth: 0,
          expensesToday: 0
        });
      }),
      shareReplay(1) // Share the result with all subscribers
    );

    return this.cache$;
  }

  private async calculateStatistics(): Promise<AppStatistics> {
    console.log('Fetching statistics from Firebase...');
    const usersRef = ref(this.db, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      console.log('No users found in database');
      return {
        activeUsers: 0,
        totalExpenses: 0,
        expensesThisMonth: 0,
        expensesToday: 0
      };
    }

    console.log('Users snapshot exists, calculating stats...');
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const startOfDay = new Date().setHours(0, 0, 0, 0);

    let activeUsers = 0;
    let totalExpenses = 0;
    let expensesThisMonth = 0;
    let expensesToday = 0;

    // Iterate through all users
    snapshot.forEach((userSnapshot) => {
      const expenses = userSnapshot.child('expenses').val();
      
      if (expenses) {
        let userHasRecentActivity = false;
        
        // Count expenses for this user
        Object.values(expenses).forEach((expense: any) => {
          totalExpenses++;
          
          const expenseDate = expense.createdAt || 0;
          
          // Check if expense is within last 30 days (active user)
          if (expenseDate >= thirtyDaysAgo) {
            userHasRecentActivity = true;
          }
          
          // Check if expense is this month
          if (expenseDate >= startOfMonth) {
            expensesThisMonth++;
          }
          
          // Check if expense is today
          if (expenseDate >= startOfDay) {
            expensesToday++;
          }
        });
        
        if (userHasRecentActivity) {
          activeUsers++;
        }
      }
    });

    const result = {
      activeUsers,
      totalExpenses,
      expensesThisMonth,
      expensesToday
    };
    
    console.log('Statistics calculated:', result);
    return result;
  }

  /**
   * Clear the statistics cache
   * Call this when new expenses are added to force a refresh
   */
  clearCache(): void {
    this.cache$ = null;
    this.cacheTime = 0;
  }

  /**
   * Format number with commas for display
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
