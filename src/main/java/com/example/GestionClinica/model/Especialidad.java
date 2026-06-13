package com.example.GestionClinica.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "especialidades")
public class Especialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEspecialidad;

    @NotBlank(message = "El nombre de la especialidad es obligatorio")
    @Size(max = 50)
    @Column(length = 50, nullable = false)
    private String nombre;

    @Size(max = 250)
    @Column(length = 250)
    private String descripcion;

    @Column(length = 15, nullable = false)
    private String estado = "ACTIVO";

    // Tarifario por especialidad, por ejemplo, el costo de una consulta.
    @Column( precision = 10, scale = 2)
    private java.math.BigDecimal precioConsulta = new java.math.BigDecimal("150.00");
}
