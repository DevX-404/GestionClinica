package com.example.GestionClinica.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class CitaMedicaDTO {
    private Long idCita;
    
    @NotNull(message = "ID de Paciente obligatorio")
    private Long idPaciente;
    private String nombreCompletoPaciente;
    // --- NUEVO: Agregamos el DNI aquí ---
    private String dniPaciente;

    @NotNull(message = "ID de Médico obligatorio")
    private Long idMedico;
    private String nombreCompletoMedico;

    private String usernameMedico;

    @NotNull(message = "ID de Especialidad obligatorio")
    private Long idEspecialidad;
    private String nombreEspecialidad;

    @NotNull(message = "Fecha obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;

    @NotNull(message = "Hora obligatoria")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime hora;

    private String estado;
    private String motivoConsulta;
    
    // --- CAMPO DE DINERO ---
    private BigDecimal montoPagadoAdelanto;

    private String tipoCita; // Recibirá "CONSULTA" o "PROCEDIMIENTO"
}
