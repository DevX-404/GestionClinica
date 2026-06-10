export interface Pago {
  idPago?: number;
  idCita: number;
  nombrePaciente?: string;
  fechaPago?: string;
  monto: number;
  metodoPago: string;
  estadoPago: string;
  
  // Datos del Comprobante (opcionales hasta que se pague)
  tipoComprobante?: string;
  numeroComprobante?: string;
  subtotal?: number;
  igv?: number;
}