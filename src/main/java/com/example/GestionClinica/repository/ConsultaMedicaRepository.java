package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.ConsultaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultaMedicaRepository extends JpaRepository<ConsultaMedica, Long> {
    List<ConsultaMedica> findByHistoriaClinicaIdHistoriaClinica(Long idHistoriaClinica);
}