import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { PDFDocument } from 'pdf-lib';
import { Document } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private http = inject(HttpClient);

  generateSignedPdf(doc: Document): Observable<Blob> {
    if (!doc.currentPdfUrl) {
      throw new Error('No se encontró la URL del PDF original');
    }

    // 1. Fetch original PDF
    return this.http.get(doc.currentPdfUrl, { responseType: 'arraybuffer' }).pipe(
      switchMap(pdfBuffer => from(PDFDocument.load(pdfBuffer))),
      switchMap(pdfDoc => {
        // 2. Fetch all unique signature images
        const signersWithSigs = doc.assignedSigners.filter(s => s.status === 'SIGNED' && s.signatureImageId);
        
        // Add extraSignatures if they exist
        const extraSigners = (doc.extraSignatures || []).filter(s => s.signatureImageId);
        const allSigners = [...signersWithSigs, ...extraSigners];

        const uniqueImageUrls = [...new Set(allSigners.map(s => s.signatureImageId!))];
        
        if (uniqueImageUrls.length === 0) {
          return from(pdfDoc.save()).pipe(map(bytes => new Blob([bytes as any], { type: 'application/pdf' })));
        }

        const imageRequests = uniqueImageUrls.map(url => 
          this.http.get(url, { responseType: 'arraybuffer' }).pipe(
            map(buffer => ({ url, buffer })),
            // Handle fetch errors gracefully
            catchError(err => {
               console.warn('Could not fetch signature image', url, err);
               return of(null);
            })
          )
        );

        return forkJoin(imageRequests).pipe(
          switchMap(async (imageResponses) => {
            const imageMap = new Map<string, any>();
            
            for (const res of imageResponses) {
              if (!res) continue;
              try {
                // Try embedding as PNG, fallback to JPG
                let embeddedImage;
                try {
                  embeddedImage = await pdfDoc.embedPng(res.buffer);
                } catch {
                   embeddedImage = await pdfDoc.embedJpg(res.buffer);
                }
                imageMap.set(res.url, embeddedImage);
              } catch (e) {
                console.warn('Could not embed image', res.url, e);
              }
            }

            // 3. Draw signatures on PDF
            const pages = pdfDoc.getPages();

            allSigners.forEach(signer => {
              const img = imageMap.get(signer.signatureImageId!);
              if (!img) return;

              const placements = signer.placements && signer.placements.length > 0 
                ? signer.placements 
                : [{ 
                    page: signer.pageNumber || 1, 
                    x: signer.positionX || 50, 
                    y: signer.positionY || 50, 
                    scale: signer.scale || 1 
                  }];

              placements.forEach(p => {
                const pageIndex = p.page - 1; // 0-indexed in pdf-lib
                if (pageIndex < 0 || pageIndex >= pages.length) return;
                
                const pdfPage = pages[pageIndex];
                const { width: pageWidth, height: pageHeight } = pdfPage.getSize();

                // UI Base signature width is ~140px on a standard view.
                // We map this to approximately 120 points on the PDF.
                const baseWidth = 120;
                const scale = p.scale || 1;
                const finalWidth = baseWidth * scale;
                const finalHeight = finalWidth * (img.height / img.width); // maintain aspect ratio

                // Calculate coordinates
                // UI places the center of the image at x%, y% from top-left
                const centerX = (p.x / 100) * pageWidth;
                const centerYFromTop = (p.y / 100) * pageHeight;
                
                // pdf-lib origin is bottom-left
                const pdfY = pageHeight - centerYFromTop;

                // Draw image centered at (centerX, pdfY)
                const drawX = centerX - (finalWidth / 2);
                const drawY = pdfY - (finalHeight / 2);

                pdfPage.drawImage(img, {
                  x: drawX,
                  y: drawY,
                  width: finalWidth,
                  height: finalHeight
                });
              });
            });

            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes as any], { type: 'application/pdf' });
          })
        );
      })
    );
  }
}
