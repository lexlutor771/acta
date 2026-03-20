import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { supabase } from '../supabase.client';
import { AppSettings } from '../models/settings.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private snackBar = inject(MatSnackBar);

  getSettings(): Observable<AppSettings> {
    return from(supabase.from('app_settings').select('*').eq('id', 1).maybeSingle()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return { id: 1, companyName: '' } as AppSettings;
        return {
          id: data.id,
          companyName: data.company_name,
          companyLogoUrl: data.company_logo_url,
          licenseStartDate: data.license_start_date ? new Date(data.license_start_date) : undefined,
          licenseEndDate: data.license_end_date ? new Date(data.license_end_date) : undefined,
          smtpEmail: data.smtp_email,
          smtpPassword: data.smtp_password
        };
      }),
      catchError(err => {
        console.error('Error fetching settings:', err);
        return throwError(() => err);
      })
    );
  }

  updateSettings(settings: Partial<AppSettings>): Observable<AppSettings> {
    const payload = {
      id: 1,
      company_name: settings.companyName,
      company_logo_url: settings.companyLogoUrl,
      license_start_date: settings.licenseStartDate?.toISOString(),
      license_end_date: settings.licenseEndDate?.toISOString(),
      smtp_email: settings.smtpEmail,
      smtp_password: settings.smtpPassword,
      updated_at: new Date().toISOString()
    };

    return from(supabase.from('app_settings').upsert(payload).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.snackBar.open('Configuración actualizada exitosamente', 'Cerrar', { duration: 3000 });
        return {
          id: data.id,
          companyName: data.company_name,
          companyLogoUrl: data.company_logo_url,
          licenseStartDate: data.license_start_date ? new Date(data.license_start_date) : undefined,
          licenseEndDate: data.license_end_date ? new Date(data.license_end_date) : undefined,
          smtpEmail: data.smtp_email,
          smtpPassword: data.smtp_password
        };
      }),
      catchError(err => {
        this.snackBar.open('Error al actualizar la configuración', 'Cerrar', { duration: 5000 });
        return throwError(() => err);
      })
    );
  }
}
