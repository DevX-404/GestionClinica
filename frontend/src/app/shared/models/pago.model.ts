export interface Pago {
  idPago?: number;
  idCita: number;
  nombrePaciente?: string;
  fechaPago?: string;
  monto: number;
  metodoPago: string;
  estadoPago: string;
  horaPago?: string;
  dniPaciente?: string;
  
  // Datos del Comprobante (opcionales hasta que se pague)
  tipoComprobante?: string;
  numeroComprobante?: string;
  subtotal?: number;
  igv?: number;

  // Nuevos campos mapeados desde el backend
  nombreMedico?: string;
  nombreEspecialidad?: string;
  estadoCita?: string;
}