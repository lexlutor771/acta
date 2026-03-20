import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentService } from '../../../core/services/document.service';
import { SignatureService } from '../../../core/services/signature.service';
import { AuthService } from '../../../core/auth/auth.service';
import { DocumentsState } from '../../../documents.state';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { SignatureImage } from '../../../core/models/signature.model';

@Component({
  selector: 'app-document-sign',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    PdfViewerComponent,
    SignaturePadComponent,
    StatusBadgeComponent,
    DateFormatPipe
  ],
  template: `
    <div class="sign-root">
      <header class="sign-header">
        <div class="header-main">
          <button mat-icon-button routerLink="/documents"><mat-icon>arrow_back</mat-icon></button>
          <div class="header-titles" *ngIf="doc()">
            <h1>{{ doc()?.title }}</h1>
            <div class="meta">
              <code class="code">{{ doc()?.documentCode }}</code>
              <span class="divider">•</span>
              <span>Reunión #{{ doc()?.meetingNumber }}</span>
              <span class="divider">•</span>
              <span>{{ doc()?.meetingDate | dateFormat:'PPP' }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions" *ngIf="doc()">
          <app-status-badge [status]="doc()!.status"></app-status-badge>
          <button mat-raised-button color="accent" (click)="saveSignature()" [disabled]="!canConfirm() || loading()">
            {{ loading() ? 'GUARDANDO...' : 'CONFIRMAR FIRMA' }}
          </button>
        </div>
      </header>

      <div class="sign-layout" *ngIf="doc()">
        <div class="pdf-panel">
          <app-pdf-viewer 
            [src]="doc()!.currentPdfUrl" 
            [signatures]="doc()!.assignedSigners"
            [extraSignatures]="doc()!.extraSignatures || []"
            [signingMode]="step() === 3"
            (coordinateSelected)="onPositionSelected($event)">
            
            <!-- Draggable Ghost for new signature -->
            <div *ngIf="step() === 3 && selectedPosition()" 
                 class="selected-position-ghost"
                 [style.left.%]="selectedPosition()!.x"
                 [style.top.%]="selectedPosition()!.y"
                 [style.transform]="'translate(-50%, -50%) scale(' + signatureScale() + ')'">
              <img [src]="mySignature()?.imageUrl" alt="Ghost Signature">
            </div>
          </app-pdf-viewer>
        </div>

        <aside class="side-panel glass-panel">
          <mat-tab-group class="side-tabs">
            <mat-tab label="FIRMAR">
              <div class="signing-workflow">
                <div class="step" [class.active]="step() === 1">
                  <div class="step-num">1</div>
                  <div class="step-content">
                    <h4>Seleccionar Firma</h4>
                    <div class="saved-signatures-grid" *ngIf="userSignatures().length > 0">
                      <div class="signature-card" 
                           *ngFor="let sig of userSignatures()"
                           [class.selected]="sig.id === mySignature()?.id"
                           (click)="mySignature.set(sig); step.set(3)">
                        <img [src]="sig.imageUrl" alt="Firma guardada">
                        <div class="badge" *ngIf="sig.id === mySignature()?.id"><mat-icon>check</mat-icon></div>
                      </div>
                    </div>
                    <div class="actions" *ngIf="isAdmin()">
                      <button mat-stroked-button (click)="step.set(2)">
                        <mat-icon>add</mat-icon> NUEVA FIRMA
                      </button>
                    </div>
                  </div>
                </div>

                <div class="step" [class.active]="step() === 2" *ngIf="step() === 2">
                  <div class="step-num">2</div>
                  <div class="step-content">
                    <h4>Dibujar Nueva Firma</h4>
                    <p class="instruction">Dibuja tu firma en el recuadro para guardarla y usarla.</p>
                    <app-signature-pad (signatureSaved)="onSignatureCreated($event)"></app-signature-pad>
                    <button mat-button (click)="step.set(1)" class="mt-2">CANCELAR</button>
                  </div>
                </div>

                <div class="step" [class.active]="step() === 3">
                  <div class="step-num">3</div>
                  <div class="step-content">
                    <h4>Posicionar en PDF</h4>
                    <p class="instruction">Haz clic sobre el visor PDF para estampar la firma seleccionada.</p>
                    <div class="coords-box" *ngIf="selectedPosition()">
                      <mat-icon color="primary">location_on</mat-icon>
                      <span>Página {{ selectedPosition()!.page }}, X: {{ selectedPosition()!.x.toFixed(1) }}%, Y: {{ selectedPosition()!.y.toFixed(1) }}%</span>
                    </div>

                    <div class="scale-control" *ngIf="selectedPosition()">
                      <label>Tamaño de firma: {{ (signatureScale() * 100) | number:'1.0-0' }}%</label>
                      <input type="range" class="scale-slider" min="0.3" max="2" step="0.1" [value]="signatureScale()" (input)="onScaleChange($event)">
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="DETALLE">
              <div class="doc-details">
                <section>
                  <h5>Ubicación</h5>
                  <p>{{ doc()?.location }}</p>
                </section>
                <section>
                  <h5>Tipo de Reunión</h5>
                  <p>{{ doc()?.meetingType }}</p>
                </section>
                <section>
                  <h5>Firmantes Asignados</h5>
                  <div class="signer-list">
                    <div class="signer" *ngFor="let s of doc()?.assignedSigners">
                      <mat-icon [color]="s.status === 'SIGNED' ? 'primary' : 'disabled'">
                        {{ s.status === 'SIGNED' ? 'check_circle' : 'pending' }}
                      </mat-icon>
                      <div class="s-info">
                        <span>{{ s.userName }}</span>
                        <small>{{ s.empresa }}</small>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </mat-tab>

            <mat-tab label="CHAT">
              <div class="comments-section">
                <div class="history">
                  <div class="comment" *ngFor="let c of doc()?.comments">
                    <strong>{{ c.userName }}</strong>
                    <p>{{ c.content }}</p>
                    <span>{{ c.createdAt | date:'short' }}</span>
                  </div>
                </div>
                <div class="comment-input">
                  <mat-form-field appearance="outline">
                    <input matInput placeholder="Escribir comentario..." #commentText>
                  </mat-form-field>
                  <button style="border-radius: 4px;" mat-mini-fab color="primary" (click)="addComment(commentText.value); commentText.value='' ">
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .sign-root { min-height: calc(100vh - 120px); display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; }
    .sign-header { display: flex; justify-content: space-between; align-items: center; }
    .header-main { display: flex; align-items: center; gap: 12px; }
    .header-titles h1 { font-size: 24px; font-weight: 900; margin: 0; color: var(--accent-color); }
    .meta { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .meta code { background: #f1f5f9; color: var(--accent-color); padding: 4px 8px; border-radius: 6px; font-weight: 700; }
    .meta .divider { opacity: 0.3; }
    .header-actions { display: flex; align-items: center; gap: 16px; }

    .sign-layout { flex: 1; display: grid; grid-template-columns: 1fr 380px; gap: 32px; overflow: visible; }
    .pdf-panel { height: 100%; border-radius: 20px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.02); min-height: 500px; display: flex; flex-direction: column; }
    .side-panel { display: flex; flex-direction: column; min-height: 600px; border: 1px solid var(--border-color); background: white; }
    .side-tabs { height: 100%; display: flex; flex-direction: column; }
    ::ng-deep .mat-mdc-tab-body-wrapper { flex: 1; overflow-y: auto; }
    ::ng-deep .mat-mdc-tab-header { border-bottom: 1px solid var(--border-color); }

    .signing-workflow { padding: 32px; display: flex; flex-direction: column; gap: 40px; }
    .saved-signatures-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .signature-card { 
      position: relative; border: 2px solid var(--border-color); border-radius: 12px; padding: 12px; 
      cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: white;
      display: flex; align-items: center; justify-content: center; min-height: 80px;
    }
    .signature-card:hover { border-color: var(--primary-color); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .signature-card.selected { border-color: var(--primary-color); background: rgba(255, 122, 41, 0.02); box-shadow: 0 4px 20px rgba(255, 122, 41, 0.15); }
    .signature-card img { max-width: 100%; max-height: 60px; filter: grayscale(1) opacity(0.8); transition: all 0.2s; }
    .signature-card.selected img { filter: grayscale(0) opacity(1); }
    .signature-card .badge { position: absolute; top: -8px; right: -8px; background: var(--primary-color); color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .signature-card .badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .actions { margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; justify-content: center; }
    .mt-2 { margin-top: 12px; }

    .step { display: flex; gap: 20px; opacity: 0.45; transition: all 0.3s ease; }
    .step.active { opacity: 1; }
    .step-num { width: 32px; height: 32px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: var(--accent-color); }
    .step.active .step-num { background: var(--primary-color); color: white; box-shadow: 0 4px 10px rgba(255, 122, 41, 0.3); }
    .step h4 { font-size: 15px; font-weight: 800; margin-bottom: 8px; color: var(--accent-color); }
    .step-content { flex: 1; }
    .instruction { font-size: 13px; line-height: 1.6; color: var(--text-muted); font-weight: 500; }

    .doc-details { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
    .doc-details h5 { font-size: 11px; text-transform: uppercase; color: var(--primary-color); margin-bottom: 4px; }
    .signer-list { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
    .signer { display: flex; align-items: center; gap: 12px; }
    .s-info { display: flex; flex-direction: column; }
    .s-info span { font-size: 13px; font-weight: 600; }
    .s-info small { font-size: 11px; opacity: 0.5; }

    .comments-section { height: 100%; display: flex; flex-direction: column; }
    .history { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; background: #fafafa; }
    .comment { background: white; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .comment strong { font-size: 12px; display: block; margin-bottom: 4px; color: var(--accent-color); }
    .comment p { font-size: 13px; margin: 0 0 4px; }
    .comment span { font-size: 10px; opacity: 0.3; }
    .comment-input { padding: 16px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; align-items: center; background: white; }
    .comment-input mat-form-field { flex: 1; margin-bottom: -1.25em; }

    .selected-position-ghost { position: absolute; z-index: 10; pointer-events: none; opacity: 0.8; transform-origin: center; transition: transform 0.1s linear; }
    .selected-position-ghost img { max-width: 140px; max-height: 70px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }

    .scale-control { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); }
    .scale-control label { font-size: 11px; font-weight: 800; color: var(--accent-color); text-transform: uppercase; }
    .scale-slider { width: 100%; accent-color: var(--primary-color); }

    @media (max-width: 1000px) {
      .sign-layout { grid-template-columns: 1fr; overflow: auto; }
      .side-panel { height: auto; }
    }

    @media (max-width: 768px) {
      .header-main { align-items: flex-start; gap: 8px; }
      .header-main button { flex-shrink: 0; margin-top: -6px; margin-left: -8px; }
      .sign-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header-actions { width: 100%; justify-content: flex-start; }
      .header-actions button { width: 100%; }
      .meta { flex-wrap: wrap; }
      .header-titles h1 { font-size: 20px; line-height: 1.3; margin-top: 2px; }
      .pdf-panel { min-height: 400px; border-radius: 12px; }
      .side-panel { min-height: auto; }
      .sign-root { padding-bottom: 20px; gap: 16px; }
      .signing-workflow { padding: 20px; gap: 24px; }
      .doc-details, .comment-input, .history { padding: 16px; }
    }

    @media (max-width: 640px) {
      .sign-root { min-height: auto; padding-bottom: 16px; }
      .sign-header { padding: 0 12px; }
      .header-actions { flex-direction: column; align-items: stretch; gap: 12px; }
      .header-actions button { width: 100%; }
      .sign-layout { grid-template-columns: 1fr; gap: 16px; }
      .pdf-panel { min-height: 320px; border-radius: 12px; }
      .side-panel { min-height: auto; border-radius: 12px; }
      .signing-workflow { padding: 16px; gap: 18px; }
      .saved-signatures-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
      .comment-input { flex-direction: column; align-items: stretch; }
      .comment-input button { width: 100%; margin-top: 8px; }
    }
  `]
})
export class DocumentSignComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private docService = inject(DocumentService);
  private sigService = inject(SignatureService);
  private snack = inject(MatSnackBar);

  doc = signal<any>(null);
  userSignatures = signal<SignatureImage[]>([]);
  mySignature = signal<SignatureImage | null>(null);
  step = signal(1);
  loading = signal(false);

  isAdmin = computed(() => this.auth.isAdmin());

  selectedPosition = signal<{ x: number, y: number, page: number } | null>(null);
  signatureScale = signal<number>(1);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.docService.getDocumentById(id).subscribe(d => this.doc.set(d));
    }

    const userId = this.auth.currentUserId();
    if (userId) {
      this.sigService.getSignaturesByUser(userId).pipe(
        map(sigs => sigs.filter(s => s.isActive))
      ).subscribe(sigs => {
        this.userSignatures.set(sigs);
        if (sigs.length > 0) {
          this.mySignature.set(sigs[0]);
          this.step.set(1); // Stay on step 1 to show selection
        } else {
          this.step.set(2); // No signature, go to drawing
        }
      });
    }
  }

  canSign(): boolean {
    const d = this.doc();
    if (!d) return false;
    const userId = this.auth.currentUserId();
    // Allow signing if the user is in the assigned list (even if already signed)
    return d.assignedSigners.some((s: any) => s.userId === userId);
  }

  onPositionSelected(pos: { x: number, y: number, page: number }) {
    if (!this.canSign()) return;
    this.selectedPosition.set(pos);
  }

  onScaleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.signatureScale.set(parseFloat(input.value));
  }

  onSignatureCreated(blob: Blob) {
    this.sigService.uploadSignature(blob, this.auth.currentUserId()).subscribe(sig => {
      this.mySignature.set(sig);
      this.step.set(3);
    });
  }

  canConfirm(): boolean {
    return !!this.mySignature() && !!this.selectedPosition() && this.canSign();
  }

  saveSignature() {
    if (!this.canConfirm()) return;

    this.loading.set(true);
    const pos = this.selectedPosition()!;

    this.docService.signDocument(this.doc()!.id, {
      ...pos,
      signatureImageId: this.mySignature()!.imageUrl,
      userId: this.auth.currentUserId(),
      scale: this.signatureScale()
    }).subscribe({
      next: (updated) => {
        this.doc.set(updated);
        this.loading.set(false);
        this.snack.open('Documento firmado con éxito', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/documents']);
      },
      error: () => this.loading.set(false)
    });
  }

  addComment(content: string) {
    if (!content.trim()) return;
    const user = this.auth.currentUser();
    this.docService.addComment(this.doc()!.id, content, user!.id, user!.name).subscribe(newComment => {
      this.doc.update(d => ({ ...d, comments: [newComment, ...d.comments] }));
    });
  }
}
