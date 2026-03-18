import { Component, inject, computed, OnInit, ViewChild, effect, AfterViewInit } from '@angular/core';
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
import { DocumentsState } from '../../../documents.state';
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
          <input matInput (keyup)="applyFilter($event)" placeholder="Ej: Acta 012" #input>
        </mat-form-field>
        
        <div class="spacer"></div>
        
        <div class="filter-actions">
          <button mat-button><mat-icon>filter_list</mat-icon> FILTROS</button>
          <button mat-icon-button (click)="refresh()"><mat-icon>refresh</mat-icon></button>
        </div>
      </div>

      <div class="table-wrapper glass-panel">
        <table mat-table [dataSource]="dataSource" matSort>
          
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

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matNoDataRow>
            <td colspan="6" class="no-data">No se encontraron documentos</td>
          </tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[10, 25, 100]" aria-label="Seleccionar página"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .list-container { display: flex; flex-direction: column; gap: 32px; }
    .list-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .list-header h1 { font-size: 32px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .list-header p { color: var(--text-muted); font-size: 15px; font-weight: 500; }

    /* Responsive - mobile friendly header and filter layout */
    @media (max-width: 640px) {
      .list-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .list-header button { width: 100%; justify-content: center; }
      .list-header button mat-icon { margin-right: 8px; }

      .filters-bar { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; }
      .filters-bar .filter-actions { width: 100%; display: flex; justify-content: space-between; gap: 8px; }
      .filters-bar .filter-actions button { flex: 1 1 auto; }
      .search-field { width: 100%; }

      .table-wrapper { padding: 4px; }
      table { min-width: 640px; }

      .col-progress,
      .col-createdAt { display: none; }
    }

    .filters-bar { padding: 16px 24px; display: flex; align-items: center; gap: 20px; margin-bottom: 8px; }
    .search-field { width: 340px; }
    ::ng-deep .search-field .mat-mdc-text-field-wrapper { height: 48px; border-radius: 12px; }
    ::ng-deep .search-field .mat-mdc-form-field-infix { padding-top: 12px; padding-bottom: 12px; }

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
  `]
})
export class DocumentListComponent implements OnInit, AfterViewInit {
  private state = inject(DocumentsState);
  private auth = inject(AuthService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['documentCode', 'title', 'status', 'progress', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isAdmin = this.auth.isAdmin;

  constructor() {
    effect(() => {
      this.dataSource.data = this.state.list();
    });
  }

  ngOnInit() {
    this.state.loadDocuments();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  refresh() {
    this.state.loadDocuments();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

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

