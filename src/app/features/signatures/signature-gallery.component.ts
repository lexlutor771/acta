import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SignatureService } from '../../core/services/signature.service';
import { AuthService } from '../../core/auth/auth.service';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { SignatureImage } from '../../core/models/signature.model';

@Component({
  selector: 'app-signature-gallery',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="gallery-root">
      <header class="header">
        <div>
          <h1>Mis Firmas Registradas</h1>
          <p>Gestione sus firmas digitales para usar en los documentos del sistema</p>
        </div>
        <div class="header-actions">
          <input type="file" #fileInput hidden accept="image/png, image/jpeg" (change)="uploadFile($event)">
          <button mat-stroked-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon> CARGAR FIRMA
          </button>
          <button mat-raised-button color="primary" (click)="openCreator()">
            <mat-icon>draw</mat-icon> DIBUJAR FIRMA
          </button>
        </div>
      </header>

      <div class="grid">
        <mat-card *ngFor="let sig of signatures()" class="sig-card glass-panel" [class.inactive]="!sig.isActive">
          <div class="sig-preview">
            <img [src]="sig.imageUrl" alt="Firma">
            <div class="inactive-overlay" *ngIf="!sig.isActive">INACTIVA</div>
          </div>
          <mat-card-content>
            <div class="sig-meta">
              <div class="m-item"><strong>ID:</strong> {{ sig.id }}</div>
              <div class="m-item"><strong>Versión:</strong> {{ sig.version }}</div>
              <div class="m-item"><strong>Fecha:</strong> {{ sig.createdAt | date:'shortDate' }}</div>
              <div class="m-item"><strong>Formato:</strong> {{ sig.format }}</div>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button color="warn" *ngIf="sig.isActive">DESACTIVAR</button>
            <button mat-button color="primary" (click)="openCreator()">NUEVA VERSIÓN</button>
          </mat-card-actions>
        </mat-card>

        <div class="empty-state" *ngIf="signatures().length === 0">
          <mat-icon>gesture</mat-icon>
          <h3>No tiene firmas registradas</h3>
          <p>Registre su primera firma para comenzar a firmar documentos.</p>
          <div class="empty-actions">
            <button mat-stroked-button color="primary" (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> CARGAR FIRMA
            </button>
            <button mat-raised-button color="primary" (click)="openCreator()">
              <mat-icon>draw</mat-icon> DIBUJAR PRIMERA FIRMA
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gallery-root { display: flex; flex-direction: column; gap: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 36px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .header p { color: var(--text-muted); font-size: 15px; font-weight: 500; }
    .header-actions { display: flex; gap: 16px; align-items: center; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 32px; }
    .sig-card { overflow: hidden; border: 1px solid var(--border-color); background: white; border-radius: 16px; padding: 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .sig-preview { 
      height: 180px; 
      background: #f8fafc; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      position: relative; 
      padding: 32px;
      border-bottom: 1px solid var(--border-color);
    }
    .sig-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
    
    .sig-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px; font-size: 12px; }
    .m-item strong { color: var(--text-muted); font-weight: 600; margin-right: 4px; }
    .m-item { color: var(--text-color); font-weight: 700; }
    
    mat-card-actions { padding: 8px 16px 16px !important; }
    mat-card-actions button { font-weight: 800; font-size: 11px; letter-spacing: 0.5px; }

    .inactive { opacity: 0.6; grayscale: 100%; }
    .inactive-overlay { position: absolute; background: var(--accent-color); color: white; padding: 6px 14px; font-size: 11px; font-weight: 900; border-radius: 8px; }

    .empty-state { 
      grid-column: 1 / -1; 
      height: 400px; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      text-align: center;
      background: white;
      border: 2px dashed var(--border-color);
      border-radius: 24px;
    }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--primary-color); opacity: 0.5; margin-bottom: 24px; }
    .empty-state h3 { font-size: 20px; font-weight: 800; color: var(--accent-color); margin-bottom: 8px; }
    .empty-state p { color: var(--text-muted); margin-bottom: 16px; font-weight: 500; }
    .empty-actions { display: flex; gap: 16px; justify-content: center; }

    @media (max-width: 768px) {
      .header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header-actions { flex-direction: column; width: 100%; }
      .header-actions button { width: 100%; }
      .header h1 { font-size: 24px; }
      .gallery-root { gap: 24px; }
      .grid { grid-template-columns: 1fr; }
      .empty-state { height: 320px; padding: 20px; }
      .empty-actions { flex-direction: column; width: 100%; }
      .empty-actions button { width: 100%; }
    }
  `]
})
export class SignatureGalleryComponent implements OnInit {
  private sigService = inject(SignatureService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  signatures = signal<SignatureImage[]>([]);

  ngOnInit() {
    this.loadSignatures();
  }

  loadSignatures() {
    this.sigService.getSignaturesByUser(this.auth.currentUserId()).subscribe(sigs => {
      this.signatures.set(sigs);
    });
  }

  openCreator() {
    const dialogRef = this.dialog.open(SignaturePadComponent, {
      width: '500px',
      panelClass: 'glass-panel-dialog'
    });

    dialogRef.componentInstance.signatureSaved.subscribe(blob => {
      this.sigService.uploadSignature(blob, this.auth.currentUserId()).subscribe(() => {
        this.loadSignatures();
        dialogRef.close();
      });
    });
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.sigService.uploadSignature(file, this.auth.currentUserId()).subscribe(() => {
        this.loadSignatures();
        input.value = ''; // Reset the input
      });
    }
  }
}
