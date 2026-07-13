package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SolicitudDTO {
    private Long idSolicitud;
    private Long idUsuario;
    private String nombreUsuario; // Para la tabla del Admin
    private String rolUsuario;
    private String tipo;
    private String detalle;
    private String estado;
    private String respuestaAdmin;
    private LocalDate fechaSolicitud;
}