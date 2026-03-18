import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, tap } from 'rxjs';
import { Document, DocumentStatus, SignerStatus, DocumentComment, DocumentSigner } from '../models/document.model';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private http = inject(HttpClient);

    // Mock data for initial development
    private mockDocuments: Document[] = [
        {
            id: 'doc-001',
            title: 'Acta de Reunión Seguimiento #012',
            documentCode: '001.P.SGI.06.F.05',
            meetingNumber: '012',
            meetingType: 'SEGUIMIENTO ACTIVIDADES DE COMISIONAMIENTO',
            location: 'FABRICA DE CEMENTOS MONCADA',
            meetingDate: new Date('2026-02-20T07:30:00'),
            participatingCompanies: ['AEI', 'GBH', 'CM'],
            originalFileName: 'acta-012.pdf',
            currentPdfUrl: '/docs/acta-012.pdf',
            status: DocumentStatus.PENDING,
            assignedSigners: [
                { userId: 'user-signer', userName: 'Mario Mendoza Garcia', empresa: 'AEI', order: 1, status: SignerStatus.PENDING },
                { userId: 'user-2', userName: 'Rafael Gabriel Villamizar', empresa: 'AEI', order: 2, status: SignerStatus.PENDING },
                { userId: 'user-3', userName: 'Raudel Matos Roche', empresa: 'CM', order: 3, status: SignerStatus.PENDING }
            ],
            createdBy: 'user-admin',
            createdAt: new Date('2026-02-20T10:00:00'),
            version: 1,
            comments: []
        }
    ];

    getDocuments(): Observable<Document[]> {
        return of(this.mockDocuments).pipe(delay(500));
    }

    getDocumentById(id: string): Observable<Document | null> {
        const doc = this.mockDocuments.find(d => d.id === id);
        return of(doc || null).pipe(delay(300));
    }

    uploadDocument(formData: any): Observable<Document> {
        // Mock upload
        const newDoc: Document = {
            ...formData,
            id: `doc-${Date.now()}`,
            status: DocumentStatus.PENDING,
            version: 1,
            createdAt: new Date(),
            comments: []
        };
        this.mockDocuments.push(newDoc);
        return of(newDoc).pipe(delay(1000));
    }

    signDocument(documentId: string, signData: { x: number, y: number, page: number, signatureImageId: string, userId: string, scale?: number }): Observable<Document> {
        const docIndex = this.mockDocuments.findIndex(d => d.id === documentId);
        if (docIndex > -1) {
            const doc = this.mockDocuments[docIndex];

            // Find specific signer for this user in the assigned list
            const assignedSigner = doc.assignedSigners.find(s => s.userId === signData.userId);

            // Generate a new signature record
            const newSignature: DocumentSigner = {
                userId: signData.userId,
                userName: assignedSigner?.userName || 'Firmante Adicional', // Use assigned signer's name if available
                empresa: assignedSigner?.empresa || '',
                status: SignerStatus.SIGNED,
                signedAt: new Date(),
                positionX: signData.x,
                positionY: signData.y,
                pageNumber: signData.page,
                signatureImageId: signData.signatureImageId,
                scale: signData.scale || 1, // Default to 1
                order: (doc.extraSignatures?.length || 0) + 100 // high order for extras
            };

            if (assignedSigner && assignedSigner.status === SignerStatus.PENDING) {
                // Update main slot if still pending
                Object.assign(assignedSigner, newSignature);
            } else {
                // Otherwise add to extra signatures (if assigned signer already signed or not in assigned list)
                if (!doc.extraSignatures) doc.extraSignatures = [];
                doc.extraSignatures.push(newSignature);
            }

            // Update document status logic (only based on assignedSigners)
            const allAssignedSigned = doc.assignedSigners.every(s => s.status === SignerStatus.SIGNED);
            doc.status = allAssignedSigned ? DocumentStatus.COMPLETED : DocumentStatus.IN_PROGRESS;
            doc.version += 1;

            return of({ ...doc }).pipe(delay(800));
        }
        throw new Error('Documento no encontrado');
    }

    addComment(documentId: string, content: string, userId: string, userName: string): Observable<DocumentComment> {
        const doc = this.mockDocuments.find(d => d.id === documentId);
        if (doc) {
            const comment: DocumentComment = {
                id: `com-${Date.now()}`,
                userId,
                userName,
                content,
                createdAt: new Date()
            };
            doc.comments.push(comment);
            return of(comment).pipe(delay(200));
        }
        throw new Error('Documento no encontrado');
    }

    getPendingCount(userId: string): Observable<number> {
        return this.getPendingDocuments(userId).pipe(map(docs => docs.length));
    }

    getPendingDocuments(userId: string): Observable<Document[]> {
        const docs = this.mockDocuments.filter(d =>
            d.assignedSigners.some(s => s.userId === userId && s.status === SignerStatus.PENDING)
        );
        return of(docs);
    }

    updateDocument(id: string, data: any): Observable<Document> {
        const index = this.mockDocuments.findIndex(d => d.id === id);
        if (index > -1) {
            const updatedDoc = { ...this.mockDocuments[index], ...data, updatedAt: new Date() };
            this.mockDocuments[index] = updatedDoc;
            return of(updatedDoc).pipe(delay(800));
        }
        throw new Error('Documento no encontrado');
    }

    deleteDocument(id: string): Observable<void> {
        const index = this.mockDocuments.findIndex(d => d.id === id);
        if (index > -1) {
            this.mockDocuments.splice(index, 1);
            return of(undefined).pipe(delay(500));
        }
        throw new Error('Documento no encontrado');
    }
}
