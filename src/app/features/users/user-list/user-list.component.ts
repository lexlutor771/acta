import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="user-root">
      <header class="header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administre accesos y roles del sistema</p>
        </div>
        <button mat-raised-button color="primary">
          <mat-icon>person_add</mat-icon> NUEVO USUARIO
        </button>
      </header>

      <div class="table-card glass-panel">
        <div class="table-wrapper">
          <table mat-table [dataSource]="users()">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Nombre / Usuario </th>
            <td mat-cell *matCellDef="let user"> 
              <div class="user-info-cell">
                <span class="user-name">{{user.name}}</span>
                <span class="user-id">ID: {{user.id}}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef class="col-email"> Email </th>
            <td mat-cell *matCellDef="let user" class="col-email"> 
              <div class="email-cell">
                <mat-icon>mail_outline</mat-icon>
                <span>{{user.email}}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef> Rol </th>
            <td mat-cell *matCellDef="let user"> 
              <span class="role-badge" [ngClass]="user.role.toLowerCase()">{{user.role}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="col-status"> Estado </th>
            <td mat-cell *matCellDef="let user" class="col-status">
              <span class="status-indicator" [class.active]="user.isActive">
                {{ user.isActive ? 'ACTIVO' : 'DESACTIVADO' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> </th>
            <td mat-cell *matCellDef="let user">
              <div class="actions">
                <button mat-icon-button color="primary" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Eliminar"><mat-icon>delete_outline</mat-icon></button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .user-root { display: flex; flex-direction: column; gap: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 36px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .header p { color: var(--text-muted); font-size: 15px; font-weight: 500; }

    .table-card { overflow: hidden; padding: 24px; background: white; border: 1px solid var(--border-color); border-radius: 20px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; min-width: 600px; background: transparent !important; }
    
    .user-info-cell { display: flex; flex-direction: column; }
    .user-name { font-weight: 800; color: var(--accent-color); font-size: 14px; }
    .user-id { font-size: 11px; color: var(--text-muted); font-weight: 500; }

    .email-cell { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; font-weight: 500; }
    .email-cell mat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.6; }

    .role-badge { 
      font-size: 10px; 
      font-weight: 900; 
      padding: 4px 10px; 
      border-radius: 8px; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role-badge.admin { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; }
    .role-badge.signer { color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; }
    .role-badge.auditor { color: #7c3aed; background: #f5f3ff; border: 1px solid #ddd6fe; }
    
    .status-indicator { 
      font-size: 11px; 
      font-weight: 800; 
      display: flex; 
      align-items: center; 
      gap: 6px;
      color: #ef4444;
    }
    .status-indicator::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
    .status-indicator.active { color: #22c55e; }
    .status-indicator.active::before { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }

    th { text-transform: uppercase; font-size: 11px; letter-spacing: 1.2px; font-weight: 900; color: var(--accent-color) !important; padding: 16px 24px !important; }
    td { padding: 16px 24px !important; border-bottom: 1px solid var(--border-color); }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }

    @media (max-width: 768px) {
      .header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header button { width: 100%; }
      .table-card { padding: 16px; }
      table { min-width: 500px; }
      .col-email, .col-status { display: none; }
      th, td { padding: 12px 16px !important; }
    }

    @media (max-width: 480px) {
      table { min-width: 420px; }
      th, td { padding: 10px 12px !important; }
    }
  `]
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);

  users = signal<User[]>([]);
  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  ngOnInit() {
    this.userService.getUsers().subscribe(u => this.users.set(u));
  }
}
