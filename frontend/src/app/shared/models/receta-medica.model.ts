export interface DetalleRecetaDTO {
    idDetalleReceta?: number;
    medicamento: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
}

export interface RecetaMedicaDTO {
    idReceta?: number;
    fechaEmision?: string;
    observaciones?: string;
    idConsulta: number;
    detalles: DetalleRecetaDTO[];
}