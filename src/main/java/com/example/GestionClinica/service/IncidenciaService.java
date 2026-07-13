package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.IncidenciaDTO;
import java.util.List;

public interface IncidenciaService {
    List<IncidenciaDTO> listarTodas();
    List<IncidenciaDTO> listarPorUsuario(Long idUsuario);
    IncidenciaDTO registrarIncidencia(Long idUsuario, IncidenciaDTO dto);
    IncidenciaDTO cambiarEstadoYResponder(Long idIncidencia, String nuevoEstado, String respuestaAdmin);
}