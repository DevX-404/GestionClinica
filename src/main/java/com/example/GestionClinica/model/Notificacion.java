package com.example.GestionClinica.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotificacion;

    // A quién va dirigida la notificación
    @Column(nullable = false)
    private Long idUsuarioDestino;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false, length = 255)
    private String mensaje;

    @Column(nullable = false)
    private String tipo; // INFO, SUCCESS, WARNING, ERROR

    @Column(nullable = false)
    private boolean leido = false;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
