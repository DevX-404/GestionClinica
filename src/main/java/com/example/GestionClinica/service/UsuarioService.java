package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.UsuarioDTO;
import java.util.List;

public interface UsuarioService {
    List<UsuarioDTO> listarTodos();
    UsuarioDTO obtenerPorUsername(String username);
    UsuarioDTO cambiarEstado(Long idUsuario);
    void restablecerPassword(Long idUsuario, String nuevaPassword);
    void cambiarPasswordPerfil(String username, String passwordActual, String nuevaPassword);
    UsuarioDTO cambiarRol(Long idUsuario, String nuevoRol);
    UsuarioDTO registrarUsuario(UsuarioDTO dto);
    UsuarioDTO actualizarUsuario(Long idUsuario, UsuarioDTO dto);
}
