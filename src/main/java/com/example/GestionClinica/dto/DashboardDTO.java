package com.example.GestionClinica.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DashboardDTO {
    private long totalPacientes;
    private long totalMedicos;
    private long citasHoy;
    private long citasPendientesHoy;
    private BigDecimal ingresosHoy;
}