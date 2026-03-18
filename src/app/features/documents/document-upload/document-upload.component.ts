import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentsState } from '../../../documents.state';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocumentService } from '../../../core/services/document.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { SignerStatus } from '../../../core/models/document.model';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTableModule,
    MatTooltipModule,
    DragDropModule
  ],
  template: `
    <div class="upload-root">
      <header class="upload-header">
        <h1>{{ editingDocId() ? 'Editar Acta' : 'Subir Nuevo Documento' }}</h1>
        <p>{{ editingDocId() ? 'Actualice la información del acta' : 'Complete los datos del acta y asigne a los firmantes correspondientes' }}</p>
      </header>

      <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()" class="upload-form">
        <div class="form-grid">
          <div class="main-info glass-panel">
            <h3>Información del Acta</h3>
            
            <mat-form-field appearance="outline">
              <mat-label>Título del Documento</mat-label>
              <input matInput formControlName="title" placeholder="Ej: Acta de Seguimiento #012">
            </mat-form-field>

            <div class="tri-col">
              <mat-form-field appearance="outline">
                <mat-label>Código Documento</mat-label>
                <input matInput formControlName="documentCode" placeholder="001.P.SGI.06.F.05">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Número de Reunión</mat-label>
                <input matInput formControlName="meetingNumber" placeholder="012">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de Reunión</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="meetingDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Lugar / Proyecto</mat-label>
              <input matInput formControlName="location" placeholder="FABRICA DE CEMENTOS MONCADA">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de Reunión</mat-label>
              <mat-select formControlName="meetingType">
                <mat-option *ngFor="let type of meetingTypes" [value]="type">
                  {{ type }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Descripción / Observaciones</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>
          </div>

          <div class="signer-assignment glass-panel">
            <div class="section-title">
              <h3>Asignación de Firmantes</h3>
              <mat-icon matTooltip="Arrastre para reordenar la secuencia de firma">info_outline</mat-icon>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Buscar Usuario</mat-label>
              <mat-icon matPrefix>person_search</mat-icon>
              <input matInput [matAutocomplete]="auto" #signerInput>
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addSigner($event)">
                <mat-option *ngFor="let user of allUsers" [value]="user">
                  {{ user.name }} ({{ user.role }})
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <div class="signer-list" cdkDropList (cdkDropListDropped)="onDropSigner($event)">
              <div class="signer-item" *ngFor="let signer of assignedSigners; let i = index" cdkDrag>
                <div class="drag-handle" cdkDragHandle><mat-icon>drag_indicator</mat-icon></div>
                <div class="signer-order">{{ i + 1 }}</div>
                <div class="signer-info">
                  <div class="signer-name">{{ signer.name }}</div>
                  <div class="signer-role">{{ signer.role }}</div>
                </div>
                <button mat-icon-button color="warn" (click)="removeSigner(i)" type="button">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div *ngIf="assignedSigners.length === 0" class="empty-signers">
                <mat-icon>person_add_disabled</mat-icon>
                <p>No hay firmantes asignados</p>
              </div>
            </div>

            <div class="pdf-upload-zone">
              <div class="upload-placeholder" *ngIf="!selectedFile">
                <mat-icon>upload_file</mat-icon>
                <p>Haz clic o arrastra el PDF aquí</p>
                <span>Máximo 50MB</span>
                <input type="file" (change)="onFileSelected($event)" accept="application/pdf">
              </div>
              <div class="file-info" *ngIf="selectedFile">
                <mat-icon color="primary">picture_as_pdf</mat-icon>
                <div class="details">
                  <span class="filename">{{ selectedFile.name }}</span>
                  <span class="filesize">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
                </div>
                <button mat-icon-button (click)="selectedFile = null" type="button"><mat-icon>delete</mat-icon></button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button mat-button type="button" (click)="resetForm()">{{ editingDocId() ? 'CANCELAR EDICIÓN' : 'REINICIAR' }}</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="uploadForm.invalid || assignedSigners.length === 0">
            {{ editingDocId() ? 'GUARDAR CAMBIOS' : 'PUBLICAR DOCUMENTO' }}
          </button>
        </div>
      </form>

      <div class="documents-list-section glass-panel">
        <div class="section-title">
          <h3>Documentos Existentes</h3>
          <mat-icon matTooltip="Listado de todas las actas registradas">list</mat-icon>
        </div>

        <table mat-table [dataSource]="documents()">
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef> Código </th>
            <td mat-cell *matCellDef="let doc"> <code>{{doc.documentCode}}</code> </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef> Título </th>
            <td mat-cell *matCellDef="let doc"> {{doc.title}} </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> </th>
            <td mat-cell *matCellDef="let doc">
              <div class="grid-actions">
                <button mat-icon-button color="primary" matTooltip="Editar" (click)="editDocument(doc)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="deleteDocument(doc.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="['code', 'title', 'actions']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['code', 'title', 'actions'];"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .upload-root { display: flex; flex-direction: column; gap: 40px; }
    .upload-header h1 { font-size: 36px; font-weight: 900; margin-bottom: 4px; color: var(--accent-color); }
    .upload-header p { color: var(--text-muted); font-size: 15px; font-weight: 500; }

    .form-grid { display: grid; grid-template-columns: 1fr 420px; gap: 32px; }
    .glass-panel { padding: 40px; }
    h3 { font-size: 20px; font-weight: 800; margin-bottom: 28px; color: var(--accent-color); }
    
    .form-grid mat-form-field { width: 100%; margin-bottom: 12px; }
    .tri-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

    .signer-assignment { display: flex; flex-direction: column; gap: 12px; }
    .section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .section-title h3 { margin: 0; }
    
    .signer-list { 
      min-height: 240px;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      background: #f8fafc;
      padding: 12px;
    }
    .signer-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 12px;
      gap: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .drag-handle { cursor: grab; color: var(--text-muted); opacity: 0.6; }
    .signer-order { font-weight: 900; color: var(--primary-color); width: 24px; font-size: 15px; }
    .signer-info { flex: 1; }
    .signer-name { font-size: 14px; font-weight: 700; color: var(--text-color); }
    .signer-role { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .empty-signers { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); opacity: 0.5; }
    .empty-signers p { font-size: 14px; font-weight: 500; }

    .pdf-upload-zone { margin-top: 24px; }
    .upload-placeholder {
      height: 140px;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .upload-placeholder:hover { border-color: var(--primary-color); background: rgba(255, 122, 41, 0.05); }
    .upload-placeholder input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
    .upload-placeholder p { font-size: 14px; font-weight: 700; margin: 12px 0 4px; color: var(--accent-color); }
    .upload-placeholder span { font-size: 12px; color: var(--text-muted); }
    
    .file-info { display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(255, 122, 41, 0.08); border-radius: 12px; }
    .file-info .details { flex: 1; display: flex; flex-direction: column; }
    .filename { font-size: 15px; font-weight: 700; color: var(--text-color); }
    .filesize { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    
    .form-footer { display: flex; justify-content: flex-end; gap: 20px; margin-top: 40px; padding-bottom: 64px; }
    .form-footer button { height: 56px; padding: 0 40px; font-weight: 800; border-radius: 16px; letter-spacing: 0.5px; }

    .documents-list-section { margin-top: 32px; padding: 40px; }
    .documents-list-section table { width: 100%; background: transparent !important; }
    .grid-actions { display: flex; justify-content: flex-end; gap: 8px; }
    
    th { text-transform: uppercase; font-size: 11px; font-weight: 800; color: var(--accent-color) !important; padding: 12px 24px !important; }
    td { padding: 12px 24px !important; border-bottom: 1px solid var(--border-color); }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; }

    @media (max-width: 1200px) {
      .form-grid { grid-template-columns: 1fr; }
      .signer-assignment { order: -1; }
    }

    @media (max-width: 768px) {
      .upload-root { gap: 24px; }
      .upload-header h1 { font-size: 24px; }
      .glass-panel { padding: 20px; }
      .tri-col { grid-template-columns: 1fr; gap: 0; }
      .form-footer { flex-direction: column; gap: 12px; }
      .form-footer button { width: 100%; }
      .documents-list-section { padding: 20px; overflow-x: auto; }
    }
  `]
})
export class DocumentUploadComponent {
  private fb = inject(FormBuilder);
  private docService = inject(DocumentService);
  private userService = inject(UserService);
  private state = inject(DocumentsState);
  private router = inject(Router);

