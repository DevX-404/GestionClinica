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
        // 1. Validar que la cita exista
        CitaMedica cita = citaRepository.findById(idCita)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con ID: " + idCita));
//MODIFIQUE ACA PARA QUE NO SE PUEDA ATENDER UNA CITA CANCELADA O YA ATENDIDA
            if (cita.getEstado().equalsIgnoreCase("CANCELADA") || cita.getEstado().equalsIgnoreCase("ATENDIDA")) {
            throw new IllegalStateException("No se puede atender una cita en estado: " + cita.getEstado());
        }

        // 2. Obtener u optimizar la creación de la Historia Clínica del Paciente
        HistoriaClinica historia = historiaRepository.findByPacienteIdPaciente(cita.getPaciente().getIdPaciente())
                .orElseGet(() -> {
                    HistoriaClinica nuevaHistoria = new HistoriaClinica();
                    nuevaHistoria.setPaciente(cita.getPaciente());
                    return historiaRepository.save(nuevaHistoria);
                });

        // 3. Modificar el estado de la Cita Médica (Flujo de control de estados)
        cita.setEstado("ATENDIDA");
        citaRepository.save(cita);

        // 4. Instanciar y rellenar la Consulta Médica
        ConsultaMedica consulta = new ConsultaMedica();
        consulta.setFechaConsulta(LocalDate.now());
        consulta.setMotivoConsulta(cita.getMotivoConsulta());
        consulta.setSintomas(sintomas);
        consulta.setDiagnosticoGeneral(diagnostico);
        consulta.setObservaciones(observaciones);
        consulta.setHistoriaClinica(historia);
        consulta.setCitaMedica(cita);
        consulta.setMedico(cita.getMedico());

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
