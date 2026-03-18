import { Component, Input, Output, EventEmitter, signal, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule, PdfViewerComponent as Ng2PdfViewer } from 'ng2-pdf-viewer';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocumentSigner, SignatureSlot } from '../../../core/models/document.model';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule, MatProgressBarModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pdf-container">
      <div class="pdf-controls" *ngIf="showControls">
        <div class="page-nav">
          <button mat-icon-button (click)="prevPage()" [disabled]="page === 1">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button mat-icon-button (click)="nextPage()" [disabled]="page === totalPages">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
        <div class="zoom-controls">
          <button mat-icon-button (click)="zoomOut()" [disabled]="signingMode">
            <mat-icon>remove</mat-icon>
          </button>
          <span>{{ signingMode ? 'AFINADO' : (zoom * 100).toFixed(0) + '%' }}</span>
          <button mat-icon-button (click)="zoomIn()" [disabled]="signingMode">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <div class="viewer-wrapper" [class.signing-mode]="signingMode" #viewerWrapper>
        <div class="pdf-content-container" [class.signing-mode]="signingMode" (click)="onDropTargetClick($event)">
          <pdf-viewer
            [src]="src"
            [render-text]="true"
            [original-size]="false"
            [fit-to-page]="signingMode"
            [show-all]="false"
            [(page)]="page"
            [zoom]="signingMode ? 1 : zoom"
            [autoresize]="true"
            (after-load-complete)="onLoadComplete($event)"
            class="pdf-viewer"
            [class.signing-mode]="signingMode"
          ></pdf-viewer>

          <!-- Signature Overlays (Assigned) - Relative to PDF content -->
          <ng-container *ngFor="let signer of signatures">
              <div *ngIf="signer.pageNumber === page && signer.status === 'SIGNED'"
                   class="signature-overlay"
                   [style.left.%]="signer.positionX"
                   [style.top.%]="signer.positionY"
                   [style.transform]="'translate(-50%, -50%) scale(' + (signer.scale || 1) + ')'">
                <img [src]="signer.signatureImageId" alt="Firma">
                <div class="signature-info">{{ signer.userName }}</div>
              </div>
          </ng-container>

          <!-- Extra Signatures (Multiple signatures per user) -->
          <ng-container *ngFor="let extra of extraSignatures">
              <div *ngIf="extra.pageNumber === page"
                   class="signature-overlay"
                   [style.left.%]="extra.positionX"
                   [style.top.%]="extra.positionY"
                   [style.transform]="'translate(-50%, -50%) scale(' + (extra.scale || 1) + ')'">
                <img [src]="extra.signatureImageId" alt="Firma Extra">
                <div class="signature-info">{{ extra.userName }}</div>
              </div>
          </ng-container>

          <!-- Signature Slot Suggestions -->
          <ng-container *ngFor="let slot of slots">
              <div *ngIf="slot.pageNumber === page"
                   class="slot-overlay"
                   [style.left.%]="slot.positionX"
                   [style.top.%]="slot.positionY">
                <div class="slot-label">{{ slot.empresa }}</div>
              </div>
          </ng-container>

          <!-- Host for projected signature ghost -->
          <div class="ghost-anchor">
            <ng-content></ng-content>
          </div>
        </div>
      </div>

      <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pdf-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
    }
    .pdf-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: white;
      border-bottom: 1px solid var(--border-color);
      z-index: 10;
      box-shadow: 0 4px 6px -2px rgba(0,0,0,0.03);
    }
    .page-nav, .zoom-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      font-weight: 800;
      color: var(--accent-color);
    }
    .viewer-wrapper {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      display: block; /* Changed from flex to block to fix top-cutoff scrolling bug */
      padding: 40px;
      text-align: center;
      background: #e2e8f0;
      min-height: 500px;
      box-sizing: border-box;
    }
    .viewer-wrapper.signing-mode {
      overflow: hidden;
      padding: 24px;
      display: flex;
      align-items: stretch;
      justify-content: center;
    }
    .pdf-content-container {
      position: relative;
      display: inline-block;
      margin: 0 auto;
      width: 100%;
      max-width: 1000px;
      min-height: 600px;
      background: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
      text-align: left;
      touch-action: pan-y; /* Allow vertical scroll on touch while still handling clicks */
    }
    .pdf-content-container.signing-mode {
      min-height: 0;
      // max-height: calc(100vh - 160px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
      cursor: crosshair;
    }
    .pdf-viewer {
      display: block;
      width: 100%;
      height: auto;
      min-height: 600px;
      border-radius: 4px;
    }
    .pdf-viewer.signing-mode {
      min-height: 0;
      height: 100%;
      width: 100%;
    }
    .signature-overlay {
      position: absolute;
      pointer-events: none;
      z-index: 5;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .signature-overlay img {
      max-width: 140px;
      max-height: 70px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    .signature-info {
      font-size: 9px;
      font-weight: 800;
      background: var(--accent-color);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .slot-overlay {
      position: absolute;
      width: 140px;
      height: 70px;
      border: 2px dashed var(--primary-color);
      opacity: 0.3;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      background: rgba(255, 122, 41, 0.05);
      border-radius: 8px;
    }
    .slot-label {
      font-size: 10px;
      color: var(--primary-color);
      font-weight: 900;
      text-transform: uppercase;
    }
    .ghost-anchor {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 6;
    }
    ::ng-deep .pdf-content-container.signing-mode .ng2-pdf-viewer-container {
      overflow-x: inherit !important;
      position: inherit !important;
    }
    mat-progress-bar { position: absolute; bottom: 0; left: 0; right: 0; }
  `]
})
export class PdfViewerComponent implements OnChanges {
  @Input() src: any;
  @Input() signatures: DocumentSigner[] = [];
  @Input() extraSignatures: DocumentSigner[] = [];
  @Input() slots: SignatureSlot[] = [];
  @Input() signingMode = false;
  @Input() showControls = true;

  @Output() pageChanged = new EventEmitter<number>();
  @Output() coordinateSelected = new EventEmitter<{ x: number, y: number, page: number }>();

  page = 1;
  totalPages = 0;
  zoom = 1.0;
  loading = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['signingMode'] && changes['signingMode'].currentValue === true) {
      this.zoom = 1.0;
    }
  }

  onLoadComplete(pdf: any) {
    this.totalPages = pdf.numPages;
    this.loading = false;
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.pageChanged.emit(this.page);
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.pageChanged.emit(this.page);
    }
  }

  zoomIn() {
    this.zoom += 0.1;
  }

  zoomOut() {
    if (this.zoom > 0.5) {
      this.zoom -= 0.1;
    }
  }

  onDropTargetClick(event: MouseEvent) {
    if (!this.signingMode) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.coordinateSelected.emit({ x, y, page: this.page });
  }
}
