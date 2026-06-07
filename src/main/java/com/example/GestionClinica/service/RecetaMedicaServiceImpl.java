package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.RecetaMedicaDTO;
import com.example.GestionClinica.dto.DetalleRecetaDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.ConsultaMedica;
import com.example.GestionClinica.model.DetalleReceta;
import com.example.GestionClinica.model.RecetaMedica;
import com.example.GestionClinica.repository.ConsultaMedicaRepository;
import com.example.GestionClinica.repository.RecetaMedicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.stream.Collectors;

@Service
public class RecetaMedicaServiceImpl implements RecetaMedicaService {

    @Autowired private RecetaMedicaRepository recetaRepository;
    @Autowired private ConsultaMedicaRepository consultaRepository;

    @Override
    @Transactional
    public RecetaMedicaDTO generarReceta(RecetaMedicaDTO dto) {
        ConsultaMedica consulta = consultaRepository.findById(dto.getIdConsulta())
                .orElseThrow(() -> new ResourceNotFoundException("Consulta médica no encontrada con ID: " + dto.getIdConsulta()));

        RecetaMedica receta = new RecetaMedica();
        receta.setConsultaMedica(consulta);
        receta.setFechaEmision(LocalDate.now());
        receta.setObservaciones(dto.getObservaciones());

        // Mapear la lista de medicamentos y amarrarlos a la receta (Relación bidireccional)
        if (dto.getDetalles() != null) {
            for (DetalleRecetaDTO dDto : dto.getDetalles()) {
                DetalleReceta detalle = new DetalleReceta();
                detalle.setMedicamento(dDto.getMedicamento());
                detalle.setDosis(dDto.getDosis());
                detalle.setFrecuencia(dDto.getFrecuencia());
                detalle.setDuracion(dDto.getDuracion());
                detalle.setRecetaMedica(receta);
                receta.getDetalles().add(detalle);
            }
        }

        return convertirADto(recetaRepository.save(receta));
    }

    @Override
    @Transactional(readOnly = true)
    public RecetaMedicaDTO obtenerPorConsulta(Long idConsulta) {
        RecetaMedica receta = recetaRepository.findByConsultaMedicaIdConsulta(idConsulta)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró receta para la consulta ID: " + idConsulta));
        return convertirADto(receta);
    }

    private RecetaMedicaDTO convertirADto(RecetaMedica receta) {
        RecetaMedicaDTO dto = new RecetaMedicaDTO();
        dto.setIdReceta(receta.getIdReceta());
        dto.setFechaEmision(receta.getFechaEmision());
        dto.setObservaciones(receta.getObservaciones());
        dto.setIdConsulta(receta.getConsultaMedica().getIdConsulta());
        
        dto.setDetalles(receta.getDetalles().stream().map(d -> {
            DetalleRecetaDTO dDto = new DetalleRecetaDTO();
            dDto.setIdDetalleReceta(d.getIdDetalleReceta());
            dDto.setMedicamento(d.getMedicamento());
            dDto.setDosis(d.getDosis());
            dDto.setFrecuencia(d.getFrecuencia());
            dDto.setDuracion(d.getDuracion());
            return dDto;
        }).collect(Collectors.toList()));
        
        return dto;
    }
}