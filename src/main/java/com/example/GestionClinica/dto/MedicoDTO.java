package com.example.GestionClinica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MedicoDTO {
    private Long idMedico;
    
    @NotBlank(message = "El código de colegiatura es obligatorio")
    private String codigoColegiatura;

    private String rne;
    
    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;
    
    @NotBlank(message = "El apellido paterno es obligatorio")
    private String apellidoPaterno;
    
    @NotBlank(message = "El apellido materno es obligatorio")
    private String apellidoMaterno;

    @Pattern(regexp = "^(|[0-9]{9})$", message = "El teléfono debe tener exactamente 9 dígitos numéricos o estar vacío")
    private String telefono;

    
    @Email(message = "El correo debe tener un formato válido")
    private String correo;
    
    private String estado;
    private String estadoDisponibilidad;
    
    @NotNull(message = "El ID de la especialidad es obligatorio")
    private Long idEspecialidad;
    
    private String nombreEspecialidad; // Para mostrarlo fácil en las tablas de Angular
}
