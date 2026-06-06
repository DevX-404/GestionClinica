package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {
    
    boolean existsByCodigoColegiatura(String codigoColegiatura);

    // SEGUNDA CONSULTA JPQL REQUERIDA POR LA RÚBRICA
    @Query("SELECT m FROM Medico m WHERE m.specialty.idEspecialidad = :idEspecialidad AND m.estado = 'ACTIVO'")
    List<Medico> findMedicosByEspecialidad(@Param("idEspecialidad") Long idEspecialidad);
}
