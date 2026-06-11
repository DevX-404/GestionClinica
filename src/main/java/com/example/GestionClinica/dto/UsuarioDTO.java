package com.example.GestionClinica.dto;

import lombok.Data;

@Data
public class UsuarioDTO {
    private Long idUsuario;
    private String username;
    private String email;
    private String rol; // ADMINISTRADOR, MEDICO, RECEPCIONISTA
    private boolean activo;
}
