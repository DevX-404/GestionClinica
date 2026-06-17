package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.HistoriaClinicaDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.HistoriaClinica;
import com.example.GestionClinica.model.Paciente;
import com.example.GestionClinica.repository.HistoriaClinicaRepository;
import com.example.GestionClinica.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.util.List;

@Service
public class HistoriaClinicaServiceImpl implements HistoriaClinicaService {

    @Autowired private HistoriaClinicaRepository historiaRepository;
    @Autowired private PacienteRepository pacienteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HistoriaClinicaDTO> obtenerTodas() {
        return historiaRepository.findAll().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public HistoriaClinicaDTO obtenerPorPacienteId(Long idPaciente) {
        HistoriaClinica historia = historiaRepository.findByPacienteIdPaciente(idPaciente)
                .orElseThrow(() -> new ResourceNotFoundException("Historia clínica no encontrada para el paciente con ID: " + idPaciente));
        return convertirADto(historia);
    }

    @Override
    @Transactional
    public HistoriaClinicaDTO inicializarHistoriaAutomática(Long idPaciente) {
        Paciente paciente = pacienteRepository.findById(idPaciente)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con ID: " + idPaciente));

        // Validar si ya cuenta con un expediente asignado para evitar inconsistencias
        if (historiaRepository.findByPacienteIdPaciente(idPaciente).isPresent()) {
            throw new IllegalArgumentException("El paciente ya cuenta con una historia clínica registrada.");
        }

        HistoriaClinica historia = new HistoriaClinica();
        historia.setPaciente(paciente);
        historia.setFechaRegistro(LocalDate.now());
        historia.setAntecedentes("Ninguno registrado.");
        historia.setAlergias("Ninguna conocida.");
        historia.setObservacionesGenerales("Apertura inicial de expediente clínico.");

        return convertirADto(historiaRepository.save(historia));
    }

    @Override
    @Transactional
    public HistoriaClinicaDTO actualizarFichaGeneral(Long idHistoria, HistoriaClinicaDTO dto) {
        HistoriaClinica historia = historiaRepository.findById(idHistoria)
                .orElseThrow(() -> new ResourceNotFoundException("Historia clínica no encontrada con ID: " + idHistoria));

        // Actualizar únicamente las fichas descriptivas del expediente maestro
        historia.setAntecedentes(dto.getAntecedentes());
        historia.setAlergias(dto.getAlergias());
        historia.setObservacionesGenerales(dto.getObservacionesGenerales());

        return convertirADto(historiaRepository.save(historia));
    }

   private HistoriaClinicaDTO convertirADto(HistoriaClinica historia) {
        HistoriaClinicaDTO dto = new HistoriaClinicaDTO();
        dto.setIdHistoriaClinica(historia.getIdHistoriaClinica());
        dto.setFechaRegistro(historia.getFechaRegistro());
        dto.setAntecedentes(historia.getAntecedentes());
        dto.setAlergias(historia.getAlergias());
        dto.setObservacionesGenerales(historia.getObservacionesGenerales());
        
        Paciente p = historia.getPaciente();
        dto.setIdPaciente(p.getIdPaciente());
        dto.setNombreCompletoPaciente(p.getNombres() + " " + p.getApellidoPaterno());
        
        // --- AQUÍ ESTÁ TU LÓGICA NIVEL DIOS PARA EL EXPEDIENTE ---
        dto.setDni(p.getDni());
        
        String inicialNombre = p.getNombres() != null && !p.getNombres().isEmpty() ? p.getNombres().substring(0, 1).toUpperCase() : "X";
        String inicialApellido = p.getApellidoPaterno() != null && !p.getApellidoPaterno().isEmpty() ? p.getApellidoPaterno().substring(0, 1).toUpperCase() : "X";
        
        dto.setNumeroExpediente("EXP-" + inicialNombre + inicialApellido + p.getDni());

        if (historia.getConsultasMedicas() != null) {
            List<HistoriaClinicaDTO.ConsultaResumen> resumenConsultas = historia.getConsultasMedicas().stream()
                .map(consulta -> {
                    HistoriaClinicaDTO.ConsultaResumen resumen = new HistoriaClinicaDTO.ConsultaResumen();
                    resumen.setFechaConsulta(consulta.getFechaConsulta());
                    resumen.setMotivoConsulta(consulta.getMotivoConsulta());
                    resumen.setDiagnosticoGeneral(consulta.getDiagnosticoGeneral());
                    resumen.setTratamiento(consulta.getTratamiento());
                    return resumen;
                }).collect(Collectors.toList());
            dto.setConsultasMedicas(resumenConsultas);
        }

        return dto;
    }
}
