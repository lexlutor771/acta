import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';

import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

class TranslateJsonLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

export function getSpanishPaginatorIntl() {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Filas por página:';
  intl.nextPageLabel = 'Siguiente página';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };
  return intl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(
      MatDialogModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient) => new TranslateJsonLoader(http),
          deps: [HttpClient],
        },
        defaultLanguage: 'es',
      }),
    ),
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: MatPaginatorIntl, useFactory: getSpanishPaginatorIntl },
  ],
};
