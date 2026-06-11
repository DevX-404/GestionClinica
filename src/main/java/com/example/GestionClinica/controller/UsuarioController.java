package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.ResetPasswordDTO;
import com.example.GestionClinica.dto.UsuarioDTO;
import com.example.GestionClinica.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:4200")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<UsuarioDTO> cambiarEstado(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(id));
    }

    @PatchMapping("/{id}/rol")
    public ResponseEntity<UsuarioDTO> cambiarRol(@PathVariable Long id, @RequestParam String nuevoRol) {
        return ResponseEntity.ok(usuarioService.cambiarRol(id, nuevoRol));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> restablecerPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordDTO dto) {
        usuarioService.restablecerPassword(id, dto.getNuevaPassword());
        return ResponseEntity.ok().build();
    }
}
