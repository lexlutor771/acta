import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { DialogService } from '../../../core/services/dialog.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="user-root">
      <header class="header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administre accesos y roles del sistema</p>
        </div>
        <button mat-raised-button color="primary" (click)="createNewUser()">
          <mat-icon>person_add</mat-icon> NUEVO USUARIO
        </button>
      </header>

      <div class="table-card glass-panel">
        <div class="loader-overlay" *ngIf="isLoading()">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando usuarios...</p>
        </div>

        <div class="table-wrapper" *ngIf="!isLoading()">
          <!-- Inline New User Form -->
          <div class="new-user-form glass-panel" *ngIf="isCreating()">
            <h3>Nuevo Colaborador</h3>
            <div [formGroup]="userForm" class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nombre Completo</mat-label>
                <input matInput formControlName="name">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>PIN (6 dígitos)</mat-label>
                <input matInput formControlName="code" maxlength="6">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Rol</mat-label>
                <mat-select formControlName="role">
                  <mat-option *ngFor="let role of roles" [value]="role">{{role}}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-flat-button color="primary" (click)="saveEdit()" [disabled]="userForm.invalid">
                  <mat-icon>save</mat-icon> CREAR
                </button>
                <button mat-stroked-button color="warn" (click)="cancelCreate()">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>          <table mat-table [dataSource]="users()" class="desktop-table">
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Nombre / PIN </th>
              <td mat-cell *matCellDef="let user"> 
                <ng-container *ngIf="editingUserId() !== user.id; else editName">
                  <div class="user-info-cell">
                    <span class="user-name">{{user.name}}</span>
                    <span class="user-id">PIN: {{user.code}}</span>
                  </div>
                </ng-container>
                <ng-template #editName [formGroup]="userForm">
                  <div class="edit-cell-group">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic">
                      <mat-label>Nombre</mat-label>
                      <input matInput formControlName="name" placeholder="Nombre completo">
                      <mat-error *ngIf="userForm.get('name')?.hasError('required')">Requerido</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline" subscriptSizing="dynamic">
                      <mat-label>PIN</mat-label>
                      <input matInput formControlName="code" placeholder="6 dígitos" maxlength="6">
                      <mat-error *ngIf="userForm.get('code')?.hasError('required')">Requerido</mat-error>
                      <mat-error *ngIf="userForm.get('code')?.hasError('pattern')">6 números</mat-error>
                    </mat-form-field>
                  </div>
                </ng-template>
              </td>
            </ng-container>

            <!-- Email Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef class="col-email"> Email </th>
              <td mat-cell *matCellDef="let user" class="col-email"> 
                <ng-container *ngIf="editingUserId() !== user.id; else editEmail">
                  <div class="email-cell">
                    <mat-icon>mail_outline</mat-icon>
                    <span>{{user.email}}</span>
                  </div>
                </ng-container>
                <ng-template #editEmail [formGroup]="userForm">
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" placeholder="correo@ejemplo.com">
                    <mat-error *ngIf="userForm.get('email')?.hasError('required')">Requerido</mat-error>
                    <mat-error *ngIf="userForm.get('email')?.hasError('email')">Email inválido</mat-error>
                  </mat-form-field>
                </ng-template>
              </td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef> Rol </th>
              <td mat-cell *matCellDef="let user"> 
                <ng-container *ngIf="editingUserId() !== user.id; else editRole">
                  <span class="role-badge" [ngClass]="user.role.toLowerCase()">{{user.role}}</span>
                </ng-container>
                <ng-template #editRole [formGroup]="userForm">
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-select formControlName="role">
                      <mat-option *ngFor="let role of roles" [value]="role">{{role}}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </ng-template>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="col-status"> Estado </th>
              <td mat-cell *matCellDef="let user" class="col-status">
                <ng-container *ngIf="editingUserId() !== user.id; else editStatus">
                  <span class="status-indicator" [class.active]="user.isActive">
                    {{ user.isActive ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </ng-container>
                <ng-template #editStatus [formGroup]="userForm">
                  <mat-slide-toggle formControlName="isActive" color="primary">
                    {{ userForm.get('isActive')?.value ? 'ACTIVO' : 'INACTIVO' }}
                  </mat-slide-toggle>
                </ng-template>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> </th>
              <td mat-cell *matCellDef="let user">
                <div class="actions">
                  <ng-container *ngIf="editingUserId() !== user.id; else editActions">
                    <button mat-icon-button color="primary" matTooltip="Editar" (click)="startEdit(user)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" matTooltip="Gestionar Firmas" (click)="manageSignatures(user)">
                      <mat-icon>gesture</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="deleteUser(user)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </ng-container>
                  <ng-template #editActions>
                    <button mat-icon-button color="primary" matTooltip="Guardar" (click)="saveEdit()" [disabled]="userForm.invalid">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" matTooltip="Cancelar" (click)="cancelEdit()">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </ng-template>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.editing-row]="editingUserId() === row.id"></tr>
          </table>

          <!-- Mobile Cards View -->
          <div class="mobile-grid">
            <div *ngFor="let user of users()" class="user-card glass-panel" [class.editing-card]="editingUserId() === user.id">
              <ng-container *ngIf="editingUserId() !== user.id; else mobileEdit">
                <div class="card-header">
                  <div class="user-basic">
                    <span class="u-name">{{user.name}}</span>
                    <span class="u-pin">PIN: {{user.code}}</span>
                  </div>
                  <span class="role-badge" [ngClass]="user.role.toLowerCase()">{{user.role}}</span>
                </div>
                <div class="card-body">
                  <div class="card-item">
                    <mat-icon>mail</mat-icon>
                    <span>{{user.email}}</span>
                  </div>
                  <div class="card-item">
                    <span class="status-indicator" [class.active]="user.isActive">
                      {{ user.isActive ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <button mat-button color="primary" (click)="startEdit(user)">
                    <mat-icon>edit</mat-icon> EDITAR
                  </button>
                  <button mat-button color="accent" (click)="manageSignatures(user)">
                    <mat-icon>gesture</mat-icon> FIRMAS
                  </button>
                  <button mat-button color="warn" (click)="deleteUser(user)">
                    <mat-icon>delete</mat-icon> ELIMINAR
                  </button>
                </div>
              </ng-container>

              <ng-template #mobileEdit [formGroup]="userForm">
                <div class="mobile-edit-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email">
                  </mat-form-field>
                  <div class="two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>PIN</mat-label>
                      <input matInput formControlName="code" maxlength="6">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Rol</mat-label>
                      <mat-select formControlName="role">
                        <mat-option *ngFor="let role of roles" [value]="role">{{role}}</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <mat-slide-toggle formControlName="isActive" color="primary">
                    {{ userForm.get('isActive')?.value ? 'ACTIVO' : 'INACTIVO' }}
                  </mat-slide-toggle>
                  <div class="mobile-edit-actions">
                    <button mat-flat-button color="primary" (click)="saveEdit()" [disabled]="userForm.invalid">GUARDAR</button>
                    <button mat-stroked-button color="warn" (click)="cancelEdit()">CANCELAR</button>
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-root { display: flex; flex-direction: column; gap: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 36px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .header p { color: var(--text-muted); font-size: 15px; font-weight: 500; }

    .table-card { position: relative; min-height: 400px; overflow: hidden; padding: 24px; background: white; border: 1px solid var(--border-color); border-radius: 20px; }
    
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
      background: rgba(255, 255, 255, 0.8);
      z-index: 10;
      gap: 16px;
    }
    .loader-overlay p {
      font-weight: 700;
      color: var(--accent-color);
      letter-spacing: 0.5px;
    }

    .new-user-form { margin-bottom: 32px; padding: 24px; border: 2px solid var(--primary-color); background: rgba(255, 122, 41, 0.02); }
    .new-user-form h3 { font-size: 18px; font-weight: 800; color: var(--accent-color); margin-bottom: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr 120px 140px auto; gap: 16px; align-items: start; }
    .form-actions { display: flex; gap: 8px; padding-top: 4px; }
    .form-actions button { height: 48px; border-radius: 12px; }

    .table-wrapper { overflow-x: auto; }
    .desktop-table { width: 100%; min-width: 800px; background: transparent !important; }
    
    .mobile-grid { display: none; }
    .user-card { margin-bottom: 16px; padding: 20px; border-radius: 16px; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .user-basic { display: flex; flex-direction: column; }
    .u-name { font-weight: 800; font-size: 16px; color: var(--accent-color); }
    .u-pin { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    
    .card-body { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .card-item { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 14px; font-weight: 500; }
    .card-item mat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.6; }
    
    .card-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 16px; }
    .card-actions button { flex: 1; font-weight: 800; font-size: 12px; border-radius: 12px; }

    .editing-card { border: 2px solid var(--primary-color); background: rgba(255, 122, 41, 0.05) !important; }
    .mobile-edit-form { display: flex; flex-direction: column; gap: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mobile-edit-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .mobile-edit-actions button { height: 48px; border-radius: 12px; font-weight: 800; }

    .user-info-cell { display: flex; flex-direction: column; }
    .user-name { font-weight: 800; color: var(--accent-color); font-size: 14px; }
    .user-id { font-size: 11px; color: var(--text-muted); font-weight: 500; }

    .email-cell { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; font-weight: 500; }
    .email-cell mat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.6; }

    .role-badge { 
      font-size: 10px; 
      // font-weight: 900; 
      padding: 4px 10px; 
      border-radius: 8px; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role-badge.admin { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; }
    .role-badge.signer { color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; }
    .role-badge.auditor { color: #7c3aed; background: #f5f3ff; border: 1px solid #ddd6fe; }
    .role-badge.viewer { color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; }
    
    .status-indicator { 
      font-size: 11px; 
      // font-weight: 800; 
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
    .actions { display: flex; justify-content: flex-end; gap: 8px; min-width: 100px; }

    .editing-row { background: rgba(var(--accent-rgb, 0,0,0), 0.02); }
    .edit-cell-group { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
    
    mat-form-field { width: 100%; font-size: 13px; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    ::ng-deep .mat-mdc-text-field-wrapper { padding-top: 4px !important; padding-bottom: 4px !important; }
    
    @media (max-width: 1024px) {
      .form-row { grid-template-columns: 1fr 1fr; }
      .form-actions { grid-column: 1 / -1; justify-content: flex-end; }
    }

    @media (max-width: 768px) {
      .header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header button { width: 100%; }
      .table-card { padding: 12px; border: none; background: transparent; }
      
      .desktop-table { display: none; }
      .mobile-grid { display: block; }
      
      .new-user-form { padding: 20px; }
      .form-row { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; }
      .form-actions button { width: 100%; }
    }
  `]
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  users = signal<User[]>([]);
  isLoading = signal(true);
  isCreating = signal(false);
  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];
  roles = Object.values(UserRole);

  editingUserId = signal<string | null>(null);
  userForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      role: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (u) => {
        this.users.set(u);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showError('Error al cargar usuarios');
        this.isLoading.set(false);
      }
    });
  }

  startEdit(user: User) {
    this.editingUserId.set(user.id);
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      code: user.code,
      role: user.role,
      isActive: user.isActive
    });
  }

  cancelEdit() {
    this.editingUserId.set(null);
    this.userForm.reset({ isActive: true });
  }

  cancelCreate() {
    this.isCreating.set(false);
    this.userForm.reset({ isActive: true });
  }

  saveEdit() {
    if (this.userForm.invalid) return;

    const updates = this.userForm.value;
    const id = this.editingUserId();

    if (id) {
      // Update existing
      this.userService.updateUser(id, updates).subscribe({
        next: () => {
          this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.editingUserId.set(null);
          this.loadUsers();
        },
        error: (err: any) => this.showError(`Error al actualizar usuario: ${err.message || err}`)
      });
    } else {
      // Create new
      this.userService.createUser(updates).subscribe({
        next: () => {
          this.snackBar.open('Nuevo usuario creado', 'Cerrar', { duration: 3000 });
          this.isCreating.set(false);
          this.userForm.reset({ isActive: true });
          this.loadUsers();
        },
        error: (err: any) => this.showError(`Error al crear usuario: ${err.message || err}`)
      });
    }
  }

  createNewUser() {
    this.isCreating.set(true);
    this.editingUserId.set(null);
    this.userForm.reset({
      isActive: true,
      role: UserRole.VIEWER
    });
  }

  deleteUser(user: User) {
    this.dialogService.confirm(
      '¿Eliminar Usuario?',
      `¿Está seguro de de desactivar el acceso de ${user.name}? Esta acción se puede revertir luego.`,
      'Confirmar',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.userService.updateUser(user.id, { isActive: false }).subscribe({
          next: () => {
            this.snackBar.open('Usuario desactivado', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err: any) => this.showError(`Error al desactivar usuario: ${err.message || err}`)
        });
      }
    });
  }

  manageSignatures(user: User) {
    this.router.navigate(['/signatures'], { queryParams: { userId: user.id } });
  }

  private showError(msg: string) {
    this.dialogService.error('Ups! Algo salió mal', msg);
  }
}
