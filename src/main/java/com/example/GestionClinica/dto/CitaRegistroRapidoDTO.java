package com.example.GestionClinica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Data;

@Data
public class CitaRegistroRapidoDTO {

    // Datos del Paciente
    private String dniPaciente;
    private String nombresPaciente;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String telefonoPaciente;
    private String fechaNacimiento;

    // Datos de la Cita
    private Long idMedico;
    private Long idEspecialidad;
    private LocalDate fecha;
    private LocalTime hora;
    private String motivoConsulta;
    private String tipoCita;
    private BigDecimal montoPagadoAdelanto;
}