  uploadForm = this.fb.group({
    title: ['', Validators.required],
    documentCode: ['001.P.SGI.06.F.05', Validators.required],
    meetingNumber: ['', Validators.required],
    meetingType: ['', Validators.required],
    location: ['FABRICA DE CEMENTOS MONCADA', Validators.required],
    meetingDate: [new Date(), Validators.required],
    description: ['']
  });

  meetingTypes = ['SEGUIMIENTO ACTIVIDADES DE COMISIONAMIENTO', 'REUNIÓN TÉCNICA', 'ASAMBLEA EXTRAORDINARIA'];

  allUsers: User[] = [];
  assignedSigners: User[] = [];
  selectedFile: File | null = null;
  documents = this.state.list;
  editingDocId = signal<string | null>(null);

  ngOnInit() {
    this.state.loadDocuments();
    this.userService.getUsers().subscribe(users => {
      this.allUsers = users.filter(u => u.role === 'SIGNER' || u.role === 'ADMIN');
    });
  }

  addSigner(event: any) {
    const user = event.option.value;
    if (!this.assignedSigners.find(u => u.id === user.id)) {
      this.assignedSigners.push(user);
    }
    event.option.deselect();
  }

  removeSigner(index: number) {
    this.assignedSigners.splice(index, 1);
  }

