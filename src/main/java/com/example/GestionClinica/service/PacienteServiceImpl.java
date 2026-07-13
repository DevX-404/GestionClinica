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
                .filter(p -> "ACTIVO".equals(p.getEstado()))
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PacienteDTO> listarInactivos() {
        return pacienteRepository.findByEstado("INACTIVO").stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PacienteDTO obtenerPorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con el ID: " + id));
        return convertirADto(paciente);
    }

    @Override
    @Transactional
    public PacienteDTO registrar(PacienteDTO dto) {
        validarDuplicados(dto, null);

        Paciente paciente = new Paciente();
        BeanUtils.copyProperties(dto, paciente);
        paciente.setEstado("ACTIVO");
        return convertirADto(pacienteRepository.save(paciente));
    }

    @Override
    @Transactional
    public PacienteDTO actualizar(Long id, PacienteDTO dto) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con el ID: " + id));
        
        validarDuplicados(dto, id);

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
        
        paciente.setEstado("INACTIVO");
        pacienteRepository.save(paciente);
    }

    @Transactional
    public void reactivarPaciente(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado con el ID: " + id));
        
        paciente.setEstado("ACTIVO");
        pacienteRepository.save(paciente);
    }

    private void validarDuplicados(PacienteDTO dto, Long idActual) {
        List<Paciente> pacientes = pacienteRepository.findAll();
        
        boolean dniDuplicado = pacientes.stream().anyMatch(p -> p.getDni().equals(dto.getDni()) && !p.getIdPaciente().equals(idActual));
        if (dniDuplicado) throw new IllegalArgumentException("El número de documento (" + dto.getDni() + ") ya pertenece a otro paciente.");

        if (dto.getTelefono() != null && !dto.getTelefono().isEmpty()) {
            boolean telDuplicado = pacientes.stream().anyMatch(p -> dto.getTelefono().equals(p.getTelefono()) && !p.getIdPaciente().equals(idActual));
            if (telDuplicado) throw new IllegalArgumentException("El número de teléfono (" + dto.getTelefono() + ") ya está registrado en otra ficha.");
        }

        if (dto.getCorreo() != null && !dto.getCorreo().isEmpty()) {
            boolean correoDuplicado = pacientes.stream().anyMatch(p -> dto.getCorreo().equals(p.getCorreo()) && !p.getIdPaciente().equals(idActual));
            if (correoDuplicado) throw new IllegalArgumentException("El correo electrónico (" + dto.getCorreo() + ") ya se encuentra en uso.");
        }
    }

    private PacienteDTO convertirADto(Paciente paciente) {
        PacienteDTO dto = new PacienteDTO();
        BeanUtils.copyProperties(paciente, dto);
        return dto;
    }
}
