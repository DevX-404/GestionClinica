package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.HistoriaClinicaDTO;

public interface HistoriaClinicaService {
    HistoriaClinicaDTO obtenerPorPacienteId(Long idPaciente);
    HistoriaClinicaDTO inicializarHistoriaAutomática(Long idPaciente);
    HistoriaClinicaDTO actualizarFichaGeneral(Long idHistoria, HistoriaClinicaDTO dto);
}
