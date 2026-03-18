import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const snackBar = inject(MatSnackBar);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ha ocurrido un error inesperado';

            if (error.status === 401) {
                errorMessage = 'Sesión expirada. Por favor, identifíquese de nuevo.';
                authService.logout();
            } else if (error.status === 403) {
                errorMessage = 'No tiene permisos para realizar esta acción.';
            } else if (error.status === 404) {
                errorMessage = 'El recurso solicitado no existe.';
            } else if (error.status >= 500) {
                errorMessage = 'Error en el servidor. Intente más tarde.';
            }

            snackBar.open(errorMessage, 'Cerrar', {
                duration: 5000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
            });

            return throwError(() => error);
        })
    );
};
