package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.NotificacionDTO;
import java.util.List;

public interface NotificacionService {
    List<NotificacionDTO> listarPorUsuario(Long idUsuarioDestino);
    void marcarComoLeida(Long idNotificacion);
    void crearNotificacion(Long idUsuarioDestino, String titulo, String mensaje, String tipo);
}