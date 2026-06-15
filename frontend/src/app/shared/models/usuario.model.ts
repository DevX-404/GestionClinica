export interface Usuario {
  idUsuario: number;
  nombreCompleto?: string;
  username: string;
  email: string;
  rol: string;
  activo: boolean;
}