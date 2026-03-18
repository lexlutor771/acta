import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const allowedRoles = route.data?.['roles'] as UserRole[];
    const currentUser = authService.currentUser();

    if (currentUser && allowedRoles && allowedRoles.includes(currentUser.role)) {
        return true;
    }

    // If user is authenticated but doesn't have the role, redirect to a safe page (documents)
    if (authService.isAuthenticated()) {
        router.navigate(['/documents']);
        return false;
    }

    // Not authenticated
    router.navigate(['/login']);
    return false;
};
