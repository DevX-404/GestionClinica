package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class PagoDTO {
    private Long idPago;
    private Long idCita;
    private LocalDate fechaPago;
    private LocalTime horaPago;
    private Double monto;
    private String metodoPago;
    private String estadoPago;
    private String concepto;
    private String numeroComprobante;
    
    // Datos del Paciente
    private String nombrePaciente;
    private String dniPaciente;
    
    // Datos de la Consulta (Lo que te salía en blanco)
    private String nombreMedico;
    private String nombreEspecialidad;
    private String estadoCita;
    
    // --- ESTE ES EL CAMPO VITAL QUE CAUSABA EL ERROR 500 ---
    private String tipoComprobante; 
}