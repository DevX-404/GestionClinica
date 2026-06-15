package com.example.GestionClinica.dto;

import java.util.List;
import lombok.Data;

@Data
public class UsuarioDTO {
    private Long idUsuario;
    private String username;
    private String email;
    private String password;
    private String rol; // ADMINISTRADOR, MEDICO, RECEPCIONISTA
    private boolean activo;
    private List<String> modulosAcceso;
    private String nombreCompleto;
}
