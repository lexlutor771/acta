import { Observable, of } from 'rxjs';

export class MockTranslateService {
  private lang = 'es';
  private translations: Record<string, Record<string, string>> = {
    es: {
      'app.title': 'Control Documentario',
      'app.subtitle': 'Actas',
      'nav.dashboard': 'Panel',
      'nav.documents': 'Documentos',
      'nav.upload': 'Subir Acta',
      'nav.signatures': 'Mis Firmas',
      'nav.users': 'Usuarios',
      'nav.settings': 'Configuración',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.loading': 'Cargando...',
      'auth.login': 'Iniciar Sesión',
      'auth.logout': 'Cerrar Sesión',
    },
    en: {
      'app.title': 'Document Control',
      'app.subtitle': 'Minutes',
      'nav.dashboard': 'Dashboard',
      'nav.documents': 'Documents',
      'nav.upload': 'Upload Minute',
      'nav.signatures': 'My Signatures',
      'nav.users': 'Users',
      'nav.settings': 'Settings',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.loading': 'Loading...',
      'auth.login': 'Login',
      'auth.logout': 'Logout',
    },
  };

  setDefaultLang(lang: string): void {
    this.lang = lang;
  }

  use(lang: string): Observable<any> {
    this.lang = lang;
    return of(this.translations[lang] || {});
  }

  get(key: string): Observable<string> {
    return of(this.translations[this.lang]?.[key] || key);
  }

  instant(key: string): string {
    return this.translations[this.lang]?.[key] || key;
  }

  get currentLang(): string {
    return this.lang;
  }
}
