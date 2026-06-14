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
                //.filter(e -> "ACTIVO".equals(e.getEstado())) impide que se muestren las inactivas, pero lo dejamos para que el filtro en frontend funcione
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
        if (repository.existsByNombreAndEstado(dto.getNombre(), "ACTIVO")) {
            throw new IllegalArgumentException("Ya existe una especialidad ACTIVA con el nombre: " + dto.getNombre());
        }
        
        Especialidad esp = new Especialidad();
        BeanUtils.copyProperties(dto, esp);
        esp.setEstado("ACTIVO");
        
        // BLINDAJE: Si el precio llega nulo desde el frontend, le forzamos el valor por defecto
        if (esp.getPrecioConsulta() == null) {
            esp.setPrecioConsulta(new java.math.BigDecimal("150.00"));
        }
        
        return convertirADto(repository.save(esp));
    }

    @Override
    @Transactional
    public EspecialidadDTO actualizar(Long id, EspecialidadDTO dto) {
        Especialidad esp = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con ID: " + id));
        
        esp.setNombre(dto.getNombre());
        esp.setDescripcion(dto.getDescripcion());
        // Necesitamos guardar el estado para que el botón "Restaurar" funcione
        if (dto.getEstado() != null) {
            esp.setEstado(dto.getEstado());
        }
        // Necesitamos guardar el precio por si lo editas
        if (dto.getPrecioConsulta() != null) {
            esp.setPrecioConsulta(dto.getPrecioConsulta());
        }
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