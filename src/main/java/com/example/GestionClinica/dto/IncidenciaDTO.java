package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class IncidenciaDTO {
    private Long idIncidencia;
    private String titulo;
    private String descripcion;
    private String tipo;
    private String nivelGravedad;
    private String urlFalla;
    private String evidenciasJson;
    private String estado;
    private LocalDateTime fechaReporte;
    private LocalDateTime fechaResolucion;
    private String respuestaAdmin;
    
    // Datos extraídos del usuario para que Angular los pinte fácil
    private Long idUsuarioReporta;
    private String nombreUsuarioReporta;
    private String rolUsuarioReporta;
}