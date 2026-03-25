import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { PdfGeneratorService } from '../../../core/services/pdf-generator.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-document-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    StatusBadgeComponent,
    DateFormatPipe,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="history-root" *ngIf="doc()">
      <header class="history-header">
        <div class="h-main">
          <button mat-icon-button routerLink="/documents"><mat-icon>arrow_back</mat-icon></button>
          <h1>
            {{
              doc()
                ? ('documents.historyTitle' | translate) + doc()?.title
                : ('common.loading' | translate)
            }}
          </h1>
        </div>
        <div class="h-actions">
          <button
            mat-raised-button
            color="primary"
            *ngIf="doc()?.status === 'COMPLETED' || doc()?.status === 'PRINTED'"
            (click)="downloadDocument()"
            [disabled]="isGeneratingPdf()"
            [class.generating]="isGeneratingPdf()"
          >
            <mat-spinner diameter="20" *ngIf="isGeneratingPdf()" color="accent"></mat-spinner>
            <mat-icon *ngIf="!isGeneratingPdf()">download</mat-icon>
            {{
              isGeneratingPdf()
                ? ('common.generating' | translate)
                : ('documents.downloadFinal' | translate)
            }}
          </button>
        </div>
      </header>

      <div class="history-grid">
        <section class="timeline-section glass-panel">
          <h3>{{ 'documents.timeline' | translate }}</h3>
          <div class="timeline">
            <div class="timeline-item" *ngFor="let audit of timeline()">
              <div class="t-icon" [ngClass]="audit.action.toLowerCase()">
                <mat-icon>{{ getActionIcon(audit.action) }}</mat-icon>
              </div>
              <div class="t-content">
                <div class="t-header">
                  <strong>{{ audit.userName }}</strong>
                  <span class="t-date">{{ audit.timestamp | dateFormat: 'Pp' }}</span>
                </div>
                <p>{{ audit.detail }}</p>
                <div class="t-version" *ngIf="audit.newVersion">
                  {{ 'documents.version' | translate }} {{ audit.newVersion }}
                </div>
              </div>
            </div>
            <div *ngIf="timeline().length === 0 && !isLoading()" class="empty-timeline">
              {{ 'documents.noEvents' | translate }}
            </div>
          </div>
        </section>

        <aside class="details-aside">
          <mat-card class="signer-card glass-panel">
            <h3>{{ 'documents.signatureStatuses' | translate }}</h3>
            <div class="signer-status" *ngFor="let s of doc()?.assignedSigners">
              <div class="s-info">
                <div class="s-name">{{ s.userName }}</div>
                <div class="s-comp">{{ s.empresa }}</div>
              </div>
              <app-status-badge [status]="s.status"></app-status-badge>
            </div>
          </mat-card>

          <mat-card class="info-card glass-panel">
            <h3>{{ 'documents.metadata' | translate }}</h3>
            <div class="meta-row">
              <span>{{ 'documents.code' | translate }}:</span>
              <code>{{ doc()?.documentCode }}</code>
            </div>
            <div class="meta-row">
              <span>{{ 'documents.version' | translate }}:</span> {{ doc()?.version }}
            </div>
            <div class="meta-row">
              <span>{{ 'documents.creator' | translate }}:</span> {{ doc()?.createdByName }}
            </div>
            <div class="meta-row">
              <span>{{ 'common.date' | translate }}:</span> {{ doc()?.createdAt | dateFormat }}
            </div>
          </mat-card>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .history-root {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .h-main {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .h-main h1 {
        font-size: 28px;
        font-weight: 900;
        margin: 0;
        color: var(--accent-color);
      }

      .history-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 32px;
      }
      .timeline-section {
        padding: 40px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 20px;
      }
      .timeline-section h3 {
        margin-bottom: 32px;
        font-size: 18px;
        font-weight: 800;
        color: var(--accent-color);
      }

      .timeline {
        position: relative;
        padding-left: 20px;
      }
      .timeline::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e2e8f0;
      }

      .timeline-item {
        position: relative;
        padding-bottom: 40px;
        padding-left: 24px;
      }
      .t-icon {
        position: absolute;
        left: -14px;
        width: 28px;
        height: 28px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid #e2e8f0;
        z-index: 2;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
      .t-icon mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .t-icon.created {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: #fff7ed;
      }
      .t-icon.signed {
        border-color: #22c55e;
        color: #22c55e;
        background: #f0fdf4;
      }
      .t-icon.commented {
        border-color: var(--accent-color);
        color: var(--accent-color);
        background: #f8fafc;
      }

      .t-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .t-header strong {
        font-size: 15px;
        font-weight: 800;
        color: var(--accent-color);
      }
      .t-date {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
      }
      .t-content p {
        font-size: 14px;
        margin: 0;
        color: var(--text-color);
        line-height: 1.5;
        font-weight: 500;
      }
      .t-version {
        display: inline-block;
        margin-top: 12px;
        padding: 4px 10px;
        background: #f1f5f9;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        color: var(--accent-color);
      }

      .details-aside {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .details-aside mat-card {
        padding: 32px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 20px;
        box-shadow: none;
      }
      .details-aside h3 {
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 24px;
        color: var(--accent-color);
      }

      .signer-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
      }
      .signer-status:last-child {
        border-bottom: none;
      }
      .s-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-color);
      }
      .s-comp {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 500;
        padding: 10px 0;
        border-bottom: 1px solid #f8fafc;
      }
      .meta-row:last-child {
        border-bottom: none;
      }
      .meta-row span {
        color: var(--text-muted);
      }
      .meta-row code {
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 11px;
      }

      @media (max-width: 1000px) {
        .history-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .h-main {
          align-items: flex-start;
        }
        .h-main button {
          flex-shrink: 0;
          margin-top: -4px;
        }
        .history-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }
        .h-actions,
        .h-actions button {
          width: 100%;
        }
        .h-main h1 {
          font-size: 20px;
        }
        .timeline-section {
          padding: 24px;
        }
        .details-aside mat-card {
          padding: 24px;
        }
        .history-root {
          gap: 16px;
        }
        .t-content p {
          font-size: 13px;
        }
      }
    `,
  ],
})
export class DocumentHistoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private docService = inject(DocumentService);
  private pdfGenService = inject(PdfGeneratorService);
  private auth = inject(AuthService);

  doc = signal<any>(null);
  isAdmin = this.auth.isAdmin;
  isLoading = signal(true);
  isGeneratingPdf = signal(false);

  timeline = computed(() => {
    const d = this.doc();
    if (!d) return [];

    const events: any[] = [];

    // 1. Creation event
    events.push({
      userName: d.createdByName || 'Sistema',
      action: 'CREATED',
      timestamp: d.createdAt,
      detail: `Creó el documento ${d.documentCode}`,
    });

    // 2. Signature events
    d.assignedSigners.forEach((s: any) => {
      if (s.status === 'SIGNED' && s.signedAt) {
        const pages = s.placements?.map((p: any) => p.page) || [s.pageNumber];
        const uniquePages = [...new Set(pages)].sort((a: any, b: any) => a - b);
        events.push({
          userName: s.userName,
          action: 'SIGNED',
          timestamp: s.signedAt,
          detail: `Posicionó ${s.placements?.length || 1} firma(s) en la(s) página(s): ${uniquePages.join(', ')}`,
        });
      }
    });

    // 3. Comment events
    d.comments.forEach((c: any) => {
      events.push({
        userName: c.userName,
        action: 'COMMENTED',
        timestamp: c.createdAt,
        detail: c.content,
      });
    });

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.docService.getDocumentById(id).subscribe((d) => {
        this.doc.set(d);
        this.isLoading.set(false);
      });
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'SIGNED':
        return 'draw';
      case 'CREATED':
        return 'add_circle';
      case 'COMMENTED':
        return 'chat';
      default:
        return 'info';
    }
  }

  downloadDocument() {
    const d = this.doc();
    if (!d) return;

    this.isGeneratingPdf.set(true);

    this.pdfGenService.generateSignedPdf(this.doc()).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${d.documentCode || 'Documento'}_Firmado.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        this.isGeneratingPdf.set(false);

        if (d.status === 'COMPLETED' && this.isAdmin()) {
          this.docService.markAsPrinted(d.id).subscribe((updated) => {
            this.doc.set(updated);
          });
        }
      },
      error: (err) => {
        console.error('Error generating PDF', err);
        this.isGeneratingPdf.set(false);
      },
    });
  }
}
