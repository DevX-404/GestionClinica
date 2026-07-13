package com.example.GestionClinica.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "solicitudes")
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSolicitud;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario; // Quien hace la solicitud

    @Column(nullable = false, length = 50)
    private String tipo; // VACACIONES, RENUNCIA, CAMBIO_TURNO

    @Column(columnDefinition = "TEXT", nullable = false)
    private String detalle;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE"; // PENDIENTE, APROBADA, RECHAZADA

    @Column(columnDefinition = "TEXT")
    private String respuestaAdmin;

    @Column(nullable = false)
    private LocalDate fechaSolicitud = LocalDate.now();
}