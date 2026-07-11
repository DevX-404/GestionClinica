package com.example.GestionClinica.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pacientes")
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPaciente;

    @NotBlank(message = "El tipo de documento es obligatorio")
    @Column(length = 20, nullable = false)
    private String tipoDocumento;

    @NotBlank(message = "El DNI/Documento es obligatorio")
    @Size(min = 8, max = 15, message = "El documento debe tener entre 8 y 15 caracteres")
    @Column(length = 15, nullable = false, unique = true)
    private String dni;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50)
    @Column(length = 50, nullable = false)
    private String nombres;

    @NotBlank(message = "El apellido paterno es obligatorio")
    @Size(max = 50)
    @Column(length = 50, nullable = false)
    private String apellidoPaterno;

    @Size(max = 50)
    @Column(length = 50)
    private String apellidoMaterno;

    @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
    @Column
    private LocalDate fechaNacimiento;

    @Size(max = 10)
    @Column(length = 10)
    private String sexo;

    @Size(max = 150)
    @Column(length = 150, nullable = true)
    private String direccion;

    @Size(max = 20)
    @Column(length = 20, nullable = true)
    private String telefono;

    @Email(message = "El correo debe tener un formato válido")
    @Column(length = 100, nullable = true)
    private String correo;

    @Column(length = 15, nullable = false)
    private String estado = "ACTIVO"; // Control de estado para borrado lógico
}
