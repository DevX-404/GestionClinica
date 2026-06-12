package com.example.GestionClinica.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPago;

    @Column(nullable = false)
    private LocalDate fechaPago;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(length = 20, nullable = false)
    private String metodoPago; // EFECTIVO, TARJETA, YAPE, PLIN

    @Column(length = 15, nullable = false)
    private String estadoPago = "PENDIENTE"; // PENDIENTE, PAGADO, ANULADO

    // Un pago corresponde a una cita médica
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cita", nullable = false)
    private CitaMedica cita;

    // Relación bidireccional con el comprobante (se crea al pagar)
    @OneToOne(mappedBy = "pago", cascade = CascadeType.ALL)
    private Comprobante comprobante;

    @Column(length = 30, nullable = false)
    private String concepto;
}
