package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.PagoDTO;
import java.util.List;

public interface PagoService {
    PagoDTO generarPagoPendiente(Long idCita); // Se llama automáticamente al confirmar una cita
    PagoDTO procesarPago(Long idPago, PagoDTO dto); // Cuando la recepcionista registra el abono
    List<PagoDTO> listarTodos();
    PagoDTO obtenerPorCita(Long idCita);
}
