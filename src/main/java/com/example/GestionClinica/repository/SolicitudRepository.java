package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {
    List<Solicitud> findByUsuario_IdUsuarioOrderByFechaSolicitudDesc(Long idUsuario);
    List<Solicitud> findAllByOrderByFechaSolicitudDesc();
}