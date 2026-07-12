package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.DashboardDTO;
import com.example.GestionClinica.repository.CitaMedicaRepository;
import com.example.GestionClinica.repository.MedicoRepository;
import com.example.GestionClinica.repository.PacienteRepository;
import com.example.GestionClinica.repository.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;


@Service
public class DashboardService {

    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private MedicoRepository medicoRepository;
    @Autowired private CitaMedicaRepository citaRepository;
    @Autowired private PagoRepository pagoRepository;

    public DashboardDTO obtenerMetricasGlobales() {
        DashboardDTO metrics = new DashboardDTO();
        LocalDate hoy = LocalDate.now();

        metrics.setTotalPacientes(pacienteRepository.count());
        metrics.setTotalMedicos(medicoRepository.count());
        metrics.setCitasHoy(citaRepository.countByFecha(hoy));
        metrics.setCitasPendientesHoy(citaRepository.countByFechaAndEstado(hoy, "PENDIENTE"));
        metrics.setIngresosHoy(pagoRepository.sumarIngresosPorFecha(hoy));

        metrics.setCitasCompletadasHoy(citaRepository.countByFechaAndEstado(hoy, "COMPLETADA"));
        metrics.setCitasCanceladasHoy(citaRepository.countByFechaAndEstado(hoy, "CANCELADA"));

        LocalDate inicioMes = hoy.withDayOfMonth(1);
        metrics.setNuevosPacientesMes(pacienteRepository.countByFechaRegistroGreaterThanEqual(inicioMes));

        return metrics;
    }
}
