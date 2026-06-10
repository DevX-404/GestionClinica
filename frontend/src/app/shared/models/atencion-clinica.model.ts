export interface DetalleRecetaDTO {
  idDetalleReceta?: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
}

export interface RecetaMedicaDTO {
  idReceta?: number;
  idConsulta: number; 
  fechaEmision?: string;
  observaciones?: string; 
  detalles: DetalleRecetaDTO[];
}

export interface ConsultaMedica {
  idConsulta?: number;
  idCita?: number;
  sintomas: string;
  diagnostico: string;
  tratamiento: string; 
  observaciones?: string;
}