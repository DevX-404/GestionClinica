package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.CitaMedicaDTO;
import com.example.GestionClinica.service.CitaMedicaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
public class CitaMedicaController {

    @Autowired
    private CitaMedicaService citaService;

    @GetMapping
    public ResponseEntity<List<CitaMedicaDTO>> listarTodas() {
        return ResponseEntity.ok(citaService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<CitaMedicaDTO> crearCita(@Valid @RequestBody CitaMedicaDTO dto) {
        return new ResponseEntity<>(citaService.programarCita(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<CitaMedicaDTO> cambiarEstado(@PathVariable Long id, @RequestParam String nuevoEstado) {
        return ResponseEntity.ok(citaService.actualizarEstado(id, nuevoEstado));
    }

    @GetMapping("/medico/{idMedico}")
    public ResponseEntity<List<CitaMedicaDTO>> listarPorMedico(@PathVariable Long idMedico, @RequestParam LocalDate fecha) {
        return ResponseEntity.ok(citaService.listarPorMedico(idMedico, fecha));
    }
}
