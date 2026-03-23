import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, throwError, tap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { signal, computed } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { supabase } from '../supabase.client';

interface DbUser {
    id: string;
    code: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    company_id: string;
    signature_image_id: string | null;
    created_at: string;
}

function mapDbUser(row: DbUser): User {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        email: row.email,
        role: row.role as UserRole,
        isActive: row.is_active,
        companyId: row.company_id,
        signatureImageId: row.signature_image_id ?? undefined,
        createdAt: new Date(row.created_at)
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private router: Router;

    private _currentUser = signal<User | null>(null);

    // Public signals
    currentUser = this._currentUser.asReadonly();
    isAuthenticated = computed(() => !!this._currentUser());
    currentUserId = computed(() => this._currentUser()?.id ?? '');

    isAdmin    = computed(() => this._currentUser()?.role === UserRole.ADMIN);
    isSigner   = computed(() => this._currentUser()?.role === UserRole.SIGNER);
    isAuditor  = computed(() => this._currentUser()?.role === UserRole.AUDITOR);
    isViewer   = computed(() => this._currentUser()?.role === UserRole.VIEWER);

    constructor(router: Router) {
        this.router = router;
        // Restore persisted session from localStorage
        const storedUser = localStorage.getItem('antigravity_user');
        if (storedUser) {
            try {
                this._currentUser.set(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('antigravity_user');
            }
        }
    }

    /** PIN-based login: looks up user in Supabase by their 6-digit code */
    loginWithPin(pin: string): Observable<User> {
        const query = supabase
            .from('user')
            .select('*')
            .eq('code', pin)
            .eq('is_active', true)
            .limit(1)
            .single();

        return from(query).pipe(
            map(({ data, error }) => {
                if (error || !data) {
                    throw new Error('PIN inválido');
                }
                return mapDbUser(data as DbUser);
            }),
            tap(user => {
                this._currentUser.set(user);
                localStorage.setItem('antigravity_user', JSON.stringify(user));
            }),
            catchError(err => throwError(() => err instanceof Error ? err : new Error('PIN inválido')))
        );
    }

    logout(): void {
        this._currentUser.set(null);
        localStorage.removeItem('antigravity_user');
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<void> {
        return from(Promise.resolve()) as Observable<void>;
    }
}
