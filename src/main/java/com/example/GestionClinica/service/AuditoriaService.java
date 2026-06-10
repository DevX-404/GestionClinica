package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.AuditoriaDTO;
import com.example.GestionClinica.model.Auditoria;
import com.example.GestionClinica.repository.AuditoriaRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditoriaService {
    private final AuditoriaRepository repository;

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    public List<AuditoriaDTO> listarHistorial() {
        return repository.findAllByOrderByFechaHoraDesc().stream().map(log -> {
            AuditoriaDTO dto = new AuditoriaDTO();
            BeanUtils.copyProperties(log, dto);
            return dto;
        }).collect(Collectors.toList());
    }
}
