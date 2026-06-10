export interface CitaMedica {
  idCita?: number;
  idPaciente: number;
  nombreCompletoPaciente?: string;
  idMedico: number;
  nombreCompletoMedico?: string;
  idEspecialidad: number;
  nombreEspecialidad?: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm:ss
  estado: string; 
  motivoConsulta?: string;
}