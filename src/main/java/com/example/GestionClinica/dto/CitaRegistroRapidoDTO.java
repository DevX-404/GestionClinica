package com.example.GestionClinica.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonFormat;
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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime hora;
    
    private String motivoConsulta;
    private String tipoCita;
    private BigDecimal montoPagadoAdelanto;
}