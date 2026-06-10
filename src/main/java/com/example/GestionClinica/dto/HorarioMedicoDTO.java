package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class HorarioMedicoDTO {
    private Long idHorario;
    private String diaSemana;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String estado;
    private Long idMedico;
    private String nombreMedico; // Para mostrar en listados
}