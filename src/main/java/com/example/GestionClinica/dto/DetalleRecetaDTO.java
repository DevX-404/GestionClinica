package com.example.GestionClinica.dto;

import lombok.Data;

@Data
public class DetalleRecetaDTO {
    private Long idDetalleReceta;
    private String medicamento;
    private String dosis;
    private String frecuencia;
    private String duracion;
}