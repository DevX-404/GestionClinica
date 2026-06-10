package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.HorarioMedicoDTO;
import com.example.GestionClinica.service.HorarioMedicoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horarios")
@CrossOrigin(origins = "http://localhost:4200")
public class HorarioMedicoController {

    @Autowired
    private HorarioMedicoService service;

    // Obtener los horarios de un médico específico
    @GetMapping("/medico/{idMedico}")
    public ResponseEntity<List<HorarioMedicoDTO>> listarPorMedico(@PathVariable Long idMedico) {
        return ResponseEntity.ok(service.listarPorMedico(idMedico));
    }

    @PostMapping
    public ResponseEntity<HorarioMedicoDTO> registrar(@Valid @RequestBody HorarioMedicoDTO dto) {
        return new ResponseEntity<>(service.registrar(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HorarioMedicoDTO> actualizar(@PathVariable Long id, @Valid @RequestBody HorarioMedicoDTO dto) {
        return ResponseEntity.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminarLogico(id);
        return ResponseEntity.noContent().build();
    }
}
