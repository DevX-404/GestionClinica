package com.example.GestionClinica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class PacienteDTO {
    private Long idPaciente;

    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDocumento;

    @NotBlank(message = "El DNI es obligatorio")
    @Size(min = 8, max = 15, message = "El DNI debe tener entre 8 y 15 caracteres")
    private String dni;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;

    @NotBlank(message = "El apellido paterno es obligatorio")
    private String apellidoPaterno;

    @NotBlank(message = "El apellido materno es obligatorio")
    private String apellidoMaterno;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
    private LocalDate fechaNacimiento;

    @NotBlank(message = "El sexo es obligatorio")
    private String sexo;

    private String direccion;
    private String telefono;

    @Email(message = "El correo debe tener un formato válido")
    private String correo;

    private String estado;
}
