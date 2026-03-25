import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'acta_language';

  currentLanguage = signal<Language>(this.getStoredLanguage());

  constructor(private translate: TranslateService) {
    const stored = this.getStoredLanguage();
    this.translate.setDefaultLang(stored);
    this.translate.use(stored).subscribe({
      next: () => console.log('Language loaded:', stored),
      error: (err) => console.error('Error loading language:', err),
    });
  }

  private getStoredLanguage(): Language {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
    return 'es';
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage() === 'es' ? 'en' : 'es';
    this.setLanguage(newLang);
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    this.translate.use(lang).subscribe();
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  get currentLang(): Language {
    return this.currentLanguage();
  }
}
