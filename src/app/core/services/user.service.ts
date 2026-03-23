import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { supabase } from '../supabase.client';
import { AuthService } from '../auth/auth.service';

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
export class UserService {
    private auth = inject(AuthService);

    getUsers(): Observable<User[]> {
        return from(
            supabase
                .from('user')
                .select('*')
                .eq('company_id', this.auth.currentUser()?.companyId)
                .order('name')
                .order('is_active')
        ).pipe(
            map(({ data, error }) => {
                if (error) throw new Error(error.message);
                return (data as DbUser[]).map(mapDbUser);
            }),
            catchError(err => throwError(() => err))
        );
    }

    getUserById(id: string): Observable<User | null> {
        return from(
            supabase
                .from('user')
                .select('*')
                .eq('id', id)
                .limit(1)
                .single()
        ).pipe(
            map(({ data, error }) => {
                if (error || !data) return null;
                return mapDbUser(data as DbUser);
            }),
            catchError(() => from([null]))
        );
    }

    createUser(userData: Partial<User>): Observable<User> {
        const insert = {
            code: userData.code,
            name: userData.name,
            email: userData.email,
            role: userData.role ?? UserRole.VIEWER,
            is_active: true,
            company_id: this.auth.currentUser()?.companyId
        };

        return from(
            supabase
                .from('user')
                .insert(insert)
                .select()
                .single()
        ).pipe(
            map(({ data, error }) => {
                if (error || !data) throw new Error(error?.message ?? 'Error al crear usuario');
                return mapDbUser(data as DbUser);
            }),
            catchError(err => throwError(() => err))
        );
    }

    updateUser(id: string, updates: Partial<User>): Observable<User> {
        const patch: Record<string, unknown> = {};
        if (updates.name !== undefined) patch['name'] = updates.name;
        if (updates.email !== undefined) patch['email'] = updates.email;
        if (updates.role !== undefined) patch['role'] = updates.role;
        if (updates.isActive !== undefined) patch['is_active'] = updates.isActive;
        if (updates.signatureImageId !== undefined) patch['signature_image_id'] = updates.signatureImageId;

        return from(
            supabase
                .from('user')
                .update(patch)
                .eq('id', id)
                .select()
                .single()
        ).pipe(
            map(({ data, error }) => {
                if (error || !data) throw new Error(error?.message ?? 'Usuario no encontrado');
                return mapDbUser(data as DbUser);
            }),
            catchError(err => throwError(() => err))
        );
    }
}
