package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {
    Optional<HistoriaClinica> findByPacienteIdPaciente(Long idPaciente);
}
