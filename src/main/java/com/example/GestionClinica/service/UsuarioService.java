package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.UsuarioDTO;
import java.util.List;

public interface UsuarioService {
    List<UsuarioDTO> listarTodos();
    UsuarioDTO cambiarEstado(Long idUsuario);
    void restablecerPassword(Long idUsuario, String nuevaPassword);
    UsuarioDTO cambiarRol(Long idUsuario, String nuevoRol);
}
