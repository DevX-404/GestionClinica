package com.example.GestionClinica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MedicoDTO {
    private Long idMedico;
    
    @NotBlank(message = "El código de colegiatura es obligatorio")
    private String codigoColegiatura;
    
    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;
    
    @NotBlank(message = "El apellido paterno es obligatorio")
    private String apellidoPaterno;
    
    @NotBlank(message = "El apellido materno es obligatorio")
    private String apellidoMaterno;


    @NotBlank(message = "El teléfono es obligatorio")
    @Size(min = 9, max = 9, message = "El teléfono debe tener exactamente 9 dígitos")
    @Pattern(regexp = "^[0-9]+$", message = "El teléfono solo debe contener números")
    private String telefono;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo debe tener un formato válido")
    private String correo;
    
    private String estado;
    private String estadoDisponibilidad;
    
    @NotNull(message = "El ID de la especialidad es obligatorio")
    private Long idEspecialidad;
    
    private String nombreEspecialidad; // Para mostrarlo fácil en las tablas de Angular
}
