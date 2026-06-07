package com.example.GestionClinica.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Entity
@Table(name = "detalles_recetas")
public class DetalleReceta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDetalleReceta;

    @NotBlank(message = "El medicamento es obligatorio")
    @Column(nullable = false, length = 100)
    private String medicamento;

    @NotBlank(message = "La dosis es obligatoria")
    @Column(nullable = false, length = 50)
    private String dosis;

    @NotBlank(message = "La frecuencia es obligatoria")
    @Column(nullable = false, length = 50)
    private String frecuencia;

    @NotBlank(message = "La duración es obligatoria")
    @Column(nullable = false, length = 50)
    private String duracion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_receta", nullable = false)
    @JsonIgnore
    private RecetaMedica recetaMedica;
}
