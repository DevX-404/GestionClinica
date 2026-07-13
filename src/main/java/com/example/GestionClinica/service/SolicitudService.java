package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.SolicitudDTO;
import java.util.List;

public interface SolicitudService {

    List<SolicitudDTO> listarTodas();
    List<SolicitudDTO> listarPorUsuario(Long idUsuario);
    SolicitudDTO crearSolicitud(Long idUsuario, SolicitudDTO dto);
    SolicitudDTO responderSolicitud(Long idSolicitud, String estado, String respuesta);
}
