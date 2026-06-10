package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuditoriaDTO {
    private Long idAuditoria;
    private String accion;
    private String entidad;
    private LocalDateTime fechaHora;
    private String username;
    private String detalle;
}
