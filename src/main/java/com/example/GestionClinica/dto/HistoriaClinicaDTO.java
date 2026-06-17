package com.example.GestionClinica.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class HistoriaClinicaDTO {
    private Long idHistoriaClinica;
    private LocalDate fechaRegistro;
    private String antecedentes;
    private String alergias;
    private String observacionesGenerales;
    private Long idPaciente;
    private String nombreCompletoPaciente;   
    private String dni; 
    private String numeroExpediente;

    private List<ConsultaResumen> consultasMedicas;
    @Data
    public static class ConsultaResumen {
        private LocalDate fechaConsulta;
        private String motivoConsulta;
        private String diagnosticoGeneral;
        private String tratamiento;
    }
}