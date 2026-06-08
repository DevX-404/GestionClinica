package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.EspecialidadDTO;
import java.util.List;

public interface EspecialidadService {
    List<EspecialidadDTO> listarTodas();
    EspecialidadDTO obtenerPorId(Long id);
    EspecialidadDTO registrar(EspecialidadDTO dto);
    EspecialidadDTO actualizar(Long id, EspecialidadDTO dto);
    void eliminarLogico(Long id);
}
