import { Component, inject, signal, OnInit, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SignatureService } from '../../core/services/signature.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { DialogService } from '../../core/services/dialog.service';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { SignatureImage } from '../../core/models/signature.model';

@Component({
  selector: 'app-signature-gallery',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="gallery-root">
      <header class="header">
        <div>
          <div class="back-link" *ngIf="isManagingOther()" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> {{ 'common.back' | translate }}
          </div>
          <h1>{{ title() }}</h1>
          <p>{{ subtitle() }}</p>
        </div>
        <div class="header-actions">
          <input
            type="file"
            #fileInput
            hidden
            accept="image/png, image/jpeg"
            (change)="uploadFile($event)"
          />
          <button
            mat-stroked-button
            color="primary"
            (click)="fileInput.click()"
            [disabled]="!canCreate()"
            [matTooltip]="
              !canCreate()
                ? 'Ya posee una firma registrada. Deberá eliminarla para cargar una nueva.'
                : ''
            "
          >
            <mat-icon>upload</mat-icon> {{ 'signatures.upload' | translate }}
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="openCreator()"
            [disabled]="!canCreate()"
            [matTooltip]="!canCreate() ? 'Ya posee una firma registrada.' : ''"
          >
            <mat-icon>draw</mat-icon> {{ 'signatures.draw' | translate }}
          </button>
        </div>
      </header>
      <div class="gallery-content">
        <div class="loader-overlay" *ngIf="isLoading()">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ 'common.loading' | translate }}</p>
        </div>

        <div class="grid" *ngIf="!isLoading()">
          <mat-card
            *ngFor="let sig of signatures()"
            class="sig-card glass-panel"
            [class.inactive]="!sig.isActive"
          >
            <div class="sig-preview">
              <img [src]="sig.imageUrl" alt="Firma" />
              <div class="inactive-overlay" *ngIf="!sig.isActive">INACTIVA</div>
            </div>
            <mat-card-content>
              <div class="sig-meta">
                <div class="m-item"><strong>Propietario:</strong> {{ ownerName() }}</div>
                <div class="m-item"><strong>Versión:</strong> {{ sig.version }}</div>
                <div class="m-item">
                  <strong>Fecha:</strong> {{ sig.createdAt | date: 'shortDate' }}
                </div>
                <div class="m-item">
                  <strong>Dimensiones:</strong> {{ sig.metadata.width }}x{{ sig.metadata.height }}
                </div>
                <div class="m-item"><strong>Formato:</strong> {{ sig.format }}</div>
              </div>
            </mat-card-content>
            <mat-card-actions align="end" *ngIf="isAdmin()">
              <button mat-button color="warn" *ngIf="sig.isActive" (click)="toggleStatus(sig)">
                DESACTIVAR
              </button>
              <button mat-button color="accent" *ngIf="!sig.isActive" (click)="toggleStatus(sig)">
                ACTIVAR
              </button>
              <button mat-button color="warn" (click)="deleteSignature(sig)">ELIMINAR</button>
              <button mat-button color="primary" (click)="openCreator()">NUEVA VERSIÓN</button>
            </mat-card-actions>
          </mat-card>

          <div class="empty-state" *ngIf="signatures().length === 0">
            <mat-icon>gesture</mat-icon>
            <h3>No hay firmas registradas</h3>
            <p>Registre una firma para comenzar a firmar documentos.</p>
            <div class="empty-actions">
              <button mat-stroked-button color="primary" (click)="fileInput.click()">
                <mat-icon>upload</mat-icon> CARGAR FIRMA
              </button>
              <button mat-raised-button color="primary" (click)="openCreator()">
                <mat-icon>draw</mat-icon> DIBUJAR FIRMA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .back-link {
        cursor: pointer;
        color: var(--primary-color);
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      .back-link:hover {
        text-decoration: underline;
        opacity: 0.8;
      }

      .gallery-root {
        display: flex;
        flex-direction: column;
        gap: 40px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .header h1 {
        font-size: 36px;
        font-weight: 900;
        margin-bottom: 4px;
        color: var(--accent-color);
      }
      .header p {
        color: var(--text-muted);
        font-size: 15px;
        font-weight: 500;
      }
      .header-actions {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .gallery-content {
        position: relative;
        min-height: 400px;
      }

      .loader-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.7);
        z-index: 10;
        gap: 16px;
        border-radius: 24px;
      }
      .loader-overlay p {
        font-weight: 800;
        color: var(--accent-color);
        letter-spacing: 0.5px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 32px;
      }
      .sig-card {
        overflow: hidden;
        border: 1px solid var(--border-color);
        background: white;
        border-radius: 16px;
        padding: 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
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
      .sig-preview img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .sig-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 20px;
        font-size: 12px;
      }
      .m-item strong {
        color: var(--text-muted);
        font-weight: 600;
        margin-right: 4px;
      }
      .m-item {
        color: var(--text-color);
        font-weight: 700;
      }

      mat-card-actions {
        padding: 8px 16px 16px !important;
      }
      mat-card-actions button {
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.5px;
      }

      .inactive {
        opacity: 0.6;
        grayscale: 100%;
      }
      .inactive-overlay {
        position: absolute;
        background: var(--accent-color);
        color: white;
        padding: 6px 14px;
        font-size: 11px;
        font-weight: 900;
        border-radius: 8px;
      }

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
      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--primary-color);
        opacity: 0.5;
        margin-bottom: 24px;
      }
      .empty-state h3 {
        font-size: 20px;
        font-weight: 800;
        color: var(--accent-color);
        margin-bottom: 8px;
      }
      .empty-state p {
        color: var(--text-muted);
        margin-bottom: 16px;
        font-weight: 500;
      }
      .empty-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
      }

      @media (max-width: 768px) {
        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }
        .header-actions {
          flex-direction: column;
          width: 100%;
        }
        .header-actions button {
          width: 100%;
        }
        .header h1 {
          font-size: 24px;
        }
        .gallery-root {
          gap: 24px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .empty-state {
          height: 320px;
          padding: 20px;
        }
        .empty-actions {
          flex-direction: column;
          width: 100%;
        }
        .empty-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class SignatureGalleryComponent implements OnInit {
  private sigService = inject(SignatureService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);

  userIdInput = input<string | undefined>(undefined, { alias: 'userId' });

  effectiveUserId = computed(() => {
    const inputId = this.userIdInput();
    return inputId && this.auth.isAdmin() ? inputId : this.auth.currentUserId();
  });

  isAdmin = computed(() => this.auth.isAdmin());

  isManagingOther = computed(() => this.effectiveUserId() !== this.auth.currentUserId());

  title = computed(() =>
    this.isManagingOther()
      ? this.translate.instant('signatures.manageUser')
      : this.translate.instant('signatures.mySignatures'),
  );
  subtitle = computed(() =>
    this.isManagingOther()
      ? this.translate.instant('signatures.userSubtitle')
      : this.translate.instant('signatures.subtitle'),
  );

  canCreate = computed(() => {
    if (this.auth.isAdmin()) return true;
    return this.signatures().length === 0;
  });

  signatures = signal<SignatureImage[]>([]);
  ownerName = signal<string>('Cargando...');
  isLoading = signal(true);

  ngOnInit() {
    this.loadSignatures();
    this.loadOwnerName();
  }

  loadOwnerName() {
    if (this.isManagingOther()) {
      this.userService.getUserById(this.effectiveUserId()).subscribe((user) => {
        this.ownerName.set(user?.name || 'Desconocido');
      });
    } else {
      this.ownerName.set(this.auth.currentUser()?.name || 'Mi Firma');
    }
  }

  loadSignatures() {
    this.isLoading.set(true);
    this.sigService
      .getSignaturesByUser(this.effectiveUserId())
      .subscribe((sigs: SignatureImage[]) => {
        this.signatures.set(sigs);
        this.isLoading.set(false);
      });
  }

  openCreator() {
    const dialogRef = this.dialog.open(SignaturePadComponent, {
      width: '500px',
      panelClass: 'glass-panel-dialog',
    });

    dialogRef.componentInstance.signatureSaved.subscribe((blob) => {
      this.sigService.uploadSignature(blob, this.effectiveUserId()).subscribe(() => {
        this.loadSignatures();
        dialogRef.close();
      });
    });
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isLoading.set(true);
      this.sigService.uploadSignature(file, this.effectiveUserId()).subscribe(() => {
        this.loadSignatures();
        input.value = ''; // Reset the input
      });
    }
  }

  toggleStatus(sig: SignatureImage) {
    this.isLoading.set(true);
    this.sigService.toggleActive(sig.id, sig.userId, !sig.isActive).subscribe(() => {
      this.loadSignatures();
    });
  }

  deleteSignature(sig: SignatureImage) {
    this.dialogService
      .confirm(
        '¿Eliminar Firma?',
        '¿Está seguro de eliminar esta firma? Esta acción no se puede deshacer y afectará a los documentos que aún no se han sellado.',
        'Eliminar',
        'Cancelar',
      )
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isLoading.set(true);
          this.sigService.deleteSignature(sig.id).subscribe(() => {
            this.loadSignatures();
          });
        }
      });
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
