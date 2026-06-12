package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.CitaMedicaDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.*;
import com.example.GestionClinica.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class CitaMedicaServiceImpl implements CitaMedicaService {

    @Autowired private CitaMedicaRepository citaRepository;
    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private MedicoRepository medicoRepository;
    @Autowired private EspecialidadRepository especialidadRepository;
    @Autowired private PagoRepository pagoRepository;

    @Override
    @Transactional
    public CitaMedicaDTO programarCita(CitaMedicaDTO dto) {
        // 1. Validar que existan los componentes de la cita
        Paciente pac = pacienteRepository.findById(dto.getIdPaciente())
            .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));
        Medico med = medicoRepository.findById(dto.getIdMedico())
            .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado"));
        Especialidad esp = especialidadRepository.findById(dto.getIdEspecialidad())
            .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada"));

        // 2. Controlar la regla de negocio: Disponibilidad horaria (JPQL)
        if (citaRepository.existeCitaMismoHorario(dto.getIdMedico(), dto.getFecha(), dto.getHora())) {
            throw new IllegalArgumentException("El médico no se encuentra disponible en la fecha y hora seleccionada.");
        }

        CitaMedica cita = new CitaMedica();
        cita.setPaciente(pac);
        cita.setMedico(med);
        cita.setEspecialidad(esp);
        cita.setFecha(dto.getFecha());
        cita.setHora(dto.getHora());
        cita.setMotivoConsulta(dto.getMotivoConsulta());
        cita.setEstado("PENDIENTE_PAGO");

        CitaMedica citaGuardada = citaRepository.save(cita);

        // --- LÓGICA DE NEGOCIO: GENERAR ADELANTO (30%) ---
        BigDecimal precioTotal = esp.getPrecioConsulta() != null ? esp.getPrecioConsulta() : new BigDecimal("150.00");
        BigDecimal adelanto = precioTotal.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);

        Pago pagoAdelanto = new Pago();
        pagoAdelanto.setCita(citaGuardada);
        pagoAdelanto.setFechaPago(LocalDate.now());
        pagoAdelanto.setMonto(adelanto);
        pagoAdelanto.setMetodoPago("POR DEFINIR");
        pagoAdelanto.setEstadoPago("PENDIENTE");
        pagoAdelanto.setConcepto("ADELANTO_30");
        pagoRepository.save(pagoAdelanto);

        return convertirADto(citaGuardada);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CitaMedicaDTO> listarTodas() {
        return citaRepository.findAll().stream().map(this::convertirADto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CitaMedicaDTO actualizarEstado(Long idCita, String nuevoEstado) {
        CitaMedica cita = citaRepository.findById(idCita)
            .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
        cita.setEstado(nuevoEstado.toUpperCase());
        return convertirADto(citaRepository.save(cita));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CitaMedicaDTO> listarPorMedico(Long idMedico) {
        return citaRepository.findByMedicoIdMedico(idMedico).stream().map(this::convertirADto).collect(Collectors.toList());
    }

    private CitaMedicaDTO convertirADto(CitaMedica cita) {
        CitaMedicaDTO dto = new CitaMedicaDTO();
        dto.setIdCita(cita.getIdCita());
        dto.setIdPaciente(cita.getPaciente().getIdPaciente());
        dto.setNombreCompletoPaciente(cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidoPaterno());
        dto.setIdMedico(cita.getMedico().getIdMedico());
        dto.setNombreCompletoMedico(cita.getMedico().getNombres() + " " + cita.getMedico().getApellidoPaterno());
        dto.setIdEspecialidad(cita.getEspecialidad().getIdEspecialidad());
        dto.setNombreEspecialidad(cita.getEspecialidad().getNombre());
        dto.setFecha(cita.getFecha());
        dto.setHora(cita.getHora());
        dto.setEstado(cita.getEstado());
        dto.setMotivoConsulta(cita.getMotivoConsulta());
        return dto;
    }
}
