package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    // Primera consulta personalizada usando JPQL requerida por la rúbrica
    @Query("SELECT p FROM Paciente p WHERE p.dni = :dni AND p.estado = 'ACTIVO'")
    Optional<Paciente> findByDniActivo(@Param("dni") String dni);

    boolean existsByDni(String dni);
}
