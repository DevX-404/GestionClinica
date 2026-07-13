package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.IncidenciaDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Incidencia;
import com.example.GestionClinica.model.Usuario;
import com.example.GestionClinica.repository.IncidenciaRepository;
import com.example.GestionClinica.repository.UsuarioRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IncidenciaServiceImpl implements IncidenciaService {

    @Autowired private IncidenciaRepository incidenciaRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<IncidenciaDTO> listarTodas() {
        return incidenciaRepository.findAllByOrderByFechaReporteDesc().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidenciaDTO> listarPorUsuario(Long idUsuario) {
        return incidenciaRepository.findByUsuarioReporta_IdUsuarioOrderByFechaReporteDesc(idUsuario).stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public IncidenciaDTO registrarIncidencia(Long idUsuario, IncidenciaDTO dto) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + idUsuario));

        Incidencia incidencia = Incidencia.builder()
                .titulo(dto.getTitulo())
                .descripcion(dto.getDescripcion())
                .tipo(dto.getTipo())
                .nivelGravedad(dto.getNivelGravedad())
                .urlFalla(dto.getUrlFalla())
                .usuarioReporta(usuario)
                .evidenciasJson(dto.getEvidenciasJson())
                .estado("ABIERTO") // Estado inicial por defecto
                .build();

        return convertirADto(incidenciaRepository.save(incidencia));
    }

    @Override
    @Transactional
    public IncidenciaDTO cambiarEstadoYResponder(Long idIncidencia, String nuevoEstado, String respuestaAdmin) {
        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new ResourceNotFoundException("Incidencia no encontrada con ID: " + idIncidencia));

        incidencia.setEstado(nuevoEstado.toUpperCase());
        incidencia.setRespuestaAdmin(respuestaAdmin);

        // Si se marca como RESUELTO, registramos la fecha de solución
        if ("RESUELTO".equalsIgnoreCase(nuevoEstado)) {
            incidencia.setFechaResolucion(LocalDateTime.now());
        } else {
            incidencia.setFechaResolucion(null); // Si se reabre, limpiamos la fecha
        }

        return convertirADto(incidenciaRepository.save(incidencia));
    }

    // Mapper manual limpio y ligero
    private IncidenciaDTO convertirADto(Incidencia incidencia) {
        IncidenciaDTO dto = new IncidenciaDTO();
        BeanUtils.copyProperties(incidencia, dto);
        
        if (incidencia.getUsuarioReporta() != null) {
            dto.setIdUsuarioReporta(incidencia.getUsuarioReporta().getIdUsuario());
            dto.setNombreUsuarioReporta(incidencia.getUsuarioReporta().getNombreCompleto());
            dto.setRolUsuarioReporta(incidencia.getUsuarioReporta().getRol().name());
        }
        return dto;
    }
}