package com.example.GestionClinica.service;

import com.example.GestionClinica.model.ConsultaMedica;
import java.util.List;

public interface ConsultaMedicaService {
    ConsultaMedica registrarAtencionMedica(Long idCita, String sintomas, String diagnostico, String tratamiento, String observaciones);
    List<ConsultaMedica> listarPorPaciente(Long idPaciente);
}
