export enum DocumentStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',     // Esperando firmas
    IN_PROGRESS = 'IN_PROGRESS', // Al menos 1 firma recibida
    COMPLETED = 'COMPLETED',   // Todas las firmas obtenidas
    REJECTED = 'REJECTED',
    DELETED = 'DELETED'
}

export enum SignerStatus {
    PENDING = 'PENDING',
    SIGNED = 'SIGNED',
    REJECTED = 'REJECTED',
    SKIPPED = 'SKIPPED'
}

export interface DocumentComment {
    id: string;
    userId: string;
    userName?: string;
    content: string;
    createdAt: Date;
}

export interface DocumentSigner {
    userId: string;
    userName?: string;
    empresa?: string;
    order: number;               // Orden de firma (secuencial o paralelo)
    status: SignerStatus;
    signedAt?: Date;
    signatureImageId?: string;
    positionX?: number;          // % sobre el PDF (0-100)
    positionY?: number;
    pageNumber?: number;
    scale?: number;              // Factor de escala (1 = 100%, 0.5 = 50%, etc)
}

export interface SignatureSlot {
    id: string;
    label: string;
    empresa: string;
    positionX: number;
    positionY: number;
    pageNumber: number;
}

export interface Document {
    id: string;
    title: string;
    description?: string;
    documentCode: string;     // Ej: "001.P.SGI.06.F.05"
    meetingNumber?: string;   // Ej: "012"
    meetingType?: string;     // Ej: "SEGUIMIENTO ACTIVIDADES DE COMISIONAMIENTO"
    location?: string;        // Ej: "FABRICA DE CEMENTOS MONCADA"
    meetingDate?: Date;       // Fecha de la reunión
    participatingCompanies: string[];  // ["AEI", "GBH", "CM"]
    originalFileName: string;
    currentPdfUrl: string;       // URL del PDF con firmas acumuladas
    status: DocumentStatus;
    assignedSigners: DocumentSigner[];
    createdBy: string;           // userId
    createdByName?: string;      // User name resolved from ID
    createdAt: Date;
    lastReadAt?: Date;
    lastModifiedAt?: Date;
    lastModifiedBy?: string;     // userId
    version: number;
    signatureSlots?: SignatureSlot[];  // Posiciones predefinidas
    extraSignatures?: DocumentSigner[]; // New: support for multiple signatures
    comments: DocumentComment[];
}
