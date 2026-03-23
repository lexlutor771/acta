export enum UserRole {
    VIEWER = 'VIEWER',     // Solo lectura
    SIGNER = 'SIGNER',     // Puede firmar documentos asignados
    ADMIN = 'ADMIN',       // Sube docs, asigna firmantes, descarga final
    AUDITOR = 'AUDITOR'    // Ve historial completo y auditoría
}

export interface User {
    id: string;
    code: string;                // Clave numérica de ingreso (PIN)
    name: string;
    email: string;
    role: UserRole;
    signatureImageId?: string;   // Referencia a su imagen de firma registrada
    isActive: boolean;
    companyId: string;
    createdAt: Date;
}
