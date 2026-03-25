import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageService } from '../../../../app/core/services/language.service';
import { TranslateService } from '@ngx-translate/core';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockTranslateService: Partial<TranslateService>;

  beforeEach(() => {
    localStorage.clear();

    mockTranslateService = {
      setDefaultLang: vi.fn(),
      use: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
      get: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    };

    service = new LanguageService(mockTranslateService as TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default language as Spanish', () => {
    expect(service.currentLanguage()).toBe('es');
  });

  it('should toggle language from Spanish to English', () => {
    const initialLang = service.currentLanguage();
    service.toggleLanguage();
    expect(service.currentLanguage()).not.toBe(initialLang);
  });

  it('should toggle language from English to Spanish', () => {
    service.setLanguage('en');
    service.toggleLanguage();
    expect(service.currentLanguage()).toBe('es');
  });

  it('should set language correctly', () => {
    service.setLanguage('en');
    expect(service.currentLanguage()).toBe('en');
  });

  it('should persist language to localStorage', () => {
    service.setLanguage('en');
    expect(localStorage.getItem('acta_language')).toBe('en');
  });

  it('should get current language', () => {
    expect(service.currentLang).toBeDefined();
  });
});
