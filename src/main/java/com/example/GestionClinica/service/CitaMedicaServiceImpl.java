package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.CitaMedicaDTO;
import com.example.GestionClinica.dto.CitaRegistroRapidoDTO;
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

    @Transactional(readOnly = true)
    public boolean validarDisponibilidad(Long idMedico, LocalDate fecha, java.time.LocalTime hora, String tipoCita) {
        return !citaRepository.existeChoqueDeHorario(idMedico, fecha, hora, tipoCita);
    }

    @Override
    @Transactional
    public CitaMedicaDTO programarCita(CitaMedicaDTO dto) {
        Paciente pac = pacienteRepository.findById(dto.getIdPaciente()).orElseThrow();
        Medico med = medicoRepository.findById(dto.getIdMedico()).orElseThrow();
        Especialidad esp = especialidadRepository.findById(dto.getIdEspecialidad()).orElseThrow();

        String tipo = dto.getTipoCita() != null ? dto.getTipoCita() : "CONSULTA";
        if (citaRepository.existeChoqueDeHorario(dto.getIdMedico(), dto.getFecha(), dto.getHora(), tipo)) {
            throw new IllegalArgumentException("El médico no está disponible para ese tipo de cita en ese horario.");
        }

        CitaMedica cita = new CitaMedica();
        cita.setPaciente(pac);
        cita.setMedico(med);
        cita.setEspecialidad(esp);
        cita.setFecha(dto.getFecha());
        cita.setHora(dto.getHora());
        cita.setMotivoConsulta(dto.getMotivoConsulta());
        cita.setTipoCita(tipo);
        
        String estadoInicial = (dto.getEstado() != null && !dto.getEstado().trim().isEmpty()) 
                                ? dto.getEstado() : "PENDIENTE_PAGO";
        cita.setEstado(estadoInicial); 
        CitaMedica citaGuardada = citaRepository.save(cita);

        BigDecimal precioTotal = esp.getPrecioConsulta() != null ? esp.getPrecioConsulta() : new BigDecimal("150.00");
        BigDecimal adelanto = precioTotal.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal saldo = precioTotal.subtract(adelanto);

        Pago pagoAdelanto = new Pago();
        pagoAdelanto.setCita(citaGuardada);
        pagoAdelanto.setFechaPago(LocalDate.now());
        pagoAdelanto.setMonto(adelanto);
        pagoAdelanto.setConcepto("ADELANTO_30");
        
        if ("CONFIRMADA".equals(estadoInicial)) {
            pagoAdelanto.setEstadoPago("PAGADO");
            pagoAdelanto.setMetodoPago("YAPE");
        } else {
            pagoAdelanto.setEstadoPago("PENDIENTE");
            pagoAdelanto.setMetodoPago("POR DEFINIR");
        }
        pagoRepository.save(pagoAdelanto);

        Pago pagoSaldo = new Pago();
        pagoSaldo.setCita(citaGuardada);
        pagoSaldo.setFechaPago(dto.getFecha()); 
        pagoSaldo.setMonto(saldo);
        pagoSaldo.setMetodoPago("POR DEFINIR");
        pagoSaldo.setEstadoPago("PENDIENTE"); 
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
        if ("ATENDIDA".equalsIgnoreCase(nuevoEstado) && !"EN_ESPERA".equals(cita.getEstado())) {
            throw new IllegalArgumentException("La cita debe estar EN_ESPERA antes de ser atendida");
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

    @Transactional(rollbackFor = Exception.class)
    public CitaMedicaDTO programarCitaRapida(com.example.GestionClinica.dto.CitaRegistroRapidoDTO dto) {

        // 1. Buscar el paciente por DNI o crearlo
        Paciente pac = pacienteRepository.findByDniActivo(dto.getDniPaciente())
        .orElseGet(() -> {
            Paciente nuevoPac = new Paciente();

            nuevoPac.setTipoDocumento("DNI");
            nuevoPac.setDni(dto.getDniPaciente());
            nuevoPac.setNombres(dto.getNombresPaciente());
            nuevoPac.setApellidoPaterno(dto.getApellidoPaterno());
            nuevoPac.setTelefono(dto.getTelefonoPaciente());

            // Validamos la fecha
            if (dto.getFechaNacimiento() != null && !dto.getFechaNacimiento().isEmpty()) {
                nuevoPac.setFechaNacimiento(LocalDate.parse(dto.getFechaNacimiento()));
            } else {
                nuevoPac.setFechaNacimiento(LocalDate.of(2000, 1, 1));
            }

            nuevoPac.setApellidoMaterno(dto.getApellidoMaterno() != null ? dto.getApellidoMaterno() : "");
            
            nuevoPac.setSexo("OTRO"); 
            
            nuevoPac.setDireccion("");
            nuevoPac.setCorreo("");
            nuevoPac.setEstado("ACTIVO");

            return pacienteRepository.save(nuevoPac);
        });

        // 2. Obtener médico y especialidad
        Medico med = medicoRepository.findById(dto.getIdMedico())
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado"));
        Especialidad esp = especialidadRepository.findById(dto.getIdEspecialidad())
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada"));

        // 3. Validar disponibilidad
        String tipo = dto.getTipoCita() != null ? dto.getTipoCita() : "CONSULTA";
        if (citaRepository.existeChoqueDeHorario(dto.getIdMedico(), dto.getFecha(), dto.getHora(), tipo)) {
            throw new IllegalArgumentException("El médico no está disponible para ese horario.");
        }

        // 4. Crear cita
        CitaMedica cita = new CitaMedica();
        cita.setPaciente(pac);
        cita.setMedico(med);
        cita.setEspecialidad(esp);
        cita.setFecha(dto.getFecha());
        cita.setHora(dto.getHora());
        cita.setMotivoConsulta(dto.getMotivoConsulta());
        cita.setTipoCita(tipo);
        cita.setEstado("CONFIRMADA");
        CitaMedica citaGuardada = citaRepository.save(cita);

        // 5. Pagos
        BigDecimal precioTotal = esp.getPrecioConsulta() != null ? esp.getPrecioConsulta() : new BigDecimal("150.00");
        BigDecimal adelanto = dto.getMontoPagadoAdelanto() != null ? dto.getMontoPagadoAdelanto() : precioTotal.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal saldo = precioTotal.subtract(adelanto);

        Pago pagoAdelanto = new Pago();
        pagoAdelanto.setCita(citaGuardada);
        pagoAdelanto.setFechaPago(LocalDate.now());
        pagoAdelanto.setMonto(adelanto);
        pagoAdelanto.setConcepto("ADELANTO_30");
        pagoAdelanto.setEstadoPago("PAGADO");
        pagoAdelanto.setMetodoPago("YAPE");
        pagoRepository.save(pagoAdelanto);

        Pago pagoSaldo = new Pago();
        pagoSaldo.setCita(citaGuardada);
        pagoSaldo.setFechaPago(dto.getFecha());
        pagoSaldo.setMonto(saldo);
        pagoSaldo.setConcepto("SALDO_70");
        pagoSaldo.setEstadoPago("PENDIENTE");
        pagoSaldo.setMetodoPago("POR DEFINIR");
        pagoRepository.save(pagoSaldo);

        return convertirADto(citaGuardada);
    }

    private CitaMedicaDTO convertirADto(CitaMedica cita) {
        CitaMedicaDTO dto = new CitaMedicaDTO();
        dto.setIdCita(cita.getIdCita());
        dto.setIdPaciente(cita.getPaciente().getIdPaciente());
        String nombreCompleto = String.join(" ",
        java.util.stream.Stream.of(
                cita.getPaciente().getNombres(),
                cita.getPaciente().getApellidoPaterno(),
                cita.getPaciente().getApellidoMaterno()
        )
        .filter(s -> s != null && !s.isBlank())
        .toList());

        dto.setNombreCompletoPaciente(nombreCompleto);
        dto.setDniPaciente(cita.getPaciente().getDni());
        dto.setIdMedico(cita.getMedico().getIdMedico());
        dto.setNombreCompletoMedico(cita.getMedico().getNombres() + " " + cita.getMedico().getApellidoPaterno());
        dto.setIdEspecialidad(cita.getEspecialidad().getIdEspecialidad());
        dto.setNombreEspecialidad(cita.getEspecialidad().getNombre());
        dto.setFecha(cita.getFecha());
        dto.setHora(cita.getHora());
        dto.setEstado(cita.getEstado());
        dto.setMotivoConsulta(cita.getMotivoConsulta());
        dto.setTipoCita(cita.getTipoCita());
        if (cita.getMedico() != null && cita.getMedico().getUsuario() != null) {
            dto.setUsernameMedico(cita.getMedico().getUsuario().getUsername());
        }
        return dto;
    }
}