package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.NotificacionDTO;
import com.example.GestionClinica.model.Notificacion;
import com.example.GestionClinica.repository.NotificacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificacionServiceImpl implements NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificacionDTO> listarPorUsuario(Long idUsuarioDestino) {
        return notificacionRepository.findByIdUsuarioDestinoOrderByFechaCreacionDesc(idUsuarioDestino)
                .stream().map(this::convertirADto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void marcarComoLeida(Long idNotificacion) {
        notificacionRepository.findById(idNotificacion).ifPresent(notif -> {
            notif.setLeido(true);
            notificacionRepository.save(notif);
        });
    }

    @Override
    @Transactional
    public void crearNotificacion(Long idUsuarioDestino, String titulo, String mensaje, String tipo) {
        Notificacion notif = new Notificacion();
        notif.setIdUsuarioDestino(idUsuarioDestino);
        notif.setTitulo(titulo);
        notif.setMensaje(mensaje);
        notif.setTipo(tipo);
        notificacionRepository.save(notif);
    }

    private NotificacionDTO convertirADto(Notificacion n) {
        NotificacionDTO dto = new NotificacionDTO();
        dto.setIdNotificacion(n.getIdNotificacion());
        dto.setIdUsuarioDestino(n.getIdUsuarioDestino());
        dto.setTitulo(n.getTitulo());
        dto.setMensaje(n.getMensaje());
        dto.setTipo(n.getTipo());
        dto.setLeido(n.isLeido());
        dto.setFechaCreacion(n.getFechaCreacion());
        return dto;
    }
}