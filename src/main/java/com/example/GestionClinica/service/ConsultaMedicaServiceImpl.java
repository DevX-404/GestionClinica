package com.example.GestionClinica.service;

import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.*;
import com.example.GestionClinica.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class ConsultaMedicaServiceImpl implements ConsultaMedicaService {

    @Autowired private ConsultaMedicaRepository consultaRepository;
    @Autowired private CitaMedicaRepository citaRepository;
    @Autowired private HistoriaClinicaRepository historiaRepository;

    @Override
    @Transactional
    public ConsultaMedica registrarAtencionMedica(Long idCita, String sintomas, String diagnostico, String observaciones , String tratamiento) {
        CitaMedica cita = citaRepository.findById(idCita)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con ID: " + idCita));
                
        if (!"EN_ESPERA".equals(cita.getEstado()) && !"CONFIRMADA".equals(cita.getEstado())) {
            throw new IllegalArgumentException("No se puede atender. El paciente no ha confirmado su asistencia o pago en recepción.");
        }

        HistoriaClinica historia = historiaRepository.findByPacienteIdPaciente(cita.getPaciente().getIdPaciente())
                .orElseGet(() -> {
                    HistoriaClinica nuevaHistoria = new HistoriaClinica();
                    nuevaHistoria.setPaciente(cita.getPaciente());
                    return historiaRepository.save(nuevaHistoria);
                });

        cita.setEstado("ATENDIDA");
        citaRepository.save(cita);

        ConsultaMedica consulta = new ConsultaMedica();
        consulta.setFechaConsulta(LocalDate.now());
        
        // --- SOLUCIÓN ERROR 500 (BASE DE DATOS) ---
        // Si la cita original no tenía motivo, le asignamos uno para que el @NotBlank no explote.
        String motivo = cita.getMotivoConsulta();
        if (motivo == null || motivo.trim().isEmpty()) {
            motivo = "Atención médica en consultorio";
        }
        consulta.setMotivoConsulta(motivo);
        
        consulta.setSintomas(sintomas);
        consulta.setDiagnosticoGeneral(diagnostico);
        consulta.setObservaciones(observaciones);
        consulta.setHistoriaClinica(historia);
        consulta.setCitaMedica(cita);
        consulta.setMedico(cita.getMedico());
        consulta.setTratamiento(tratamiento);

        return consultaRepository.save(consulta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultaMedica> listarPorPaciente(Long idPaciente) {
        HistoriaClinica historia = historiaRepository.findByPacienteIdPaciente(idPaciente)
                .orElseThrow(() -> new ResourceNotFoundException("Historia clínica no encontrada"));
        return consultaRepository.findByHistoriaClinicaIdHistoriaClinica(historia.getIdHistoriaClinica());
    }
}