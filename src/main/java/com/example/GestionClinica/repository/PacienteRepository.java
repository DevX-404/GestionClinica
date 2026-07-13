package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    @Query("SELECT p FROM Paciente p WHERE p.dni = :dni AND p.estado = 'ACTIVO'")
    Optional<Paciente> findByDniActivo(@Param("dni") String dni);

    boolean existsByDni(String dni);
    boolean existsByTelefono(String telefono);
    boolean existsByCorreo(String correo);
    
    long countByFechaRegistroGreaterThanEqual(LocalDate fecha);

    List<Paciente> findByEstado(String estado);
    
}
