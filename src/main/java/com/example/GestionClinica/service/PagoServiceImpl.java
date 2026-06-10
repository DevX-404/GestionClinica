package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.PagoDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.CitaMedica;
import com.example.GestionClinica.model.Comprobante;
import com.example.GestionClinica.model.Pago;
import com.example.GestionClinica.repository.CitaMedicaRepository;
import com.example.GestionClinica.repository.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PagoServiceImpl implements PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private CitaMedicaRepository citaRepository;

    // Tarifa base de consulta médica (Podría venir de la Especialidad en el futuro)
    private static final BigDecimal TARIFA_CONSULTA = new BigDecimal("150.00");

    @Override
    @Transactional
    public PagoDTO generarPagoPendiente(Long idCita) {
        CitaMedica cita = citaRepository.findById(idCita)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));

        // Verificamos si ya tiene un pago pendiente
        return pagoRepository.findByCitaIdCita(idCita)
                .map(this::convertirADto)
                .orElseGet(() -> {
                    Pago nuevoPago = new Pago();
                    nuevoPago.setCita(cita);
                    nuevoPago.setFechaPago(LocalDate.now());
                    nuevoPago.setMonto(TARIFA_CONSULTA);
                    nuevoPago.setMetodoPago("POR DEFINIR");
                    nuevoPago.setEstadoPago("PENDIENTE");
                    return convertirADto(pagoRepository.save(nuevoPago));
                });
    }

    @Override
    @Transactional
    public PagoDTO procesarPago(Long idPago, PagoDTO dto) {
        Pago pago = pagoRepository.findById(idPago)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de pago no encontrado"));

        if ("PAGADO".equals(pago.getEstadoPago())) {
            throw new IllegalArgumentException("Esta cita ya se encuentra pagada.");
        }

        // 1. Actualizar el Pago
        pago.setMetodoPago(dto.getMetodoPago().toUpperCase());
        pago.setEstadoPago("PAGADO");
        pago.setFechaPago(LocalDate.now());

        // 2. Generar el Comprobante (Factura o Boleta)
        Comprobante comp = new Comprobante();
        comp.setTipoComprobante(dto.getTipoComprobante().toUpperCase());
        comp.setFechaEmision(LocalDate.now());
        comp.setTotal(pago.getMonto());

        // Calcular Subtotal e IGV (18%)
        // Total = Subtotal * 1.18  => Subtotal = Total / 1.18
        BigDecimal divisorIgv = new BigDecimal("1.18");
        BigDecimal subtotal = pago.getMonto().divide(divisorIgv, 2, RoundingMode.HALF_UP);
        BigDecimal igv = pago.getMonto().subtract(subtotal);

        comp.setSubtotal(subtotal);
        comp.setIgv(igv);
        comp.setPago(pago);

        // Simulador de Correlativo (Ej: B001-00012)
        String serie = comp.getTipoComprobante().equals("FACTURA") ? "F001" : "B001";
        // En producción contarías en base de datos. Usamos el ID del pago + 1000 para simular correlativo
        comp.setNumeroComprobante(serie + "-" + String.format("%06d", pago.getIdPago() + 1000));

        pago.setComprobante(comp);

        return convertirADto(pagoRepository.save(pago));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PagoDTO> listarTodos() {
        return pagoRepository.findAll().stream().map(this::convertirADto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagoDTO obtenerPorCita(Long idCita) {
        Pago pago = pagoRepository.findByCitaIdCita(idCita)
                .orElseThrow(() -> new ResourceNotFoundException("No hay pagos asociados a esta cita"));
        return convertirADto(pago);
    }

    private PagoDTO convertirADto(Pago pago) {
        PagoDTO dto = new PagoDTO();
        dto.setIdPago(pago.getIdPago());
        dto.setIdCita(pago.getCita().getIdCita());
        dto.setNombrePaciente(pago.getCita().getPaciente().getNombres() + " " + pago.getCita().getPaciente().getApellidoPaterno());
        dto.setFechaPago(pago.getFechaPago());
        dto.setMonto(pago.getMonto());
        dto.setMetodoPago(pago.getMetodoPago());
        dto.setEstadoPago(pago.getEstadoPago());

        if (pago.getComprobante() != null) {
            dto.setTipoComprobante(pago.getComprobante().getTipoComprobante());
            dto.setNumeroComprobante(pago.getComprobante().getNumeroComprobante());
            dto.setSubtotal(pago.getComprobante().getSubtotal());
            dto.setIgv(pago.getComprobante().getIgv());
        }
        return dto;
    }
}
