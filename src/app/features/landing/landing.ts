import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { APP_NAME } from '../../core/constants/app.constants';
import { StatisticsService } from '../../core/services/statistics';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent implements OnInit {
  appName = APP_NAME;
  currentYear = new Date().getFullYear();

  features = [
    {
      icon: 'account_balance_wallet',
      title: 'Track Every Penny',
      description: 'Record all your expenses in seconds and never lose track of where your money goes.'
    },
    {
      icon: 'insights',
      title: 'Smart Analytics',
      description: 'Get detailed insights with beautiful charts and understand your spending patterns.'
    },
    {
      icon: 'payments',
      title: 'Multiple Payment Methods',
      description: 'Track expenses across UPI, Cash, Credit Card, and Debit Card seamlessly.'
    },
    {
      icon: 'currency_exchange',
      title: 'Multi-Currency Support',
      description: 'Support for 20+ currencies with automatic locale-based formatting.'
    },
    {
      icon: 'cloud_sync',
      title: 'Sync Anywhere',
      description: 'Your data syncs across all devices in real-time with Firebase.'
    },
    {
      icon: 'phone_android',
      title: 'PWA Ready',
      description: 'Install on your phone and use like a native app, even offline.'
    }
  ];

  benefits = [
    {
      number: '01',
      title: 'Build Better Habits',
      description: 'Tracking expenses daily helps you become more mindful of your spending and develop healthier financial habits.'
    },
    {
      number: '02',
      title: 'Save More Money',
      description: 'Studies show that people who track expenses save 20% more on average by identifying unnecessary spending.'
    },
    {
      number: '03',
      title: 'Achieve Financial Goals',
      description: 'Set budgets, track progress, and reach your financial goals faster with data-driven insights.'
    },
    {
      number: '04',
      title: 'Reduce Financial Stress',
      description: 'Know exactly where you stand financially and eliminate the anxiety of unknown expenses.'
    }
  ];

  stats = [
    { value: '--', label: 'Active Users' },
    { value: '--', label: 'Expenses Tracked' },
    { value: '--', label: 'Expenses This Month' }
  ];
  
  statsLoading = true;

  private router = inject(Router);
  private statisticsService = inject(StatisticsService);

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    console.log('Loading statistics...');
    this.statisticsService.getAppStatistics().subscribe({
      next: (stats) => {
        console.log('Statistics received:', stats);
        this.stats = [
          { 
            value: this.statisticsService.formatNumber(stats.activeUsers), 
            label: 'Active Users' 
          },
          { 
            value: this.statisticsService.formatNumber(stats.totalExpenses), 
            label: 'Expenses Tracked' 
          },
          { 
            value: this.statisticsService.formatNumber(stats.expensesThisMonth), 
            label: 'Expenses This Month' 
          }
        ];
        console.log('Stats array updated:', this.stats);
        this.statsLoading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        // Show 0 on error
        this.stats = [
          { value: '0', label: 'Active Users' },
          { value: '0', label: 'Expenses Tracked' },
          { value: '0', label: 'Expenses This Month' }
        ];
        this.statsLoading = false;
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
