package com.example.GestionClinica.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "auditoria")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAuditoria;

    @Column(nullable = false, length = 100)
    private String accion;

    @Column(nullable = false, length = 100)
    private String entidad;

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    @Column(nullable = false, length = 100)
    private String username; // Guardamos el usuario del JWT

    @Column(columnDefinition = "TEXT")
    private String detalle;
}
