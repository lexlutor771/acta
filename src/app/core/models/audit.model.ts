export enum AuditAction {
    CREATED = 'CREATED',
    UPLOADED = 'UPLOADED',
    ASSIGNED = 'ASSIGNED',
    READ = 'READ',
    SIGNED = 'SIGNED',
    SIGNATURE_MOVED = 'SIGNATURE_MOVED',
    COMMENTED = 'COMMENTED',
    REJECTED = 'REJECTED',
    DOWNLOADED = 'DOWNLOADED',
    VERSION_SAVED = 'VERSION_SAVED'
}

export interface AuditEntry {
    id: string;
    documentId: string;
    userId: string;
    userName?: string;
    action: AuditAction;
    previousVersion?: number;
    newVersion?: number;
    detail: string;
    ipAddress?: string;
    timestamp: Date;
    snapshotUrl?: string;        // PDF snapshot de esa versión
}
