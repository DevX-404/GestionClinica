package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificacionDTO {
    private Long idNotificacion;
    private Long idUsuarioDestino;
    private String titulo;
    private String mensaje;
    private String tipo;
    private boolean leido;
    private LocalDateTime fechaCreacion;
}