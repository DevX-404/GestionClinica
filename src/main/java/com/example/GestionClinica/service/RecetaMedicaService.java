package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.RecetaMedicaDTO;

public interface RecetaMedicaService {
    RecetaMedicaDTO generarReceta(RecetaMedicaDTO dto);
    RecetaMedicaDTO obtenerPorConsulta(Long idConsulta);
}
