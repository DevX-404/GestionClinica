package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.EspecialidadDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Especialidad;
import com.example.GestionClinica.repository.EspecialidadRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EspecialidadServiceImpl implements EspecialidadService {

    @Autowired
    private EspecialidadRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<EspecialidadDTO> listarTodas() {
        return repository.findAll().stream()
                .filter(e -> "ACTIVO".equals(e.getEstado()))
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EspecialidadDTO obtenerPorId(Long id) {
        Especialidad esp = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con ID: " + id));
        return convertirADto(esp);
    }

    @Override
    @Transactional
    public EspecialidadDTO registrar(EspecialidadDTO dto) {
        if (repository.existsByNombre(dto.getNombre())) {
            throw new IllegalArgumentException("Ya existe una especialidad con el nombre: " + dto.getNombre());
        }
        Especialidad esp = new Especialidad();
        BeanUtils.copyProperties(dto, esp);
        esp.setEstado("ACTIVO");
        return convertirADto(repository.save(esp));
    }

    @Override
    @Transactional
    public EspecialidadDTO actualizar(Long id, EspecialidadDTO dto) {
        Especialidad esp = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con ID: " + id));
        
        esp.setNombre(dto.getNombre());
        esp.setDescripcion(dto.getDescripcion());
        return convertirADto(repository.save(esp));
    }

    @Override
    @Transactional
    public void eliminarLogico(Long id) {
        Especialidad esp = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con ID: " + id));
        esp.setEstado("INACTIVO");
        repository.save(esp);
    }

    private EspecialidadDTO convertirADto(Especialidad esp) {
        EspecialidadDTO dto = new EspecialidadDTO();
        BeanUtils.copyProperties(esp, dto);
        return dto;
    }
}