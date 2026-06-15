package com.example.GestionClinica.service;

import com.example.GestionClinica.dto.UsuarioDTO;
import com.example.GestionClinica.exception.ResourceNotFoundException;
import com.example.GestionClinica.model.Rol;
import com.example.GestionClinica.model.Usuario;
import com.example.GestionClinica.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UsuarioDTO cambiarEstado(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Invierte el estado actual (Activo <-> Inactivo)
        usuario.setActivo(!usuario.isActivo());
        return convertirADto(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional
    public void restablecerPassword(Long idUsuario, String nuevaPassword) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public UsuarioDTO cambiarRol(Long idUsuario, String nuevoRol) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Asumiendo que usas un Enum o Entidad para el Rol. Ajusta según tu configuración exacta.
        try {
            usuario.setRol(Rol.valueOf(nuevoRol.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Rol no válido. Intente con ADMINISTRADOR, MEDICO o RECEPCIONISTA");
        }

        return convertirADto(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional
    public UsuarioDTO registrarUsuario(UsuarioDTO dto) {
        Usuario usuario = new Usuario();
        // --- GUARDAR NOMBRE ---
        usuario.setNombreCompleto(dto.getNombreCompleto());
        usuario.setUsername(dto.getUsername());
        usuario.setEmail(dto.getEmail());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol(Rol.valueOf(dto.getRol().toUpperCase()));
        usuario.setActivo(true);
        usuario.setModulosAcceso(dto.getModulosAcceso());
        return convertirADto(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional
    public UsuarioDTO actualizarUsuario(Long idUsuario, UsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // --- ACTUALIZAR NOMBRE ---
        usuario.setNombreCompleto(dto.getNombreCompleto());
        usuario.setUsername(dto.getUsername());
        usuario.setEmail(dto.getEmail());
        usuario.setRol(Rol.valueOf(dto.getRol().toUpperCase()));
        usuario.setModulosAcceso(dto.getModulosAcceso());
        
        return convertirADto(usuarioRepository.save(usuario));
    }

    private UsuarioDTO convertirADto(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setIdUsuario(usuario.getIdUsuario());
        // --- ENVIAR NOMBRE ---
        dto.setNombreCompleto(usuario.getNombreCompleto());
        dto.setUsername(usuario.getUsername());
        dto.setEmail(usuario.getEmail());
        dto.setRol(usuario.getRol() != null ? usuario.getRol().toString() : "SIN_ROL");
        dto.setActivo(usuario.isActivo());
        dto.setModulosAcceso(usuario.getModulosAcceso());
        return dto;
    }
}
