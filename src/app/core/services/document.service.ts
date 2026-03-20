import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Document, DocumentStatus, SignerStatus, DocumentComment, DocumentSigner } from '../models/document.model';
import { supabase } from '../supabase.client';
import { AuthService } from '../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private http = inject(HttpClient);

    private auth = inject(AuthService);
    private snackBar = inject(MatSnackBar);

    private readonly BUCKET_NAME = 'c001';
    private readonly FOLDER_NAME = 'docs';

    private mapDbToDocument(row: any): Document {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            documentCode: row.document_code,
            meetingNumber: row.meeting_number,
            meetingType: row.meeting_type,
            location: row.location,
            meetingDate: row.meeting_date ? new Date(row.meeting_date) : undefined,
            participatingCompanies: row.participating_companies || [],
            originalFileName: row.original_file_name,
            currentPdfUrl: row.current_pdf_url,
            status: row.status as DocumentStatus,
            createdBy: row.created_by,
            createdByName: row.user?.name,
            createdAt: new Date(row.created_at),
            version: row.version,
            assignedSigners: (row.document_signers || []).map((s: any) => this.mapDbToSigner(s)),
            comments: (row.document_comments || []).map((c: any) => this.mapDbToComment(c))
        };
    }

    private mapDbToSigner(row: any): DocumentSigner {
        return {
            userId: row.user_id,
            userName: row.user_name,
            empresa: row.empresa,
            order: row.signer_order,
            status: row.status as SignerStatus,
            signedAt: row.signed_at ? new Date(row.signed_at) : undefined,
            signatureImageId: row.signature_image_id,
            positionX: row.position_x,
            positionY: row.position_y,
            pageNumber: row.page_number,
            scale: row.scale,
            placements: row.placements || []
        };
    }

    private mapDbToComment(row: any): DocumentComment {
        return {
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            content: row.content,
            createdAt: new Date(row.created_at)
        };
    }

    private handleError(err: any) {
        const message = err.message || 'Error en la operación de documentos';
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        return throwError(() => err);
    }

    getDocuments(): Observable<Document[]> {
        return from(supabase
            .from('documents')
            .select(`
                *,
                document_signers(*),
                document_comments(*),
                user!created_by(name)
            `)
            .neq('status', DocumentStatus.DELETED)
            .order('created_at', { ascending: false })
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data || []).map(row => this.mapDbToDocument(row));
            }),
            catchError(err => this.handleError(err))
        );
    }

    getDocumentById(id: string): Observable<Document | null> {
        return from(supabase
            .from('documents')
            .select(`
                *,
                document_signers(*),
                document_comments(*),
                user!created_by(name)
            `)
            .eq('id', id)
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) return null;
                return this.mapDbToDocument(data);
            }),
            catchError(() => of(null))
        );
    }

    uploadDocument(formData: any, file: File): Observable<Document> {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
        const filePath = `${this.FOLDER_NAME}/${fileName}`;

        // 1. Upload file to storage
        return from(supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, file)
        ).pipe(
            switchMap(({ data, error: uploadError }) => {
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from(this.BUCKET_NAME)
                    .getPublicUrl(filePath);

                // 2. Insert document metadata
                const docInsert = {
                    title: formData.title,
                    description: formData.description,
                    document_code: formData.documentCode,
                    meeting_number: formData.meetingNumber,
                    meeting_type: formData.meetingType,
                    location: formData.location,
                    meeting_date: formData.meetingDate,
                    participating_companies: formData.participatingCompanies || [],
                    original_file_name: file.name,
                    current_pdf_url: publicUrl,
                    status: formData.status || DocumentStatus.PENDING,
                    created_by: this.auth.currentUserId(),
                    version: 1
                };

                return from(supabase
                    .from('documents')
                    .insert(docInsert)
                    .select()
                    .single()
                );
            }),
            switchMap(({ data: newDoc, error: docError }) => {
                if (docError) throw docError;

                // 3. Insert signers
                const signersInsert = formData.assignedSigners.map((s: any) => ({
                    document_id: newDoc.id,
                    user_id: s.userId,
                    user_name: s.userName,
                    empresa: s.empresa || '',
                    signer_order: s.order,
                    status: SignerStatus.PENDING
                }));

                return from(supabase
                    .from('document_signers')
                    .insert(signersInsert)
                ).pipe(map(({ error: signerError }) => {
                    if (signerError) throw signerError;
                    return this.mapDbToDocument({ ...newDoc, document_signers: signersInsert });
                }));
            }),
            catchError(err => this.handleError(err))
        );
    }

    signDocument(documentId: string, signData: { placements: any[], signatureImageId: string, userId: string }): Observable<Document> {
        // Update the specific signer record
        return from(supabase
            .from('document_signers')
            .update({
                status: SignerStatus.SIGNED,
                signed_at: new Date(),
                signature_image_id: signData.signatureImageId,
                placements: signData.placements,
                // For backward compatibility with things expecting single coordinates, use first placement
                position_x: signData.placements[0]?.x,
                position_y: signData.placements[0]?.y,
                page_number: signData.placements[0]?.page,
                scale: signData.placements[0]?.scale || 1
            })
            .eq('document_id', documentId)
            .eq('user_id', signData.userId)
        ).pipe(
            switchMap(({ error }) => {
                if (error) throw error;
                // Get all signers to check if the document is complete
                return from(supabase
                    .from('document_signers')
                    .select('status')
                    .eq('document_id', documentId)
                );
            }),
            switchMap(({ data: signers, error: signersError }) => {
                if (signersError) throw signersError;
                
                const allSigned = (signers || []).every(s => s.status === SignerStatus.SIGNED);
                const newStatus = allSigned ? DocumentStatus.COMPLETED : DocumentStatus.IN_PROGRESS;

                // Update document status and version
                return from(supabase
                    .from('documents')
                    .update({ 
                        status: newStatus,
                        last_modified_at: new Date()
                    })
                    .eq('id', documentId)
                    .select()
                );
            }),
            switchMap(({ data: updatedDoc, error: updateError }) => {
                if (updateError) throw updateError;
                return this.getDocumentById(documentId).pipe(
                    map(d => { if (!d) throw new Error('Documento no encontrado'); return d; })
                );
            }),
            catchError(err => this.handleError(err))
        );
    }

    addComment(documentId: string, content: string, userId: string, userName: string): Observable<DocumentComment> {
        return from(supabase
            .from('document_comments')
            .insert({
                document_id: documentId,
                user_id: userId,
                user_name: userName,
                content: content
            })
            .select()
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return this.mapDbToComment(data);
            }),
            catchError(err => this.handleError(err))
        );
    }

    getPendingCount(userId: string): Observable<number> {
        return from(supabase
            .from('document_signers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', SignerStatus.PENDING)
        ).pipe(
            map(({ count, error }) => {
                if (error) throw error;
                return count || 0;
            }),
            catchError(() => of(0))
        );
    }

    getPendingDocuments(userId: string): Observable<Document[]> {
        return from(supabase
            .from('document_signers')
            .select('document_id')
            .eq('user_id', userId)
            .eq('status', SignerStatus.PENDING)
        ).pipe(
            switchMap(({ data, error }) => {
                if (error || !data || data.length === 0) return of([]);
                const ids = data.map(d => d.document_id);
                return from(supabase
                    .from('documents')
                    .select(`*, document_signers(*), document_comments(*)`)
                    .in('id', ids)
                    .neq('status', DocumentStatus.DELETED)
                    .neq('status', DocumentStatus.DRAFT)
                ).pipe(map(({ data: docs }) => (docs || []).map(row => this.mapDbToDocument(row))));
            }),
            catchError(() => of([]))
        );
    }

    updateDocument(id: string, data: any): Observable<Document> {
        const patch = {
            title: data.title,
            description: data.description,
            document_code: data.documentCode,
            meeting_number: data.meetingNumber,
            meeting_type: data.meetingType,
            location: data.location,
            meeting_date: data.meetingDate,
            status: data.status,
            last_modified_at: new Date()
        };

        return from(supabase
            .from('documents')
            .update(patch)
            .eq('id', id)
            .select()
            .single()
        ).pipe(
            switchMap(({ data: updated, error }) => {
                if (error) throw error;
                // If we want to update signers too, it would be more complex (delete and re-insert or diff)
                // For now just return the updated doc
                return this.getDocumentById(id).pipe(
                    map(d => { if (!d) throw new Error('Documento no encontrado'); return d; })
                );
            }),
            catchError(err => this.handleError(err))
        );
    }

    markAsPrinted(id: string): Observable<Document> {
        return from(supabase
            .from('documents')
            .update({ status: DocumentStatus.PRINTED, last_modified_at: new Date() })
            .eq('id', id)
            .select()
            .single()
        ).pipe(
            switchMap(({ error }) => {
                if (error) throw error;
                return this.getDocumentById(id).pipe(
                    map(d => { if (!d) throw new Error('Documento no encontrado'); return d; })
                );
            }),
            catchError(err => this.handleError(err))
        );
    }

    deleteDocument(id: string): Observable<void> {
        return from(supabase
            .from('documents')
            .update({ status: DocumentStatus.DELETED, last_modified_at: new Date() })
            .eq('id', id)
        ).pipe(
            map(({ error }) => {
                if (error) throw error;
            }),
            catchError(err => this.handleError(err))
        );
    }
}
