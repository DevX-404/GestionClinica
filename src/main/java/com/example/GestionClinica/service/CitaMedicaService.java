package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.CitaMedicaDTO;

import java.time.LocalDate;
import java.util.List;

public interface CitaMedicaService {
    CitaMedicaDTO programarCita(CitaMedicaDTO dto);
    CitaMedicaDTO programarCitaRapida(com.example.GestionClinica.dto.CitaRegistroRapidoDTO dto);
    List<CitaMedicaDTO> listarTodas();
    CitaMedicaDTO actualizarEstado(Long idCita, String nuevoEstado);
    CitaMedicaDTO reprogramarCita(Long idCita, String nuevaFecha, String nuevaHora);
    List<CitaMedicaDTO> listarPorMedico(Long idMedico, LocalDate fecha);
}
