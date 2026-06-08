export interface Medico {
  idMedico?: number;
  codigoColegiatura: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  correo: string;
  estado?: string;
  estadoDisponibilidad: string; // DISPONIBLE, VACACIONES, LICENCIA, INACTIVO
  idEspecialidad: number;
  nombreEspecialidad?: string;
}