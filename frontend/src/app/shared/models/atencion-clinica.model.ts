export interface DetalleReceta {
  idDetalle?: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
}

export interface RecetaMedicaDTO {
  idReceta?: number;
  idConsulta?: number; // Se ligará al ID devuelto por la consulta
  fechaEmision?: string;
  indicacionesGenerales?: string;
  detalles: DetalleReceta[];
}

export interface ConsultaMedica {
  idConsulta?: number;
  idCita: number;
  sintomas: string;
  diagnostico: string;
  observaciones: string;
}