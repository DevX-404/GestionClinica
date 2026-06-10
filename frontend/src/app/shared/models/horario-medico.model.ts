export interface HorarioMedico {
  idHorario?: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado?: string;
  idMedico: number;
  nombreMedico?: string;
}