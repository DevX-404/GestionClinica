package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.PagoDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Comprobante;
import com.example.GestionClinica.model.Pago;
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

        // 1. Actualizamos los datos principales del pago
        pago.setMetodoPago(dto != null && dto.getMetodoPago() != null ? dto.getMetodoPago() : "EFECTIVO");
        pago.setEstadoPago("PAGADO");
        pago.setFechaPago(LocalDate.now());
        pago.setHoraPago(LocalTime.now());

        // 2. Llenamos TODOS los campos de Comprobante (Total, Subtotal e IGV)
        String tipoComp = (dto != null && dto.getTipoComprobante() != null) ? dto.getTipoComprobante() : "BOLETA";
        String prefix = tipoComp.equalsIgnoreCase("FACTURA") ? "F001-" : "B001-";
        
        Comprobante comprobante = new Comprobante();
        comprobante.setTipoComprobante(tipoComp);
        comprobante.setNumeroComprobante(prefix + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        comprobante.setFechaEmision(LocalDate.now());
        
        // --- AQUÍ ESTÁ LA MAGIA PARA QUE LA BASE DE DATOS NO EXPLOTE ---
        BigDecimal total = pago.getMonto() != null ? pago.getMonto() : BigDecimal.ZERO;
        // Calculamos Subtotal dividiendo entre 1.18
        BigDecimal subtotal = total.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        // Calculamos IGV restando el subtotal al total
        BigDecimal igv = total.subtract(subtotal);

        // Asignamos los 3 valores obligatorios
        comprobante.setTotal(total);
        comprobante.setSubtotal(subtotal);
        comprobante.setIgv(igv);
        
        // Enlazamos
        comprobante.setPago(pago);
        pago.setComprobante(comprobante);

        // 3. Guardamos en la base de datos
        Pago pagoGuardado = pagoRepository.save(pago);
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