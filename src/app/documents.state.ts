import { Injectable, signal, computed, inject } from '@angular/core';
import { Document, DocumentStatus } from './core/models/document.model';
import { DocumentService } from './core/services/document.service';
import { AuthService } from './core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class DocumentsState {
    private documentService = inject(DocumentService);
    private authService = inject(AuthService);

    // State signals
    list = signal<Document[]>([]);
    selectedId = signal<string | null>(null);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    // Computed signals
    selected = computed(() =>
        this.list().find(d => d.id === this.selectedId()) || null
    );

    completedCount = computed(() =>
        this.list().filter(d => d.status === DocumentStatus.COMPLETED).length
    );

    pendingForUser = computed(() => {
        const userId = this.authService.currentUserId();
        if (!userId) return [];
        return this.list().filter(d =>
            d.assignedSigners.some(s => s.userId === userId && s.status === 'PENDING')
        );
    });

    pendingCount = computed(() => this.pendingForUser().length);

    // Actions
    async loadDocuments() {
        this.loading.set(true);
        this.error.set(null);

        this.documentService.getDocuments().subscribe({
            next: (docs) => {
                this.list.set(docs);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.message || 'Error al cargar documentos');
                this.loading.set(false);
            }
        });
    }

    selectDocument(id: string | null) {
        this.selectedId.set(id);
    }

    updateDocumentInList(updatedDoc: Document) {
        this.list.update(docs =>
            docs.map(d => d.id === updatedDoc.id ? updatedDoc : d)
        );
        if (this.selectedId() === updatedDoc.id) {
            // Logic for selected update is already handled by computed 'selected'
        }
    }
}
