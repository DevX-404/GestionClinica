package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.SolicitudDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Solicitud;
import com.example.GestionClinica.model.Usuario;
import com.example.GestionClinica.repository.SolicitudRepository;
import com.example.GestionClinica.repository.UsuarioRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SolicitudServiceImpl implements SolicitudService {

    @Autowired private SolicitudRepository solicitudRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SolicitudDTO> listarTodas() {
        return solicitudRepository.findAllByOrderByFechaSolicitudDesc().stream()
                .map(this::convertirADto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SolicitudDTO> listarPorUsuario(Long idUsuario) {
        return solicitudRepository.findByUsuario_IdUsuarioOrderByFechaSolicitudDesc(idUsuario).stream()
                .map(this::convertirADto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SolicitudDTO crearSolicitud(Long idUsuario, SolicitudDTO dto) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        Solicitud solicitud = new Solicitud();
        solicitud.setUsuario(usuario);
        solicitud.setTipo(dto.getTipo());
        solicitud.setDetalle(dto.getDetalle());
        solicitud.setEstado("PENDIENTE");
        
        return convertirADto(solicitudRepository.save(solicitud));
    }

    @Override
    @Transactional
    public SolicitudDTO responderSolicitud(Long idSolicitud, String estado, String respuesta) {
        Solicitud solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket no encontrado"));
        
        solicitud.setEstado(estado);
        solicitud.setRespuestaAdmin(respuesta);
        
        return convertirADto(solicitudRepository.save(solicitud));
    }

    private SolicitudDTO convertirADto(Solicitud s) {
        SolicitudDTO dto = new SolicitudDTO();
        BeanUtils.copyProperties(s, dto);
        dto.setIdUsuario(s.getUsuario().getIdUsuario());
        dto.setNombreUsuario(s.getUsuario().getNombreCompleto());
        dto.setRolUsuario(s.getUsuario().getRol().toString());
        return dto;
    }
}