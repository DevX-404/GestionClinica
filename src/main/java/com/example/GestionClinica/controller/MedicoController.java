package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.MedicoDTO;
import com.example.GestionClinica.service.MedicoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicos")
public class MedicoController {

    @Autowired
    private MedicoService medicoService;

    @GetMapping
    public ResponseEntity<List<MedicoDTO>> listarMedicos() {
        return ResponseEntity.ok(medicoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicoDTO> obtenerMedico(@PathVariable Long id) {
        return ResponseEntity.ok(medicoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<MedicoDTO> registrarMedico(@Valid @RequestBody MedicoDTO dto) {
        return new ResponseEntity<>(medicoService.registrar(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicoDTO> actualizarMedico(@PathVariable Long id, @Valid @RequestBody MedicoDTO dto) {
        return ResponseEntity.ok(medicoService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarMedico(@PathVariable Long id) {
        medicoService.eliminarLogico(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/especialidad/{idEspecialidad}")
    public ResponseEntity<List<MedicoDTO>> listarPorEspecialidad(@PathVariable Long idEspecialidad) {
        return ResponseEntity.ok(medicoService.listarPorEspecialidad(idEspecialidad));
    }
}
