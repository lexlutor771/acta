import { Component, inject, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-page">
      <div class="glass-panel login-card">
        <div class="login-header">
          <img [src]="companyLogoUrl()" alt="Logo Empresa" class="logo-img" (error)="companyLogoUrl.set('/assets/logo-afi.png')">
          <h1>Bienvenido</h1>
          <p>Ingrese su código PIN para continuar</p>
        </div>

        <form (submit)="onSubmit($event)" class="pin-form">
          <div class="pin-inputs">
            <input #pinInput
                   *ngFor="let digit of [0,1,2,3,4,5]; let i = index"
                   type="password"
                   maxlength="1"
                   pattern="[0-9]*"
                   inputmode="numeric"
                   [(ngModel)]="pinDigits[i]"
                   [name]="'pin' + i"
                   (keyup)="onKeyUp($event, i)"
                   (paste)="onPaste($event)"
                   [disabled]="loading()"
                   autocomplete="off">
          </div>

          <div class="error-message" *ngIf="error()">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>

          <button mat-raised-button 
                  color="primary" 
                  class="submit-btn" 
                  [disabled]="!isPinComplete() || loading()"
                  type="submit">
            <span *ngIf="!loading()">INGRESAR</span>
            <mat-spinner diameter="24" *ngIf="loading()"></mat-spinner>
          </button>
        </form>

        <div class="login-footer">
          <p>AEI Fábricas de Cementos</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      position: relative;
      overflow: hidden;
    }
    .login-page::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(255, 122, 41, 0.05) 0%, transparent 70%);
      top: -200px;
      right: -200px;
      border-radius: 50%;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 64px 48px;
      text-align: center;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);
      z-index: 1;
    }
    .logo-img {
      height: 60px;
      width: auto;
      margin-bottom: 32px;
      display: inline-block;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      color: var(--accent-color);
    }
    p {
      color: var(--text-muted);
      font-size: 15px;
      margin-bottom: 40px;
    }
    .pin-inputs {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .pin-inputs input {
      width: 48px;
      height: 64px;
      font-size: 28px;
      text-align: center;
      background: #f1f5f9;
      border: 2px solid transparent;
      border-radius: 12px;
      color: var(--accent-color);
      font-weight: 700;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pin-inputs input:focus {
      outline: none;
      border-color: var(--primary-color);
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 122, 41, 0.1);
      transform: translateY(-2px);
    }
    .submit-btn {
      width: 100%;
      height: 56px !important;
      border-radius: 16px !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      letter-spacing: 0.5px !important;
    }
    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #ef4444;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
      animation: shake 0.4s;
    }
    .login-footer {
      margin-top: 48px;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.6;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    @media (max-width: 520px) {
      .login-card { padding: 40px 3px; margin: 0 16px; }
      .login-header h1 { font-size: 28px; }
      .login-header p { font-size: 14px; margin-bottom: 28px; }
      .pin-inputs { gap: 10px; margin-bottom: 24px; }
      .pin-inputs input { width: 42px; height: 56px; font-size: 24px; }
      .submit-btn { height: 52px !important; font-size: 15px !important; }
      .login-footer { margin-top: 32px; font-size: 11px; }
    }
  `]
})
export class LoginComponent {
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private settingsService = inject(SettingsService);
  private dialogService = inject(DialogService);

  pinDigits: string[] = ['', '', '', '', '', ''];
  loading = signal(false);
  error = signal<string | null>(null);
  companyLogoUrl = signal<string>('/assets/logo-afi.png');

  constructor() {
    this.settingsService.getSettings().subscribe(s => {
      if (s?.companyLogoUrl) {
        this.companyLogoUrl.set(s.companyLogoUrl);
      }
    });
  }

  isPinComplete(): boolean {
    return this.pinDigits.every(d => d.length === 1);
  }

  onKeyUp(event: KeyboardEvent, index: number) {
    const key = event.key;

    if (key === 'Backspace') {
      if (index > 0 && !this.pinDigits[index]) {
        this.pinInputs.toArray()[index - 1].nativeElement.focus();
      }
    } else if (/^[0-9]$/.test(key)) {
      if (index < 5) {
        this.pinInputs.toArray()[index + 1].nativeElement.focus();
      } else {
        // Auto submit if last digit entered
        if (this.isPinComplete()) {
          this.onSubmit();
        }
      }
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const data = event.clipboardData?.getData('text').slice(0, 6);
    if (data && /^[0-9]+$/.test(data)) {
      for (let i = 0; i < data.length; i++) {
        this.pinDigits[i] = data[i];
      }
      const nextIndex = Math.min(data.length, 5);
      this.pinInputs.toArray()[nextIndex].nativeElement.focus();

      if (this.isPinComplete()) {
        this.onSubmit();
      }
    }
  }

  onSubmit(event?: Event) {
    if (event) event.preventDefault();
    if (!this.isPinComplete()) return;

    this.loading.set(true);
    this.error.set(null);

    const pin = this.pinDigits.join('');

    this.authService.loginWithPin(pin).subscribe({
      next: (user) => {
        this.settingsService.getSettings().subscribe({
          next: (settings) => {
            if (settings?.licenseEndDate) {
              const expireDate = new Date(settings.licenseEndDate);
              const now = new Date();
              expireDate.setHours(23, 59, 59, 999);

              if (now > expireDate) {
                this.authService.logout();
                this.dialogService.error('Licencia Expirada', 'El período de licencia de este sistema ha finalizado. Por favor, contacte con el administrador.');
                this.loading.set(false);
                this.pinDigits = ['', '', '', '', '', ''];
                setTimeout(() => this.pinInputs?.toArray()[0]?.nativeElement.focus(), 0);
                return;
              }

              const timeDiff = expireDate.getTime() - now.getTime();
              const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

              if (daysLeft > 0 && daysLeft <= 5) {
                this.dialogService.warning(
                  'Licencia por expirar',
                  `La licencia de uso del sistema caducará en ${daysLeft - 1} día(s). Por favor, contacte a soporte para la renovación.`
                ).subscribe(() => {
                  const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                  this.router.navigate([returnUrl]);
                });
                return;
              }
            }
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigate([returnUrl]);
          },
          error: (err) => {
            // Si hay error leyendo configuración, permitimos ingreso por precaución
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigate([returnUrl]);
          }
        });
      },
      error: (err) => {
        this.error.set('PIN incorrecto. Intente de nuevo.');
        this.loading.set(false);
        this.pinDigits = ['', '', '', '', '', ''];
        setTimeout(() => this.pinInputs?.toArray()[0]?.nativeElement.focus(), 0);
      }
    });
  }
}
