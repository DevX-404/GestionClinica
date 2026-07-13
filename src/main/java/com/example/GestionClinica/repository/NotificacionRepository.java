package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    // Trae las notificaciones de un usuario, las más recientes primero
    List<Notificacion> findByIdUsuarioDestinoOrderByFechaCreacionDesc(Long idUsuarioDestino);
    
    // Cuenta cuántas notificaciones no leídas tiene el usuario (Para la campanita roja)
    long countByIdUsuarioDestinoAndLeidoFalse(Long idUsuarioDestino);
}