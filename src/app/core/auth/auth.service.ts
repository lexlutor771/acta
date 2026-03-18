import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, delay, throwError } from 'rxjs';
import { User, UserRole } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private _currentUser = signal<User | null>(null);

    // Public signals
    currentUser = this._currentUser.asReadonly();
    isAuthenticated = computed(() => !!this._currentUser());
    currentUserId = computed(() => this._currentUser()?.id ?? '');

    isAdmin = computed(() => this._currentUser()?.role === UserRole.ADMIN);
    isSigner = computed(() => this._currentUser()?.role === UserRole.SIGNER);
    isAuditor = computed(() => this._currentUser()?.role === UserRole.AUDITOR);
    isViewer = computed(() => this._currentUser()?.role === UserRole.VIEWER);

    constructor() {
        // Check if user is stored in session/local storage for persistence (MOCK)
        const storedUser = localStorage.getItem('antigravity_user');
        if (storedUser) {
            this._currentUser.set(JSON.parse(storedUser));
        }
    }

    // Login with PIN logic (Mocking backend response)
    loginWithPin(pin: string): Observable<User> {
        // Mock user mapping based on PINs specified in implementation plan
        let mockUser: User | null = null;

        if (pin === '111111') {
            mockUser = {
                id: 'user-admin',
                code: '111111',
                name: 'Administrador General',
                email: 'admin@aei.com.cu',
                role: UserRole.ADMIN,
                isActive: true,
                createdAt: new Date()
            };
        } else if (pin === '222222') {
            mockUser = {
                id: 'user-signer',
                code: '222222',
                name: 'Mario Mendoza Garcia',
                email: 'mario.mendoza@aei.com.cu',
                role: UserRole.SIGNER,
                isActive: true,
                createdAt: new Date()
            };
        } else if (pin === '444444') {
            mockUser = {
                id: 'user-2',
                code: '444444',
                name: 'Rafael Gabriel Villamizar',
                email: 'rafael@aei.com.cu',
                role: UserRole.SIGNER,
                isActive: true,
                createdAt: new Date()
            };
        } else if (pin === '555555') {
            mockUser = {
                id: 'user-3',
                code: '555555',
                name: 'Raudel Matos Roche',
                email: 'raudel@cm.com.cu',
                role: UserRole.SIGNER,
                isActive: true,
                createdAt: new Date()
            };
        } else if (pin === '333333') {
            mockUser = {
                id: 'user-auditor',
                code: '333333',
                name: 'Auditor Externo',
                email: 'auditoria@cm.com.cu',
                role: UserRole.AUDITOR,
                isActive: true,
                createdAt: new Date()
            };
        }

        if (mockUser) {
            return of(mockUser).pipe(
                delay(800), // Simulate network latency
                tap(user => {
                    this._currentUser.set(user);
                    localStorage.setItem('antigravity_user', JSON.stringify(user));
                })
            );
        } else {
            return throwError(() => new Error('PIN inválido')).pipe(delay(800));
        }
    }

    logout(): void {
        this._currentUser.set(null);
        localStorage.removeItem('antigravity_user');
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<void> {
        // Mock refresh
        return of(undefined).pipe(delay(500));
    }
}
