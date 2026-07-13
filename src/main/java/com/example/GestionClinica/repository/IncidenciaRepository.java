package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, Long> {
    
    // Para que el Administrador de TI vea todas las fallas (Las más recientes primero)
    List<Incidencia> findAllByOrderByFechaReporteDesc();
    
    // Para que un usuario normal vea solo los bugs que él ha reportado
    List<Incidencia> findByUsuarioReporta_IdUsuarioOrderByFechaReporteDesc(Long idUsuario);
}