import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignatureImage } from '../models/signature.model';
import { supabase } from '../supabase.client';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class SignatureService {
    private readonly BUCKET_NAME = 'c001';
    private readonly FOLDER_NAME = 'signs';
    private auth = inject(AuthService);
    private snackBar = inject(MatSnackBar);

    private handleError(err: any) {
        const message = err.message || 'Ha ocurrido un error inesperado.';
        this.snackBar.open(message, 'Cerrar', { duration: 5000, verticalPosition: 'bottom' });
        return throwError(() => err);
    }

    getSignaturesByUser(userId: string): Observable<SignatureImage[]> {
        const query = supabase
            .from('signatures')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        return from(query).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data || []).map(row => this.mapDbToSignature(row));
            }),
            catchError(err => {
                console.error('Error fetching signatures:', err);
                return throwError(() => err);
            })
        );
    }

    uploadSignature(file: Blob | File, userId: string): Observable<SignatureImage> {
        const currentUserId = this.auth.currentUserId();
        const isAdmin = this.auth.isAdmin();

        // Control de acceso: solo el propio usuario o un Admin pueden subir firmas
        if (userId !== currentUserId && !isAdmin) {
            return throwError(() => new Error('Permisos insuficientes para realizar esta acción.'))
                .pipe(catchError(e => this.handleError(e)));
        }

        // Regla: Los usuarios que no son Admin solo pueden tener una firma registrada en total.
        return this.getSignaturesByUser(userId).pipe(
            switchMap(sigs => {
                if (!isAdmin && sigs.length > 0) {
                    return throwError(() => new Error('Usted ya posee una firma física registrada. Solo un administrador puede eliminarla para registrar una nueva.'));
                }

                const timestamp = Date.now();
                const fileName = `${userId}_v${timestamp}.png`;
                const filePath = `${this.FOLDER_NAME}/${fileName}`;

                return from(this.getImageDimensions(file)).pipe(
                    switchMap(dimensions => {
                        return from(supabase.storage
                            .from(this.BUCKET_NAME)
                            .upload(filePath, file, { cacheControl: '3600', upsert: true })
                        ).pipe(
                            switchMap(({ data, error }) => {
                                if (error) throw error;
                                const { data: { publicUrl } } = supabase.storage
                                    .from(this.BUCKET_NAME)
                                    .getPublicUrl(filePath);

                                // Si es un Admin o si por alguna razón tuviera más, desactivamos las anteriores.
                                return from(supabase
                                    .from('signatures')
                                    .update({ is_active: false })
                                    .eq('user_id', userId)
                                ).pipe(
                                    switchMap(() => {
                                        return from(supabase
                                            .from('signatures')
                                            .select('version')
                                            .eq('user_id', userId)
                                            .order('version', { ascending: false })
                                            .limit(1)
                                        ).pipe(
                                            switchMap(({ data: versionData }) => {
                                                const nextVersion = (versionData && versionData.length > 0) 
                                                    ? (versionData[0].version + 1) : 1;

                                                const sigData = {
                                                    user_id: userId,
                                                    image_url: publicUrl,
                                                    thumbnail_url: publicUrl,
                                                    version: nextVersion,
                                                    is_active: true,
                                                    format: 'PNG',
                                                    file_size: file.size,
                                                    width: dimensions.width,
                                                    height: dimensions.height
                                                };

                                                return from(supabase
                                                    .from('signatures')
                                                    .insert(sigData)
                                                    .select()
                                                    .single()
                                                ).pipe(
                                                    switchMap(({ data: newSig, error: insertError }) => {
                                                        if (insertError) throw insertError;
                                                        return from(supabase
                                                            .from('user')
                                                            .update({ signature_image_id: newSig.id })
                                                            .eq('id', userId)
                                                        ).pipe(
                                                            map(({ error: updateError }) => {
                                                                if (updateError) throw updateError;
                                                                return this.mapDbToSignature(newSig);
                                                            })
                                                        );
                                                    })
                                                );
                                            })
                                        );
                                    })
                                );
                            })
                        );
                    })
                );
            }),
            catchError(err => this.handleError(err))
        );
    }

    private getImageDimensions(file: Blob | File): Promise<{ width: number; height: number }> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const dims = { width: img.naturalWidth, height: img.naturalHeight };
                URL.revokeObjectURL(url);
                resolve(dims);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ width: 0, height: 0 });
            };
            img.src = url;
        });
    }

    deleteSignature(id: string): Observable<void> {
        if (!this.auth.isAdmin()) {
            return throwError(() => new Error('Solo el administrador puede eliminar firmas físicas del sistema para auditoría.'))
                .pipe(catchError(e => this.handleError(e)));
        }
        return from(supabase.from('signatures').delete().eq('id', id)).pipe(
            map(({ error }) => {
                if (error) throw error;
            }),
            catchError(e => this.handleError(e))
        );
    }

    /**
     * Alterna el estado de una firma. 
     * Si se activa, desactiva automáticamente todas las otras firmas del usuario.
     */
    toggleActive(sigId: string, userId: string, targetStatus: boolean): Observable<void> {
        const isAdmin = this.auth.isAdmin();
        
        // Bloqueo estricto: solo admins pueden desactivar o activar firmas existentes
        if (!isAdmin) {
            return throwError(() => new Error('Solo un administrador puede activar o desactivar firmas registradas.'))
                .pipe(catchError(e => this.handleError(e)));
        }

        if (userId !== this.auth.currentUserId() && !isAdmin) {
            return throwError(() => new Error('No tiene permisos para modificar firmas de otros usuarios.'))
                .pipe(catchError(e => this.handleError(e)));
        }

        let operation: Observable<any>;
        if (targetStatus === true) {
            // Activar esta firma implica desactivar las demás del usuario
            operation = from(supabase.from('signatures').update({ is_active: false }).eq('user_id', userId)).pipe(
                switchMap(() => from(supabase.from('signatures').update({ is_active: true }).eq('id', sigId))),
                switchMap(() => from(supabase.from('user').update({ signature_image_id: sigId }).eq('id', userId))),
                map(({ error }) => { if (error) throw error; })
            );
        } else {
            // Desactivar simplemente
            operation = from(supabase.from('signatures').update({ is_active: false }).eq('id', sigId)).pipe(
                switchMap(() => from(supabase.from('user').update({ signature_image_id: null }).eq('id', userId))),
                map(({ error }) => { if (error) throw error; })
            );
        }

        return operation.pipe(catchError(e => this.handleError(e)));
    }

    private mapDbToSignature(row: any): SignatureImage {
        return {
            id: row.id,
            userId: row.user_id,
            imageUrl: row.image_url,
            thumbnailUrl: row.thumbnail_url ?? row.image_url,
            version: row.version,
            isActive: row.is_active,
            createdAt: new Date(row.created_at),
            modifiedAt: row.modified_at ? new Date(row.modified_at) : undefined,
            modifiedBy: row.modified_by,
            format: row.format as 'PNG' | 'SVG',
            metadata: {
                width: row.width ?? 0,
                height: row.height ?? 0,
                fileSize: row.file_size ?? 0
            }
        };
    }
}
