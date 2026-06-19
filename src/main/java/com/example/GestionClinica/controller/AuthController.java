package com.example.GestionClinica.controller;

import com.example.GestionClinica.model.Medico;
import com.example.GestionClinica.model.Rol;
import com.example.GestionClinica.model.Usuario;
import com.example.GestionClinica.repository.MedicoRepository;
import com.example.GestionClinica.repository.UsuarioRepository;
import com.example.GestionClinica.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private MedicoRepository medicoRepository;

    // Registrar usuarios iniciales (Útil para pruebas en Postman)
    @PostMapping("/register")
    public ResponseEntity<?> registrarUsuario(@RequestBody Usuario usuario) {
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            return ResponseEntity.badRequest().body("El nombre de usuario ya existe.");
        }
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    // Login que consumirá el formulario de Angular
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (passwordEncoder.matches(password, usuario.getPassword())) {
            String token = tokenProvider.generarToken(usuario.getUsername(), usuario.getRol().name());
            
            // --- MAGIA PARA OBTENER EL NOMBRE REAL ---
            String nombreReal = usuario.getUsername(); // Por defecto queda el alias (Ej: Para el ADMIN)
            
            if (usuario.getRol() == Rol.MEDICO) {
                Optional<Medico> medicoOpt = medicoRepository.findAll().stream()
                        .filter(m -> m.getUsuario() != null && m.getUsuario().getIdUsuario().equals(usuario.getIdUsuario()))
                        .findFirst();
                if (medicoOpt.isPresent()) {
                    // Concatenamos el Primer Nombre + Primer Apellido
                    nombreReal = medicoOpt.get().getNombres() + " " + medicoOpt.get().getApellidoPaterno();
                }
            } 
            
            Map<String, Object> response = new HashMap<>();
            response.put("username", usuario.getUsername()); // NO TOCAR: La agenda lo necesita para filtrar
            response.put("nombreReal", nombreReal); // <-- NUEVO: Mandamos el nombre real para el Navbar
            response.put("rol", usuario.getRol().name());
            response.put("token", token);
            response.put("modulos", usuario.getModulosAcceso()); 
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Contraseña incorrecta");
        }
    }
}