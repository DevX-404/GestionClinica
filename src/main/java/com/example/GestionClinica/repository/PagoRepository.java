package com.example.GestionClinica.repository;

import com.example.GestionClinica.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    Optional<Pago> findByCitaIdCita(Long idCita);

    // Sumar todos los ingresos del día actual
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.fechaPago = :fecha AND p.estadoPago = 'PAGADO'")
    java.math.BigDecimal sumarIngresosPorFecha(@org.springframework.data.repository.query.Param("fecha") java.time.LocalDate fecha);
}
