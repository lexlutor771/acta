import { Component, inject, computed, OnInit, ViewChild, effect, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentsState } from '../../../documents.state';
import { DocumentStatus } from '../../../core/models/document.model';
import { AuthService } from '../../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    DateFormatPipe
  ],
  template: `
    <div class="list-container">
      <header class="list-header">
        <div>
          <h1>Documentos</h1>
          <p>Gestión de actas y seguimiento de firmas</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/documents/upload" *ngIf="isAdmin()">
          <mat-icon>add</mat-icon> SUBIR NUEVA ACTA
        </button>
      </header>

      <div class="filters-bar glass-panel">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por título o código</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [value]="columnFilters()['global'] || ''" (keyup)="applyFilter($event)" placeholder="Ej: Acta 012">
        </mat-form-field>
        
        <div class="spacer"></div>
        
        <div class="filter-actions">
          <button mat-button (click)="toggleFilters()" [color]="showColumnFilters() ? 'primary' : ''">
            <mat-icon>{{ showColumnFilters() ? 'filter_list_off' : 'filter_list' }}</mat-icon> FILTROS
          </button>
          <button mat-icon-button (click)="refresh()"><mat-icon>refresh</mat-icon></button>
        </div>
      </div>

      <div class="table-wrapper glass-panel shadow-premium">
        <div class="loader-overlay" *ngIf="isLoading()">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Sincronizando expedientes...</p>
        </div>

        <table mat-table [dataSource]="dataSource" matSort *ngIf="!isLoading()" class="desktop-table">
          
          <ng-container matColumnDef="documentCode">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Código </th>
            <td mat-cell *matCellDef="let row"> <code class="code-text">{{row.documentCode}}</code> </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Título </th>
            <td mat-cell *matCellDef="let row"> 
              <div class="title-cell">
                <span class="main-title">{{row.title}}</span>
                <span class="sub-title">v{{row.version}}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Estado </th>
            <td mat-cell *matCellDef="let row"> 
              <app-status-badge [status]="row.status"></app-status-badge>
            </td>
          </ng-container>

          <ng-container matColumnDef="progress">
            <th mat-header-cell *matHeaderCellDef class="col-progress"> Firmas </th>
            <td mat-cell *matCellDef="let row" class="col-progress">
              <div class="progress-cell">
                <span class="progress-text">{{ getSignedCount(row) }}/{{ row.assignedSigners.length }}</span>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" [style.width.%]="(getSignedCount(row)/row.assignedSigners.length)*100"></div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header class="col-createdAt"> Fecha </th>
            <td mat-cell *matCellDef="let row" class="col-createdAt"> {{row.createdAt | dateFormat}} </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> </th>
            <td mat-cell *matCellDef="let row">
              <div class="action-buttons">
                <button mat-icon-button [routerLink]="['/documents', row.id, 'sign']" matTooltip="Firmar / Ver" color="primary">
                  <mat-icon>draw</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/documents', row.id, 'history']" matTooltip="Historial">
                  <mat-icon>history</mat-icon>
                </button>
                <button *ngIf="isAdmin()" mat-icon-button (click)="downloadDocument(row)" matTooltip="Descargar PDF" color="accent" [disabled]="row.status === 'PENDING'">
                  <mat-icon>file_download</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <!-- Column Filter Rows -->
          <ng-container [matColumnDef]="col + '-filter'" *ngFor="let col of filterableColumns">
            <th mat-header-cell *matHeaderCellDef>
              <div class="filter-cell-wrapper" *ngIf="showColumnFilters() && col !== 'actions'">
                <mat-form-field appearance="outline" class="col-filter-field">
                  <input matInput [value]="columnFilters()[col] || ''" (keyup)="applyColumnFilter(col, $event)" placeholder="Filtrar...">
                </mat-form-field>
              </div>
            </th>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-header-row *matHeaderRowDef="displayedFilterColumns" [class.filter-row-hidden]="!showColumnFilters()"></tr>
          <tr mat-row *matNoDataRow>
            <td colspan="6" class="no-data">No se encontraron documentos</td>
          </tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="mobile-grid" *ngIf="!isLoading()">
          <div class="doc-card glass-panel shadow-premium" *ngFor="let row of dataSource.filteredData">
            <div class="card-header">
              <code class="code-text">{{row.documentCode}}</code>
              <app-status-badge [status]="row.status"></app-status-badge>
            </div>
            <div class="card-body">
              <h3 class="main-title">{{row.title}}</h3>
              <div class="card-meta">
                <span>Versión {{row.version}}</span>
                <span class="divider"></span>
                <span>{{row.createdAt | dateFormat}}</span>
              </div>
              <div class="progress-section">
                <div class="progress-text">
                  <span>Avance de Firmas</span>
                  <span class="pct">{{ (getSignedCount(row)/row.assignedSigners.length)*100 | number:'1.0-0' }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" [style.width.%]="(getSignedCount(row)/row.assignedSigners.length)*100"></div>
                </div>
                <div class="progress-text" style="opacity: 0.6; margin-top: 2px;">
                   <span>Suscritos: {{ getSignedCount(row) }}/{{ row.assignedSigners.length }}</span>
                </div>
              </div>
            </div>
            <div class="card-actions">
                <button mat-flat-button color="primary" class="btn-main" [routerLink]="['/documents', row.id, 'sign']">
                  <mat-icon>draw</mat-icon> FIRMAR / VER
                </button>
                <button mat-icon-button class="btn-icon" [routerLink]="['/documents', row.id, 'history']" matTooltip="Historial"><mat-icon>history</mat-icon></button>
                <button *ngIf="isAdmin()" mat-icon-button class="btn-icon" (click)="downloadDocument(row)" [disabled]="row.status === 'PENDING'" matTooltip="Descargar"><mat-icon>file_download</mat-icon></button>
            </div>
          </div>
          <div *ngIf="dataSource.filteredData.length === 0" class="no-data-mobile">No se encontraron documentos</div>
        </div>

        <mat-paginator [pageSizeOptions]="[10, 25, 100]" aria-label="Seleccionar página"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .list-container { display: flex; flex-direction: column; gap: 32px; }
    .list-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .list-header h1 { font-size: 32px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .list-header p { color: var(--text-muted); font-size: 15px; font-weight: 500; }

    /* Mobile Card Grid Styles */
    .mobile-grid { display: none; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 0; }
    .doc-card { 
      background: white; border-radius: 20px; border: 1px solid var(--border-color); padding: 20px; 
      display: flex; flex-direction: column; gap: 14px; transition: all 0.2s ease;
      position: relative; overflow: hidden;
    }
    .doc-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -10px rgba(0,0,0,0.1) !important; }
    
    .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
    .card-body { display: flex; flex-direction: column; gap: 10px; }
    .card-body .main-title { font-size: 15px; font-weight: 800; color: var(--accent-color); margin: 0; line-height: 1.4; }
    .card-meta { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .card-meta .divider { width: 3px; height: 3px; background: #cbd5e1; border-radius: 50%; }
    
    .progress-section { background: #f8fafc; padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
    .progress-section .progress-text { font-size: 10px; font-weight: 900; color: var(--accent-color); text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; }
    .progress-section .pct { color: var(--primary-color); }
    
    .card-actions { margin-top: auto; padding-top: 16px; display: flex; gap: 8px; }
    .card-actions .btn-main { flex: 1; height: 44px; font-weight: 800; font-size: 12px; border-radius: 12px; }
    .card-actions .btn-icon { width: 44px; height: 44px; border-radius: 12px; }
    
    .no-data-mobile { padding: 60px 20px; text-align: center; color: var(--text-muted); font-weight: 600; font-size: 14px; }

    @media (max-width: 1024px) {
      .search-field { width: 100%; max-width: 400px; }
    }

    /* Responsive - mobile friendly header and filter layout */
    @media (max-width: 768px) {
      .list-header { flex-direction: column; align-items: stretch; gap: 16px; margin-bottom: 24px; }
      .list-header h1 { font-size: 26px; }
      .list-header p { font-size: 13px; }
      .list-header button { width: 100%; height: 52px; font-size: 14px; }

      .filters-bar { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; border-radius: 20px; }
      .filters-bar .filter-actions { display: grid; grid-template-columns: 1fr 52px; gap: 8px; width: 100%; }
      .filters-bar .filter-actions button:first-child { height: 52px; border-radius: 12px; background: rgba(0,0,0,0.03); opacity: 0.8; }
      .filters-bar .filter-actions button:last-child { width: 52px; height: 52px; border-radius: 12px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; }
      .search-field { width: 100%; max-width: none; margin: 0; }
      ::ng-deep .search-field .mat-mdc-text-field-wrapper { height: 52px; }

      .table-wrapper { padding: 0; background: transparent; box-shadow: none; border: none; min-height: auto; }
      .desktop-table { display: none; }
      .mobile-grid { display: grid; }
      .shadow-premium { margin-bottom: 32px; background: transparent; box-shadow: none !important; }
    }

    .filters-bar { padding: 16px 24px; display: flex; gap: 20px; margin-bottom: 8px; }
    // .search-field { width: 340px; }
    ::ng-deep .search-field .mat-mdc-text-field-wrapper { height: 48px; border-radius: 12px; }
    ::ng-deep .search-field .mat-mdc-form-field-infix { padding-top: 12px; padding-bottom: 12px; }
    
    .shadow-premium { position: relative;  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1) !important; }

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
      background: rgba(255, 255, 255, 0.85);
      z-index: 10;
      gap: 16px;
      border-radius: 20px;
    }
    .loader-overlay p {
      font-weight: 800;
      color: var(--accent-color);
      letter-spacing: 0.5px;
      font-size: 14px;
    }

    .table-wrapper { overflow: auto; padding: 8px; }
    table { width: 100%; background: transparent !important; }
    
    .code-text { background: #f1f5f9; color: var(--accent-color); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .title-cell { display: flex; flex-direction: column; }
    .main-title { font-weight: 700; font-size: 14px; color: var(--text-color); }
    .sub-title { font-size: 11px; color: var(--text-muted); font-weight: 500; }

    .progress-cell { width: 120px; display: flex; flex-direction: column; gap: 6px; }
    .progress-text { font-size: 11px; font-weight: 800; color: var(--text-muted); }
    .progress-bar-bg { height: 6px; background: #f1f5f9; border-radius: 3px; width: 100%; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: var(--primary-color); border-radius: 3px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

    .action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
    .no-data { padding: 64px; text-align: center; color: var(--text-muted); font-weight: 500; }

    th { text-transform: uppercase; font-size: 11px; letter-spacing: 1.2px; font-weight: 800; color: var(--accent-color) !important; padding: 16px 24px !important; }
    td { padding: 16px 24px !important; border-bottom: 1px solid var(--border-color); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(0, 0, 0, 0.01); }

    .filter-row-hidden { display: none !important; }
    .col-filter-field { width: 100%; margin: 8px 0; }
    ::ng-deep .col-filter-field .mat-mdc-text-field-wrapper { height: 36px !important; border-radius: 8px !important; background: white !important; }
    ::ng-deep .col-filter-field .mat-mdc-form-field-infix { padding-top: 6px !important; padding-bottom: 6px !important; min-height: 36px !important; }
    ::ng-deep .col-filter-field .mat-mdc-form-field-input-control { font-size: 11px !important; }
    
    .filter-cell-wrapper { padding: 0 4px; }
  `]
})
export class DocumentListComponent implements OnInit, AfterViewInit {
  private state = inject(DocumentsState);
  private auth = inject(AuthService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['documentCode', 'title', 'status', 'progress', 'createdAt', 'actions'];
  filterableColumns: string[] = ['documentCode', 'title', 'status', 'progress', 'createdAt', 'actions'];
  displayedFilterColumns: string[] = this.filterableColumns.map(c => c + '-filter');

  dataSource = new MatTableDataSource<any>([]);
  isAdmin = this.auth.isAdmin;
  isLoading = computed(() => this.state.loading());

  showColumnFilters = signal(false);
  columnFilters = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      const allDocs = this.state.list();
      // En la lista principal solo mostramos documentos que ya NO son borradores
      this.dataSource.data = allDocs.filter(d => d.status !== DocumentStatus.DRAFT);
    });

    // Custom filtering logic
    this.dataSource.filterPredicate = (data, filter) => {
      let searchTerms: any = {};
      try {
        searchTerms = JSON.parse(filter);
      } catch {
        // Fallback if filter is just a string
        return (data.title || '').toLowerCase().includes(filter.toLowerCase()) ||
          (data.documentCode || '').toLowerCase().includes(filter.toLowerCase());
      }

      const global = (searchTerms.global || '').toLowerCase();
      const matchGlobal = !global ||
        (data.title || '').toLowerCase().includes(global) ||
        (data.documentCode || '').toLowerCase().includes(global);

      const matchDocumentCode = (data.documentCode || '').toLowerCase().includes(searchTerms.documentCode || '');
      const matchTitle = (data.title || '').toLowerCase().includes(searchTerms.title || '');
      const matchStatus = (data.status || '').toLowerCase().includes(searchTerms.status || '');
      const matchCreatedAt = this.formatDate(data.createdAt).includes(searchTerms.createdAt || '');

      const signedCount = data.assignedSigners.filter((s: any) => s.status === 'SIGNED').length;
      const progressStr = `${signedCount}/${data.assignedSigners.length}`;
      const matchProgress = progressStr.includes(searchTerms.progress || '');

      return matchGlobal && matchDocumentCode && matchTitle && matchStatus && matchCreatedAt && matchProgress;
    };
  }

  private formatDate(date: any): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }

  applyColumnFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.columnFilters.update(filters => ({
      ...filters,
      [column]: filterValue
    }));

    this.dataSource.filter = JSON.stringify(this.columnFilters());
  }

  toggleFilters() {
    const isShowing = this.showColumnFilters();
    if (isShowing) {
      this.clearFilters();
    }
    this.showColumnFilters.set(!isShowing);
  }

  clearFilters() {
    this.columnFilters.set({});
    this.dataSource.filter = '';
  }

  ngOnInit() {
    this.state.loadDocuments();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  refresh() {
    this.clearFilters();
    this.state.loadDocuments();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.columnFilters.update(filters => ({
      ...filters,
      global: filterValue
    }));

    this.dataSource.filter = JSON.stringify(this.columnFilters());

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getSignedCount(doc: any): number {
    return doc.assignedSigners.filter((s: any) => s.status === 'SIGNED').length;
  }

  downloadDocument(doc: any) {
    if (doc.currentPdfUrl) {
      window.open(doc.currentPdfUrl, '_blank');
    }
  }
}

