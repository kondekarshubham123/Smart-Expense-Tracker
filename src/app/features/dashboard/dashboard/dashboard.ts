import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth';
import { ExpenseService, Expense } from '../../../core/services/expense';
import { CurrencyService } from '../../../core/services/currency';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface CategoryData {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
}

interface DailySpending {
  date: string;
  amount: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);
  private expenseService = inject(ExpenseService);
  currencyService = inject(CurrencyService);
  
  isLoading = signal<boolean>(true);
  totalExpenses = signal<number>(0);
  transactionCount = signal<number>(0);
  categoryCount = signal<number>(0);
  topCategory = signal<string>('N/A');
  topCategoryAmount = signal<number>(0);
  lastMonthTotal = signal<number>(0);
  percentageChange = signal<number>(0);
  
  // Analytics data
  categoryData = signal<CategoryData[]>([]);
  paymentMethodData = signal<PaymentMethodData[]>([]);
  dailySpending = signal<DailySpending[]>([]);
  topExpenses = signal<Expense[]>([]);
  
  // Chart configurations
  categoryChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const currency = this.currencyService.getCurrencyCode();
            return `${label}: ${this.formatCurrency(value)}`;
          }
        }
      }
    }
  };
  categoryChartType: ChartType = 'doughnut';
  
  paymentChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  paymentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  paymentChartType: ChartType = 'pie';
  
  trendChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  trendChartType: ChartType = 'line';

  ngOnInit() {
    this.loadDashboardData();
  }

  private isCurrentMonth(dateString: string): boolean {
    const expenseDate = new Date(dateString);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    // Load expenses and filter for current month
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        // Filter expenses for current month
        const thisMonthExpenses = expenses.filter(e => this.isCurrentMonth(e.date));
        const lastMonthExpenses = expenses.filter(e => this.isLastMonth(e.date));
        
        // Calculate total expenses for this month
        const total = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        this.totalExpenses.set(total);
        
        // Calculate last month total
        const lastTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        this.lastMonthTotal.set(lastTotal);
        
        // Calculate percentage change
        if (lastTotal > 0) {
          const change = ((total - lastTotal) / lastTotal) * 100;
          this.percentageChange.set(change);
        }
        
        // Set transaction count for this month
        this.transactionCount.set(thisMonthExpenses.length);
        
        // Count unique categories for this month
        const categories = new Set(thisMonthExpenses.map(e => e.category));
        this.categoryCount.set(categories.size);
        
        // Find top spending category
        if (thisMonthExpenses.length > 0) {
          const categoryTotals = new Map<string, number>();
          thisMonthExpenses.forEach(expense => {
            const current = categoryTotals.get(expense.category) || 0;
            categoryTotals.set(expense.category, current + expense.amount);
          });
          
          let maxAmount = 0;
          let topCat = 'N/A';
          categoryTotals.forEach((amount, category) => {
            if (amount > maxAmount) {
              maxAmount = amount;
              topCat = category;
            }
          });
          
          this.topCategory.set(topCat);
          this.topCategoryAmount.set(maxAmount);
        }
        
        // Process category data
        this.processCategoryData(thisMonthExpenses, total);
        
        // Process payment method data
        this.processPaymentMethodData(thisMonthExpenses);
        
        // Process daily spending trend
        this.processDailySpending(thisMonthExpenses);
        
        // Get top expenses
        this.topExpenses.set(
          [...thisMonthExpenses]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
        );
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading.set(false);
      }
    });
  }
  
  private isLastMonth(dateString: string): boolean {
    const expenseDate = new Date(dateString);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return expenseDate.getMonth() === lastMonth.getMonth() && 
           expenseDate.getFullYear() === lastMonth.getFullYear();
  }
  
  private processCategoryData(expenses: Expense[], total: number) {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: current.amount + expense.amount,
        count: current.count + 1
      });
    });
    
    const data: CategoryData[] = Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      amount: stats.amount,
      count: stats.count,
      percentage: total > 0 ? (stats.amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
    
    this.categoryData.set(data);
    
    // Update category chart
    this.categoryChartData = {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
  
  private processPaymentMethodData(expenses: Expense[]) {
    const paymentMap = new Map<string, { amount: number; count: number }>();
    
    expenses.forEach(expense => {
      if (expense.paymentMethod) {
        const current = paymentMap.get(expense.paymentMethod) || { amount: 0, count: 0 };
        paymentMap.set(expense.paymentMethod, {
          amount: current.amount + expense.amount,
          count: current.count + 1
        });
      }
    });
    
    const data: PaymentMethodData[] = Array.from(paymentMap.entries()).map(([method, stats]) => ({
      method,
      amount: stats.amount,
      count: stats.count
    }));
    
    this.paymentMethodData.set(data);
    
    // Update payment chart
    this.paymentChartData = {
      labels: data.map(d => d.method),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FF9F40', '#9966FF'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
  
  private processDailySpending(expenses: Expense[]) {
    const dailyMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const date = expense.date;
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + expense.amount);
    });
    
    const data: DailySpending[] = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    this.dailySpending.set(data);
    
    // Update trend chart
    this.trendChartData = {
      labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Daily Spending',
        data: data.map(d => d.amount),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }

  get userName(): string {
    return this.authService.currentUser()?.displayName || 'User';
  }

  get userEmail(): string | null {
    return this.authService.currentUser()?.email || null;
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.currencyService.getLocale(), {
      style: 'currency',
      currency: this.currencyService.getCurrencyCode()
    }).format(amount);
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      'Transportation': 'directions_car',
      'Shopping': 'shopping_bag',
      'Entertainment': 'movie',
      'Bills & Utilities': 'receipt',
      'Healthcare': 'local_hospital',
      'Education': 'school',
      'Travel': 'flight',
      'Other': 'more_horiz'
    };
    return icons[category] || 'category';
  }

  navigateToExpenses() {
    this.router.navigate(['/expenses']);
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
