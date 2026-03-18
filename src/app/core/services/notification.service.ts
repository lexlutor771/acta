import { Injectable, signal, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval, startWith, switchMap, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { DocumentService } from './document.service';
import { Document } from '../models/document.model';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
    documentId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private authService = inject(AuthService);
    private documentService = inject(DocumentService);
    private snackBar = inject(MatSnackBar);

    private _notifications = signal<Notification[]>([]);
    notifications = this._notifications.asReadonly();
    private alertedDocumentIds = new Set<string>();

    pendingDocsCount = signal<number>(0);

    constructor() {
        // Poll for pending documents every 60 seconds if logged in
        interval(60000).pipe(
            startWith(0),
            switchMap(() => {
                const userId = this.authService.currentUserId();
                return userId ? this.documentService.getPendingDocuments(userId) : of([]);
            })
        ).subscribe(docs => {
            this.pendingDocsCount.set(docs.length);

            if (this.authService.isAuthenticated()) {
                docs.forEach(doc => {
                    if (!this.alertedDocumentIds.has(doc.id)) {
                        this.notify(`El acta ${doc.documentCode} requiere su firma`, 'info', doc.id);
                        this.alertedDocumentIds.add(doc.id);
                    }
                });
            }
        });
    }

    notify(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', documentId?: string): void {
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            message,
            type,
            timestamp: new Date(),
            read: false,
            documentId
        };

        this._notifications.update(n => [newNotification, ...n]);

        this.snackBar.open(message, 'Cerrar', {
            duration: 4000,
            panelClass: [`${type}-snackbar`],
            horizontalPosition: 'right',
            verticalPosition: 'bottom'
        });
    }

    markAsRead(id: string): void {
        this._notifications.update(notifs =>
            notifs.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }

    clearAll(): void {
        this._notifications.set([]);
    }
}
