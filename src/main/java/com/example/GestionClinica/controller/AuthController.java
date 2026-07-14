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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // 1. MANEJO ELEGANTE DE ERROR: Si el usuario no existe, evitamos el Error 500
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Usuario o contraseña incorrectos.");
        }
        
        Usuario usuario = usuarioOpt.get();

        // 2. Verificamos si la cuenta está bloqueada
        if (!usuario.isActivo()) {
            return ResponseEntity.status(403).body("⛔ Su cuenta ha sido bloqueada. Por favor, comuníquese con el departamento de TI.");
        }

        // 3. Comprobamos la contraseña
        if (passwordEncoder.matches(password, usuario.getPassword())) {
            
            // Reseteamos intentos fallidos al entrar con éxito
            if (usuario.getIntentosFallidos() > 0) {
                usuario.setIntentosFallidos(0);
                usuarioRepository.save(usuario);
            }

            String token = tokenProvider.generarToken(usuario.getUsername(), usuario.getRol().name());
            String nombreReal = usuario.getNombreCompleto() != null && !usuario.getNombreCompleto().isEmpty() 
                                ? usuario.getNombreCompleto() 
                                : usuario.getUsername();
            
            Map<String, Object> response = new HashMap<>();
            response.put("username", usuario.getUsername());
            response.put("nombreReal", nombreReal);
            response.put("rol", usuario.getRol().name());
            response.put("token", token);
            response.put("modulos", usuario.getModulosAcceso()); 
            
            return ResponseEntity.ok(response);
            
        } else {
            // FUERZA BRUTA: Sumamos intentos fallidos
            int intentos = usuario.getIntentosFallidos() + 1;
            usuario.setIntentosFallidos(intentos);
            
            if (intentos >= 3) {
                usuario.setActivo(false); // BLOQUEO
                usuarioRepository.save(usuario);
                return ResponseEntity.status(403).body("⛔ Has superado los 3 intentos permitidos. Por seguridad, tu cuenta ha sido bloqueada. Contacta a TI.");
            }
            
            usuarioRepository.save(usuario);
            int intentosRestantes = 3 - intentos;
            return ResponseEntity.status(401).body("Contraseña incorrecta. Te quedan " + intentosRestantes + " intentos antes de bloquear la cuenta.");
        }
    }
}