  onDropSigner(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.assignedSigners, event.previousIndex, event.currentIndex);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    }
  }

  editDocument(doc: any) {
    this.editingDocId.set(doc.id);
    this.uploadForm.patchValue({
      title: doc.title,
      documentCode: doc.documentCode,
      meetingNumber: doc.meetingNumber,
      meetingType: doc.meetingType,
      location: doc.location,
      meetingDate: new Date(doc.meetingDate),
      description: doc.description || ''
    });

    // Convert back signedSigners to initial User model for management
    this.assignedSigners = doc.assignedSigners.map((s: any) => ({
      id: s.userId,
      name: s.userName,
      role: 'SIGNER' // Simplified for mock
    }));

    // If there is an existing URL, we simulate that we have a file (for validation)
    if (doc.currentPdfUrl) {
      this.selectedFile = { name: doc.originalFileName, size: 0 } as any;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteDocument(id: string) {
    if (confirm('¿Está seguro de eliminar este documento?')) {
      this.docService.deleteDocument(id).subscribe(() => {
        this.state.loadDocuments();
        if (this.editingDocId() === id) this.resetForm();
      });
    }
  }

  resetForm() {
    this.editingDocId.set(null);
    this.uploadForm.reset({
      documentCode: '001.P.SGI.06.F.05',
      location: 'FABRICA DE CEMENTOS MONCADA',
      meetingDate: new Date()
    });
    this.assignedSigners = [];
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.uploadForm.invalid || this.assignedSigners.length === 0) return;

    const signers = this.assignedSigners.map((u, i) => ({
      userId: u.id,
      userName: u.name,
      order: i + 1,
      status: SignerStatus.PENDING
    }));

    const docData = {
      ...this.uploadForm.value,
      assignedSigners: signers,
      originalFileName: this.selectedFile?.name || 'documento.pdf',
      participatingCompanies: ['AEI']
    };

    const action = this.editingDocId()
      ? this.docService.updateDocument(this.editingDocId()!, docData)
      : this.docService.uploadDocument(docData);

    action.subscribe(() => {
      this.state.loadDocuments();
      this.resetForm();
      if (!this.editingDocId()) this.router.navigate(['/documents']);
    });
  }
}
