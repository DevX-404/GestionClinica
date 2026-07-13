package com.example.GestionClinica.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "incidencias")
public class Incidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idIncidencia;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Column(nullable = false, length = 50)
    private String tipo; // Ej: ERROR_INTERFAZ, FALLA_BASE_DATOS, SUGERENCIA

    @Column(nullable = false, length = 20)
    private String nivelGravedad; // Ej: BAJA, MEDIA, ALTA, CRITICA

    @Column(length = 255)
    private String urlFalla; // Para saber en qué pantalla exacta ocurrió el error

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_reporta", nullable = false)
    private Usuario usuarioReporta;

    @Column(columnDefinition = "TEXT")
    private String evidenciasJson; // Guardará arreglos de fotos en Base64

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String estado = "ABIERTO"; // ABIERTO, EN_PROGRESO, RESUELTO

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaReporte;

    private LocalDateTime fechaResolucion;

    @Column(columnDefinition = "TEXT")
    private String respuestaAdmin;
}