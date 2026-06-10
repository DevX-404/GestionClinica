package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.HorarioMedicoDTO;
import java.util.List;

public interface HorarioMedicoService {
    List<HorarioMedicoDTO> listarPorMedico(Long idMedico);
    HorarioMedicoDTO registrar(HorarioMedicoDTO dto);
    HorarioMedicoDTO actualizar(Long id, HorarioMedicoDTO dto);
    void eliminarLogico(Long id);
}
