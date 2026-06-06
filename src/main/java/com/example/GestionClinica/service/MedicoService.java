package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.MedicoDTO;
import java.util.List;

public interface MedicoService {
    List<MedicoDTO> listarTodos();
    MedicoDTO obtenerPorId(Long id);
    MedicoDTO registrar(MedicoDTO dto);
    MedicoDTO actualizar(Long id, MedicoDTO dto);
    void eliminarLogico(Long id);
    List<MedicoDTO> listarPorEspecialidad(Long idEspecialidad);
}
