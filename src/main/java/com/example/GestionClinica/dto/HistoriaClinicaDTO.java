package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class HistoriaClinicaDTO {
    private Long idHistoriaClinica;
    private LocalDate fechaRegistro;
    private String antecedentes;
    private String alergias;
    private String observacionesGenerales;
    private Long idPaciente;
    private String nombreCompletoPaciente;   
}