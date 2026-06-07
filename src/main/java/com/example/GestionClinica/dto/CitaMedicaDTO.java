package com.example.GestionClinica.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CitaMedicaDTO {
    private Long idCita;
    
    @NotNull(message = "ID de Paciente obligatorio")
    private Long idPaciente;
    private String nombreCompletoPaciente;

    @NotNull(message = "ID de Médico obligatorio")
    private Long idMedico;
    private String nombreCompletoMedico;

    @NotNull(message = "ID de Especialidad obligatorio")
    private Long idEspecialidad;
    private String nombreEspecialidad;

    @NotNull(message = "Fecha obligatoria")
    private LocalDate fecha;

    @NotNull(message = "Hora obligatoria")
    private LocalTime hora;

    private String estado;
    private String motivoConsulta;
}
