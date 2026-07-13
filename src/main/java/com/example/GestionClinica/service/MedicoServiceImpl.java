package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.MedicoDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Especialidad;
import com.example.GestionClinica.model.Medico;
import com.example.GestionClinica.model.Usuario;
import com.example.GestionClinica.model.Rol;
import com.example.GestionClinica.repository.EspecialidadRepository;
import com.example.GestionClinica.repository.MedicoRepository;
import com.example.GestionClinica.repository.UsuarioRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicoServiceImpl implements MedicoService {

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspecialidadRepository specialtyRepository;

    @Autowired
    private UsuarioRepository usuarioRepository; 
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<MedicoDTO> listarTodos() {
        return medicoRepository.findAll().stream()
                .filter(m -> "ACTIVO".equals(m.getEstado()))
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MedicoDTO obtenerPorId(Long id) {
        Medico medico = medicoRepository.findById(id)
                .filter(m -> "ACTIVO".equals(m.getEstado()))
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con el ID: " + id));
        return convertirADto(medico);
    }

   @Override
    @Transactional // Si falla la creación del usuario, se hace un rollback y no se crea el médico
    public MedicoDTO registrar(MedicoDTO dto) {
        if (medicoRepository.existsByCodigoColegiatura(dto.getCodigoColegiatura())) {
            throw new IllegalArgumentException("El código de colegiatura ya está registrado.");
        }
        
        // Validar que el correo no esté en uso por otro usuario
        if (usuarioRepository.existsByUsername(dto.getCorreo()) || usuarioRepository.existsByEmail(dto.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado en el sistema de usuarios.");
        }
        
        Especialidad esp = specialtyRepository.findById(dto.getIdEspecialidad())
                .orElseThrow(() -> new ResourceNotFoundException("La especialidad especificada no existe."));

        Medico medico = new Medico();
        BeanUtils.copyProperties(dto, medico);
        medico.setSpecialty(esp);
        medico.setEstado("ACTIVO");
        
        // Lógica automática de creación de Usuario
        Usuario nuevoUsuario = new Usuario();
        
        // --- LÍNEA NUEVA: Guardamos el nombre real para el módulo de Seguridad ---
        nuevoUsuario.setNombreCompleto(dto.getNombres() + " " + dto.getApellidoPaterno());
        
        nuevoUsuario.setUsername(dto.getCorreo()); // Usamos el correo como username
        nuevoUsuario.setEmail(dto.getCorreo());
        nuevoUsuario.setPassword(passwordEncoder.encode(dto.getCodigoColegiatura())); // Contraseña por defecto
        nuevoUsuario.setRol(Rol.MEDICO);
        nuevoUsuario.setActivo(true);
        
        // --- LÍNEA NUEVA: Le damos acceso por defecto a sus módulos de trabajo ---
        nuevoUsuario.setModulosAcceso(java.util.List.of("Citas Médicas", "Pacientes"));
        
        medico.setUsuario(nuevoUsuario);

        medico.setRne(dto.getRne());

        return convertirADto(medicoRepository.save(medico));
    }

    @Override
    @Transactional
    public MedicoDTO actualizar(Long id, MedicoDTO dto) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con el ID: " + id));

        if (!medico.getCodigoColegiatura().equals(dto.getCodigoColegiatura()) && 
            medicoRepository.existsByCodigoColegiatura(dto.getCodigoColegiatura())) {
            throw new IllegalArgumentException("El nuevo código de colegiatura ya está en uso.");
        }

        Especialidad esp = specialtyRepository.findById(dto.getIdEspecialidad())
                .orElseThrow(() -> new ResourceNotFoundException("La especialidad especificada no existe."));

        medico.setCodigoColegiatura(dto.getCodigoColegiatura());
        medico.setNombres(dto.getNombres());
        medico.setApellidoPaterno(dto.getApellidoPaterno());
        medico.setApellidoMaterno(dto.getApellidoMaterno());
        medico.setTelefono(dto.getTelefono());
        medico.setEstadoDisponibilidad(dto.getEstadoDisponibilidad());
        medico.setSpecialty(esp);
        
        // Si cambió el correo, actualizamos el username/email del usuario asociado
        if (medico.getUsuario() != null && !medico.getCorreo().equals(dto.getCorreo())) {
            if (usuarioRepository.existsByUsername(dto.getCorreo()) || usuarioRepository.existsByEmail(dto.getCorreo())) {
                throw new IllegalArgumentException("El nuevo correo ya está en uso por otro usuario.");
            }
            medico.getUsuario().setUsername(dto.getCorreo());
            medico.getUsuario().setEmail(dto.getCorreo());
        }
        medico.setCorreo(dto.getCorreo());

        medico.setRne(dto.getRne());

        return convertirADto(medicoRepository.save(medico));
    }

    @Override
    @Transactional
    public void eliminarLogico(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado con el ID: " + id));
        
        medico.setEstado("INACTIVO");
        medico.setEstadoDisponibilidad("INACTIVO");
        
        // Desactivamos el acceso al sistema del médico
        if (medico.getUsuario() != null) {
            medico.getUsuario().setActivo(false);
        }
        
        medicoRepository.save(medico);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicoDTO> listarPorEspecialidad(Long idEspecialidad) {
        return medicoRepository.findMedicosByEspecialidad(idEspecialidad).stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    private MedicoDTO convertirADto(Medico medico) {
        MedicoDTO dto = new MedicoDTO();
        BeanUtils.copyProperties(medico, dto);
        if (medico.getSpecialty() != null) {
            dto.setIdEspecialidad(medico.getSpecialty().getIdEspecialidad());
            dto.setNombreEspecialidad(medico.getSpecialty().getNombre());
            dto.setRne(medico.getRne());
        }
        return dto;
    }
}
