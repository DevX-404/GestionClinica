package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.MedicoDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Especialidad;
import com.example.GestionClinica.model.Medico;
import com.example.GestionClinica.repository.EspecialidadRepository;
import com.example.GestionClinica.repository.MedicoRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicoServiceImpl implements MedicoService {

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspecialidadRepository specialtyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MedicoDTO> listarTodos() {
        return medicoRepository.findAll().stream()
                .filter(m -> "ACTIVO".equals(m.getEstado()))
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MedicoDTO obtenerPorId(Long id) {
        Medico medico = medicoRepository.findById(id)
                .filter(m -> "ACTIVO".equals(m.getEstado()))
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con el ID: " + id));
        return convertirADto(medico);
    }

    @Override
    @Transactional
    public MedicoDTO registrar(MedicoDTO dto) {
        if (medicoRepository.existsByCodigoColegiatura(dto.getCodigoColegiatura())) {
            throw new IllegalArgumentException("El código de colegiatura ya está registrado.");
        }
        
        Especialidad esp = specialtyRepository.findById(dto.getIdEspecialidad())
                .orElseThrow(() -> new ResourceNotFoundException("La especialidad especificada no existe."));

        Medico medico = new Medico();
        BeanUtils.copyProperties(dto, medico);
        medico.setSpecialty(esp);
        medico.setEstado("ACTIVO");
        
        return convertirADto(medicoRepository.save(medico));
    }

    @Override
    @Transactional
    public MedicoDTO actualizar(Long id, MedicoDTO dto) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con el ID: " + id));

        if (!medico.getCodigoColegiatura().equals(dto.getCodigoColegiatura()) && 
            medicoRepository.existsByCodigoColegiatura(dto.getCodigoColegiatura())) {
            throw new IllegalArgumentException("El nuevo código de colegiatura ya está en uso.");
        }

        Especialidad esp = specialtyRepository.findById(dto.getIdEspecialidad())
                .orElseThrow(() -> new ResourceNotFoundException("La especialidad especificada no existe."));

        medico.setCodigoColegiatura(dto.getCodigoColegiatura());
        medico.setNombres(dto.getNombres());
        medico.setApellidoPaterno(dto.getApellidoPaterno());
        medico.setApellidoMaterno(dto.getApellidoMaterno());
        medico.setTelefono(dto.getTelefono());
        medico.setCorreo(dto.getCorreo());
        medico.setEstadoDisponibilidad(dto.getEstadoDisponibilidad());
        medico.setSpecialty(esp);

        return convertirADto(medicoRepository.save(medico));
    }

    @Override
    @Transactional
    public void eliminarLogico(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con el ID: " + id));
        medico.setEstado("INACTIVO");
        medicoRepository.save(medico);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicoDTO> listarPorEspecialidad(Long idEspecialidad) {
        return medicoRepository.findMedicosByEspecialidad(idEspecialidad).stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    private MedicoDTO convertirADto(Medico medico) {
        MedicoDTO dto = new MedicoDTO();
        BeanUtils.copyProperties(medico, dto);
        if (medico.getSpecialty() != null) {
            dto.setIdEspecialidad(medico.getSpecialty().getIdEspecialidad());
            dto.setNombreEspecialidad(medico.getSpecialty().getNombre());
        }
        return dto;
    }
}
