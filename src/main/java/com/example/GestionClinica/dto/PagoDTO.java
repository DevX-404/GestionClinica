package com.example.GestionClinica.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PagoDTO {
    private Long idPago;
    private Long idCita;
    private String nombrePaciente;
    private LocalDate fechaPago;
    private BigDecimal monto;
    private String metodoPago;
    private String estadoPago;
    
    // Datos del comprobante si existe
    private String tipoComprobante;
    private String numeroComprobante;
    private BigDecimal subtotal;
    private BigDecimal igv;
    private String concepto; // ADELANTO_30, PAGO_FINAL, etc.
}