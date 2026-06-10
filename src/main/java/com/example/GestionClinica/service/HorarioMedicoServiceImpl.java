package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.HorarioMedicoDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.HorarioMedico;
import com.example.GestionClinica.model.Medico;
import com.example.GestionClinica.repository.HorarioMedicoRepository;
import com.example.GestionClinica.repository.MedicoRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HorarioMedicoServiceImpl implements HorarioMedicoService {

    @Autowired
    private HorarioMedicoRepository horarioRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HorarioMedicoDTO> listarPorMedico(Long idMedico) {
        return horarioRepository.findHorariosActivosByMedico(idMedico).stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HorarioMedicoDTO registrar(HorarioMedicoDTO dto) {
        // Validación 1: Verificar que el médico exista
        Medico medico = medicoRepository.findById(dto.getIdMedico())
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con ID: " + dto.getIdMedico()));

        // Validación 2: Verificar si ya tiene horario ese día (opcional, dependiendo de si un médico atiende en turnos partidos)
        // Por simplicidad, asumiremos un turno por día (ej: Lunes de 08:00 a 14:00)
        if (horarioRepository.existsByMedico_IdMedicoAndDiaSemanaAndEstado(dto.getIdMedico(), dto.getDiaSemana().toUpperCase(), "ACTIVO")) {
            throw new IllegalArgumentException("El médico ya tiene un horario registrado para el día: " + dto.getDiaSemana());
        }
        
        // Validación 3: Lógica de horas (Hora de inicio debe ser anterior a la de fin)
        if (dto.getHoraInicio().isAfter(dto.getHoraFin())) {
             throw new IllegalArgumentException("La hora de inicio no puede ser posterior a la hora de fin.");
        }

        HorarioMedico horario = new HorarioMedico();
        BeanUtils.copyProperties(dto, horario);
        horario.setDiaSemana(dto.getDiaSemana().toUpperCase());
        horario.setMedico(medico);
        horario.setEstado("ACTIVO");

        return convertirADto(horarioRepository.save(horario));
    }

    @Override
    @Transactional
    public HorarioMedicoDTO actualizar(Long id, HorarioMedicoDTO dto) {
        HorarioMedico horario = horarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horario no encontrado con ID: " + id));
                
        if (dto.getHoraInicio().isAfter(dto.getHoraFin())) {
             throw new IllegalArgumentException("La hora de inicio no puede ser posterior a la hora de fin.");
        }

        horario.setHoraInicio(dto.getHoraInicio());
        horario.setHoraFin(dto.getHoraFin());
        // Generalmente, no se cambia el médico ni el día, si necesita otro día, se crea un horario nuevo o se borra el actual.

        return convertirADto(horarioRepository.save(horario));
    }

    @Override
    @Transactional
    public void eliminarLogico(Long id) {
        HorarioMedico horario = horarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horario no encontrado con ID: " + id));
        horario.setEstado("INACTIVO");
        horarioRepository.save(horario);
    }

    private HorarioMedicoDTO convertirADto(HorarioMedico horario) {
        HorarioMedicoDTO dto = new HorarioMedicoDTO();
        BeanUtils.copyProperties(horario, dto);
        if (horario.getMedico() != null) {
            dto.setIdMedico(horario.getMedico().getIdMedico());
            dto.setNombreMedico(horario.getMedico().getNombres() + " " + horario.getMedico().getApellidoPaterno());
        }
        return dto;
    }
}
