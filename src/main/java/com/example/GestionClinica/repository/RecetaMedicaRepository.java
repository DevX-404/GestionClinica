package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.RecetaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RecetaMedicaRepository extends JpaRepository<RecetaMedica, Long> {
    // Buscar la receta emitida en una consulta específica
    Optional<RecetaMedica> findByConsultaMedicaIdConsulta(Long idConsulta);
}
