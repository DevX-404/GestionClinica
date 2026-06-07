package com.example.GestionClinica.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "recetas_medicas")
public class RecetaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idReceta;

    @Column(nullable = false)
    private LocalDate fechaEmision = LocalDate.now();

    @Column(length = 255)
    private String observaciones;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_consulta", nullable = false, unique = true)
    private ConsultaMedica consultaMedica;

    @OneToMany(mappedBy = "recetaMedica", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<DetalleReceta> detalles = new ArrayList<>();
}
