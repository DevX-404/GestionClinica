package com.example.GestionClinica.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "medicos")
public class Medico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMedico;

    @NotBlank(message = "El código de colegiatura es obligatorio")
    @Size(min = 4, max = 10, message = "El código de colegiatura debe tener entre 4 y 10 caracteres")
    @Column(length = 10, nullable = false, unique = true)
    private String codigoColegiatura;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50)
    @Column(length = 50, nullable = false)
    private String nombres;

    @NotBlank(message = "El apellido paterno es obligatorio")
    @Size(max = 50)
    @Column(length = 50, nullable = false)
    private String apellidoPaterno;

    @NotBlank(message = "El apellido materno es obligatorio")
    @Size(max = 50)
    @Column(length = 50, nullable = false)
    private String apellidoMaterno;

    @Size(max = 20)
    @Column(length = 20)
    private String telefono;

    @Email(message = "El correo debe tener un formato válido")
    @Column(length = 100)
    private String correo;

    @Column(length = 15, nullable = false)
    private String estado = "ACTIVO"; // Borrado lógico

    @NotBlank(message = "El estado de disponibilidad es obligatorio")
    @Column(length = 20, nullable = false)
    private String estadoDisponibilidad = "DISPONIBLE"; // DISPONIBLE, VACACIONES, LICENCIA

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_especialidad", nullable = false)
    private Especialidad specialty;
}