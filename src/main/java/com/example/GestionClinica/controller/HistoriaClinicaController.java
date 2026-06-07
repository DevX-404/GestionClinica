package com.example.GestionClinica.controller;

import com.example.GestionClinica.dto.HistoriaClinicaDTO;
import com.example.GestionClinica.service.HistoriaClinicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/historias")
public class HistoriaClinicaController {

    @Autowired private HistoriaClinicaService historiaService;

    // Obtener el historial completo buscando por el ID del Paciente
    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<HistoriaClinicaDTO> obtenerPorPaciente(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(historiaService.obtenerPorPacienteId(idPaciente));
    }

    // Inicializar historia de forma manual o automatizada
    @PostMapping("/paciente/{idPaciente}/inicializar")
    public ResponseEntity<HistoriaClinicaDTO> inicializar(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(historiaService.inicializarHistoriaAutomática(idPaciente));
    }

    // Actualizar Alergias y Antecedentes (Flujo 17 del Médico)
    @PutMapping("/{idHistoria}")
    public ResponseEntity<HistoriaClinicaDTO> actualizarFicha(@PathVariable Long idHistoria, @RequestBody HistoriaClinicaDTO dto) {
        return ResponseEntity.ok(historiaService.actualizarFichaGeneral(idHistoria, dto));
    }
}
