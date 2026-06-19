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
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PagoServiceImpl implements PagoService {

    @Autowired
    private PagoRepository pagoRepository;
    
    @Autowired
    private CitaMedicaRepository citaRepository; // Necesario para cambiar el estado de la cita

    @Override
    @Transactional(readOnly = true)
    public List<PagoDTO> listarTodos() {
        return pagoRepository.findAll().stream().map(this::convertirADto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagoDTO obtenerPorCita(Long idCita) {
        return pagoRepository.findAll().stream()
                .filter(p -> p.getCita() != null && p.getCita().getIdCita().equals(idCita))
                .map(this::convertirADto)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró registro de pago para la cita: " + idCita));
    }

    @Override
    @Transactional
    public PagoDTO procesarPago(Long idPago, PagoDTO dto) {
        Pago pago = pagoRepository.findById(idPago)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        // 1. Actualizamos el pago actual a PAGADO
        pago.setMetodoPago(dto != null && dto.getMetodoPago() != null ? dto.getMetodoPago() : "EFECTIVO");
        pago.setEstadoPago("PAGADO");
        pago.setFechaPago(LocalDate.now());
        pago.setHoraPago(LocalTime.now());

        // 2. Generamos el Comprobante (Boleta o Factura)
        String tipoComp = (dto != null && dto.getTipoComprobante() != null) ? dto.getTipoComprobante() : "BOLETA";
        String prefix = tipoComp.equalsIgnoreCase("FACTURA") ? "F001-" : "B001-";
        
        Comprobante comprobante = new Comprobante();
        comprobante.setTipoComprobante(tipoComp);
        comprobante.setNumeroComprobante(prefix + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        comprobante.setFechaEmision(LocalDate.now());
        
        BigDecimal total = pago.getMonto() != null ? pago.getMonto() : BigDecimal.ZERO;
        BigDecimal subtotal = total.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        BigDecimal igv = total.subtract(subtotal);

        comprobante.setTotal(total);
        comprobante.setSubtotal(subtotal);
        comprobante.setIgv(igv);
        
        comprobante.setPago(pago);
        pago.setComprobante(comprobante);

        // Guardamos este pago específico para que quede asentado en caja
        Pago pagoGuardado = pagoRepository.save(pago);

        // 3. LA MAGIA DE LOS 2 PAGOS (30% y 70%)
        if (pagoGuardado.getCita() != null && pagoGuardado.getCita().getIdCita() != null) {
            CitaMedica citaAActualizar = citaRepository.findById(pagoGuardado.getCita().getIdCita())
                    .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada"));
            
            // Buscamos cuántos recibos de pago tiene esta cita en total
            List<Pago> pagosDeLaCita = pagoRepository.findByCita_IdCita(citaAActualizar.getIdCita());
            
            long totalPagosGenerados = pagosDeLaCita.size();
            long pagosPagados = pagosDeLaCita.stream()
                    .filter(p -> "PAGADO".equals(p.getEstadoPago()))
                    .count();

            // Evaluamos si ya canceló todo o solo la reserva
            if (totalPagosGenerados > 0 && totalPagosGenerados == pagosPagados) {
                // Pagó el 100% de la cita -> ¡Directo con el doctor!
                citaAActualizar.setEstado("EN_ESPERA");
            } else if (pagosPagados > 0) {
                // Solo pagó la primera parte -> Cita apartada, pero no pasa al consultorio aún
                citaAActualizar.setEstado("CONFIRMADA");
            } else {
                // No ha pagado nada
                citaAActualizar.setEstado("PENDIENTE_PAGO");
            }

            citaRepository.save(citaAActualizar);
            pagoGuardado.setCita(citaAActualizar);
        }

        return convertirADto(pagoGuardado);
    }

    // --- TRADUCCIÓN HACIA ANGULAR ---
    private PagoDTO convertirADto(Pago pago) {
        PagoDTO dto = new PagoDTO();
        dto.setIdPago(pago.getIdPago());
        dto.setFechaPago(pago.getFechaPago());
        dto.setHoraPago(pago.getHoraPago());
        
        dto.setMonto(pago.getMonto() != null ? pago.getMonto().doubleValue() : 0.0);
        dto.setMetodoPago(pago.getMetodoPago());
        dto.setEstadoPago(pago.getEstadoPago());
        dto.setConcepto(pago.getConcepto());
        
        if (pago.getComprobante() != null) {
            dto.setNumeroComprobante(pago.getComprobante().getNumeroComprobante());
            if (pago.getComprobante().getTipoComprobante() != null) {
                dto.setTipoComprobante(pago.getComprobante().getTipoComprobante());
            }
        } else {
            dto.setNumeroComprobante("Por Emitir");
        }

        if (pago.getCita() != null) {
            dto.setIdCita(pago.getCita().getIdCita());
            dto.setEstadoCita(pago.getCita().getEstado());
            
            if (pago.getCita().getPaciente() != null) {
                String nombres = pago.getCita().getPaciente().getNombres() != null ? pago.getCita().getPaciente().getNombres() : "";
                String apellido = pago.getCita().getPaciente().getApellidoPaterno() != null ? pago.getCita().getPaciente().getApellidoPaterno() : "";
                dto.setNombrePaciente((nombres + " " + apellido).trim());
                dto.setDniPaciente(pago.getCita().getPaciente().getDni());
            }
            
            if (pago.getCita().getMedico() != null) {
                String nombresMed = pago.getCita().getMedico().getNombres() != null ? pago.getCita().getMedico().getNombres() : "";
                String apellidoMed = pago.getCita().getMedico().getApellidoPaterno() != null ? pago.getCita().getMedico().getApellidoPaterno() : "";
                dto.setNombreMedico("Dr/Dra. " + (nombresMed + " " + apellidoMed).trim());
                
                if (pago.getCita().getMedico().getSpecialty() != null) {
                    dto.setNombreEspecialidad(pago.getCita().getMedico().getSpecialty().getNombre());
                } else {
                    dto.setNombreEspecialidad("General");
                }
            }
        }
        return dto;
    }
}