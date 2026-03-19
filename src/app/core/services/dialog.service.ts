import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { SharedDialogComponent, DialogData } from '../../shared/components/dialog/dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog);

  success(title: string, message: string, buttonText?: string): Observable<boolean> {
    return this.openDialog({
      title,
      message,
      type: 'success',
      confirmText: buttonText || 'Continuar'
    });
  }

  error(title: string, message: string, buttonText?: string): Observable<boolean> {
    return this.openDialog({
      title,
      message,
      type: 'error',
      confirmText: buttonText || 'Continuar'
    });
  }

  warning(title: string, message: string, buttonText?: string): Observable<boolean> {
    return this.openDialog({
      title,
      message,
      type: 'warning',
      confirmText: buttonText || 'Aceptar'
    });
  }

  confirm(title: string, message: string, confirmText?: string, cancelText?: string): Observable<boolean> {
    return this.openDialog({
      title,
      message,
      type: 'confirm',
      confirmText: confirmText || 'Eliminar',
      cancelText: cancelText || 'Cancelar'
    });
  }

  private openDialog(data: DialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(SharedDialogComponent, {
      data,
      width: '400px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-panel',
      disableClose: true
    });

    return dialogRef.afterClosed();
  }
}
