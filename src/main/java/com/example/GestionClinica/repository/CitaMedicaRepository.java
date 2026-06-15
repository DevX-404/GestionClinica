package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.CitaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface CitaMedicaRepository extends JpaRepository<CitaMedica, Long> {

   // CONSULTA JPQL CORREGIDA: Usando CASE WHEN EXISTS para mayor precisión
    @Query("SELECT CASE WHEN (COUNT(c) > 0) THEN true ELSE false END FROM CitaMedica c " +
           "WHERE c.medico.idMedico = :idMedico " +
           "AND c.fecha = :fecha " +
           "AND c.hora = :hora " +
           "AND c.estado NOT IN ('CANCELADA', 'ATENDIDA')")
    boolean existeCitaMismoHorario(@Param("idMedico") Long idMedico, 
                                   @Param("fecha") LocalDate fecha, 
                                   @Param("hora") LocalTime hora);

    // Listar citas de un paciente
    List<CitaMedica> findByPacienteIdPaciente(Long idPaciente);

    // Listar citas de un médico (Requisito del Rol de Médico en tu flujo)
    List<CitaMedica> findByMedicoIdMedico(Long idMedico);

    // Métricas para el Dashboard
    long countByFecha(LocalDate fecha);
    long countByFechaAndEstado(LocalDate fecha, String estado);
}