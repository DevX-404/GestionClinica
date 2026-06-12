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

    @Autowired private PagoRepository pagoRepository;
    @Autowired private CitaMedicaRepository citaRepository;

    @Override
    @Transactional
    public PagoDTO procesarPago(Long idPago, PagoDTO dto) {
        Pago pago = pagoRepository.findById(idPago)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de pago no encontrado"));

        if ("PAGADO".equals(pago.getEstadoPago())) {
            throw new IllegalArgumentException("Este recibo ya se encuentra pagado.");
        }

        // 1. Actualizar y procesar el Pago actual
        pago.setMetodoPago(dto.getMetodoPago().toUpperCase());
        pago.setEstadoPago("PAGADO");
        pago.setFechaPago(LocalDate.now());

        // Generación de comprobante (tu código original intacto)
        Comprobante comp = new Comprobante();
        comp.setTipoComprobante(dto.getTipoComprobante().toUpperCase());
        comp.setFechaEmision(LocalDate.now());
        comp.setTotal(pago.getMonto());
        BigDecimal divisorIgv = new BigDecimal("1.18");
        BigDecimal subtotal = pago.getMonto().divide(divisorIgv, 2, RoundingMode.HALF_UP);
        comp.setSubtotal(subtotal);
        comp.setIgv(pago.getMonto().subtract(subtotal));
        comp.setPago(pago);
        String serie = comp.getTipoComprobante().equals("FACTURA") ? "F001" : "B001";
        comp.setNumeroComprobante(serie + "-" + String.format("%06d", pago.getIdPago() + 1000));
        pago.setComprobante(comp);

        // --- 2. AUTOMATIZACIÓN DEL FLUJO CLÍNICO ---
        CitaMedica cita = pago.getCita();
        
        if ("ADELANTO_30".equals(pago.getConcepto())) {
            // El paciente pagó la reserva. Confirmamos su cita para el médico.
            cita.setEstado("CONFIRMADA");
            citaRepository.save(cita);

            // Inmediatamente generamos el cobro del 70% para cuando llegue a la clínica
            BigDecimal precioTotal = cita.getEspecialidad().getPrecioConsulta();
            BigDecimal saldoRestante = precioTotal.subtract(pago.getMonto());

            Pago saldo = new Pago();
            saldo.setCita(cita);
            saldo.setFechaPago(cita.getFecha()); // Sugerimos la fecha de la cita para el pago
            saldo.setMonto(saldoRestante);
            saldo.setMetodoPago("POR DEFINIR");
            saldo.setEstadoPago("PENDIENTE");
            saldo.setConcepto("SALDO_70");
            pagoRepository.save(saldo);

        } else if ("SALDO_70".equals(pago.getConcepto())) {
            // El paciente pagó en ventanilla al llegar a la clínica.
            cita.setEstado("EN_ESPERA"); // Cambia de estado para que el médico sepa que ya llegó
            citaRepository.save(cita);
        }

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
        // Como ahora hay dos pagos, podríamos buscar el que esté PENDIENTE para cobrar en la UI
        // o devolver una lista (List<PagoDTO>). Por simplicidad para tu frontend actual:
        return pagoRepository.findAll().stream()
                .filter(p -> p.getCita().getIdCita().equals(idCita) && "PENDIENTE".equals(p.getEstadoPago()))
                .findFirst()
                .map(this::convertirADto)
                .orElseThrow(() -> new ResourceNotFoundException("No hay pagos pendientes para esta cita"));
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
        dto.setConcepto(pago.getConcepto());

        if (pago.getComprobante() != null) {
            dto.setTipoComprobante(pago.getComprobante().getTipoComprobante());
            dto.setNumeroComprobante(pago.getComprobante().getNumeroComprobante());
            dto.setSubtotal(pago.getComprobante().getSubtotal());
            dto.setIgv(pago.getComprobante().getIgv());
        }
        return dto;
    }
}
