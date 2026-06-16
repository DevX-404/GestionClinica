package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.DetalleRecetaDTO;
import com.example.GestionClinica.dto.RecetaMedicaDTO;
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
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecetaMedicaServiceImpl implements RecetaMedicaService {

    @Autowired private RecetaMedicaRepository recetaRepository;
    @Autowired private ConsultaMedicaRepository consultaRepository;

    @Override
    @Transactional
    public RecetaMedicaDTO generarReceta(RecetaMedicaDTO dto) {
        ConsultaMedica consulta = consultaRepository.findById(dto.getIdConsulta())
                .orElseThrow(() -> new ResourceNotFoundException("Consulta no encontrada"));

        RecetaMedica receta = new RecetaMedica();
        receta.setConsultaMedica(consulta);
        receta.setFechaEmision(LocalDate.now());
        receta.setObservaciones(dto.getObservaciones());

        if (dto.getDetalles() != null) {
            List<DetalleReceta> detalles = dto.getDetalles().stream().map(d -> {
                DetalleReceta detalle = new DetalleReceta();
                detalle.setMedicamento(d.getMedicamento());
                detalle.setDosis(d.getDosis());
                detalle.setFrecuencia(d.getFrecuencia());
                detalle.setDuracion(d.getDuracion());
                detalle.setRecetaMedica(receta);
                return detalle;
            }).collect(Collectors.toList());
            receta.setDetalles(detalles);
        }

        RecetaMedica guardada = recetaRepository.save(receta);
        return convertirADto(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public RecetaMedicaDTO obtenerPorConsulta(Long idConsulta) {
        RecetaMedica receta = recetaRepository.findByConsultaMedicaIdConsulta(idConsulta)
                .orElseThrow(() -> new ResourceNotFoundException("Receta no encontrada para esta consulta"));
        return convertirADto(receta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecetaMedicaDTO> listarTodas() {
        return recetaRepository.findAll().stream().map(this::convertirADto).collect(Collectors.toList());
    }

    private RecetaMedicaDTO convertirADto(RecetaMedica receta) {
        RecetaMedicaDTO dto = new RecetaMedicaDTO();
        dto.setIdReceta(receta.getIdReceta());
        if (receta.getConsultaMedica() != null) {
            dto.setIdConsulta(receta.getConsultaMedica().getIdConsulta());
            
            if(receta.getConsultaMedica().getCitaMedica() != null) {
                if(receta.getConsultaMedica().getCitaMedica().getPaciente() != null){
                    String nombrePac = receta.getConsultaMedica().getCitaMedica().getPaciente().getNombres();
                    String apPatPac = receta.getConsultaMedica().getCitaMedica().getPaciente().getApellidoPaterno();
                    String apMatPac = receta.getConsultaMedica().getCitaMedica().getPaciente().getApellidoMaterno();
                    apMatPac = (apMatPac != null) ? apMatPac : "";
                    
                    dto.setNombrePaciente((nombrePac + " " + apPatPac + " " + apMatPac).trim());
                    // <--- AQUÍ CAPTURAMOS EL DNI --->
                    dto.setDniPaciente(receta.getConsultaMedica().getCitaMedica().getPaciente().getDni()); 
                }
                if(receta.getConsultaMedica().getCitaMedica().getMedico() != null){
                    String nombreMed = receta.getConsultaMedica().getCitaMedica().getMedico().getNombres();
                    String apPatMed = receta.getConsultaMedica().getCitaMedica().getMedico().getApellidoPaterno();
                    String apMatMed = receta.getConsultaMedica().getCitaMedica().getMedico().getApellidoMaterno();
                    apMatMed = (apMatMed != null) ? apMatMed : "";
                    dto.setNombreMedico("Dr/Dra. " + (nombreMed + " " + apPatMed + " " + apMatMed).trim());
                }
            }
        }
        dto.setFechaEmision(receta.getFechaEmision());
        dto.setObservaciones(receta.getObservaciones());

        if (receta.getDetalles() != null) {
            dto.setDetalles(receta.getDetalles().stream().map(d -> {
                DetalleRecetaDTO detDto = new DetalleRecetaDTO();
                detDto.setIdDetalleReceta(d.getIdDetalleReceta()); 
                detDto.setMedicamento(d.getMedicamento());
                detDto.setDosis(d.getDosis());
                detDto.setFrecuencia(d.getFrecuencia());
                detDto.setDuracion(d.getDuracion());
                return detDto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}