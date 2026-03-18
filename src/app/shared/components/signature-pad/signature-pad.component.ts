import { Component, ElementRef, EventEmitter, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="signature-container">
      <div class="signature-header">
        <span>Firme dentro del cuadro blanco</span>
        <button mat-icon-button (click)='clear()' title="Limpiar">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>
      
      <div class="canvas-wrapper">
        <canvas #signatureCanvas></canvas>
      </div>

      <div class="signature-footer">
        <button mat-button (click)="clear()" type="button">BORRAR</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="isEmpty()" type="button">
          CONFIRMAR FIRMA
        </button>
      </div>
    </div>
  `,
  styles: [`
    .signature-container { display: flex; flex-direction: column; gap: 16px; width: 100%; }
    .signature-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; color: var(--accent-color); }
    
    .canvas-wrapper {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: white;
      overflow: hidden;
      height: 240px;
      width: 100%;
      box-sizing: border-box;
      cursor: crosshair;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
    }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; box-sizing: border-box; }
    
    .signature-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .signature-footer button { font-weight: 800; border-radius: 12px; }
  `]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureSaved = new EventEmitter<Blob>();

  private signaturePad!: SignaturePad;
  private lastWidth = 0;
  private lastHeight = 0;
  private resizeTimeout: any;

  private onWindowResize = () => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.resizeCanvas();
    }, 150);
  };

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#2D3250' // Navy accent color
    });

    // In a dialog, wait for the open animation to complete before sizing the canvas
    setTimeout(() => {
      this.resizeCanvas();
    }, 300);

    // Listen to window resizes instead of ResizeObserver to prevent infinite loops
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;

    // Use the actual dimensions of the canvas itself
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    if (width === 0 || height === 0) return; // Hidden or not yet mounted properly

    // Prevent resize loops and unnecessary clears
    if (this.lastWidth === width && this.lastHeight === height) {
      return;
    }
    this.lastWidth = width;
    this.lastHeight = height;

    // Save existing signature data before resize
    const data = this.signaturePad ? this.signaturePad.toData() : null;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    if (this.signaturePad) {
      this.signaturePad.clear();
      // Restore drawing if it existed before the resize event
      if (data && data.length > 0) {
        this.signaturePad.fromData(data);
      }
    }
  }

  isEmpty(): boolean {
    return this.signaturePad ? this.signaturePad.isEmpty() : true;
  }

  clear() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  save() {
    if (this.signaturePad.isEmpty()) return;

    // Convert data URL to Blob
    const dataUrl = this.signaturePad.toDataURL('image/png');
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => this.signatureSaved.emit(blob));
  }
}
