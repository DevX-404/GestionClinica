package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.RecetaMedicaDTO;
import com.example.GestionClinica.service.RecetaMedicaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recetas")
public class RecetaMedicaController {

    @Autowired private RecetaMedicaService recetaService;

    // Emitir receta (Flujo 16)
    @PostMapping
    public ResponseEntity<RecetaMedicaDTO> generarReceta(@Valid @RequestBody RecetaMedicaDTO dto) {
        return new ResponseEntity<>(recetaService.generarReceta(dto), HttpStatus.CREATED);
    }

    // Consultar receta de una consulta
    @GetMapping("/consulta/{idConsulta}")
    public ResponseEntity<RecetaMedicaDTO> obtenerPorConsulta(@PathVariable Long idConsulta) {
        return ResponseEntity.ok(recetaService.obtenerPorConsulta(idConsulta));
    }

    // EL NUEVO MÉTODO PARA LISTAR TODAS LAS RECETAS
    @GetMapping
    public ResponseEntity<List<RecetaMedicaDTO>> listarTodas() {
        return ResponseEntity.ok(recetaService.listarTodas());
    }
}
