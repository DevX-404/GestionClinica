package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Especialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EspecialidadRepository extends JpaRepository<Especialidad, Long> {
    boolean existsByNombreAndEstado(String nombre, String estado);
}
