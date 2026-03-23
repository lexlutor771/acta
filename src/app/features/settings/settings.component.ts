import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/auth/auth.service';
import { DialogService } from '../../core/services/dialog.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  template: `
    <div class="settings-root">
      <header class="settings-header">
        <div class="header-titles">
          <h1>Configuración del Sistema</h1>
          <p>Administre los datos de la empresa y configuración de correos electrónicos.</p>
        </div>
        <button mat-stroked-button color="primary" (click)="unlockEditing()" *ngIf="!isEditMode()">
          <mat-icon>edit</mat-icon> MODIFICAR
        </button>
      </header>

      <div class="glass-panel main-content" *ngIf="!isLoading()">
        <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
          
          <div class="section-block">
            <h3><mat-icon color="primary">business</mat-icon> Datos de la Empresa</h3>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Nombre de la Empresa</mat-label>
                <input matInput formControlName="companyName" placeholder="Ej: Tech Corp">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>ID de la Empresa</mat-label>
                <input matInput formControlName="companyId" placeholder="Ej: AFI" maxlength="3" (input)="onCompanyIdInput($event)" style="text-transform: uppercase;">
                <mat-hint>3 caracteres en mayúsculas</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>URL del Logo</mat-label>
                <input matInput formControlName="companyLogoUrl" placeholder="https://...">
              </mat-form-field>
            </div>
          </div>

          <div class="section-block">
            <h3><mat-icon color="primary">event_available</mat-icon> Licencia de Uso</h3>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Fecha de Inicio</mat-label>
                <input matInput [matDatepicker]="pickerStart" formControlName="licenseStartDate">
                <mat-datepicker-toggle matIconSuffix [for]="pickerStart"></mat-datepicker-toggle>
                <mat-datepicker #pickerStart></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de Vencimiento</mat-label>
                <input matInput [matDatepicker]="pickerEnd" formControlName="licenseEndDate">
                <mat-datepicker-toggle matIconSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                <mat-datepicker #pickerEnd></mat-datepicker>
              </mat-form-field>
            </div>
          </div>

          <div class="section-block">
            <h3><mat-icon color="primary">mail</mat-icon> Configuración de Correo (Notificaciones)</h3>
            <p class="helper-text">Configure una cuenta de Gmail para el envío automático de actas. Debe generar una <a href="https://myaccount.google.com/apppasswords" target="_blank">Contraseña de Aplicación de Google</a>.</p>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Correo Remitente (Gmail)</mat-label>
                <input matInput type="email" formControlName="smtpEmail" placeholder="notificaciones@gmail.com">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contraseña de Aplicación</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="smtpPassword" placeholder="xxxx xxxx xxxx xxxx">
                <button disabled="{{isEditMode() ? false : true}}" mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
              </mat-form-field>
            </div>
          </div>

          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="settingsForm.invalid || isSaving()" *ngIf="isEditMode()">
              <mat-spinner diameter="20" *ngIf="isSaving()"></mat-spinner>
              <mat-icon *ngIf="!isSaving()">save</mat-icon> GUARDAR CONFIGURACIÓN
            </button>
          </div>
        </form>
      </div>

      <div class="loading-state" *ngIf="isLoading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    </div>
  `,
  styles: [`
    .settings-root { display: flex; flex-direction: column; gap: 32px; max-width: 900px; margin: 0 auto; }
    .settings-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-titles h1 { font-size: 36px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .header-titles p { color: var(--text-muted); font-size: 15px; font-weight: 500; }
    
    .glass-panel { padding: 40px; }
    
    .section-block { margin-bottom: 40px; }
    .section-block h3 { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 800; color: var(--accent-color); margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
    .helper-text { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; font-weight: 500; }
    .helper-text a { color: var(--primary-color); text-decoration: none; font-weight: 700; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .full-width { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 32px; }
    .form-actions button { height: 56px; padding: 0 40px; font-weight: 800; border-radius: 16px; letter-spacing: 0.5px; }

    .loading-state { display: flex; justify-content: center; padding: 60px 0; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; gap: 16px; }
      .glass-panel { padding: 24px; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogService = inject(DialogService);

  isLoading = signal(true);
  isSaving = signal(false);
  isEditMode = signal(false);
  hidePassword = true;

  settingsForm: FormGroup = this.fb.group({
    companyName: ['', Validators.required],
    companyId: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    companyLogoUrl: [''],
    licenseStartDate: [''],
    licenseEndDate: [''],
    smtpEmail: ['', [Validators.email]],
    smtpPassword: ['']
  });

  onCompanyIdInput(event: any) {
    const input = event.target as HTMLInputElement;
    const val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.settingsForm.get('companyId')?.setValue(val.substring(0, 3), { emitEvent: false });
  }

  ngOnInit() {
    this.settingsForm.disable();
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.settingsForm.patchValue(settings);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  unlockEditing() {
    this.dialogService.prompt(
      'Autorización Requerida',
      'Ingrese la contraseña para modificar la configuración:',
      'Contraseña'
    ).subscribe(pwd => {
      if (pwd === 'luthor00$$') {
        this.isEditMode.set(true);
        this.settingsForm.enable();
        this.snackBar.open('Modo de edición habilitado', 'Cerrar', { duration: 3000 });
      } else if (pwd !== null) {
        this.snackBar.open('Contraseña incorrecta', 'Cerrar', { duration: 3000 });
      }
    });
  }

  saveSettings() {
    if (this.settingsForm.invalid || !this.isEditMode()) return;
    this.isSaving.set(true);
    this.settingsService.updateSettings(this.settingsForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditMode.set(false);
        this.settingsForm.disable();
        this.snackBar.open('Configuración actualizada y bloqueada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Error al guardar la configuración', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
