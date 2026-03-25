import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { supabase } from '../supabase.client';
import { AppSettings } from '../models/settings.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);

  getSettings(): Observable<AppSettings> {
    const companyId = this.auth.currentUser()?.companyId;
    if (!companyId) {
      return of({ id: 0, companyName: '' } as AppSettings);
    }

    return from(
      supabase.from('app_settings').select('*').eq('company_id', companyId).maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return { id: 0, companyId, companyName: '' } as AppSettings;
        return {
          id: data.id,
          companyName: data.company_name,
          companyId: data.company_id,
          companyLogoUrl: data.company_logo_url,
          licenseStartDate: data.license_start_date ? new Date(data.license_start_date) : undefined,
          licenseEndDate: data.license_end_date ? new Date(data.license_end_date) : undefined,
          smtpEmail: data.smtp_email,
          smtpPassword: data.smtp_password,
        };
      }),
      catchError((err) => {
        console.error('Error fetching settings:', err);
        return throwError(() => err);
      }),
    );
  }

  updateSettings(settings: Partial<AppSettings>): Observable<AppSettings> {
    const companyId = this.auth.currentUser()?.companyId;
    if (!companyId) {
      return throwError(() => new Error('No company ID available'));
    }

    const payload = {
      company_name: settings.companyName,
      company_id: companyId,
      company_logo_url: settings.companyLogoUrl,
      license_start_date: settings.licenseStartDate?.toISOString(),
      license_end_date: settings.licenseEndDate?.toISOString(),
      smtp_email: settings.smtpEmail,
      smtp_password: settings.smtpPassword,
      updated_at: new Date().toISOString(),
    };

    return from(supabase.from('app_settings').upsert(payload).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.snackBar.open('Configuración actualizada exitosamente', 'Cerrar', { duration: 3000 });
        return {
          id: data.id,
          companyName: data.company_name,
          companyId: data.company_id,
          companyLogoUrl: data.company_logo_url,
          licenseStartDate: data.license_start_date ? new Date(data.license_start_date) : undefined,
          licenseEndDate: data.license_end_date ? new Date(data.license_end_date) : undefined,
          smtpEmail: data.smtp_email,
          smtpPassword: data.smtp_password,
        };
      }),
      catchError((err) => {
        this.snackBar.open('Error al actualizar la configuración', 'Cerrar', { duration: 5000 });
        return throwError(() => err);
      }),
    );
  }
}
