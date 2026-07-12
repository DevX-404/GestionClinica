package com.example.GestionClinica.dto;
import lombok.Data;

@Data
public class CitaResumenDTO {
    private String hora;
    private String pacienteNombre;
    private String medicoNombre;
    private String estado;
}
