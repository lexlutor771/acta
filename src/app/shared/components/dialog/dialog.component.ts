import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DialogData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  inputPlaceholder?: string;
}

@Component({
  selector: 'app-shared-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container" [ngClass]="data.type">
      <div class="icon-wrapper">
        <mat-icon *ngIf="data.type === 'success'">check_circle</mat-icon>
        <mat-icon *ngIf="data.type === 'error'">cancel</mat-icon>
        <mat-icon *ngIf="data.type === 'warning' || data.type === 'confirm'">help_outline</mat-icon>
      </div>
      
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      
      <div class="prompt-section" *ngIf="data.type === 'prompt'">
        <input type="password" class="prompt-input" [placeholder]="data.inputPlaceholder || ''" (input)="promptValue = $any($event.target).value" (keyup.enter)="onConfirm()">
      </div>

      <div class="dialog-actions">
        <button mat-flat-button class="action-button confirm" (click)="onConfirm()">
          {{ data.confirmText || 'Continuar' }}
        </button>
        <button *ngIf="data.type === 'confirm' || data.type === 'prompt'" mat-stroked-button class="action-button cancel" (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px 32px;
      text-align: center;
      background: white;
      border-radius: 30px !important;
      max-width: 400px;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .icon-wrapper mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    /* Success Theme */
    .success .icon-wrapper { background: #ecfdf5; color: #10b981; }
    .success .confirm { background: #10b981; color: white; }

    /* Error Theme */
    .error .icon-wrapper { background: #fef2f2; color: #f54343; }
    .error .confirm { background: #f54343; color: white; }

    /* Warning/Confirm Theme */
    .warning .icon-wrapper, .confirm .icon-wrapper, .prompt .icon-wrapper { background: #fffbeb; color: #f59e0b; }
    .warning .confirm, .confirm .confirm, .prompt .confirm { background: #f59e0b; color: white; }

    .prompt-section { width: 100%; display: flex; justify-content: center; }
    .prompt-input { width: 100%; height: 48px; border-radius: 12px; border: 2px solid #e2e8f0; padding: 0 16px; font-size: 16px; margin-bottom: 24px; box-sizing: border-box; text-align: center; }
    .prompt-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1); }

    .dialog-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 12px;
      color: #1e293b;
      line-height: 1.2;
    }

    .dialog-message {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 32px;
      line-height: 1.5;
      font-weight: 400;
    }

    .dialog-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .action-button {
      height: 54px;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 700;
      text-transform: none;
      letter-spacing: 0.5px;
    }

    .cancel {
      border: 2px solid #e2e8f0;
      color: #64748b;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 30px !important;
      overflow: visible !important;
    }
  `]
})
export class SharedDialogComponent {
  promptValue = '';

  constructor(
    public dialogRef: MatDialogRef<SharedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onConfirm(): void {
    if (this.data.type === 'prompt') {
      this.dialogRef.close(this.promptValue);
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    if (this.data.type === 'prompt') {
      this.dialogRef.close(null);
    } else {
      this.dialogRef.close(false);
    }
  }
}
