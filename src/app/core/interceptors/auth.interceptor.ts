import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const user = authService.currentUser();

    // If we have a user (and presumably a token in a real app), attach it
    // For this mock app, we'll just check if a user is set
    if (user) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer mock-token-${user.id}`
            }
        });
        return next(authReq);
    }

    return next(req);
};
