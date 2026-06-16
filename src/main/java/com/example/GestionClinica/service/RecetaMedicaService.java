package com.example.GestionClinica.service;
import java.util.List;
import com.example.GestionClinica.dto.RecetaMedicaDTO;

public interface RecetaMedicaService {
    RecetaMedicaDTO generarReceta(RecetaMedicaDTO dto);
    RecetaMedicaDTO obtenerPorConsulta(Long idConsulta);
    List<RecetaMedicaDTO> listarTodas();
}
