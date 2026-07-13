package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.PacienteDTO;
import java.util.List;

public interface PacienteService {
    List<PacienteDTO> listarTodos();
    List<PacienteDTO> listarInactivos();
    PacienteDTO obtenerPorId(Long id);
    PacienteDTO registrar(PacienteDTO dto);
    PacienteDTO actualizar(Long id, PacienteDTO dto);
    void eliminarLogico(Long id);
    void reactivarPaciente(Long id);
}