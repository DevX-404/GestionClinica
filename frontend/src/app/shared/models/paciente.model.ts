export interface Paciente {
  idPaciente?: number;
  tipoDocumento: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  direccion: string;
  telefono: string;
  correo: string;
  estado: string; // ACTIVO, INACTIVO
}