package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.CitaMedicaDTO;

import java.time.LocalDate;
import java.util.List;

public interface CitaMedicaService {
    CitaMedicaDTO programarCita(CitaMedicaDTO dto);
    List<CitaMedicaDTO> listarTodas();
    CitaMedicaDTO actualizarEstado(Long idCita, String nuevoEstado);
    List<CitaMedicaDTO> listarPorMedico(Long idMedico, LocalDate fecha);
}
