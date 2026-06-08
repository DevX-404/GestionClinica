package com.example.GestionClinica.dto;

import lombok.Data;

@Data
public class EspecialidadDTO {
    private Long idEspecialidad;
    private String nombre;
    private String descripcion;
    private String estado;
}
