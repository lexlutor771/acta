import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User, UserRole } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private mockUsers: User[] = [
        { id: 'user-admin', code: '111111', name: 'Administrador General', email: 'admin@aei.com.cu', role: UserRole.ADMIN, isActive: true, createdAt: new Date() },
        { id: 'user-signer', code: '222222', name: 'Mario Mendoza Garcia', email: 'mario.mendoza@aei.com.cu', role: UserRole.SIGNER, isActive: true, createdAt: new Date() },
        { id: 'user-auditor', code: '333333', name: 'Auditor Externo', email: 'auditoria@cm.com.cu', role: UserRole.AUDITOR, isActive: true, createdAt: new Date() },
        { id: 'user-2', code: '444444', name: 'Rafael Gabriel Villamizar', email: 'rafael@aei.com.cu', role: UserRole.SIGNER, isActive: true, createdAt: new Date() },
        { id: 'user-3', code: '555555', name: 'Raudel Matos Roche', email: 'raudel@cm.com.cu', role: UserRole.SIGNER, isActive: true, createdAt: new Date() }
    ];

    getUsers(): Observable<User[]> {
        return of(this.mockUsers).pipe(delay(400));
    }

    getUserById(id: string): Observable<User | null> {
        return of(this.mockUsers.find(u => u.id === id) || null).pipe(delay(200));
    }

    createUser(userData: Partial<User>): Observable<User> {
        const newUser: User = {
            ...userData as User,
            id: `user-${Date.now()}`,
            isActive: true,
            createdAt: new Date()
        };
        this.mockUsers.push(newUser);
        return of(newUser).pipe(delay(500));
    }

    updateUser(id: string, updates: Partial<User>): Observable<User> {
        const index = this.mockUsers.findIndex(u => u.id === id);
        if (index > -1) {
            this.mockUsers[index] = { ...this.mockUsers[index], ...updates };
            return of(this.mockUsers[index]).pipe(delay(300));
        }
        throw new Error('Usuario no encontrado');
    }
}
