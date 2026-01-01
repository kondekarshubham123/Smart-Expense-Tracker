import { Injectable, signal, computed, inject } from '@angular/core';
import { Database, ref, set, get } from '@angular/fire/database';
import { AuthService } from './auth';

// Currency interface for defining currency properties
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private db = inject(Database);
  private authService = inject(AuthService);

  currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', locale: 'pl-PL' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' }
  ];

  private selectedCurrency = signal<string>('USD');

  constructor() {
    // Load currency from Firebase when user is available
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadUserCurrency();
      } else {
        // Use browser detection for non-logged in users
        this.selectedCurrency.set(this.detectCurrencyFromBrowser());
      }
    });
  }

  currentCurrency = computed(() => {
    const code = this.selectedCurrency();
    return this.currencies.find(c => c.code === code) || this.currencies[0];
  });

  getCurrencyCode(): string {
    return this.currentCurrency().code;
  }

  getCurrencySymbol(): string {
    return this.currentCurrency().symbol;
  }

  getLocale(): string {
    return this.currentCurrency().locale;
  }

  setCurrency(code: string) {
    const currency = this.currencies.find(c => c.code === code);
    if (currency) {
      this.selectedCurrency.set(code);
      // Save to localStorage as backup
      localStorage.setItem('preferredCurrency', code);
      // Save to Firebase for the user
      this.saveUserCurrency(code);
    }
  }

  private async loadUserCurrency() {
    const userId = this.authService.userId;
    if (!userId) {
      this.selectedCurrency.set(this.detectCurrencyFromBrowser());
      return;
    }

    try {
      const currencyRef = ref(this.db, `users/${userId}/preferences/currency`);
      const snapshot = await get(currencyRef);
      
      if (snapshot.exists()) {
        const savedCurrency = snapshot.val();
        this.selectedCurrency.set(savedCurrency);
      } else {
        // No saved currency, use browser detection
        const detectedCurrency = this.detectCurrencyFromBrowser();
        this.selectedCurrency.set(detectedCurrency);
        // Save the detected currency
        await this.saveUserCurrency(detectedCurrency);
      }
    } catch (error) {
      console.error('Error loading user currency:', error);
      // Fallback to browser detection
      this.selectedCurrency.set(this.detectCurrencyFromBrowser());
    }
  }

  private async saveUserCurrency(currencyCode: string) {
    const userId = this.authService.userId;
    if (!userId) return;

    try {
      const currencyRef = ref(this.db, `users/${userId}/preferences/currency`);
      await set(currencyRef, currencyCode);
    } catch (error) {
      console.error('Error saving user currency:', error);
    }
  }

  private getStoredCurrency(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('preferredCurrency');
    }
    return null;
  }

  private detectCurrencyFromBrowser(): string {
    if (typeof navigator === 'undefined') {
      return 'USD';
    }

    const locale = navigator.language || 'en-US';
    
    // Try to find currency based on browser locale
    const currency = this.currencies.find(c => c.locale === locale);
    if (currency) {
      return currency.code;
    }

    // Try matching just the country code
    const countryCode = locale.split('-')[1];
    const currencyMap: { [key: string]: string } = {
      'US': 'USD',
      'IN': 'INR',
      'GB': 'GBP',
      'CA': 'CAD',
      'AU': 'AUD',
      'JP': 'JPY',
      'CN': 'CNY',
      'KR': 'KRW',
      'BR': 'BRL',
      'RU': 'RUB',
      'SA': 'SAR',
      'TR': 'TRY',
      'PL': 'PLN',
      'SE': 'SEK',
      'CH': 'CHF',
      'MX': 'MXN',
      'SG': 'SGD',
      'HK': 'HKD',
      'NZ': 'NZD'
    };

    // Common European countries that use EUR
    const euroCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'IE', 'PT', 'GR'];
    if (countryCode && euroCountries.includes(countryCode)) {
      return 'EUR';
    }

    return currencyMap[countryCode || ''] || 'USD';
  }
}
