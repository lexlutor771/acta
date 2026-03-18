export interface SignatureImage {
    id: string;
    userId: string;
    imageUrl: string;            // URL almacenada en servidor/S3
    thumbnailUrl: string;
    version: number;
    isActive: boolean;
    createdAt: Date;
    modifiedAt?: Date;
    modifiedBy?: string;         // userId del que actualizó
    format: 'PNG' | 'SVG';
    metadata: {
        width: number;
        height: number;
        fileSize: number;
    };
}
