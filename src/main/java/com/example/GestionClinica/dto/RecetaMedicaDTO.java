package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class RecetaMedicaDTO {
    private Long idReceta;
    private LocalDate fechaEmision;
    private String observaciones;
    private Long idConsulta;
    private List<DetalleRecetaDTO> detalles;

    private String nombrePaciente;
    private String nombreMedico;
    private String dniPaciente;
}
