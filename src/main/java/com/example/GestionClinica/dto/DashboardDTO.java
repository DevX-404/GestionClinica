package com.example.GestionClinica.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardDTO {
    private long totalPacientes;
    private long totalMedicos;
    private long citasHoy;
    private long citasPendientesHoy;
    private BigDecimal ingresosHoy;

    private long citasCompletadasHoy;
    private long citasCanceladasHoy;
    private long nuevosPacientesMes;

    private List<CitaResumenDTO> proximasCitasHoy;
}