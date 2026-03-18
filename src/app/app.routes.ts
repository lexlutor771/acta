import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.AUDITOR] }
            },
            {
                path: 'documents',
                loadComponent: () => import('./features/documents/document-list/document-list.component').then(m => m.DocumentListComponent)
            },
            {
                path: 'documents/upload',
                loadComponent: () => import('./features/documents/document-upload/document-upload.component').then(m => m.DocumentUploadComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            },
            {
                path: 'documents/:id/sign',
                loadComponent: () => import('./features/documents/document-sign/document-sign.component').then(m => m.DocumentSignComponent)
            },
            {
                path: 'documents/:id/history',
                loadComponent: () => import('./features/documents/document-history/document-history.component').then(m => m.DocumentHistoryComponent)
            },
            {
                path: 'signatures',
                loadComponent: () => import('./features/signatures/signature-gallery.component').then(m => m.SignatureGalleryComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            }
        ]
    },
    { path: '**', redirectTo: 'dashboard' }
];
