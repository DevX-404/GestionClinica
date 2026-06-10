package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    // Para mostrar los más recientes primero
    List<Auditoria> findAllByOrderByFechaHoraDesc(); 
}
