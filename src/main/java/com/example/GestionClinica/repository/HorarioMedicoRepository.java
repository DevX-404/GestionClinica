package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.HorarioMedico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorarioMedicoRepository extends JpaRepository<HorarioMedico, Long> {
    
    // Obtener los horarios activos de un médico específico
    @Query("SELECT h FROM HorarioMedico h WHERE h.medico.idMedico = :idMedico AND h.estado = 'ACTIVO'")
    List<HorarioMedico> findHorariosActivosByMedico(@Param("idMedico") Long idMedico);
    
    // Validar si el médico ya tiene un horario registrado en un día específico que esté activo
    boolean existsByMedico_IdMedicoAndDiaSemanaAndEstado(Long idMedico, String diaSemana, String estado);
}