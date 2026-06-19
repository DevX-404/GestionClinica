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

    @Autowired
    private CitaMedicaRepository citaRepository;
    @Autowired
    private PacienteRepository pacienteRepository;
    @Autowired
    private MedicoRepository medicoRepository;
    @Autowired
    private EspecialidadRepository especialidadRepository;
    @Autowired
    private PagoRepository pagoRepository;

    @Override
    @Transactional
    public CitaMedicaDTO programarCita(CitaMedicaDTO dto) {
        Paciente pac = pacienteRepository.findById(dto.getIdPaciente()).orElseThrow();
        Medico med = medicoRepository.findById(dto.getIdMedico()).orElseThrow();
        Especialidad esp = especialidadRepository.findById(dto.getIdEspecialidad()).orElseThrow();

        if (citaRepository.existeCitaMismoHorario(dto.getIdMedico(), dto.getFecha(), dto.getHora())) {
            throw new IllegalArgumentException("El médico no está disponible en ese horario.");
        }

        CitaMedica cita = new CitaMedica();
        cita.setPaciente(pac);
        cita.setMedico(med);
        cita.setEspecialidad(esp);
        cita.setFecha(dto.getFecha());
        cita.setHora(dto.getHora());
        cita.setMotivoConsulta(dto.getMotivoConsulta());
        
        // CORRECCIÓN 1: Respetamos el estado que Angular nos manda (Ej: CONFIRMADA si pagó el Yape)
        String estadoInicial = (dto.getEstado() != null && !dto.getEstado().trim().isEmpty()) 
                                ? dto.getEstado() : "PENDIENTE_PAGO";
        cita.setEstado(estadoInicial); 
        CitaMedica citaGuardada = citaRepository.save(cita);

        // --- LÓGICA DE NEGOCIO: GENERAR ADELANTO (30%) Y SALDO (70%) AL INSTANTE ---
        BigDecimal precioTotal = esp.getPrecioConsulta() != null ? esp.getPrecioConsulta() : new BigDecimal("150.00");
        BigDecimal adelanto = precioTotal.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal saldo = precioTotal.subtract(adelanto);

        // 1. Guardar la deuda del Adelanto (30%)
        Pago pagoAdelanto = new Pago();
        pagoAdelanto.setCita(citaGuardada);
        pagoAdelanto.setFechaPago(LocalDate.now());
        pagoAdelanto.setMonto(adelanto);
        pagoAdelanto.setConcepto("ADELANTO_30");
        
        // CORRECCIÓN 2: Si la cita entró como CONFIRMADA, liquidamos la deuda del 30% automáticamente
        if ("CONFIRMADA".equals(estadoInicial)) {
            pagoAdelanto.setEstadoPago("PAGADO");
            pagoAdelanto.setMetodoPago("YAPE");
        } else {
            pagoAdelanto.setEstadoPago("PENDIENTE");
            pagoAdelanto.setMetodoPago("POR DEFINIR");
        }
        pagoRepository.save(pagoAdelanto);

        // 2. Guardar la deuda del Saldo restante (70%)
        Pago pagoSaldo = new Pago();
        pagoSaldo.setCita(citaGuardada);
        pagoSaldo.setFechaPago(dto.getFecha()); // Se cobrará el día que el paciente asista
        pagoSaldo.setMonto(saldo);
        pagoSaldo.setMetodoPago("POR DEFINIR");
        pagoSaldo.setEstadoPago("PENDIENTE"); // El 70% SIEMPRE nace pendiente
        pagoSaldo.setConcepto("SALDO_70");
        pagoRepository.save(pagoSaldo);

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
        if ("ATENDIDA".equalsIgnoreCase(nuevoEstado)
            && !"EN_ESPERA".equals(cita.getEstado())) {

        throw new IllegalArgumentException(
                "La cita debe estar EN_ESPERA antes de ser atendida");
    }
    cita.setEstado(nuevoEstado.toUpperCase());
        return convertirADto(citaRepository.save(cita));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CitaMedicaDTO> listarPorMedico(Long idMedico, LocalDate fecha) {
        return citaRepository.findCitasValidasParaAgenda(idMedico, fecha)
                .stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    private CitaMedicaDTO convertirADto(CitaMedica cita) {
        CitaMedicaDTO dto = new CitaMedicaDTO();
        dto.setIdCita(cita.getIdCita());
        dto.setIdPaciente(cita.getPaciente().getIdPaciente());
        dto.setNombreCompletoPaciente(cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidoPaterno());
        dto.setDniPaciente(cita.getPaciente().getDni()); // --- NUEVO: DNI del paciente ---
        dto.setIdMedico(cita.getMedico().getIdMedico());
        dto.setNombreCompletoMedico(cita.getMedico().getNombres() + " " + cita.getMedico().getApellidoPaterno());
        dto.setIdEspecialidad(cita.getEspecialidad().getIdEspecialidad());
        dto.setNombreEspecialidad(cita.getEspecialidad().getNombre());
        dto.setFecha(cita.getFecha());
        dto.setHora(cita.getHora());
        dto.setEstado(cita.getEstado());
        dto.setMotivoConsulta(cita.getMotivoConsulta());
        if (cita.getMedico() != null && cita.getMedico().getUsuario() != null) {
            dto.setUsernameMedico(cita.getMedico().getUsuario().getUsername());
        }
        return dto;
    }
}
