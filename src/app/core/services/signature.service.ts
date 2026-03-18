import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SignatureImage } from '../models/signature.model';

@Injectable({
    providedIn: 'root'
})
export class SignatureService {
    private mockSignatures: SignatureImage[] = [
        {
            id: 'sig-1',
            userId: 'user-signer',
            imageUrl: 'assets/mock-signature.png',
            thumbnailUrl: 'assets/mock-signature-thumb.png',
            version: 1,
            isActive: true,
            createdAt: new Date('2026-01-10'),
            format: 'PNG',
            metadata: { width: 400, height: 200, fileSize: 15420 }
        },
        {
            id: 'sig-2',
            userId: 'user-2',
            imageUrl: 'assets/mock-signature.png',
            thumbnailUrl: 'assets/mock-signature-thumb.png',
            version: 1,
            isActive: true,
            createdAt: new Date('2026-01-15'),
            format: 'PNG',
            metadata: { width: 400, height: 200, fileSize: 15420 }
        },
        {
            id: 'sig-3',
            userId: 'user-3',
            imageUrl: 'assets/mock-signature.png',
            thumbnailUrl: 'assets/mock-signature-thumb.png',
            version: 1,
            isActive: true,
            createdAt: new Date('2026-01-20'),
            format: 'PNG',
            metadata: { width: 400, height: 200, fileSize: 15420 }
        }
    ];

    getSignaturesByUser(userId: string): Observable<SignatureImage[]> {
        const userSigs = this.mockSignatures
            .filter(s => s.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return of(userSigs).pipe(delay(300));
    }

    uploadSignature(blob: Blob, userId: string): Observable<SignatureImage> {
        const newSig: SignatureImage = {
            id: `sig-${Date.now()}`,
            userId,
            imageUrl: URL.createObjectURL(blob),
            thumbnailUrl: URL.createObjectURL(blob),
            version: 1,
            isActive: true,
            createdAt: new Date(),
            format: 'PNG',
            metadata: { width: 400, height: 200, fileSize: blob.size }
        };
        this.mockSignatures.forEach(s => { if (s.userId === userId) s.isActive = false; });
        this.mockSignatures.push(newSig);
        return of(newSig).pipe(delay(800));
    }
}
