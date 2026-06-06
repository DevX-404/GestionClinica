package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.PacienteDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Paciente;
import com.example.GestionClinica.repository.PacienteRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PacienteServiceImpl implements PacienteService {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PacienteDTO> listarTodos() {
        return pacienteRepository.findAll().stream()
                .filter(p -> "ACTIVO".equals(p.getEstado())) // Solo listamos los activos
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PacienteDTO obtenerPorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .filter(p -> "ACTIVO".equals(p.getEstado()))
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con el ID: " + id));
        return convertirADto(paciente);
    }

    @Override
    @Transactional
    public PacienteDTO registrar(PacienteDTO dto) {
        if (pacienteRepository.existsByDni(dto.getDni())) {
            throw new IllegalArgumentException("El DNI ya se encuentra registrado en el sistema.");
        }
        Paciente paciente = new Paciente();
        BeanUtils.copyProperties(dto, paciente);
        paciente.setEstado("ACTIVO"); // Forzamos estado inicial
        
        // Aquí a futuro automatizaremos la creación de su Historia Clínica (Rúbrica Avance 2)
        
        return convertirADto(pacienteRepository.save(paciente));
    }

    @Override
    @Transactional
    public PacienteDTO actualizar(Long id, PacienteDTO dto) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con el ID: " + id));
        
        // Si cambia de DNI, validar que el nuevo no exista
        if (!paciente.getDni().equals(dto.getDni()) && pacienteRepository.existsByDni(dto.getDni())) {
            throw new IllegalArgumentException("El nuevo DNI ya está registrado por otro paciente.");
        }

        paciente.setTipoDocumento(dto.getTipoDocumento());
        paciente.setDni(dto.getDni());
        paciente.setNombres(dto.getNombres());
        paciente.setApellidoPaterno(dto.getApellidoPaterno());
        paciente.setApellidoMaterno(dto.getApellidoMaterno());
        paciente.setFechaNacimiento(dto.getFechaNacimiento());
        paciente.setSexo(dto.getSexo());
        paciente.setDireccion(dto.getDireccion());
        paciente.setTelefono(dto.getTelefono());
        paciente.setCorreo(dto.getCorreo());

        return convertirADto(pacienteRepository.save(paciente));
    }

    @Override
    @Transactional
    public void eliminarLogico(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con el ID: " + id));
        
        // REQUISITO DE RÚBRICA: No eliminación física, solo cambio de estado
        paciente.setEstado("INACTIVO");
        pacienteRepository.save(paciente);
    }

    // Métodos Helpers para conversión manual limpia (evitamos meter librerías pesadas)
    private PacienteDTO convertirADto(Paciente paciente) {
        PacienteDTO dto = new PacienteDTO();
        BeanUtils.copyProperties(paciente, dto);
        return dto;
    }
}
